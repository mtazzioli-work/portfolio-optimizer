import { notFound } from "next/navigation";
import { getPortfolioWithPositions } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalyzeButton } from "@/components/portfolio/analyze-button";

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let data;
  try {
    data = await getPortfolioWithPositions(id);
  } catch {
    notFound();
  }

  const { portfolio, positions } = data;
  const activePositions = positions.filter((p) => (p.positionValue ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio Snapshot</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Uploaded {format(new Date(portfolio.uploadedAt), "dd MMM yyyy HH:mm")} · Source:{" "}
            <Badge variant="outline">{portfolio.source}</Badge>
          </p>
        </div>
        <AnalyzeButton portfolioId={portfolio.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Positions ({activePositions.length})</CardTitle>
          <CardDescription>
            Total market value: ${(portfolio.totalValueUsd ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })} USD
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Position</TableHead>
                <TableHead className="text-right">Mark Price</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Cost Basis</TableHead>
                <TableHead className="text-right">P&L %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activePositions.map((p) => {
                const pnlPct =
                  p.costBasisPrice && p.markPrice
                    ? ((p.markPrice - p.costBasisPrice) / p.costBasisPrice) * 100
                    : null;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.symbol}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.isin ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {p.subCategory ?? p.assetCategory ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.currency ?? "-"}</TableCell>
                    <TableCell className="text-right">{p.position?.toFixed(4) ?? "-"}</TableCell>
                    <TableCell className="text-right">{p.markPrice?.toFixed(2) ?? "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {p.positionValue?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">{p.costBasisPrice?.toFixed(2) ?? "-"}</TableCell>
                    <TableCell className={`text-right font-medium ${pnlPct !== null ? (pnlPct >= 0 ? "text-green-600" : "text-red-600") : ""}`}>
                      {pnlPct !== null ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%` : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
