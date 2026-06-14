export default function AlertMessage({ variant = 'error', children }) {
  if (!children) {
    return null;
  }

  const safeVariant = variant === 'success' ? 'success' : 'error';

  return <div className={`alert alert--${safeVariant}`}>{children}</div>;
}

