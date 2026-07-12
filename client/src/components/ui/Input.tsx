import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, helper, className, leftIcon, rightIcon, style, ...rest }, ref) => (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className="input-icon-wrapper">
        {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
        <input
          ref={ref}
          className={[
            "input",
            leftIcon && "input-with-icon",
            rightIcon && "input-with-icon",
            error && "input-error",
            className
          ].filter(Boolean).join(" ")}
          style={style}
          {...rest}
        />
        {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
      </div>
      {error && <span style={{ color: "var(--color-error)", fontSize: 12 }}>{error}</span>}
      {helper && !error && <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{helper}</span>}
    </div>
  ),
);

