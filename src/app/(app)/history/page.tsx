import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { portfolios } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { HistoryClient } from "@/components/dashboard/history-client";

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const snapshots = await db.query.portfolios.findMany({
    where: eq(portfolios.userId, userId),
    orderBy: [asc(portfolios.uploadedAt)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio History</h1>
        <p className="text-muted-foreground text-sm mt-1">Evolution of your total invested value over time</p>
      </div>
      <HistoryClient snapshots={snapshots} />
    </div>
  );
}
