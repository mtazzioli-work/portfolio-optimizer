import { PortfolioUploadClient } from "@/components/portfolio/portfolio-upload-client";

export default function PortfolioUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload your portfolio as a CSV export from Interactive Brokers or as a screenshot image.
        </p>
      </div>
      <PortfolioUploadClient />
    </div>
  );
}
