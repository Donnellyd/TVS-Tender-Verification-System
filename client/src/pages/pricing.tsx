import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Globe, Shield, Zap, Users, FileCheck, BarChart3, Headphones } from "lucide-react";

const SUBSCRIPTION_TIERS = [
  {
    id: "starter",
    name: "Starter",
    description: "For small procurement teams getting started",
    priceMonthly: 49,
    priceAnnual: 499,
    bidsIncluded: 50,
    documentsIncluded: 500,
    storageGb: 5,
    features: [
      "AI document verification",
      "GLOBAL compliance rules",
      "Email notifications",
      "Basic analytics",
      "1 user seat",
      "Email support"
    ],
    highlighted: false
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing organizations with regional needs",
    priceMonthly: 199,
    priceAnnual: 1999,
    bidsIncluded: 200,
    documentsIncluded: 2000,
    storageGb: 25,
    features: [
      "Everything in Starter",
      "Country-specific compliance modules",
      "Multi-language support (EN/FR/PT/AR)",
      "Advanced fraud detection",
      "Webhook integrations",
      "5 user seats",
      "Priority email support"
    ],
    highlighted: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with complex requirements",
    priceMonthly: 499,
    priceAnnual: 4999,
    bidsIncluded: 1000,
    documentsIncluded: 10000,
    storageGb: 100,
    features: [
      "Everything in Professional",
      "Custom compliance rule builder",
      "API access with high rate limits",
      "SSO/SAML integration",
      "Dedicated account manager",
      "25 user seats",
      "Phone & email support"
    ],
    highlighted: false
  },
  {
    id: "government",
    name: "Government",
    description: "For government agencies and public sector",
    priceMonthly: 999,
    priceAnnual: 9999,
    bidsIncluded: -1,
    documentsIncluded: -1,
    storageGb: -1,
    features: [
      "Everything in Enterprise",
      "Unlimited bids & documents",
      "Unlimited storage",
      "On-premise deployment option",
      "Custom integrations",
      "Unlimited user seats",
      "24/7 dedicated support",
      "SLA guarantee"
    ],
    highlighted: false
  }
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const formatPrice = (monthly: number, annual: number) => {
    const price = isAnnual ? annual : monthly;
    if (price === -1) return "Custom";
    return `$${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Globe className="h-3 w-3 mr-1" />
            Serving 54+ African Nations & Middle East
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your organization. All plans include AI-powered document 
            verification and configurable compliance rules.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing-toggle" className={!isAnnual ? "font-semibold" : "text-muted-foreground"}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            data-testid="switch-billing-toggle"
          />
          <Label htmlFor="billing-toggle" className={isAnnual ? "font-semibold" : "text-muted-foreground"}>
            Annual
            <Badge variant="secondary" className="ml-2 text-xs">Save 15%</Badge>
          </Label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <Card 
              key={tier.id} 
              className={tier.highlighted ? "border-primary shadow-lg relative" : ""}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tier.name}
                </CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-4xl font-bold">
                    {formatPrice(tier.priceMonthly, tier.priceAnnual)}
                  </span>
                  {tier.priceMonthly !== -1 && (
                    <span className="text-muted-foreground">
                      /{isAnnual ? "year" : "month"}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <span>
                      {tier.bidsIncluded === -1 ? "Unlimited" : tier.bidsIncluded} bids/month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <span>
                      {tier.documentsIncluded === -1 ? "Unlimited" : tier.documentsIncluded} documents/month
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <span>
                      {tier.storageGb === -1 ? "Unlimited" : `${tier.storageGb} GB`} storage
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={tier.highlighted ? "default" : "outline"}
                  data-testid={`button-select-${tier.id}`}
                >
                  {tier.id === "government" ? "Contact Sales" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center p-6">
            <Shield className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Enterprise Security</h3>
            <p className="text-sm text-muted-foreground">
              AES-256 encryption, audit logging, and RBAC
            </p>
          </Card>
          <Card className="text-center p-6">
            <Globe className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Pan-African Coverage</h3>
            <p className="text-sm text-muted-foreground">
              All 54 African nations + Middle East support
            </p>
          </Card>
          <Card className="text-center p-6">
            <Zap className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Document verification in seconds, not hours
            </p>
          </Card>
          <Card className="text-center p-6">
            <Headphones className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Dedicated Support</h3>
            <p className="text-sm text-muted-foreground">
              Expert assistance when you need it
            </p>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Questions about pricing?</h2>
          <p className="text-muted-foreground mb-6">
            Contact our sales team for custom enterprise solutions or volume discounts.
          </p>
          <Button size="lg" variant="outline" data-testid="button-contact-sales">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
