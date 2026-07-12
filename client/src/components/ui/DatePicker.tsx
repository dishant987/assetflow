import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...rest }, ref) => (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <input
        ref={ref}
        type="date"
        className={["input", error && "input-error", className].filter(Boolean).join(" ")}
        {...rest}
      />
      {error && <span style={{ color: "var(--color-error)", fontSize: 12 }}>{error}</span>}
    </div>
  ),
);
