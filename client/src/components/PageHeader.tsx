import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    testId?: string;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action && (
            <Button onClick={action.onClick} data-testid={action.testId}>
              {action.icon}
              {action.label}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
