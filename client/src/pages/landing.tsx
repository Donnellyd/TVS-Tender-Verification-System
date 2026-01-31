import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle, BarChart3, Users, FileCheck, Lock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">GLOBAL - TVS</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#compliance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Compliance</a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            </div>
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary border border-primary/20">
                <Shield className="h-4 w-4" />
                <span>Multi-Country Compliance</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight font-serif">
                AI-Powered Global{" "}
                <span className="text-primary">Bid Evaluation Platform</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Transform your procurement process with automated AI document verification, 
                country-specific compliance rules, and enterprise-grade security. 
                Built for governments and enterprises across Africa, Middle East, and beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/api/login">Get Started</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">Learn More</a>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>7+ Countries</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>AI-Powered OCR</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Fraud Detection</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-card/50 backdrop-blur border-2 border-primary/10">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">Vendor Verified</p>
                        <p className="text-sm text-green-600 dark:text-green-400">CSD Status: Active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                        <FileCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-700 dark:text-blue-300">Tax Clearance Valid</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Expires: Dec 2026</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-700 dark:text-purple-300">BBBEE Level 2</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Certificate Valid</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
              Complete Procurement Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage vendors, tenders, and compliance in one platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Vendor Management",
                description: "Register and verify vendors with automated CSD, VAT, and debarment checks. Track BBBEE certificates and tax clearance status.",
                color: "blue",
              },
              {
                icon: FileCheck,
                title: "Tender Tracking",
                description: "Manage the complete tender lifecycle from intake to award. Track submissions, evaluations, and compliance requirements.",
                color: "green",
              },
              {
                icon: Shield,
                title: "Compliance Engine",
                description: "Automated rule-based compliance checks with configurable thresholds. Risk scoring and flagging for manual review.",
                color: "purple",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reporting",
                description: "Real-time dashboards with tender volumes, compliance rates, and processing times. Export audit-ready reports.",
                color: "teal",
              },
              {
                icon: Lock,
                title: "Audit Trail",
                description: "Immutable logging of all actions for PFMA/MFMA compliance. Track every view, edit, and approval with timestamps.",
                color: "orange",
              },
              {
                icon: CheckCircle,
                title: "Document Verification",
                description: "Upload and verify vendor documents. Track expiry dates, versions, and verification status with digital signatures.",
                color: "red",
              },
            ].map((feature, index) => (
              <Card key={index} className="hover-elevate group">
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                    feature.color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" :
                    feature.color === "green" ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                    feature.color === "purple" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" :
                    feature.color === "teal" ? "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400" :
                    feature.color === "orange" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                    "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  }`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-serif">
            Ready to Transform Your Procurement?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join South African municipalities using GLOBAL - TVS for compliant, efficient tender management.
          </p>
          <Button size="lg" asChild>
            <a href="/api/login">Get Started Now</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">GLOBAL - TVS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tender Vetting System. POPIA Compliant. Built for SA Municipalities.
          </p>
        </div>
      </footer>
    </div>
  );
}
