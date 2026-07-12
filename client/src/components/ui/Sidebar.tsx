import { useState } from "react";

interface NavItem {
  label: string;
  icon?: string;
  href: string;
  active?: boolean;
}

interface Props {
  items: NavItem[];
  logo?: string;
  onNavigate?: (path: string) => void;
}

export function Sidebar({ items, logo = "AF", onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={["sidebar", collapsed && "collapsed"].filter(Boolean).join(" ")}>
      <div className="sidebar-logo">
        <span style={{ background: "var(--color-primary)", color: "#fff", borderRadius: "var(--radius-md)", padding: "4px 8px", fontSize: 14 }}>{logo}</span>
        {!collapsed && <span>AssetFlow</span>}
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={["sidebar-link", item.active && "active"].filter(Boolean).join(" ")}
            onClick={(e) => { e.preventDefault(); onNavigate?.(item.href); }}
          >
            {item.icon && <span>{item.icon}</span>}
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>
      <div className="sidebar-toggle">
        <button className="btn btn-ghost btn-sm" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "→" : "←"}
        </button>
      </div>
    </aside>
  );
}
