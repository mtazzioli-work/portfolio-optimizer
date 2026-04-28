import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const BearishCandidateSchema = z.object({
  symbol: z.string(),
  reason: z.string().describe("Technical + fundamental reason for bearish view"),
  keyLevel: z.string().describe("Key price level (support broken or resistance)"),
  exitTrigger: z.string().describe("Specific trigger to sell (e.g. close below X)"),
  estimatedExitCost: z.string().describe("Estimated transaction cost to exit"),
  alternative: z.string().describe("Suggested replacement instrument"),
});

const AllocationRowSchema = z.object({
  category: z.string(),
  currentPct: z.number().describe("Current % of total portfolio"),
  targetMin: z.number(),
  targetMax: z.number(),
  status: z.enum(["OK", "UNDERWEIGHT", "OVERWEIGHT"]),
  comment: z.string().optional(),
});

const RegionRowSchema = z.object({
  region: z.string(),
  currentPct: z.number(),
  comment: z.string().optional(),
});

const SectorRowSchema = z.object({
  sector: z.string(),
  currentPct: z.number(),
  comment: z.string().optional(),
});

const SellHoldWatchSchema = z.object({
  symbol: z.string(),
  action: z.enum(["SELL", "HOLD", "WATCH"]),
  technicalReason: z.string(),
  keyLevel: z.string().optional(),
  exitTrigger: z.string().optional(),
  estimatedExitCost: z.string().optional(),
});

const TopDestinationSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  suggestedPct: z.number().describe("% of available cash to allocate"),
  role: z.enum(["growth", "defensive", "hedge", "income"]),
  riskLevel: z.number().min(1).max(5),
  liquidity: z.enum(["high", "medium", "low"]),
  ter: z.string().optional().describe("TER or annual fee"),
  entryPlan: z.string().describe("DCA, limit order levels, or lump sum"),
  thesis: z.string().describe("Investment thesis: technical + fundamental"),
  isNew: z.boolean().describe("True if not currently in portfolio"),
});

const ScenarioSchema = z.object({
  name: z.string(),
  description: z.string(),
  allocation: z.array(z.object({ ticker: z.string(), amount: z.string(), rationale: z.string() })),
  expectedOutcome: z.string(),
  mainRisk: z.string(),
});

export const AnalysisResultSchema = z.object({
  bearishCandidates: z.array(BearishCandidateSchema),
  allocationDiagnosis: z.object({
    byAssetClass: z.array(AllocationRowSchema),
    byRegion: z.array(RegionRowSchema),
    bySector: z.array(SectorRowSchema),
    summary: z.string(),
  }),
  sellHoldWatch: z.array(SellHoldWatchSchema),
  topDestinations: z.array(TopDestinationSchema).max(5),
  scenarios: z.object({
    investToday: ScenarioSchema,
    wait: ScenarioSchema,
  }),
  overallAssessment: z.string().describe("2-3 sentence overall portfolio health summary"),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export async function runClaudeAnalysis(prompt: string): Promise<AnalysisResult> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5"),
    schema: AnalysisResultSchema,
    prompt,
  });
  return object;
}
