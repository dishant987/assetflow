import { ReactNode } from "react";

interface Props {
  variant?: "default" | "success" | "warning" | "error" | "info" | "muted";
  children: ReactNode;
}

const bg: Record<string, string> = {
  default: "#F0EBF0",
  success: "#E0F5F4",
  warning: "#FFFBEB",
  error: "#FEF2F2",
  info: "#E0E7FF",
  muted: "#F3F4F6",
};

const fg: Record<string, string> = {
  default: "#714B67",
  success: "#00A09D",
  warning: "#B45309",
  error: "#DC2626",
  info: "#3B82F6",
  muted: "#6B7280",
};

export function Badge({ variant = "default", children }: Props) {
  return <span className="badge" style={{ background: bg[variant], color: fg[variant] }}>{children}</span>;
}
