import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  BookOpen, 
  Rocket, 
  CreditCard, 
  FileText, 
  Code, 
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Users,
  Shield,
  Upload,
  BarChart3,
  Globe
} from "lucide-react";
import { Link } from "wouter";

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("getting-started");

  useEffect(() => {
    document.title = "Help & Documentation - GLOBAL-TVS";
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Learn how to use GLOBAL-TVS for bid evaluation and procurement compliance. Guides for getting started, billing, API integration, and more.');
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="page-help">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4" data-testid="badge-help">
              <BookOpen className="w-3 h-3 mr-1" />
              Help Center
            </Badge>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-help-title">
              Documentation & Guides
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-help-subtitle">
              Everything you need to get started with GLOBAL-TVS and make the most of your subscription.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto" data-testid="tabs-help">
            <TabsTrigger value="getting-started" className="flex items-center gap-2" data-testid="tab-getting-started">
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">Getting Started</span>
              <span className="sm:hidden">Start</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2" data-testid="tab-billing">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
              <span className="sm:hidden">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex items-center gap-2" data-testid="tab-platform">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Platform Usage</span>
              <span className="sm:hidden">Platform</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2" data-testid="tab-api">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
              <span className="sm:hidden">API</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2" data-testid="tab-faq">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">FAQ</span>
              <span className="sm:hidden">FAQ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" data-testid="content-getting-started">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>Get up and running in minutes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</div>
                      <div>
                        <p className="font-medium">Create Your Account</p>
                        <p className="text-sm text-muted-foreground">Sign up using your email or organization credentials. Your account will be linked to a tenant (organization).</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</div>
                      <div>
                        <p className="font-medium">Choose Your Subscription</p>
                        <p className="text-sm text-muted-foreground">Select a plan that fits your needs. You can start with Starter ($499/year) and upgrade anytime.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">3</div>
                      <div>
                        <p className="font-medium">Configure Your Country</p>
                        <p className="text-sm text-muted-foreground">Set your country to load the appropriate compliance rules. Each country has specific requirements we verify.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">4</div>
                      <div>
                        <p className="font-medium">Add Your First Vendor</p>
                        <p className="text-sm text-muted-foreground">Register vendors by entering their details. Upload compliance documents like tax clearances and certificates.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">5</div>
                      <div>
                        <p className="font-medium">Create Your First Tender</p>
                        <p className="text-sm text-muted-foreground">Set up a tender with requirements. Our AI extracts compliance requirements from tender PDFs automatically.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      User Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Admin</span>
                        <span className="text-sm text-muted-foreground">Full access to all features</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Manager</span>
                        <span className="text-sm text-muted-foreground">Manage vendors, tenders, users</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Analyst</span>
                        <span className="text-sm text-muted-foreground">Review and score bids</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Viewer</span>
                        <span className="text-sm text-muted-foreground">Read-only access</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Supported Countries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      We have pre-configured compliance modules for major markets:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">South Africa</Badge>
                      <Badge variant="secondary">Kenya</Badge>
                      <Badge variant="secondary">Nigeria</Badge>
                      <Badge variant="secondary">Ghana</Badge>
                      <Badge variant="secondary">UAE</Badge>
                      <Badge variant="secondary">UK</Badge>
                      <Badge variant="secondary">USA</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Our Global framework works for any country not specifically configured.
                    </p>
                    <Link href="/compliance-explorer">
                      <Button variant="ghost" className="p-0 h-auto mt-2 text-primary">
                        Explore country compliance <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" data-testid="content-billing">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Subscription Plans
                  </CardTitle>
                  <CardDescription>Choose the right plan for your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Starter</span>
                      <span className="text-primary font-bold">$499/year</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Up to 100 bids/month</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> 500 documents/month</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> 5GB storage</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Email support</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Professional</span>
                      <span className="text-primary font-bold">$1,999/year</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Up to 500 bids/month</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> 2,500 documents/month</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> 25GB storage</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> API access</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Enterprise</span>
                      <span className="text-primary font-bold">$4,999/year</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Up to 2,000 bids/month</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> 10,000 documents/month</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> 100GB storage</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Priority support + webhooks</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4 bg-primary/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Government</span>
                      <span className="text-primary font-bold">$9,999/year</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Unlimited bids</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Unlimited documents</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> 500GB storage</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Dedicated support + SLA</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How Billing Works</CardTitle>
                  <CardDescription>Understanding your subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Annual Billing</h4>
                    <p className="text-sm text-muted-foreground">
                      All plans are billed annually. You can pay via credit card or request an invoice 
                      for bank transfer (Enterprise and Government plans).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Usage Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Your dashboard shows real-time usage of bids processed, documents verified, 
                      and storage used. You'll receive alerts at 80% and 100% of your limits.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Upgrading</h4>
                    <p className="text-sm text-muted-foreground">
                      You can upgrade your plan anytime. The price difference is prorated for 
                      the remaining period. Downgrades take effect at the next billing cycle.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Overages</h4>
                    <p className="text-sm text-muted-foreground">
                      If you exceed your plan limits, you'll be notified and can either upgrade 
                      or wait until the next billing period. We don't charge overage fees.
                    </p>
                  </div>
                  <Link href="/billing">
                    <Button className="w-full mt-4">
                      Manage Your Subscription
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="platform" data-testid="content-platform">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Core Platform Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4" /> Vendor Management
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>Register vendors with company details and contact information</li>
                        <li>Upload and verify compliance documents (tax clearance, certificates)</li>
                        <li>Track document expiry dates with automatic notifications</li>
                        <li>View vendor risk scores and compliance history</li>
                        <li>Check debarment status against government databases</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4" /> Tender Management
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>Create tenders with requirements and deadlines</li>
                        <li>Upload tender PDFs - AI extracts compliance requirements</li>
                        <li>Track tender lifecycle from draft to award</li>
                        <li>Receive and manage bid submissions</li>
                        <li>Generate award and rejection letters</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Upload className="w-4 h-4" /> Document Processing
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>AI-powered document classification and data extraction</li>
                        <li>Multi-language support (English, French, Portuguese, Arabic)</li>
                        <li>Fraud detection for tampered or suspicious documents</li>
                        <li>Automatic expiry date detection and tracking</li>
                        <li>Secure cloud storage with encryption</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4" /> Analytics & Reporting
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>Real-time dashboard with key metrics</li>
                        <li>Tender volume and compliance rate trends</li>
                        <li>Vendor performance analytics</li>
                        <li>Export audit-ready compliance reports</li>
                        <li>Custom report generation</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workflow Guide</CardTitle>
                  <CardDescription>Typical bid evaluation workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                      <h4 className="font-medium mb-1">Create Tender</h4>
                      <p className="text-xs text-muted-foreground">Upload tender PDF, AI extracts requirements</p>
                    </div>
                    <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                      <h4 className="font-medium mb-1">Receive Bids</h4>
                      <p className="text-xs text-muted-foreground">Vendors submit via portal or API</p>
                    </div>
                    <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                      <h4 className="font-medium mb-1">AI Verification</h4>
                      <p className="text-xs text-muted-foreground">Documents analyzed for compliance</p>
                    </div>
                    <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold">4</div>
                      <h4 className="font-medium mb-1">Score & Review</h4>
                      <p className="text-xs text-muted-foreground">Apply scoring rules, manual review</p>
                    </div>
                    <div className="flex-1 p-4 bg-muted/50 rounded-lg text-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-bold">5</div>
                      <h4 className="font-medium mb-1">Award</h4>
                      <p className="text-xs text-muted-foreground">Generate letters, complete audit trail</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api" data-testid="content-api">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    API Overview
                  </CardTitle>
                  <CardDescription>Integrate GLOBAL-TVS with your systems</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Use API keys for authentication. Generate keys from the API Settings page. 
                      Include your key in the <code className="bg-muted px-1 rounded">X-API-Key</code> header.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Base URL</h4>
                    <code className="block bg-muted p-2 rounded text-sm">
                      https://your-domain.com/api/v1
                    </code>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Rate Limits</h4>
                    <p className="text-sm text-muted-foreground">
                      Rate limits vary by plan: Starter (100/min), Professional (500/min), 
                      Enterprise (2000/min), Government (5000/min).
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <code className="font-mono">POST /api/v1/bids</code>
                      <p className="text-muted-foreground mt-1">Submit a bid for evaluation</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <code className="font-mono">GET /api/v1/bids</code>
                      <p className="text-muted-foreground mt-1">List bids with pagination</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <code className="font-mono">GET /api/v1/bids/:id</code>
                      <p className="text-muted-foreground mt-1">Get bid details and results</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <code className="font-mono">POST /api/v1/documents/verify</code>
                      <p className="text-muted-foreground mt-1">Verify a single document</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <code className="font-mono">GET /api/v1/compliance/rules</code>
                      <p className="text-muted-foreground mt-1">List compliance rules by country</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <code className="font-mono">POST /api/v1/webhooks</code>
                      <p className="text-muted-foreground mt-1">Register webhook endpoints</p>
                    </div>
                  </div>
                  <Link href="/api-settings">
                    <Button variant="outline" className="w-full mt-4">
                      Manage API Keys
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="faq" data-testid="content-faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>What is GLOBAL-TVS?</AccordionTrigger>
                    <AccordionContent>
                      GLOBAL-TVS (Global Tender Verification System) is an AI-powered multi-tenant SaaS platform 
                      for bid evaluation and procurement compliance. It helps organizations verify vendor documents, 
                      evaluate bids against compliance rules, and manage the entire tender lifecycle.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Which countries do you support?</AccordionTrigger>
                    <AccordionContent>
                      We have pre-configured compliance modules for South Africa, Kenya, Nigeria, Ghana, UAE, 
                      UK, and USA. Our Global framework works for any other country - you can customize the 
                      compliance rules to match your specific requirements.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>How does AI document verification work?</AccordionTrigger>
                    <AccordionContent>
                      Our AI analyzes uploaded documents to extract key information (dates, amounts, registration numbers), 
                      classify document types, and detect potential fraud indicators. It supports multiple languages 
                      including English, French, Portuguese, and Arabic.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Can I integrate GLOBAL-TVS with my existing systems?</AccordionTrigger>
                    <AccordionContent>
                      Yes! Professional and higher plans include API access. You can submit bids programmatically, 
                      verify documents, and receive webhook notifications for status changes. See our API documentation 
                      for details.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>Is my data secure?</AccordionTrigger>
                    <AccordionContent>
                      Absolutely. We use AES-256-GCM encryption for sensitive data, complete audit logging, 
                      role-based access control, and secure cloud infrastructure. We're compliant with POPIA (South Africa), 
                      GDPR (Europe), and other data protection regulations.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6">
                    <AccordionTrigger>What happens if I exceed my plan limits?</AccordionTrigger>
                    <AccordionContent>
                      You'll receive alerts at 80% and 100% of your limits. If you exceed limits, you can upgrade 
                      your plan or wait until the next billing period. We don't charge overage fees - we believe 
                      in transparent, predictable pricing.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-7">
                    <AccordionTrigger>Do you offer a free trial?</AccordionTrigger>
                    <AccordionContent>
                      We offer personalized demos for organizations evaluating GLOBAL-TVS. Contact our sales team 
                      to schedule a demo and discuss your requirements. For smaller organizations, the Starter plan 
                      offers an affordable entry point.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-8">
                    <AccordionTrigger>How do I get support?</AccordionTrigger>
                    <AccordionContent>
                      Support options vary by plan: Starter includes email support, Professional adds chat support, 
                      Enterprise includes priority support with 4-hour response time, and Government includes 
                      a dedicated account manager with SLA.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
