"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadPortfolioCSV, uploadPortfolioImage, triggerAnalysis, upsertLiquidAssets } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, FileText, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LiquidEntry = {
  category: string;
  label: string;
  amountUsd: number;
};

const DEFAULT_LIQUID: LiquidEntry[] = [
  { category: "real_estate", label: "Real Estate (Argentina)", amountUsd: 17000 },
  { category: "crypto", label: "Crypto (BTC, BNB, ETH, TRX)", amountUsd: 11500 },
  { category: "stablecoins", label: "Stablecoins (staked)", amountUsd: 12500 },
  { category: "liquid_for_investing", label: "Liquid for Investing (IB)", amountUsd: 13400 },
  { category: "cash_usd", label: "Idle Cash", amountUsd: 4400 },
];

export function PortfolioUploadClient() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [runAnalysis, setRunAnalysis] = useState(true);
  const [liquid, setLiquid] = useState<LiquidEntry[]>(DEFAULT_LIQUID);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => setSelectedFile(file);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const isCSV = selectedFile?.name.endsWith(".csv") || selectedFile?.type === "text/csv";

  const handleSubmit = async () => {
    if (!selectedFile) { toast.error("Please select a file"); return; }
    if (!isImage && !isCSV) { toast.error("Only CSV or image files are supported"); return; }

    setUploading(true);
    try {
      // Save liquid assets
      await upsertLiquidAssets(liquid);

      // Upload portfolio
      const fd = new FormData();
      fd.append("file", selectedFile);
      const portfolioId = isImage
        ? await uploadPortfolioImage(fd)
        : await uploadPortfolioCSV(fd);

      toast.success("Portfolio uploaded successfully");

      if (runAnalysis) {
        toast.info("Running AI analysis… this may take 30–60 seconds");
        const analysisId = await triggerAnalysis(portfolioId);
        toast.success("Analysis complete!");
        router.push(`/analysis/${analysisId}`);
      } else {
        router.push(`/portfolio/${portfolioId}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* File upload */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio File</CardTitle>
          <CardDescription>
            CSV columns expected: symbol, isin, currency, assetCategory, position, markPrice, positionValue, costBasisPrice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="csv">
            <TabsList className="mb-4">
              <TabsTrigger value="csv">
                <FileText className="h-4 w-4 mr-2" />
                CSV File
              </TabsTrigger>
              <TabsTrigger value="image">
                <Image className="h-4 w-4 mr-2" />
                Screenshot (AI Extract)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                {selectedFile && isCSV ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">Drop CSV here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Compatible with IBKR Flex Query CSV exports</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            </TabsContent>

            <TabsContent value="image">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Image className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                {selectedFile && isImage ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">Drop screenshot here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Claude Vision will extract positions automatically</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Liquid assets */}
      <Card>
        <CardHeader>
          <CardTitle>Liquid & Off-Exchange Assets</CardTitle>
          <CardDescription>Assets not tracked in IB (crypto, real estate, cash). These are included in the analysis context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {liquid.map((entry, i) => (
            <div key={i} className="flex items-center gap-3">
              <Label className="w-48 shrink-0 text-sm">{entry.label}</Label>
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={entry.amountUsd}
                  onChange={(e) => {
                    const updated = [...liquid];
                    updated[i] = { ...entry, amountUsd: parseFloat(e.target.value) || 0 };
                    setLiquid(updated);
                  }}
                  className="max-w-36"
                />
                <span className="text-muted-foreground text-xs">USD</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={runAnalysis}
              onChange={(e) => setRunAnalysis(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Run AI analysis immediately after upload</span>
          </label>
          <Button onClick={handleSubmit} disabled={uploading || !selectedFile} size="lg">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {runAnalysis ? "Uploading & Analyzing…" : "Uploading…"}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {runAnalysis ? "Upload & Analyze" : "Upload Portfolio"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
