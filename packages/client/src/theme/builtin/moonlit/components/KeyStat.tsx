export function MoonlitKeyStat({
  value,
  label,
  detail,
}: {
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <figure className="moonlit-key-stat">
      <div className="moonlit-key-stat-value">{value}</div>
      <figcaption className="moonlit-key-stat-copy">
        <span className="moonlit-key-stat-label">{label}</span>
        {detail ? <span className="moonlit-key-stat-detail">{detail}</span> : null}
      </figcaption>
    </figure>
  );
}
