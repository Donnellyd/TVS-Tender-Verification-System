# TVS Menu Structure & Color Scheme Template

This document contains everything you need to replicate the TVS sidebar menu structure and professional blue/teal government color scheme in another Replit application.

---

## 1. Color Scheme (index.css)

Replace the `:root` and `.dark` sections in your `client/src/index.css` with the following:

```css
/* LIGHT MODE - Professional Blue/Teal Government Theme */
:root {
  --button-outline: rgba(0,0,0, .10);
  --badge-outline: rgba(0,0,0, .05);

  /* Automatic computation of border around primary / danger buttons */
  --opaque-button-border-intensity: -8; /* In terms of percentages */

  /* Backgrounds applied on top of other backgrounds when hovered/active */
  --elevate-1: rgba(0,0,0, .03);
  --elevate-2: rgba(0,0,0, .08);

  --background: 210 20% 98%;
  --foreground: 215 25% 15%;

  --border: 214 20% 88%;

  --card: 0 0% 100%;
  --card-foreground: 215 25% 15%;
  --card-border: 214 20% 92%;

  --sidebar: 215 30% 18%;
  --sidebar-foreground: 210 20% 95%;
  --sidebar-border: 215 30% 25%;
  --sidebar-primary: 199 89% 48%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 215 30% 25%;
  --sidebar-accent-foreground: 210 20% 95%;
  --sidebar-ring: 199 89% 48%;

  --popover: 0 0% 100%;
  --popover-foreground: 215 25% 15%;
  --popover-border: 214 20% 90%;

  --primary: 199 89% 48%;
  --primary-foreground: 0 0% 100%;

  --secondary: 210 16% 93%;
  --secondary-foreground: 215 25% 25%;

  --muted: 210 16% 95%;
  --muted-foreground: 215 15% 45%;

  --accent: 172 66% 40%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  --input: 214 20% 85%;
  --ring: 199 89% 48%;

  --chart-1: 199 89% 48%;
  --chart-2: 142 71% 45%;
  --chart-3: 24 95% 53%;
  --chart-4: 262 83% 58%;
  --chart-5: 172 66% 40%;

  --font-sans: 'Inter', sans-serif;
  --font-serif: Georgia, serif;
  --font-mono: 'Fira Code', monospace;
  --radius: .5rem;
  --shadow-2xs: 0px 1px 2px 0px rgba(0,0,0, 0.03);
  --shadow-xs: 0px 1px 3px 0px rgba(0,0,0, 0.05);
  --shadow-sm: 0px 2px 4px -1px rgba(0,0,0, 0.06), 0px 1px 2px -1px rgba(0,0,0, 0.04);
  --shadow: 0px 4px 6px -1px rgba(0,0,0, 0.07), 0px 2px 4px -1px rgba(0,0,0, 0.05);
  --shadow-md: 0px 6px 10px -1px rgba(0,0,0, 0.08), 0px 4px 6px -1px rgba(0,0,0, 0.05);
  --shadow-lg: 0px 10px 15px -3px rgba(0,0,0, 0.1), 0px 4px 6px -2px rgba(0,0,0, 0.05);
  --shadow-xl: 0px 20px 25px -5px rgba(0,0,0, 0.1), 0px 10px 10px -5px rgba(0,0,0, 0.04);
  --shadow-2xl: 0px 25px 50px -12px rgba(0,0,0, 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  /* Automatically computed borders */
  --sidebar-primary-border: hsl(var(--sidebar-primary));
  --sidebar-primary-border: hsl(from hsl(var(--sidebar-primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);

  --sidebar-accent-border: hsl(var(--sidebar-accent));
  --sidebar-accent-border: hsl(from hsl(var(--sidebar-accent)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);

  --primary-border: hsl(var(--primary));
  --primary-border: hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);

  --secondary-border: hsl(var(--secondary));
  --secondary-border: hsl(from hsl(var(--secondary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);

  --muted-border: hsl(var(--muted));
  --muted-border: hsl(from hsl(var(--muted)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);

  --accent-border: hsl(var(--accent));
  --accent-border: hsl(from hsl(var(--accent)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);

  --destructive-border: hsl(var(--destructive));
  --destructive-border: hsl(from hsl(var(--destructive)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
}

.dark {
  --button-outline: rgba(255,255,255, .10);
  --badge-outline: rgba(255,255,255, .05);

  --opaque-button-border-intensity: 9;

  /* Backgrounds applied on top of other backgrounds when hovered/active */
  --elevate-1: rgba(255,255,255, .04);
  --elevate-2: rgba(255,255,255, .09);

  --background: 215 25% 9%;
  --foreground: 210 20% 95%;

  --border: 215 20% 20%;

  --card: 215 25% 12%;
  --card-foreground: 210 20% 95%;
  --card-border: 215 20% 18%;

  --sidebar: 215 30% 8%;
  --sidebar-foreground: 210 20% 92%;
  --sidebar-border: 215 25% 15%;
  --sidebar-primary: 199 89% 48%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 215 25% 18%;
  --sidebar-accent-foreground: 210 20% 95%;
  --sidebar-ring: 199 89% 48%;

  --popover: 215 25% 12%;
  --popover-foreground: 210 20% 95%;
  --popover-border: 215 20% 20%;

  --primary: 199 89% 48%;
  --primary-foreground: 0 0% 100%;

  --secondary: 215 20% 20%;
  --secondary-foreground: 210 20% 90%;

  --muted: 215 20% 16%;
  --muted-foreground: 215 15% 55%;

  --accent: 172 66% 40%;
  --accent-foreground: 0 0% 100%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  --input: 215 20% 25%;
  --ring: 199 89% 48%;

  --chart-1: 199 89% 55%;
  --chart-2: 142 71% 50%;
  --chart-3: 24 95% 58%;
  --chart-4: 262 83% 63%;
  --chart-5: 172 66% 45%;

  --shadow-2xs: 0px 1px 2px 0px rgba(0,0,0, 0.2);
  --shadow-xs: 0px 1px 3px 0px rgba(0,0,0, 0.25);
  --shadow-sm: 0px 2px 4px -1px rgba(0,0,0, 0.3), 0px 1px 2px -1px rgba(0,0,0, 0.2);
  --shadow: 0px 4px 6px -1px rgba(0,0,0, 0.35), 0px 2px 4px -1px rgba(0,0,0, 0.25);
  --shadow-md: 0px 6px 10px -1px rgba(0,0,0, 0.4), 0px 4px 6px -1px rgba(0,0,0, 0.3);
  --shadow-lg: 0px 10px 15px -3px rgba(0,0,0, 0.45), 0px 4px 6px -2px rgba(0,0,0, 0.3);
  --shadow-xl: 0px 20px 25px -5px rgba(0,0,0, 0.5), 0px 10px 10px -5px rgba(0,0,0, 0.35);
  --shadow-2xl: 0px 25px 50px -12px rgba(0,0,0, 0.6);
}
```

---

## 2. Sidebar Component (AppSidebar.tsx)

Create this file at `client/src/components/AppSidebar.tsx`:

```tsx
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
  Shield,
  FolderOpen,
  LogOut,
  Send,
  Mail,
  MessageCircle,
} from "lucide-react";
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

// CUSTOMIZE THESE MENU ITEMS FOR YOUR APP
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
  { title: "Compliance Rules", url: "/rules", icon: Shield },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            {/* REPLACE WITH YOUR APP ICON */}
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            {/* REPLACE WITH YOUR APP NAME */}
            <span className="text-lg font-bold text-sidebar-foreground">TVS</span>
            <span className="text-xs text-sidebar-foreground/70">Tender Vetting System</span>
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
```

---

## 3. App.tsx Setup

Update your `client/src/App.tsx` to use the sidebar:

```tsx
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

// Import your pages
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      {/* Add your other routes here */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-3 border-b bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

---

## 4. Required Dependencies

Make sure you have the Shadcn sidebar component installed. If not, the sidebar primitives should be at `@/components/ui/sidebar`.

Required packages:
- `lucide-react` - for icons
- `wouter` - for routing
- Shadcn UI components: sidebar, avatar, badge

---

## 5. Color Theme Summary

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary | Cyan/Blue (`199 89% 48%`) | Same |
| Accent | Teal (`172 66% 40%`) | Same |
| Sidebar | Dark Blue (`215 30% 18%`) | Darker (`215 30% 8%`) |
| Background | Light Gray (`210 20% 98%`) | Dark (`215 25% 9%`) |
| Cards | White | Dark Gray (`215 25% 12%`) |

---

## 6. Customization Tips

1. **Change App Name/Icon**: Update the `SidebarHeader` section in AppSidebar.tsx
2. **Modify Menu Items**: Edit the `mainNavItems` and `settingsNavItems` arrays
3. **Add Notification Badges**: Use the `Badge` component in menu items
4. **Remove User Footer**: Delete the `SidebarFooter` section if you don't need user info
5. **Change Colors**: Modify the HSL values in index.css (primary is cyan, accent is teal)

---

## 7. Icon Reference

Common Lucide icons for menus:
- `LayoutDashboard` - Dashboard
- `Users` - People/Vendors
- `FileText` - Documents/Files
- `Settings` - Settings
- `Bell` - Notifications
- `BarChart3` - Analytics
- `Shield` - Security/Compliance
- `Mail` - Email
- `MessageCircle` - Chat/Messages
- `Building2` - Organizations
- `FolderOpen` - Folders/Categories
- `Send` - Submissions/Send
- `ClipboardCheck` - Checklists/Tasks

Browse all icons at: https://lucide.dev/icons
