import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Building2, Globe, DollarSign, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { auditLogService } from "@/services/auditLogService";

interface CompanyValues {
  company_name: string;
  company_tagline: string;
  company_description: string;
  physical_address: string;
  city: string;
  country: string;
  phone_number: string;
  email_address: string;
  website_url: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  whatsapp_number: string;
  currency: string;
  timezone: string;
  financial_year_start: string;
  vat_rate: string;
}

const DEFAULT_COMPANY: CompanyValues = {
  company_name: "Amuse Kenya",
  company_tagline: "Adventure Awaits in the Wild",
  company_description: "",
  physical_address: "",
  city: "Nairobi",
  country: "Kenya",
  phone_number: "",
  email_address: "",
  website_url: "https://amusekenya.co.ke",
  facebook_url: "",
  instagram_url: "",
  twitter_url: "",
  whatsapp_number: "",
  currency: "KES",
  timezone: "Africa/Nairobi",
  financial_year_start: "January",
  vat_rate: "16",
};

const CompanyConfigPanel: React.FC = () => {
  const [values, setValues] = useState<CompanyValues>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any).from("company_settings").select("key, value");

        if (error) throw error;

        if (data && data.length > 0) {
          const loaded: Partial<CompanyValues> = {};
          (data as { key: string; value: string }[]).forEach((row) => {
            if (row.key in DEFAULT_COMPANY) {
              (loaded as any)[row.key] = row.value ?? (DEFAULT_COMPANY as any)[row.key];
            }
          });
          setValues({ ...DEFAULT_COMPANY, ...loaded });
        }
      } catch (e) {
        console.error("Failed to load company settings:", e);
        toast({ title: "Error", description: "Could not load company settings.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const set = (key: keyof CompanyValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const upserts = Object.entries(values).map(([key, value]) => ({ key, value }));

      const { error } = await (supabase as any).from("company_settings").upsert(upserts, { onConflict: "key" });

      if (error) throw error;

      await auditLogService.logEvent({
        action: "company_settings_updated",
        entityType: "company",
        details: "Company configuration updated",
        severity: "warning",
      });

      toast({ title: "Company Config Saved", description: "Company settings have been updated successfully." });
    } catch (e) {
      console.error("Failed to save company settings:", e);
      toast({ title: "Error", description: "Failed to save company settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Company Configuration</h2>
          <p className="text-muted-foreground">Manage company profile, social links, and business settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Core business details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={values.company_name}
                onChange={(e) => set("company_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_tagline">Tagline</Label>
              <Input
                id="company_tagline"
                value={values.company_tagline}
                onChange={(e) => set("company_tagline", e.target.value)}
                placeholder="Short compelling tagline"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_description">Company Description</Label>
            <Textarea
              id="company_description"
              rows={3}
              value={values.company_description}
              onChange={(e) => set("company_description", e.target.value)}
              placeholder="Brief description of the company..."
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="physical_address">Physical Address</Label>
            <Textarea
              id="physical_address"
              rows={2}
              value={values.physical_address}
              onChange={(e) => set("physical_address", e.target.value)}
              placeholder="Street address / location description"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={values.country} onChange={(e) => set("country", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={values.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_address">Email Address</Label>
              <Input
                id="email_address"
                type="email"
                value={values.email_address}
                onChange={(e) => set("email_address", e.target.value)}
                placeholder="info@amusekenya.co.ke"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                value={values.website_url}
                onChange={(e) => set("website_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Links
          </CardTitle>
          <CardDescription>Official company social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook URL</Label>
              <Input
                id="facebook_url"
                value={values.facebook_url}
                onChange={(e) => set("facebook_url", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input
                id="instagram_url"
                value={values.instagram_url}
                onChange={(e) => set("instagram_url", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter_url">Twitter / X URL</Label>
              <Input
                id="twitter_url"
                value={values.twitter_url}
                onChange={(e) => set("twitter_url", e.target.value)}
                placeholder="https://x.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <Input
                id="whatsapp_number"
                value={values.whatsapp_number}
                onChange={(e) => set("whatsapp_number", e.target.value)}
                placeholder="+254 700 000 000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Business Settings
          </CardTitle>
          <CardDescription>Financial, regional, and operational defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={values.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={values.timezone} onValueChange={(v) => set("timezone", v)}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fy_start">Financial Year Start</Label>
              <Select value={values.financial_year_start} onValueChange={(v) => set("financial_year_start", v)}>
                <SelectTrigger id="fy_start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="January">January</SelectItem>
                  <SelectItem value="April">April</SelectItem>
                  <SelectItem value="July">July</SelectItem>
                  <SelectItem value="October">October</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_rate">VAT / Tax Rate (%)</Label>
              <Input
                id="vat_rate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={values.vat_rate}
                onChange={(e) => set("vat_rate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default CompanyConfigPanel;
