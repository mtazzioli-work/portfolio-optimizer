"use client";

import { type Portfolio } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Upload, TrendingUp } from "lucide-react";

type Props = { snapshots: Portfolio[] };

export function HistoryClient({ snapshots }: Props) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <TrendingUp className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No snapshots yet. Upload your first portfolio to start tracking.</p>
          <Link href="/portfolio/upload" className={buttonVariants()}>
            <Upload className="h-4 w-4 mr-2" /> Upload Portfolio
          </Link>
        </CardContent>
      </Card>
    );
  }

  const chartData = snapshots.map((s) => ({
    date: format(new Date(s.uploadedAt), "dd MMM yy"),
    value: s.totalValueUsd ?? 0,
  }));

  const first = chartData[0].value;
  const last = chartData[chartData.length - 1].value;
  const growthPct = first > 0 ? ((last - first) / first) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><p className="text-sm text-muted-foreground">First Snapshot</p></CardHeader>
          <CardContent className="font-semibold">${first.toLocaleString("en-US", { maximumFractionDigits: 0 })}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Latest Snapshot</p></CardHeader>
          <CardContent className="font-semibold">${last.toLocaleString("en-US", { maximumFractionDigits: 0 })}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><p className="text-sm text-muted-foreground">Total Growth</p></CardHeader>
          <CardContent className={`font-semibold ${growthPct >= 0 ? "text-green-600" : "text-red-600"}`}>
            {growthPct >= 0 ? "+" : ""}{growthPct.toFixed(1)}%
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invested Value (IB) Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => { const n = typeof v === "number" ? v : 0; return [`$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, "Value"]; }} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
