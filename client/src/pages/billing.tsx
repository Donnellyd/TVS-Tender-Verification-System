import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, FileText, BarChart3, Clock, CheckCircle, AlertCircle, Download, Globe } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionTier {
  name: string;
  price: number;
  priceAnnual: number;
  bidsIncluded: number;
  documentsIncluded: number;
  storageIncludedMb: number;
  features: string[];
}

interface UsageData {
  current: {
    bidsProcessed: number;
    documentsVerified: number;
    storageUsedMb: number;
    apiCalls: number;
  };
  limits: {
    bidsIncluded: number;
    documentsIncluded: number;
    storageIncludedMb: number;
  };
  tier: SubscriptionTier;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  pdfUrl?: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  const { data: tiers } = useQuery<Record<string, SubscriptionTier>>({
    queryKey: ["/api/subscription-tiers"],
  });

  const { data: yocoConfigured } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/yoco/configured"],
  });

  const handleYocoPayment = async (priceId: string) => {
    if (!tenantId) return;
    setPaymentLoading(true);
    try {
      const response = await apiRequest("POST", "/api/yoco/create-checkout", { priceId, tenantId });
      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error("Yoco payment error:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const { data: userTenants } = useQuery<{ tenantId: string }[]>({
    queryKey: ["/api/user/tenants"],
    enabled: !!user,
  });
  
  const tenantId = userTenants?.[0]?.tenantId;
  
  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/tenants", tenantId, "usage"],
    enabled: !!tenantId,
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/tenants", tenantId, "invoices"],
    enabled: !!tenantId,
  });

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit <= 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const currentTier = usage?.tier || tiers?.starter;
  const currentUsage = usage?.current || { bidsProcessed: 0, documentsVerified: 0, storageUsedMb: 0, apiCalls: 0 };
  const limits = usage?.limits || { bidsIncluded: 50, documentsIncluded: 500, storageIncludedMb: 5000 };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription, usage, and invoices</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="plans" data-testid="tab-plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentTier?.name || "Starter"}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(currentTier?.price || 49900)}/month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Billing Period</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Monthly</div>
                <p className="text-xs text-muted-foreground">
                  Renews on {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All features available
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method for subscription billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {yocoConfigured?.configured && (
                <div className="flex items-center justify-between p-4 border rounded-lg border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">South African Cards (Yoco)</p>
                      <p className="text-sm text-muted-foreground">Local ZAR billing - Recommended for SA</p>
                    </div>
                  </div>
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-pay-yoco"
                    disabled={paymentLoading}
                    onClick={() => handleYocoPayment("starter_annual")}
                  >
                    {paymentLoading ? "Processing..." : "Pay with Yoco"}
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                All payments are processed securely with bank-grade encryption
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage This Period
              </CardTitle>
              <CardDescription>
                Track your usage against your plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Bids Processed</span>
                  <span className="font-medium">{currentUsage.bidsProcessed} / {limits.bidsIncluded}</span>
                </div>
                <Progress value={getUsagePercentage(currentUsage.bidsProcessed, limits.bidsIncluded)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Documents Verified</span>
                  <span className="font-medium">{currentUsage.documentsVerified} / {limits.documentsIncluded}</span>
                </div>
                <Progress value={getUsagePercentage(currentUsage.documentsVerified, limits.documentsIncluded)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Storage Used</span>
                  <span className="font-medium">{currentUsage.storageUsedMb} MB / {limits.storageIncludedMb} MB</span>
                </div>
                <Progress value={getUsagePercentage(currentUsage.storageUsedMb, limits.storageIncludedMb)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>API Calls</span>
                  <span className="font-medium">{currentUsage.apiCalls}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers && Object.entries(tiers).map(([key, tier]) => (
              <Card key={key} className={key === "professional" ? "border-primary" : ""}>
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">{formatCurrency(tier.price)}</span>
                    <span className="text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{tier.bidsIncluded === -1 ? "Unlimited" : tier.bidsIncluded} bids/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{tier.documentsIncluded === -1 ? "Unlimited" : tier.documentsIncluded} documents/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{tier.storageIncludedMb === -1 ? "Unlimited" : `${tier.storageIncludedMb / 1000} GB`} storage</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={key === "professional" ? "default" : "outline"}
                    data-testid={`button-select-${key}`}
                  >
                    {key === "starter" ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice History
              </CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(invoice.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.pdfUrl && (
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices yet</p>
                  <p className="text-sm">Your invoices will appear here once generated</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
