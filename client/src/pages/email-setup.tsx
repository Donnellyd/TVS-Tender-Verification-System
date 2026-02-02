import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft,
  Building,
  Clock,
  Info
} from "lucide-react";

interface DnsRecord {
  host: string;
  type: string;
  data: string;
  valid: boolean;
}

interface EmailSettings {
  id?: string;
  tenantId?: string;
  emailConfigType: 'default' | 'custom';
  customDomain?: string;
  customFromEmail?: string;
  customFromName?: string;
  customReplyTo?: string;
  domainVerificationStatus?: 'pending' | 'verified' | 'failed' | 'expired';
  dnsRecords?: DnsRecord[];
  isConfigured: boolean;
}

export default function EmailSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(window.location.search);
  const tenantId = searchParams.get("tenantId") || "";
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  
  const [step, setStep] = useState<'choose' | 'custom-form' | 'dns-setup' | 'complete'>('choose');
  const [emailChoice, setEmailChoice] = useState<'default' | 'custom' | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

  const { data: settings, isLoading } = useQuery<EmailSettings>({
    queryKey: ['/api/email-settings', tenantId],
    enabled: !!tenantId,
  });

  const initializeMutation = useMutation({
    mutationFn: async (data: { tenantId: string; emailConfigType: 'default' | 'custom' }) => {
      const res = await apiRequest('POST', '/api/email-settings/initialize', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-settings', tenantId] });
      if (emailChoice === 'default') {
        setStep('complete');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize email settings",
        variant: "destructive",
      });
    },
  });

  const setupDomainMutation = useMutation({
    mutationFn: async (data: { tenantId: string; domain: string; fromEmail: string; fromName: string; replyTo?: string }) => {
      const res = await apiRequest('POST', '/api/email-settings/setup-domain', data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setDnsRecords(data.dnsRecords || []);
      setStep('dns-setup');
      queryClient.invalidateQueries({ queryKey: ['/api/email-settings', tenantId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to setup custom domain",
        variant: "destructive",
      });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/email-settings/verify-domain', { tenantId });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.verified) {
        setStep('complete');
        toast({
          title: "Domain Verified",
          description: "Your custom domain is now verified and ready to use.",
        });
      } else {
        toast({
          title: "Verification Pending",
          description: "DNS records not yet verified. Please ensure all records are properly configured and try again in a few minutes.",
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/email-settings', tenantId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify domain",
        variant: "destructive",
      });
    },
  });

  const handleChooseDefault = () => {
    setEmailChoice('default');
    initializeMutation.mutate({ tenantId, emailConfigType: 'default' });
  };

  const handleChooseCustom = () => {
    setEmailChoice('custom');
    setStep('custom-form');
  };

  const handleSetupDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setupDomainMutation.mutate({
      tenantId,
      domain: customDomain,
      fromEmail,
      fromName,
      replyTo: replyTo || undefined,
    });
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Value copied to clipboard",
    });
  };

  const handleSkipForNow = () => {
    initializeMutation.mutate({ tenantId, emailConfigType: 'default' });
    navigate(returnTo);
  };

  const handleContinue = () => {
    navigate(returnTo);
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Missing Configuration</CardTitle>
            <CardDescription>
              No tenant ID provided. Please complete the purchase process first.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => navigate("/pricing")} data-testid="button-return-pricing">
              Return to Pricing
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Email Configuration</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Set up how your organization sends email notifications to vendors and stakeholders
          </p>
        </div>

        {step === 'choose' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="relative hover-elevate cursor-pointer" onClick={handleChooseDefault} data-testid="card-default-email">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Use VeritasAI Email</CardTitle>
                    <CardDescription>Quick and easy setup</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>No configuration required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Instant activation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Professional email delivery</span>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Emails sent from:</p>
                    <p className="font-mono text-sm">veritasai@zd-solutions.com</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={initializeMutation.isPending} data-testid="button-use-default">
                  {initializeMutation.isPending && emailChoice === 'default' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Use Default Email
                </Button>
              </CardFooter>
            </Card>

            <Card className="relative hover-elevate cursor-pointer" onClick={handleChooseCustom} data-testid="card-custom-email">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Use Your Own Domain</CardTitle>
                    <CardDescription>Professional branding</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Send from your company domain</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Better brand recognition</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Requires DNS configuration</span>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Example:</p>
                    <p className="font-mono text-sm">noreply@yourcompany.com</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" data-testid="button-use-custom">
                  Configure Custom Domain
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 'custom-form' && (
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Custom Domain Setup
              </CardTitle>
              <CardDescription>
                Enter your domain and email configuration details
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSetupDomain}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Name</Label>
                  <Input
                    id="domain"
                    placeholder="yourcompany.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    required
                    data-testid="input-domain"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your company domain (without http:// or www.)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email Address</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="noreply@yourcompany.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    required
                    data-testid="input-from-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    placeholder="Your Company Procurement"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    required
                    data-testid="input-from-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    placeholder="procurement@yourcompany.com"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    data-testid="input-reply-to"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('choose')}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={setupDomainMutation.isPending}
                  data-testid="button-continue-dns"
                >
                  {setupDomainMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Continue to DNS Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {step === 'dns-setup' && (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                DNS Configuration Required
              </CardTitle>
              <CardDescription>
                Add these DNS records to your domain registrar (GoDaddy, Cloudflare, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      DNS changes can take 24-48 hours to propagate
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      You can verify once the records are added. If verification fails, wait a few hours and try again.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {dnsRecords.length > 0 ? (
                  dnsRecords.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={record.valid ? "default" : "outline"}>
                          {record.type} Record
                        </Badge>
                        {record.valid && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Host / Name</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                              {record.host}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleCopyToClipboard(record.host)}
                              data-testid={`button-copy-host-${index}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Value / Points To</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all">
                              {record.data}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleCopyToClipboard(record.data)}
                              data-testid={`button-copy-value-${index}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No DNS records found. Please try again.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
              <Button 
                variant="outline" 
                onClick={handleSkipForNow}
                data-testid="button-skip-dns"
              >
                Skip for Now (Use Default)
              </Button>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep('custom-form')}
                  data-testid="button-back-form"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => verifyDomainMutation.mutate()}
                  disabled={verifyDomainMutation.isPending}
                  data-testid="button-verify-dns"
                >
                  {verifyDomainMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Verify DNS Records
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {step === 'complete' && (
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle>Email Setup Complete</CardTitle>
              <CardDescription>
                Your email configuration has been saved successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Emails will be sent from:</p>
                <p className="font-mono">
                  {emailChoice === 'custom' && settings?.customFromEmail 
                    ? settings.customFromEmail 
                    : 'veritasai@zd-solutions.com'}
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <Button onClick={handleContinue} data-testid="button-continue-dashboard">
                Continue to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'choose' && (
          <div className="text-center mt-8">
            <Button variant="ghost" onClick={handleSkipForNow} data-testid="button-skip-setup">
              Skip email setup for now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
