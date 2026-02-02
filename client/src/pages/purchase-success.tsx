import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Copy, Key, Mail, Building2, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PurchaseData {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  tier: string;
  status: string;
  tempPassword: string | null;
  currency: string;
  amount: number;
  tenantId?: string;
}

export default function PurchaseSuccessPage() {
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseId = params.get("purchaseId");

    if (!purchaseId) {
      setError("No purchase ID found");
      setLoading(false);
      return;
    }

    const fetchPurchase = async () => {
      try {
        const res = await fetch(`/api/public/purchase/${purchaseId}`);
        if (!res.ok) {
          throw new Error("Purchase not found");
        }
        const data = await res.json();
        setPurchase(data);
      } catch (err) {
        setError("Failed to load purchase details");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchase();
    
    const interval = setInterval(fetchPurchase, 3000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === "ZAR" ? "R" : "$";
    return `${symbol}${(amount / 100).toLocaleString()}`;
  };

  const tierNames: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="page-purchase-success-loading">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-lg font-medium">Loading purchase details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="page-purchase-success-error">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error || "Purchase not found"}</p>
            <Link href="/pricing">
              <Button>Return to Pricing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (purchase.status === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="page-purchase-success-pending">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-bold mb-2">Processing Your Payment</h2>
            <p className="text-muted-foreground mb-2">
              Please wait while we confirm your payment...
            </p>
            <p className="text-sm text-muted-foreground">
              This page will automatically update once complete.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4" data-testid="page-purchase-success">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-success-title">Payment Successful!</h1>
          <p className="text-muted-foreground" data-testid="text-success-subtitle">
            Welcome to VeritasAI. Your account has been created.
          </p>
        </div>

        <Card className="mb-6" data-testid="card-account-details">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Account Details
            </CardTitle>
            <CardDescription>
              Save these credentials - you'll need them to log in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{tierNames[purchase.tier] || purchase.tier} Plan</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(purchase.amount, purchase.currency)}/year
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your subscription is now active. You have full access to all {tierNames[purchase.tier] || purchase.tier} features.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </Label>
                <div className="flex gap-2">
                  <Input value={purchase.companyName} readOnly className="bg-muted" data-testid="input-company-name" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (Username)
                </Label>
                <div className="flex gap-2">
                  <Input value={purchase.email} readOnly className="bg-muted" data-testid="input-email" />
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => copyToClipboard(purchase.email, "Email")}
                    data-testid="button-copy-email"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {purchase.tempPassword && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Temporary Password
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={purchase.tempPassword} 
                      readOnly 
                      className="bg-muted font-mono"
                      data-testid="input-temp-password"
                    />
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => copyToClipboard(purchase.tempPassword!, "Password")}
                      data-testid="button-copy-password"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    You will be required to change this password on first login.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Copy your email and temporary password above</li>
                <li>Configure your email settings (optional)</li>
                <li>Click "Log In to Your Account" below</li>
                <li>Enter your credentials to access your dashboard</li>
                <li>Change your password when prompted</li>
              </ol>
            </div>

            {purchase.tenantId && (
              <div className="border-t pt-6">
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Email Configuration (After Login)</h4>
                    <p className="text-sm text-muted-foreground">
                      After logging in, you can configure email settings to send notifications from VeritasAI's email or your own company domain. Access this from your Settings menu.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto" data-testid="button-login">
              Log In to Your Account
            </Button>
          </Link>
          <Link href="/help">
            <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-help">
              View Getting Started Guide
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Need help? Contact us at support@veritas-ai.com
        </p>
      </div>
    </div>
  );
}
