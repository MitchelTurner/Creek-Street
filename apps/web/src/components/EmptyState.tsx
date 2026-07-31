import { Link } from 'react-router-dom';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { to: string; label: string };
}) {
  return (
    <div className="border-t border-ink/10 py-10 text-center">
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">{body}</p>
      {action && (
        <Link to={action.to} className="btn-primary mt-6 inline-flex">
          {action.label}
        </Link>
      )}
    </div>
  );
}
