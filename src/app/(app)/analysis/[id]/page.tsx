import { notFound } from "next/navigation";
import { getAnalysis } from "@/lib/actions";
import { type AnalysisResult } from "@/lib/claude-analysis";
import { AnalysisView } from "@/components/analysis/analysis-view";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let analysis;
  try {
    analysis = await getAnalysis(id);
  } catch {
    notFound();
  }

  if (analysis.status !== "done" || !analysis.result) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Analysis</h1>
        <Badge variant={analysis.status === "error" ? "destructive" : "secondary"}>
          {analysis.status}
        </Badge>
        {analysis.errorMessage && (
          <p className="text-sm text-destructive">{analysis.errorMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monthly Portfolio Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generated {format(new Date(analysis.generatedAt), "dd MMM yyyy 'at' HH:mm")}
        </p>
      </div>
      <AnalysisView result={analysis.result as AnalysisResult} />
    </div>
  );
}
