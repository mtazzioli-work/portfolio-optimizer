import { getAnalysesList } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { BarChart3, ArrowRight } from "lucide-react";

export default async function AnalysesListPage() {
  const analyses = await getAnalysesList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analyses</h1>
        <p className="text-muted-foreground text-sm mt-1">All AI-generated portfolio analyses</p>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No analyses yet. Upload a portfolio to get started.</p>
          <Link href="/portfolio/upload" className={buttonVariants()}>Upload Portfolio</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <Card key={a.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-base">
                      Analysis — {format(new Date(a.generatedAt), "dd MMM yyyy HH:mm")}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Portfolio snapshot · ID {a.portfolioId.slice(0, 8)}…
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={a.status === "done" ? "default" : a.status === "error" ? "destructive" : "secondary"}>
                      {a.status}
                    </Badge>
                    {a.status === "done" && (
                      <Link href={`/analysis/${a.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        View <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              {a.status === "error" && (
                <CardContent className="pt-0">
                  <p className="text-sm text-destructive">{a.errorMessage}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
