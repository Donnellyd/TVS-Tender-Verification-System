import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 
  | "active" | "approved" | "open" | "passed" | "verified"
  | "pending" | "under_review" | "in_progress"
  | "closed" | "completed" | "awarded"
  | "rejected" | "failed" | "debarred" | "suspended" | "cancelled"
  | "clear" | "flagged" | "expired";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Success / Active states
  active: { label: "Active", className: "bg-green-500 text-white border-green-600" },
  approved: { label: "Approved", className: "bg-green-500 text-white border-green-600" },
  open: { label: "Open", className: "bg-green-500 text-white border-green-600" },
  passed: { label: "Passed", className: "bg-green-500 text-white border-green-600" },
  verified: { label: "Verified", className: "bg-green-500 text-white border-green-600" },
  clear: { label: "Clear", className: "bg-green-500 text-white border-green-600" },

  // Warning / Pending states
  pending: { label: "Pending", className: "bg-orange-500 text-white border-orange-600" },
  under_review: { label: "Under Review", className: "bg-orange-500 text-white border-orange-600" },
  in_progress: { label: "In Progress", className: "bg-blue-500 text-white border-blue-600" },
  flagged: { label: "Flagged", className: "bg-orange-500 text-white border-orange-600" },

  // Neutral / Completed states
  closed: { label: "Closed", className: "bg-gray-500 text-white border-gray-600" },
  completed: { label: "Completed", className: "bg-blue-500 text-white border-blue-600" },
  awarded: { label: "Awarded", className: "bg-purple-500 text-white border-purple-600" },

  // Error / Rejected states
  rejected: { label: "Rejected", className: "bg-red-500 text-white border-red-600" },
  failed: { label: "Failed", className: "bg-red-500 text-white border-red-600" },
  debarred: { label: "Debarred", className: "bg-red-500 text-white border-red-600" },
  suspended: { label: "Suspended", className: "bg-red-500 text-white border-red-600" },
  cancelled: { label: "Cancelled", className: "bg-gray-500 text-white border-gray-600" },
  expired: { label: "Expired", className: "bg-red-500 text-white border-red-600" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_") as StatusType;
  const config = statusConfig[normalizedStatus] || {
    label: status,
    className: "bg-gray-500 text-white border-gray-600",
  };

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
