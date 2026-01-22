import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: "blue" | "green" | "orange" | "red" | "purple" | "teal";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  testId?: string;
}

const iconColorClasses = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "blue",
  trend,
  testId,
}: StatsCardProps) {
  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-lg p-2", iconColorClasses[iconColor])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={testId}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={cn(
            "text-xs mt-1 flex items-center gap-1",
            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
            <span className="text-muted-foreground">from last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
