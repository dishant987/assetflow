import toast from "react-hot-toast";

type Kind = "success" | "error" | "warning" | "info";

const icons: Record<Kind, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

export function showToast(message: string, kind: Kind = "info") {
  toast.custom(
    (t) => (
      <div className={`toast-body ${kind}`} style={{ opacity: t.visible ? 1 : 0, transition: "opacity 0.2s" }}>
        <span style={{
          width: 24, height: 24, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 13, color: "#fff",
          background: kind === "success" ? "var(--color-success)" : kind === "error" ? "var(--color-error)" : kind === "warning" ? "var(--color-warning)" : "var(--color-primary)",
        }}>
          {icons[kind]}
        </span>
        <span>{message}</span>
      </div>
    ),
    { duration: 4000, position: "top-right" },
  );
}
