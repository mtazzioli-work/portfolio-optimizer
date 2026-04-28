import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { portfolios, analyses, liquidAssets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [latestPortfolio, latestAnalysis, liquid] = await Promise.all([
    db.query.portfolios.findFirst({
      where: eq(portfolios.userId, userId),
      orderBy: [desc(portfolios.uploadedAt)],
    }),
    db.query.analyses.findFirst({
      where: eq(analyses.userId, userId),
      orderBy: [desc(analyses.generatedAt)],
    }),
    db.query.liquidAssets.findMany({ where: eq(liquidAssets.userId, userId) }),
  ]);

  return <DashboardClient latestPortfolio={latestPortfolio ?? null} latestAnalysis={latestAnalysis ?? null} liquid={liquid} />;
}
