export default function StatCard({ title, value, hint }) {
  return (
    <article className="stat-card">
      <span className="stat-card__title">{title}</span>
      <strong className="stat-card__value">{value}</strong>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </article>
  );
}
