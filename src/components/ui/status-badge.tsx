import { CircleCheck, CircleX, Clock3, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "muted"; icon: typeof CircleCheck }> = {
  ACTIVE: { label: "Hoạt động", variant: "success", icon: CircleCheck }, WORKING: { label: "Hoạt động", variant: "success", icon: CircleCheck }, COMPLETED: { label: "Hoàn thành", variant: "success", icon: CircleCheck }, AVAILABLE: { label: "Khả dụng", variant: "success", icon: CircleCheck }, VALIDATED: { label: "Đã xác thực", variant: "info", icon: CircleCheck }, PENDING: { label: "Chờ xử lý", variant: "warning", icon: Clock3 }, PROCESSING: { label: "Đang xử lý", variant: "info", icon: LoaderCircle }, REJECTED: { label: "Từ chối", variant: "danger", icon: CircleX }, FAILED: { label: "Thất bại", variant: "danger", icon: CircleX }, DISABLED: { label: "Đã khóa", variant: "danger", icon: CircleX }, DELETED: { label: "Đã xóa", variant: "muted", icon: CircleX },
};

export function StatusBadge({ status }: { status: string }) { const item = map[status] ?? { label: status, variant: "muted" as const, icon: Clock3 }; const Icon = item.icon; return <Badge variant={item.variant}><Icon className={`size-3.5 ${status === "PROCESSING" ? "animate-spin" : ""}`} />{item.label}</Badge>; }
