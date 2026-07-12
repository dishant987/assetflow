import { ReactNode } from "react";

interface Props {
  title?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function Topbar({ title, actions, children }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {children}
        {title && <h1 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h1>}
      </div>
      <div className="topbar-right">{actions}</div>
    </header>
  );
}
