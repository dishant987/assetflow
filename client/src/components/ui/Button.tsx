import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const cls = (v: Variant, s: Size, extra?: string) =>
  ["btn", `btn-${v}`, `btn-${s}`, extra].filter(Boolean).join(" ");

export function Button({ variant = "primary", size = "md", loading, disabled, children, className, ...rest }: Props) {
  return (
    <button className={cls(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}
