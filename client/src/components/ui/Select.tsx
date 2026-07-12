import { SelectHTMLAttributes, forwardRef } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, className, ...rest }, ref) => (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <select ref={ref} className={["input", error && "input-error", className].filter(Boolean).join(" ")} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span style={{ color: "var(--color-error)", fontSize: 12 }}>{error}</span>}
    </div>
  ),
);
