interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
}

export function Breadcrumb({ crumbs }: Props) {
  return (
    <div className="breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && <span style={{ marginRight: 6 }}>/</span>}
          {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
        </span>
      ))}
    </div>
  );
}
