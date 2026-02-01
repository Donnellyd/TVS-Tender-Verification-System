import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Globe, Shield, Zap, Users, FileCheck, BarChart3, Headphones, Building2, Mail, Phone, ArrowRight, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CountryEnquiryForm } from "@/components/CountryEnquiryForm";
import type { CountryLaunchStatus } from "@shared/schema";

interface CountryComplianceInfo {
  countryCode: string;
  countryName: string;
  region: string;
  status: string;
  description?: string;
  keyFeatures?: string[];
}

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
    overagePricePerBid: 2.00,
    costPerBid: 0.83,
    features: [
      "AI document verification",
      "GLOBAL compliance rules",
      "Email notifications",
      "Basic analytics",
      "1 user seat",
      "Email support"
    ],
    highlighted: false,
    isContactUs: false
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing organizations with regional needs",
    priceMonthly: 149,
    priceAnnual: 1499,
    bidsIncluded: 300,
    documentsIncluded: 3000,
    storageGb: 25,
    overagePricePerBid: 1.00,
    costPerBid: 0.42,
    features: [
      "Everything in Starter",
      "Country-specific compliance modules",
      "Multi-language support (EN/FR/PT/AR)",
      "Advanced fraud detection",
      "Webhook integrations",
      "5 user seats",
      "Priority email support"
    ],
    highlighted: true,
    isContactUs: false
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with complex requirements",
    priceMonthly: 399,
    priceAnnual: 3999,
    bidsIncluded: 1500,
    documentsIncluded: 15000,
    storageGb: 100,
    overagePricePerBid: 0.50,
    costPerBid: 0.22,
    features: [
      "Everything in Professional",
      "Custom compliance rule builder",
      "API access with high rate limits",
      "SSO/SAML integration",
      "Dedicated account manager",
      "25 user seats",
      "Phone & email support"
    ],
    highlighted: false,
    isContactUs: false
  },
  {
    id: "government",
    name: "Government & Public Sector",
    description: "Tailored solutions for national, provincial & municipal procurement",
    priceMonthly: -1,
    priceAnnual: -1,
    bidsIncluded: -1,
    documentsIncluded: -1,
    storageGb: -1,
    overagePricePerBid: -1,
    costPerBid: -1,
    features: [
      "Everything in Enterprise",
      "Custom pricing based on scope",
      "Unlimited capacity options",
      "On-premise deployment available",
      "Custom integrations",
      "Unlimited user seats",
      "24/7 dedicated support",
      "SLA guarantee"
    ],
    highlighted: false,
    isContactUs: true
  }
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    organization: "",
    country: "",
    message: ""
  });

  const { data: countries } = useQuery<CountryComplianceInfo[]>({
    queryKey: ["/api/compliance/countries"],
  });

  const { data: countryLaunchStatus } = useQuery<CountryLaunchStatus>({
    queryKey: ["/api/country-launch-status", selectedCountry],
    queryFn: async () => {
      const res = await fetch(`/api/country-launch-status/${selectedCountry}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedCountry,
  });

  const isCountryActive = countryLaunchStatus?.status === "active";
  const selectedCountryData = countries?.find(c => c.countryCode === selectedCountry);

  useEffect(() => {
    document.title = "Pricing - VeritasAI | AI-Powered Bid Evaluation Platform";
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", "Choose from Starter, Professional, Enterprise plans or contact us for Government solutions. AI-powered document verification for procurement teams across Africa and Middle East.");
    
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", "Pricing - VeritasAI | AI-Powered Bid Evaluation Platform");
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute("content", "Choose from Starter ($499/yr), Professional ($1,499/yr), Enterprise ($3,999/yr), or contact us for Government solutions.");
  }, []);

  const formatPrice = (monthly: number, annual: number) => {
    const price = isAnnual ? annual : monthly;
    if (price === -1) return "Custom";
    return `$${price.toLocaleString()}`;
  };

  const handleContactSubmit = () => {
    console.log("Contact form submitted:", contactForm);
    setContactDialogOpen(false);
    setContactForm({ name: "", email: "", organization: "", country: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-pricing">
      <div className="container mx-auto px-6 py-16" data-testid="pricing-container">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4" data-testid="badge-coverage">
            <Globe className="h-3 w-3 mr-1" />
            Serving 54+ African Nations & Middle East
          </Badge>
          <h1 className="text-4xl font-bold mb-4" data-testid="text-pricing-title">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-subtitle">
            Choose the plan that fits your organization. All plans include AI-powered document 
            verification and configurable compliance rules.
          </p>
        </div>

        <Card className="mb-12 p-6" data-testid="card-country-selector">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="font-medium">Select your country to see relevant compliance features:</span>
            </div>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full md:w-[280px]" data-testid="select-country">
                <SelectValue placeholder={countries ? "Choose your country..." : "Loading countries..."} />
              </SelectTrigger>
              <SelectContent>
                {countries?.filter(c => c.countryCode !== "GLOBAL").map((country) => (
                  <SelectItem key={country.countryCode} value={country.countryCode}>
                    {country.countryName} ({country.region})
                  </SelectItem>
                ))}
                {!countries?.length && (
                  <div className="p-2 text-sm text-muted-foreground text-center">Loading...</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedCountryData && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20" data-testid="country-compliance-preview">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {selectedCountryData.countryName} Compliance
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedCountryData.description}</p>
                  {selectedCountryData.keyFeatures && selectedCountryData.keyFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedCountryData.keyFeatures.slice(0, 5).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {selectedCountryData.keyFeatures.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedCountryData.keyFeatures.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <Link href="/compliance-explorer">
                  <Button variant="outline" size="sm" className="flex items-center gap-1" data-testid="link-compliance-explorer">
                    View Full Details <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {selectedCountry && !isCountryActive && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg" data-testid="country-not-active-notice">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200">Coming Soon to {selectedCountryData?.countryName || selectedCountry}</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    VeritasAI is not yet available for direct purchase in your region. Submit an enquiry below and we'll contact you when we launch.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {selectedCountry && !isCountryActive && (
          <div className="mb-12" data-testid="enquiry-form-section">
            <CountryEnquiryForm 
              countryCode={selectedCountry} 
              countryName={selectedCountryData?.countryName || selectedCountry} 
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-4 mb-12" data-testid="billing-toggle-container">
          <Label htmlFor="billing-toggle" className={!isAnnual ? "font-semibold" : "text-muted-foreground"} data-testid="label-monthly">
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            data-testid="switch-billing-toggle"
          />
          <Label htmlFor="billing-toggle" className={isAnnual ? "font-semibold" : "text-muted-foreground"} data-testid="label-annual">
            Annual
            <Badge variant="secondary" className="ml-2 text-xs" data-testid="badge-save">Save 15%</Badge>
          </Label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16" data-testid="pricing-grid">
          {SUBSCRIPTION_TIERS.map((tier) => (
            <Card 
              key={tier.id} 
              className={`${tier.highlighted ? "border-primary shadow-lg relative" : ""} ${tier.isContactUs ? "bg-gradient-to-b from-primary/5 to-transparent" : ""}`}
              data-testid={`card-pricing-${tier.id}`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary" data-testid="badge-most-popular">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid={`text-tier-name-${tier.id}`}>
                  {tier.isContactUs && <Building2 className="h-5 w-5 text-primary" />}
                  {tier.name}
                </CardTitle>
                <CardDescription data-testid={`text-tier-description-${tier.id}`}>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div data-testid={`text-tier-price-${tier.id}`}>
                  {tier.isContactUs ? (
                    <div>
                      <span className="text-2xl font-bold text-primary">Contact Us</span>
                      <p className="text-sm text-muted-foreground mt-1">Custom pricing based on your needs</p>
                    </div>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        {formatPrice(tier.priceMonthly, tier.priceAnnual)}
                      </span>
                      <span className="text-muted-foreground">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    </>
                  )}
                </div>

                {!tier.isContactUs && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2" data-testid={`text-bids-${tier.id}`}>
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span>{tier.bidsIncluded} bids/month</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-cost-per-bid-${tier.id}`}>
                      <span className="ml-6 text-xs">~${tier.costPerBid.toFixed(2)}/bid included</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground" data-testid={`text-overage-${tier.id}`}>
                      <span className="ml-6 text-xs">+${tier.overagePricePerBid.toFixed(2)}/bid over limit</span>
                    </div>
                    <div className="flex items-center gap-2" data-testid={`text-documents-${tier.id}`}>
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span>{tier.documentsIncluded.toLocaleString()} documents/month</span>
                    </div>
                    <div className="flex items-center gap-2" data-testid={`text-storage-${tier.id}`}>
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span>{tier.storageGb} GB storage</span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2" data-testid={`features-list-${tier.id}`}>
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm" data-testid={`text-feature-${tier.id}-${idx}`}>
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                {tier.isContactUs ? (
                  <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="default" data-testid={`button-select-${tier.id}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Sales
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          Government & Public Sector Inquiry
                        </DialogTitle>
                        <DialogDescription>
                          Tell us about your requirements and we'll create a custom solution for your organization.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact-name">Name</Label>
                            <Input 
                              id="contact-name" 
                              placeholder="Your name"
                              value={contactForm.name}
                              onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                              data-testid="input-contact-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact-email">Email</Label>
                            <Input 
                              id="contact-email" 
                              type="email"
                              placeholder="your@email.gov"
                              value={contactForm.email}
                              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                              data-testid="input-contact-email"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact-org">Organization</Label>
                            <Input 
                              id="contact-org" 
                              placeholder="Ministry / Agency"
                              value={contactForm.organization}
                              onChange={(e) => setContactForm({...contactForm, organization: e.target.value})}
                              data-testid="input-contact-org"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact-country">Country</Label>
                            <Select 
                              value={contactForm.country} 
                              onValueChange={(v) => setContactForm({...contactForm, country: v})}
                            >
                              <SelectTrigger data-testid="select-contact-country">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries?.filter(c => c.countryCode !== "GLOBAL").map((country) => (
                                  <SelectItem key={country.countryCode} value={country.countryCode}>
                                    {country.countryName}
                                  </SelectItem>
                                ))}
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact-message">Tell us about your needs</Label>
                          <Textarea 
                            id="contact-message" 
                            placeholder="Number of municipalities/agencies, expected bid volume, specific compliance requirements..."
                            rows={4}
                            value={contactForm.message}
                            onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                            data-testid="textarea-contact-message"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleContactSubmit} data-testid="button-submit-contact">
                          Send Inquiry
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : selectedCountry && !isCountryActive ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled
                    data-testid={`button-select-${tier.id}`}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Coming Soon
                  </Button>
                ) : (
                  <Link href="/billing">
                    <Button 
                      className="w-full" 
                      variant={tier.highlighted ? "default" : "outline"}
                      data-testid={`button-select-${tier.id}`}
                    >
                      Get Started
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16" data-testid="features-grid">
          <Card className="text-center p-6" data-testid="card-feature-security">
            <Shield className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2" data-testid="text-feature-security-title">Enterprise Security</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-feature-security-desc">
              AES-256 encryption, audit logging, and RBAC
            </p>
          </Card>
          <Card className="text-center p-6" data-testid="card-feature-coverage">
            <Globe className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2" data-testid="text-feature-coverage-title">Pan-African Coverage</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-feature-coverage-desc">
              All 54 African nations + Middle East support
            </p>
          </Card>
          <Card className="text-center p-6" data-testid="card-feature-ai">
            <Zap className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2" data-testid="text-feature-ai-title">AI-Powered</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-feature-ai-desc">
              Document verification in seconds, not hours
            </p>
          </Card>
          <Card className="text-center p-6" data-testid="card-feature-support">
            <Headphones className="h-10 w-10 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2" data-testid="text-feature-support-title">Dedicated Support</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-feature-support-desc">
              Expert assistance when you need it
            </p>
          </Card>
        </div>

        <div className="text-center" data-testid="contact-section">
          <h2 className="text-2xl font-bold mb-4" data-testid="text-contact-title">Questions about pricing?</h2>
          <p className="text-muted-foreground mb-6" data-testid="text-contact-description">
            Contact our sales team for custom enterprise solutions or volume discounts.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" variant="outline" data-testid="button-contact-sales">
              <Phone className="h-4 w-4 mr-2" />
              Schedule a Call
            </Button>
            <Link href="/help">
              <Button size="lg" variant="ghost" data-testid="button-view-docs">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
