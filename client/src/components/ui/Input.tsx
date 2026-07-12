import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, helper, className, ...rest }, ref) => (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <input
        ref={ref}
        className={["input", error && "input-error", className].filter(Boolean).join(" ")}
        {...rest}
      />
      {error && <span style={{ color: "var(--color-error)", fontSize: 12 }}>{error}</span>}
      {helper && !error && <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{helper}</span>}
    </div>
  ),
);
