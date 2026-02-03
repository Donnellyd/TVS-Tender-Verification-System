import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { statusDefinitions } from "@/lib/helpContent";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusBadgeHelpProps {
  status: string;
  type: "vendor" | "tender" | "document" | "submission" | "compliance" | "subscription";
  className?: string;
}

function mapVariant(variant: string): BadgeVariant {
  if (variant === "success") return "default";
  if (variant === "warning") return "secondary";
  if (variant === "destructive") return "destructive";
  if (variant === "secondary") return "secondary";
  return "default";
}

export function StatusBadgeHelp({ status, type, className }: StatusBadgeHelpProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "-");
  const typeDefinitions = statusDefinitions[type] || {};
  const definition = typeDefinitions[normalizedStatus] || {
    label: status,
    description: "Status information not available",
    variant: "default"
  };

  const badgeVariant = mapVariant(definition.variant);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer"
          data-testid={`status-badge-${type}-${normalizedStatus}`}
        >
          <Badge variant={badgeVariant} className={className}>
            {definition.label}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant}>{definition.label}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{type}</span>
          </div>
          <p className="text-sm text-muted-foreground">{definition.description}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
