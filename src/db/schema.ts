import { pgTable, text, integer, real, timestamp, jsonb, uuid, boolean } from "drizzle-orm/pg-core";

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  totalValueUsd: real("total_value_usd"),
  source: text("source").notNull(), // "csv" | "image"
  label: text("label"),
});

export const positions = pgTable("positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  isin: text("isin"),
  currency: text("currency"),
  assetCategory: text("asset_category"),
  subCategory: text("sub_category"),
  issuerCountryCode: text("issuer_country_code"),
  position: real("position"),
  markPrice: real("mark_price"),
  positionValue: real("position_value"),
  costBasisPrice: real("cost_basis_price"),
});

export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  // Snapshot of the rules used at analysis time
  rulesSnapshot: jsonb("rules_snapshot"),
  // Full Claude output: { bearishCandidates, allocationDiagnosis, sellHoldWatch, topDestinations, scenarios }
  result: jsonb("result"),
  status: text("status").notNull().default("pending"), // "pending" | "processing" | "done" | "error"
  errorMessage: text("error_message"),
});

export const liquidAssets = pgTable("liquid_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(), // "cash_usd" | "stablecoins" | "crypto" | "real_estate"
  label: text("label").notNull(),
  amountUsd: real("amount_usd").notNull(),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const investmentProfiles = pgTable("investment_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  label: text("label").notNull().default("My Investment Strategy"),
  rulesJson: jsonb("rules_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types inferred from schema
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type Position = typeof positions.$inferSelect;
export type NewPosition = typeof positions.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
export type LiquidAsset = typeof liquidAssets.$inferSelect;
export type NewLiquidAsset = typeof liquidAssets.$inferInsert;
export type InvestmentProfile = typeof investmentProfiles.$inferSelect;
export type NewInvestmentProfile = typeof investmentProfiles.$inferInsert;
