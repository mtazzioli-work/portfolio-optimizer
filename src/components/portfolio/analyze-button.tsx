"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { triggerAnalysis } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export function AnalyzeButton({ portfolioId }: { portfolioId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      toast.info("Running AI analysis… this may take 30–60 seconds");
      const analysisId = await triggerAnalysis(portfolioId);
      toast.success("Analysis complete!");
      router.push(`/analysis/${analysisId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleAnalyze} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Analyzing…
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Run AI Analysis
        </>
      )}
    </Button>
  );
}
