export function SlideKeyStat({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <figure className="slide-key-stat">
      <div className="slide-key-stat-value">{value}</div>
      <figcaption className="slide-key-stat-copy">
        <span className="slide-key-stat-label">{label}</span>
        {detail ? <span className="slide-key-stat-detail">{detail}</span> : null}
      </figcaption>
    </figure>
  );
}
