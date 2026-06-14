import AlertMessage from './AlertMessage';

export default function PageStack({ error, success, children }) {
  return (
    <div className="page-stack">
      <AlertMessage variant="error">{error}</AlertMessage>
      <AlertMessage variant="success">{success}</AlertMessage>
      {children}
    </div>
  );
}
