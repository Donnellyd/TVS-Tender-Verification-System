import { cn } from "@/lib/utils";

interface FilledPencilIconProps {
  className?: string;
}

export function FilledPencilIcon({ className }: FilledPencilIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn("h-5 w-5", className)}
    >
      <defs>
        <linearGradient id="pencilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(199, 89%, 48%)" />
          <stop offset="100%" stopColor="hsl(199, 89%, 38%)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#pencilGradient)"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  );
}
