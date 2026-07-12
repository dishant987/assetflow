import { ReactNode } from "react";

interface Props {
  title?: string;
  accent?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: Record<string, unknown>;
}

export function Card({ title, accent, actions, children, className, style }: Props) {
  return (
    <div className={["card", accent && "card-accent", className].filter(Boolean).join(" ")} style={style}>
      {title && (
        <div className="card-header">
          <span>{title}</span>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
