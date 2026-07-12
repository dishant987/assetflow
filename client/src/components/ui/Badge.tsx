import { ReactNode } from "react";

interface Props {
  variant?: "default" | "success" | "warning" | "error" | "info" | "muted" | "danger" | "purple";
  children: ReactNode;
}

const bg: Record<string, string> = {
  default:  "var(--color-primary-light)",
  success:  "var(--color-secondary-light)",
  warning:  "var(--color-warning-light, #FFFBEB)",
  error:    "var(--color-error-light, #FEF2F2)",
  info:     "var(--color-info-light, #E0E7FF)",
  muted:    "var(--color-muted-light, #F3F4F6)",
  danger:   "#FFF4E6",   // warm orange — damaged
  purple:   "#F3EEFF",   // soft purple — mismatched
};

const fg: Record<string, string> = {
  default:  "var(--color-primary)",
  success:  "var(--color-secondary)",
  warning:  "var(--color-warning)",
  error:    "var(--color-error)",
  info:     "var(--color-info, #3B82F6)",
  muted:    "var(--color-muted, #6B7280)",
  danger:   "#D97706",   // amber-600
  purple:   "#7C3AED",   // violet-600
};

export function Badge({ variant = "default", children }: Props) {
  return <span className="badge" style={{ background: bg[variant], color: fg[variant] }}>{children}</span>;
}
