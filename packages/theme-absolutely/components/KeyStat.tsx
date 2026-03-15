export function KeyStat({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <figure className="absolutely-key-stat">
      <div className="absolutely-key-stat-value">{value}</div>
      <figcaption className="absolutely-key-stat-copy">
        <span className="absolutely-key-stat-label">{label}</span>
        {detail ? <span className="absolutely-key-stat-detail">{detail}</span> : null}
      </figcaption>
    </figure>
  );
}
