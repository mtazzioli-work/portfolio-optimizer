import { getOrCreateInvestmentProfile } from "@/lib/actions";
import { InvestmentProfileForm } from "@/components/settings/investment-profile-form";

export default async function InvestmentProfilePage() {
  const profile = await getOrCreateInvestmentProfile();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Investment Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your personal investment rules and constraints. These are injected into every Claude analysis to ensure personalized recommendations.
        </p>
      </div>
      <InvestmentProfileForm initialProfile={profile} />
    </div>
  );
}
