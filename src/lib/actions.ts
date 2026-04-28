"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { portfolios, positions, analyses, investmentProfiles, liquidAssets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { analyzePortfolio } from "./market-data";
import { buildAnalysisPrompt, type LiquidSummary } from "./analysis-prompt";
import { runClaudeAnalysis } from "./claude-analysis";
import { DEFAULT_INVESTMENT_PROFILE, type InvestmentRules } from "./default-investment-profile";
import { put } from "@vercel/blob";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

// ─── Investment Profile ───────────────────────────────────────────────────────

export async function getOrCreateInvestmentProfile(): Promise<InvestmentRules> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const existing = await db.query.investmentProfiles.findFirst({
    where: eq(investmentProfiles.userId, userId),
  });

  if (existing) return existing.rulesJson as InvestmentRules;

  // Seed default profile for new user
  await db.insert(investmentProfiles).values({
    userId,
    label: "My Investment Strategy",
    rulesJson: DEFAULT_INVESTMENT_PROFILE,
  });

  return DEFAULT_INVESTMENT_PROFILE;
}

export async function updateInvestmentProfile(rules: InvestmentRules): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const existing = await db.query.investmentProfiles.findFirst({
    where: eq(investmentProfiles.userId, userId),
  });

  if (existing) {
    await db
      .update(investmentProfiles)
      .set({ rulesJson: rules, updatedAt: new Date() })
      .where(eq(investmentProfiles.userId, userId));
  } else {
    await db.insert(investmentProfiles).values({
      userId,
      label: "My Investment Strategy",
      rulesJson: rules,
    });
  }
}

// ─── Liquid Assets ────────────────────────────────────────────────────────────

export async function getLiquidAssets() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return db.query.liquidAssets.findMany({ where: eq(liquidAssets.userId, userId) });
}

export async function upsertLiquidAssets(assets: { category: string; label: string; amountUsd: number; notes?: string }[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Delete existing and re-insert
  await db.delete(liquidAssets).where(eq(liquidAssets.userId, userId));
  if (assets.length > 0) {
    await db.insert(liquidAssets).values(
      assets.map((a) => ({ ...a, userId, updatedAt: new Date() }))
    );
  }
}

// ─── Portfolio Upload ─────────────────────────────────────────────────────────

type ParsedPosition = {
  symbol: string;
  isin?: string;
  currency?: string;
  assetCategory?: string;
  subCategory?: string;
  issuerCountryCode?: string;
  position?: number;
  markPrice?: number;
  positionValue?: number;
  costBasisPrice?: number;
};

export async function uploadPortfolioCSV(formData: FormData): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const text = await file.text();
  const rows = parseCSV(text);

  return savePortfolioSnapshot(userId, rows, "csv");
}

export async function uploadPortfolioImage(formData: FormData): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // Store image in Vercel Blob
  const blob = await put(`portfolios/${userId}/${Date.now()}-${file.name}`, file, { access: "public" });

  // Use Claude Vision to extract portfolio data
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5"),
    schema: z.object({
      positions: z.array(
        z.object({
          symbol: z.string(),
          isin: z.string().optional(),
          currency: z.string().optional(),
          assetCategory: z.string().optional(),
          subCategory: z.string().optional(),
          issuerCountryCode: z.string().optional(),
          position: z.number().optional(),
          markPrice: z.number().optional(),
          positionValue: z.number().optional(),
          costBasisPrice: z.number().optional(),
        })
      ),
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: new URL(blob.url),
          },
          {
            type: "text",
            text: "Extract all portfolio positions from this image. Return every row you can identify with its ticker symbol, ISIN, currency, asset category, number of shares/units, current price, total market value, and cost basis price. If a field is not visible, omit it.",
          },
        ],
      },
    ],
  });

  return savePortfolioSnapshot(userId, object.positions, "image");
}

async function savePortfolioSnapshot(
  userId: string,
  rows: ParsedPosition[],
  source: "csv" | "image"
): Promise<string> {
  const totalValueUsd = rows.reduce((s, r) => s + (r.positionValue ?? 0), 0);

  const [portfolio] = await db
    .insert(portfolios)
    .values({ userId, totalValueUsd, source, uploadedAt: new Date() })
    .returning();

  if (rows.length > 0) {
    await db.insert(positions).values(
      rows.map((r) => ({
        portfolioId: portfolio.id,
        symbol: r.symbol,
        isin: r.isin,
        currency: r.currency,
        assetCategory: r.assetCategory,
        subCategory: r.subCategory,
        issuerCountryCode: r.issuerCountryCode,
        position: r.position,
        markPrice: r.markPrice,
        positionValue: r.positionValue,
        costBasisPrice: r.costBasisPrice,
      }))
    );
  }

  return portfolio.id;
}

// ─── Portfolio Analysis ───────────────────────────────────────────────────────

export async function triggerAnalysis(portfolioId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  // Create pending analysis record
  const [analysis] = await db
    .insert(analyses)
    .values({ portfolioId, userId, status: "processing" })
    .returning();

  try {
    // Load positions
    const positionRows = await db.query.positions.findMany({
      where: eq(positions.portfolioId, portfolioId),
    });

    // Load investment profile
    const profile = await getOrCreateInvestmentProfile();

    // Load liquid assets
    const liquid = await getLiquidAssets();
    const liquidSummary: LiquidSummary = {
      cashUsd: liquid.filter((l) => l.category === "cash_usd").reduce((s, l) => s + l.amountUsd, 0),
      stablecoins: liquid.filter((l) => l.category === "stablecoins").reduce((s, l) => s + l.amountUsd, 0),
      crypto: liquid.filter((l) => l.category === "crypto").reduce((s, l) => s + l.amountUsd, 0),
      realEstate: liquid.filter((l) => l.category === "real_estate").reduce((s, l) => s + l.amountUsd, 0),
      liquidForInvesting: liquid.filter((l) => l.category === "liquid_for_investing").reduce((s, l) => s + l.amountUsd, 0),
    };

    // Fetch market data + compute indicators for all symbols
    const symbols = [...new Set(positionRows.map((p) => p.symbol!).filter(Boolean))];
    const symbolAnalyses = await analyzePortfolio(symbols);

    // Build prompt and call Claude
    const prompt = buildAnalysisPrompt(positionRows, symbolAnalyses, liquidSummary, profile);
    const result = await runClaudeAnalysis(prompt);

    // Store result with snapshot of rules used
    await db
      .update(analyses)
      .set({
        status: "done",
        result,
        rulesSnapshot: profile,
      })
      .where(eq(analyses.id, analysis.id));

    return analysis.id;
  } catch (error) {
    await db
      .update(analyses)
      .set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(analyses.id, analysis.id));
    throw error;
  }
}

export async function getPortfolios() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return db.query.portfolios.findMany({
    where: eq(portfolios.userId, userId),
    orderBy: [desc(portfolios.uploadedAt)],
  });
}

export async function getPortfolioWithPositions(portfolioId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const portfolio = await db.query.portfolios.findFirst({
    where: eq(portfolios.id, portfolioId),
  });
  if (!portfolio || portfolio.userId !== userId) throw new Error("Not found");

  const positionRows = await db.query.positions.findMany({
    where: eq(positions.portfolioId, portfolioId),
  });
  return { portfolio, positions: positionRows };
}

export async function getLatestAnalysis() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return db.query.analyses.findFirst({
    where: eq(analyses.userId, userId),
    orderBy: [desc(analyses.generatedAt)],
  });
}

export async function getAnalysis(analysisId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  const analysis = await db.query.analyses.findFirst({
    where: eq(analyses.id, analysisId),
  });
  if (!analysis || analysis.userId !== userId) throw new Error("Not found");
  return analysis;
}

export async function getAnalysesList() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return db.query.analyses.findMany({
    where: eq(analyses.userId, userId),
    orderBy: [desc(analyses.generatedAt)],
  });
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedPosition[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const col = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const symIdx = col("symbol");
  if (symIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    const get = (idx: number) => (idx >= 0 ? vals[idx]?.replace(/^"|"$/g, "").trim() : undefined);
    const getNum = (idx: number) => {
      const v = get(idx);
      return v ? parseFloat(v) : undefined;
    };

    return {
      symbol: get(symIdx) ?? "",
      isin: get(col("isin")),
      currency: get(col("currency")),
      assetCategory: get(col("assetCategory")) ?? get(col("asset_category")),
      subCategory: get(col("subCategory")) ?? get(col("sub_category")),
      issuerCountryCode: get(col("issuerCountryCode")) ?? get(col("issuer_country_code")),
      position: getNum(col("position")),
      markPrice: getNum(col("markPrice")) ?? getNum(col("mark_price")),
      positionValue: getNum(col("positionValue")) ?? getNum(col("position_value")),
      costBasisPrice: getNum(col("costBasisPrice")) ?? getNum(col("cost_basis_price")),
    };
  }).filter((r) => r.symbol);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
