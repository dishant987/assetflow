import { Badge } from "./Badge";

const statusMap: Record<string, "success" | "warning" | "error" | "info" | "muted" | "default" | "danger" | "purple"> = {
  // Asset statuses
  available:         "success",
  allocated:         "info",
  reserved:          "warning",
  under_maintenance: "warning",
  lost:              "error",
  retired:           "muted",
  disposed:          "muted",
  damaged:           "danger",   // 🟠 warm orange — distinct from missing (red)
  // User statuses
  active:            "success",
  inactive:          "muted",
  suspended:         "error",
  // Booking / request statuses
  pending:           "warning",
  approved:          "success",
  rejected:          "error",
  cancelled:         "muted",
  transfer_pending:  "warning",
  // Audit cycle statuses
  planned:           "info",
  in_progress:       "warning",
  completed:         "success",
  // Audit verdict statuses
  found:             "success",   // 🟢 teal
  missing:           "error",     // 🔴 red
  mismatched:        "purple",    // 🟣 violet
  // Maintenance priority
  reported:          "warning",
  low:               "success",
  medium:            "warning",
  high:              "error",
  critical:          "error",
  // Roles
  employee:          "info",
  manager:           "warning",
  department_head:   "purple",
  admin:             "default",
};

const labels: Record<string, string> = {
  under_maintenance: "Under Maintenance",
  in_progress: "In Progress",
  transfer_pending: "Transfer Pending",
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
