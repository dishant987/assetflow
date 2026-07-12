import { Badge } from "./Badge";

const statusMap: Record<string, "success" | "warning" | "error" | "info" | "muted" | "default"> = {
  available: "success",
  allocated: "info",
  reserved: "warning",
  under_maintenance: "error",
  lost: "error",
  retired: "muted",
  active: "success",
  inactive: "muted",
  pending: "warning",
  approved: "success",
  rejected: "error",
  cancelled: "muted",
  completed: "success",
  in_progress: "info",
  reported: "warning",
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
  planned: "info",
  found: "success",
  missing: "error",
  damaged: "warning",
  mismatched: "warning",
  suspended: "error",
  employee: "info",
  manager: "warning",
  admin: "default",
};

const labels: Record<string, string> = {
  under_maintenance: "Under Maintenance",
  in_progress: "In Progress",
  // auto-capitalise fallback
};

function labelize(key: string): string {
  return labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  const variant = statusMap[status] || "muted";
  return <Badge variant={variant}>{labelize(status)}</Badge>;
}
