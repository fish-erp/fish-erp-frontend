import { cn } from "@/lib/utils";

const variants = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
} as const;

export function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: keyof typeof variants; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", variants[variant], className)}>{children}</span>;
}

export function MockBadge() { return <Badge variant="info">Dữ liệu mẫu</Badge>; }
