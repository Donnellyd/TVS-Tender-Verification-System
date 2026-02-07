import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Palette, RotateCcw, Save, Globe, Image, Type, Mail, Phone } from "lucide-react";

interface WhiteLabelConfig {
  companyName: string;
  portalTitle: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  welcomeMessage: string;
  footerText: string;
  supportEmail: string;
  supportPhone: string;
  termsUrl: string;
  customDomain: string;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  companyName: "City of Johannesburg",
  portalTitle: "City of Johannesburg Supplier Portal",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#1e40af",
  secondaryColor: "#3b82f6",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  welcomeMessage: "Welcome to the official supplier portal. Register and manage your bids, track submissions, and stay updated on procurement opportunities.",
  footerText: "Powered by VeritasAI. All rights reserved.",
  supportEmail: "procurement@example.gov.za",
  supportPhone: "+27 11 000 0000",
  termsUrl: "https://example.gov.za/terms",
  customDomain: "",
};

export default function WhiteLabel() {
  const [config, setConfig] = useState<WhiteLabelConfig>({ ...DEFAULT_CONFIG });
  const { toast } = useToast();

  const updateField = (field: keyof WhiteLabelConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    toast({ title: "Configuration saved", description: "White-label settings have been updated successfully." });
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG });
    toast({ title: "Configuration reset", description: "All settings have been restored to defaults." });
  };

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <PageHeader
        title="White-Label Portal"
        description="Customize the look and feel of your vendor-facing portal with your own branding, colors, and content."
      />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={handleReset} data-testid="button-reset-defaults">
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} data-testid="button-save-config">
          <Save className="h-4 w-4 mr-1" />
          Save Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Image className="h-4 w-4" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" value={config.companyName} onChange={(e) => updateField("companyName", e.target.value)} data-testid="input-company-name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portal-title">Portal Title</Label>
                  <Input id="portal-title" value={config.portalTitle} onChange={(e) => updateField("portalTitle", e.target.value)} data-testid="input-portal-title" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input id="logo-url" value={config.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} placeholder="https://example.com/logo.png" data-testid="input-logo-url" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="favicon-url">Favicon URL</Label>
                  <Input id="favicon-url" value={config.faviconUrl} onChange={(e) => updateField("faviconUrl", e.target.value)} placeholder="https://example.com/favicon.ico" data-testid="input-favicon-url" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" />
                Color Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "Primary", field: "primaryColor" as const },
                  { label: "Secondary", field: "secondaryColor" as const },
                  { label: "Accent", field: "accentColor" as const },
                  { label: "Background", field: "backgroundColor" as const },
                  { label: "Text", field: "textColor" as const },
                ].map((c) => (
                  <div key={c.field} className="space-y-1.5">
                    <Label htmlFor={c.field}>{c.label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id={c.field}
                        value={config[c.field]}
                        onChange={(e) => updateField(c.field, e.target.value)}
                        className="h-9 w-9 rounded-md border cursor-pointer"
                        data-testid={`color-${c.field}`}
                      />
                      <Input
                        value={config[c.field]}
                        onChange={(e) => updateField(c.field, e.target.value)}
                        className="font-mono text-xs"
                        data-testid={`input-${c.field}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="h-4 w-4" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea id="welcome-message" value={config.welcomeMessage} onChange={(e) => updateField("welcomeMessage", e.target.value)} rows={3} data-testid="textarea-welcome-message" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="footer-text">Footer Text</Label>
                <Textarea id="footer-text" value={config.footerText} onChange={(e) => updateField("footerText", e.target.value)} rows={2} data-testid="textarea-footer-text" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="support-email">Support Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="support-email" value={config.supportEmail} onChange={(e) => updateField("supportEmail", e.target.value)} className="pl-9" data-testid="input-support-email" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="support-phone" value={config.supportPhone} onChange={(e) => updateField("supportPhone", e.target.value)} className="pl-9" data-testid="input-support-phone" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="terms-url">Terms & Conditions URL</Label>
                <Input id="terms-url" value={config.termsUrl} onChange={(e) => updateField("termsUrl", e.target.value)} data-testid="input-terms-url" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" />
                Domain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="custom-domain">Custom Domain</Label>
                <Input id="custom-domain" value={config.customDomain} disabled placeholder="e.g. portal.yourcompany.co.za" data-testid="input-custom-domain" />
                <p className="text-xs text-muted-foreground">Contact support to configure a custom domain for your portal.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Current Portal URL</Label>
                <Input value="https://portal.veritasai.co.za/your-org" readOnly className="bg-muted" data-testid="input-current-url" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portal Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden" data-testid="portal-preview">
                <div className="p-3 flex items-center gap-2" style={{ backgroundColor: config.primaryColor }}>
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-6 w-6 rounded" />
                  ) : (
                    <div className="h-6 w-6 rounded bg-white/20 flex items-center justify-center">
                      <Image className="h-3 w-3 text-white/70" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white truncate">{config.portalTitle}</span>
                </div>

                <div className="p-3 space-y-2" style={{ backgroundColor: config.backgroundColor }}>
                  <p className="text-xs leading-relaxed" style={{ color: config.textColor }}>
                    {config.welcomeMessage}
                  </p>
                  <Separator />
                  <div className="flex gap-1">
                    <div className="h-7 rounded-md px-3 flex items-center" style={{ backgroundColor: config.secondaryColor }}>
                      <span className="text-[10px] font-medium text-white">Register</span>
                    </div>
                    <div className="h-7 rounded-md px-3 flex items-center" style={{ backgroundColor: config.accentColor }}>
                      <span className="text-[10px] font-medium text-white">Login</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 text-center border-t" style={{ backgroundColor: config.primaryColor }}>
                  <span className="text-[9px] text-white/70">{config.footerText}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Support:</span>
                  <span className="font-mono truncate ml-2">{config.supportEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phone:</span>
                  <span className="font-mono">{config.supportPhone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
