"use client";

import Link from "next/link";
import { type Portfolio, type Analysis, type LiquidAsset } from "@/db/schema";
import { type AnalysisResult } from "@/lib/claude-analysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { AllocationDonut } from "./allocation-donut";
import { Upload, BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

type Props = {
  latestPortfolio: Portfolio | null;
  latestAnalysis: Analysis | null;
  liquid: LiquidAsset[];
};

export function DashboardClient({ latestPortfolio, latestAnalysis, liquid }: Props) {
  const analysisResult = latestAnalysis?.result as AnalysisResult | null;

  const cashUsd = liquid.filter((l) => l.category === "cash_usd").reduce((s, l) => s + l.amountUsd, 0);
  const stablecoins = liquid.filter((l) => l.category === "stablecoins").reduce((s, l) => s + l.amountUsd, 0);
  const crypto = liquid.filter((l) => l.category === "crypto").reduce((s, l) => s + l.amountUsd, 0);
  const realEstate = liquid.filter((l) => l.category === "real_estate").reduce((s, l) => s + l.amountUsd, 0);
  const liquidForInvesting = liquid.filter((l) => l.category === "liquid_for_investing").reduce((s, l) => s + l.amountUsd, 0);

  const investedValue = latestPortfolio?.totalValueUsd ?? 0;
  const totalPortfolio = investedValue + cashUsd + stablecoins + crypto + realEstate + liquidForInvesting;

  const allocationData = [
    { name: "Stocks/ETFs", value: investedValue, color: "#6366f1" },
    { name: "Crypto", value: crypto, color: "#f59e0b" },
    { name: "Stablecoins", value: stablecoins, color: "#10b981" },
    { name: "Real Estate", value: realEstate, color: "#3b82f6" },
    { name: "Cash (liquid)", value: liquidForInvesting + cashUsd, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Portfolio overview and latest AI analysis
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Portfolio</CardDescription>
            <CardTitle className="text-2xl">${totalPortfolio.toLocaleString("en-US", { maximumFractionDigits: 0 })}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">USD equivalent</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Invested (IB)</CardDescription>
            <CardTitle className="text-2xl">${investedValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalPortfolio > 0 ? ((investedValue / totalPortfolio) * 100).toFixed(1) : 0}% of total
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Liquid for Investing</CardDescription>
            <CardTitle className="text-2xl">${liquidForInvesting.toLocaleString("en-US", { maximumFractionDigits: 0 })}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {totalPortfolio > 0 ? ((liquidForInvesting / totalPortfolio) * 100).toFixed(1) : 0}% of total
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Analysis</CardDescription>
            <CardTitle className="text-sm">
              {latestAnalysis
                ? format(new Date(latestAnalysis.generatedAt), "dd MMM yyyy")
                : "None yet"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestAnalysis ? (
              <Badge variant={latestAnalysis.status === "done" ? "default" : latestAnalysis.status === "error" ? "destructive" : "secondary"}>
                {latestAnalysis.status}
              </Badge>
            ) : (
              <Badge variant="outline">No analysis</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation chart */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>By asset class (all holdings)</CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.length > 0 ? (
              <AllocationDonut data={allocationData} total={totalPortfolio} />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                <Upload className="h-8 w-8" />
                <p className="text-sm">Upload your portfolio to see allocation</p>
                <Link href="/portfolio/upload" className={buttonVariants({ size: "sm" })}>
                    Upload Portfolio
                  </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest analysis summary */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Analysis Summary</CardTitle>
            <CardDescription>
              {latestAnalysis
                ? `Generated ${format(new Date(latestAnalysis.generatedAt), "dd MMM yyyy HH:mm")}`
                : "No analysis yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisResult ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysisResult.overallAssessment}
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.bearishCandidates.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <TrendingDown className="h-4 w-4" />
                      <span>{analysisResult.bearishCandidates.length} bearish</span>
                    </div>
                  )}
                  {analysisResult.topDestinations.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>{analysisResult.topDestinations.length} opportunities</span>
                    </div>
                  )}
                  {analysisResult.sellHoldWatch.filter((s) => s.action === "WATCH").length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{analysisResult.sellHoldWatch.filter((s) => s.action === "WATCH").length} to watch</span>
                    </div>
                  )}
                  {analysisResult.sellHoldWatch.filter((s) => s.action === "HOLD").length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{analysisResult.sellHoldWatch.filter((s) => s.action === "HOLD").length} hold</span>
                    </div>
                  )}
                </div>
                <Link href={`/analysis/${latestAnalysis?.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Full Analysis
                  </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-3">
                <BarChart3 className="h-8 w-8" />
                <p className="text-sm">Upload a portfolio and run analysis</p>
                <Link href="/portfolio/upload" className={buttonVariants({ size: "sm" })}>
                    Get Started
                  </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
