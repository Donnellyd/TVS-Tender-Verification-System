import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { clearPortalToken, portalFetch } from "@/lib/portalApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Send, FileText, MessageSquare, LogOut, Menu, X, Award } from "lucide-react";
import { useState } from "react";
import logoImage from "@/assets/logo.png";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["portal", "profile"],
    queryFn: async () => {
      const res = await portalFetch("/api/portal/profile");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const handleLogout = () => {
    clearPortalToken();
    setLocation("/portal");
  };

  const navItems = [
    { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { label: "Submit", href: "/portal/submit", icon: Send },
    { label: "My Submissions", href: "/portal/submissions", icon: FileText },
    { label: "Awards", href: "/portal/awards", icon: Award },
    { label: "Messages", href: "/portal/messages", icon: MessageSquare },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/portal/dashboard" className="flex items-center gap-3 shrink-0">
              <img src={logoImage} alt="VeritasAI" className="h-8 w-8 rounded-md" />
              <span className="text-lg font-bold text-foreground hidden sm:inline">VeritasAI Vendor Portal</span>
              <span className="text-lg font-bold text-foreground sm:hidden">Portal</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                    data-testid={`portal-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.label === "Messages" && profile?.unreadMessages > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs px-1.5">
                        {profile.unreadMessages}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              {profile?.companyName && (
                <span className="text-sm text-muted-foreground hidden lg:inline truncate max-w-[200px]">
                  {profile.companyName}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
                data-testid="portal-logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="portal-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`portal-mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.label === "Messages" && profile?.unreadMessages > 0 && (
                      <Badge variant="destructive" className="ml-auto text-xs px-1.5">
                        {profile.unreadMessages}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Powered by VeritasAI | Support: support@zd-solutions.com
          </p>
        </div>
      </footer>
    </div>
  );
}
