"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateInvestmentProfile } from "@/lib/actions";
import { type InvestmentRules } from "@/lib/default-investment-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Plus } from "lucide-react";

type Props = { initialProfile: InvestmentRules };

export function InvestmentProfileForm({ initialProfile }: Props) {
  const [profile, setProfile] = useState<InvestmentRules>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [newAllowed, setNewAllowed] = useState("");
  const [newProhibited, setNewProhibited] = useState("");

  const update = <K extends keyof InvestmentRules>(key: K, value: InvestmentRules[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const updateAllocation = (
    key: keyof InvestmentRules["targetAllocation"],
    field: "min" | "max",
    value: number
  ) =>
    setProfile((p) => ({
      ...p,
      targetAllocation: {
        ...p.targetAllocation,
        [key]: { ...p.targetAllocation[key], [field]: value / 100 },
      },
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateInvestmentProfile(profile);
      toast.success("Investment profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const allocationFields: { key: keyof InvestmentRules["targetAllocation"]; label: string }[] = [
    { key: "equityEtf", label: "Equity / ETFs" },
    { key: "bondsIG", label: "IG Bonds / T-bills" },
    { key: "commodities", label: "Commodities / Metals" },
    { key: "crypto", label: "Crypto" },
    { key: "liquidity", label: "Liquidity (cash/stablecoins)" },
  ];

  return (
    <div className="space-y-6">
      {/* Risk & Objectives */}
      <Card>
        <CardHeader>
          <CardTitle>Risk & Objectives</CardTitle>
          <CardDescription>Core investment parameters</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Risk Profile</Label>
            <Select value={profile.riskProfile} onValueChange={(v) => update("riskProfile", v as InvestmentRules["riskProfile"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Objective</Label>
            <Select value={profile.objective} onValueChange={(v) => update("objective", v as InvestmentRules["objective"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Investment Horizon</Label>
            <Input value={profile.horizon} onChange={(e) => update("horizon", e.target.value)} placeholder="e.g. 3-5 years" />
          </div>

          <div className="space-y-2">
            <Label>Rebalancing Policy</Label>
            <Select value={profile.rebalancingPolicy} onValueChange={(v) => update("rebalancingPolicy", v as InvestmentRules["rebalancingPolicy"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Max Portfolio Drawdown: <span className="text-primary font-semibold">{(profile.maxPortfolioDrawdown * 100).toFixed(0)}%</span></Label>
            <Slider
              min={5} max={50} step={5}
              value={[profile.maxPortfolioDrawdown * 100]}
              onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; update("maxPortfolioDrawdown", (n ?? 10) / 100); }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Maximum acceptable drawdown from portfolio peak</p>
          </div>

          <div className="space-y-3">
            <Label>Max Loss per Position: <span className="text-primary font-semibold">{(profile.maxPositionLoss * 100).toFixed(0)}%</span></Label>
            <Slider
              min={10} max={50} step={5}
              value={[profile.maxPositionLoss * 100]}
              onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; update("maxPositionLoss", (n ?? 30) / 100); }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Stop-loss threshold per individual position</p>
          </div>
        </CardContent>
      </Card>

      {/* Target Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Target Allocation</CardTitle>
          <CardDescription>Min-max % bands per asset class</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {allocationFields.map(({ key, label }) => {
            const val = profile.targetAllocation[key];
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{label}</Label>
                  <span className="text-sm font-medium text-primary">
                    {(val.min * 100).toFixed(0)}% – {(val.max * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6">Min</span>
                  <Slider
                    min={0} max={100} step={5}
                    value={[val.min * 100]}
                    onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; updateAllocation(key, "min", n ?? 0); }}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-6">Max</span>
                  <Slider
                    min={0} max={100} step={5}
                    value={[val.max * 100]}
                    onValueChange={(v) => { const n = Array.isArray(v) ? v[0] : v; updateAllocation(key, "max", n ?? 0); }}
                    className="flex-1"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Instruments */}
      <Card>
        <CardHeader>
          <CardTitle>Instruments</CardTitle>
          <CardDescription>Allowed and prohibited instruments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Allowed Instruments</Label>
            <div className="flex flex-wrap gap-2">
              {profile.allowedInstruments.map((inst, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {inst}
                  <button onClick={() => update("allowedInstruments", profile.allowedInstruments.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newAllowed} onChange={(e) => setNewAllowed(e.target.value)} placeholder="Add instrument…" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter" && newAllowed.trim()) { update("allowedInstruments", [...profile.allowedInstruments, newAllowed.trim()]); setNewAllowed(""); }}} />
              <Button size="sm" variant="outline" onClick={() => { if (newAllowed.trim()) { update("allowedInstruments", [...profile.allowedInstruments, newAllowed.trim()]); setNewAllowed(""); }}}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Prohibited Instruments</Label>
            <div className="flex flex-wrap gap-2">
              {profile.prohibitedInstruments.map((inst, i) => (
                <Badge key={i} variant="destructive" className="gap-1">
                  {inst}
                  <button onClick={() => update("prohibitedInstruments", profile.prohibitedInstruments.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newProhibited} onChange={(e) => setNewProhibited(e.target.value)} placeholder="Add prohibition…" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter" && newProhibited.trim()) { update("prohibitedInstruments", [...profile.prohibitedInstruments, newProhibited.trim()]); setNewProhibited(""); }}} />
              <Button size="sm" variant="outline" onClick={() => { if (newProhibited.trim()) { update("prohibitedInstruments", [...profile.prohibitedInstruments, newProhibited.trim()]); setNewProhibited(""); }}}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Rules & Context */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Rules & Context</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Timeframe</Label>
            <Input value={profile.technicalRules.primaryTimeframe} onChange={(e) => update("technicalRules", { ...profile.technicalRules, primaryTimeframe: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Trend Rule</Label>
            <Input value={profile.technicalRules.trendRule} onChange={(e) => update("technicalRules", { ...profile.technicalRules, trendRule: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Entry Trigger</Label>
            <Input value={profile.technicalRules.trigger} onChange={(e) => update("technicalRules", { ...profile.technicalRules, trigger: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Entry Strategy</Label>
            <Input value={profile.technicalRules.entryStrategy} onChange={(e) => update("technicalRules", { ...profile.technicalRules, entryStrategy: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Tax Jurisdiction</Label>
            <Input value={profile.taxJurisdiction} onChange={(e) => update("taxJurisdiction", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Input value={profile.accountType} onChange={(e) => update("accountType", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={profile.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-2" /> Save Profile</>}
      </Button>
    </div>
  );
}
