type Props = { size?: number; className?: string };

export function Spinner({ size = 20, className }: Props) {
  return (
    <div
      className={className}
      style={{
        width: size, height: size,
        border: `2px solid var(--color-border)`,
        borderTopColor: "var(--color-primary)",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
    />
  );
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 200, gap: 16 }}>
      <Spinner size={32} />
      <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>{text}</p>
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon?: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 200, gap: 12, textAlign: "center" }}>
      {icon && <div style={{ fontSize: 36, lineHeight: 1 }}>{icon}</div>}
      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-secondary)" }}>{title}</p>
      {description && <p style={{ fontSize: 14, color: "var(--color-text-muted)", maxWidth: 360 }}>{description}</p>}
    </div>
  );
}
