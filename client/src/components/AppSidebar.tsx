import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  ClipboardCheck,
  BarChart3,
  Bell,
  Settings,
  FolderOpen,
  LogOut,
  Send,
  Mail,
  MessageCircle,
  CreditCard,
  Key,
  Globe,
  HelpCircle,
  Rocket,
} from "lucide-react";
import logoImage from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Vendors", url: "/vendors", icon: Users },
  { title: "Tenders", url: "/tenders", icon: FileText },
  { title: "Submissions", url: "/submissions", icon: Send },
  { title: "Documents", url: "/documents", icon: FolderOpen },
  { title: "Compliance", url: "/compliance", icon: ClipboardCheck },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const settingsNavItems = [
  { title: "Municipalities", url: "/municipalities", icon: Building2 },
  { title: "Email Templates", url: "/email-templates", icon: Mail },
  { title: "WhatsApp Templates", url: "/whatsapp-templates", icon: MessageCircle },
  { title: "Compliance Rules", url: "/rules", icon: Globe },
  { title: "Country Launch", url: "/country-launch", icon: Rocket },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "API Settings", url: "/api-settings", icon: Key },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help & Docs", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="VeritasAI Logo" className="h-10 w-10 rounded-lg" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground">VeritasAI</span>
            <span className="text-xs text-sidebar-foreground/70">AI-Powered Bid Evaluation</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.title === "Notifications" && (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0.5">3</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {user.firstName} {user.lastName}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {user.email}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
