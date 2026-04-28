"use client";

import { type AnalysisResult } from "@/lib/claude-analysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Globe,
  PieChart,
  Target,
  Clock,
  Zap,
} from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  SELL: "destructive",
  HOLD: "default",
  WATCH: "secondary",
};

const RISK_LABELS = ["", "Very Low", "Low", "Moderate", "High", "Very High"];
const RISK_COLORS = ["", "text-green-600", "text-green-500", "text-amber-500", "text-orange-500", "text-red-600"];

const STATUS_COLORS: Record<string, string> = {
  OK: "text-green-600",
  UNDERWEIGHT: "text-amber-600",
  OVERWEIGHT: "text-red-600",
};

type Props = { result: AnalysisResult };

export function AnalysisView({ result }: Props) {
  return (
    <div className="space-y-4">
      {/* Overall assessment */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Overall Assessment</AlertTitle>
        <AlertDescription>{result.overallAssessment}</AlertDescription>
      </Alert>

      <Tabs defaultValue="bearish" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="bearish" className="gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            A · Bearish ({result.bearishCandidates.length})
          </TabsTrigger>
          <TabsTrigger value="allocation" className="gap-1.5">
            <PieChart className="h-3.5 w-3.5" />
            B1 · Allocation
          </TabsTrigger>
          <TabsTrigger value="sellhold" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            B2 · Sell/Hold/Watch
          </TabsTrigger>
          <TabsTrigger value="destinations" className="gap-1.5">
            <Target className="h-3.5 w-3.5" />
            B3 · Top 5 Picks
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            B4 · Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Section A: Bearish candidates */}
        <TabsContent value="bearish">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Bearish Candidates — Consider Liquidating
              </CardTitle>
              <CardDescription>Instruments showing bearish signals or deteriorating fundamentals</CardDescription>
            </CardHeader>
            <CardContent>
              {result.bearishCandidates.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  No bearish candidates at this time — portfolio looks healthy
                </div>
              ) : (
                <div className="space-y-4">
                  {result.bearishCandidates.map((c, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold text-base">{c.symbol}</span>
                        <Badge variant="destructive">Bearish</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.reason}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div><span className="font-medium">Key level:</span> {c.keyLevel}</div>
                        <div><span className="font-medium">Exit trigger:</span> {c.exitTrigger}</div>
                        <div><span className="font-medium">Est. exit cost:</span> {c.estimatedExitCost}</div>
                        <div><span className="font-medium">Alternative:</span> {c.alternative}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section B1: Allocation Diagnosis */}
        <TabsContent value="allocation">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  By Asset Class
                </CardTitle>
                <CardDescription>{result.allocationDiagnosis.summary}</CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Class</TableHead>
                      <TableHead className="text-right">Current %</TableHead>
                      <TableHead className="text-right">Target Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.allocationDiagnosis.byAssetClass.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.category}</TableCell>
                        <TableCell className="text-right">{row.currentPct.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{row.targetMin.toFixed(0)}–{row.targetMax.toFixed(0)}%</TableCell>
                        <TableCell className={`font-medium ${STATUS_COLORS[row.status] ?? ""}`}>{row.status}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.comment ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" /> By Region
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.allocationDiagnosis.byRegion.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.region}</TableCell>
                          <TableCell className="text-right">{row.currentPct.toFixed(1)}%</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.comment ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4" /> By Sector
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sector</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.allocationDiagnosis.bySector.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.sector}</TableCell>
                          <TableCell className="text-right">{row.currentPct.toFixed(1)}%</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.comment ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Section B2: Sell/Hold/Watch */}
        <TabsContent value="sellhold">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sell / Hold / Watch List
              </CardTitle>
              <CardDescription>Action recommendation for each current holding</CardDescription>
            </CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Technical Reason</TableHead>
                    <TableHead>Key Level</TableHead>
                    <TableHead>Exit Trigger</TableHead>
                    <TableHead>Est. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.sellHoldWatch.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold">{row.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={(ACTION_COLORS[row.action] ?? "default") as "default" | "destructive" | "secondary" | "outline"}>
                          {row.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">{row.technicalReason}</TableCell>
                      <TableCell className="text-sm">{row.keyLevel ?? "-"}</TableCell>
                      <TableCell className="text-sm">{row.exitTrigger ?? "-"}</TableCell>
                      <TableCell className="text-sm">{row.estimatedExitCost ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section B3: Top 5 destinations */}
        <TabsContent value="destinations">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Top 5 Investment Destinations</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {result.topDestinations.map((dest, i) => (
                <Card key={i} className={dest.isNew ? "border-primary/50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-muted-foreground/40">#{i + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base">{dest.ticker}</span>
                            {dest.isNew && <Badge variant="outline" className="text-xs">New</Badge>}
                          </div>
                          <span className="text-sm text-muted-foreground">{dest.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{dest.suggestedPct.toFixed(0)}% of cash</Badge>
                        <Badge variant={dest.role === "growth" ? "default" : dest.role === "hedge" ? "secondary" : "outline"}>
                          {dest.role}
                        </Badge>
                        <span className={`text-sm font-medium ${RISK_COLORS[dest.riskLevel]}`}>
                          Risk {dest.riskLevel}/5 · {RISK_LABELS[dest.riskLevel]}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{dest.thesis}</p>
                    <Separator />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                      <div><span className="font-medium">Liquidity:</span> {dest.liquidity}</div>
                      {dest.ter && <div><span className="font-medium">TER/Fee:</span> {dest.ter}</div>}
                      <div className="col-span-2 sm:col-span-1"><span className="font-medium">Entry plan:</span> {dest.entryPlan}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Section B4: Scenarios */}
        <TabsContent value="scenarios">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[result.scenarios.investToday, result.scenarios.wait].map((scenario, i) => (
              <Card key={i} className={i === 0 ? "border-green-500/50" : "border-amber-500/50"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {i === 0 ? <Zap className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-amber-600" />}
                    {scenario.name}
                  </CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Allocation:</p>
                    {scenario.allocation.map((a, j) => (
                      <div key={j} className="text-sm bg-muted/50 rounded px-3 py-2">
                        <span className="font-medium">{a.ticker}</span> · {a.amount}
                        <p className="text-muted-foreground text-xs mt-0.5">{a.rationale}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Expected outcome:</p>
                    <p className="text-sm text-muted-foreground">{scenario.expectedOutcome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1 text-amber-600">Main risk:</p>
                    <p className="text-sm text-muted-foreground">{scenario.mainRisk}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
