export default function WorkspaceHeader({ title }) {
  return (
    <header className="workspace-header">
      <div className="workspace-header__lead">
        <h2>{title}</h2>
      </div>
      <div className="workspace-header__meta">
        <strong>{new Date().toLocaleDateString('ru-RU')}</strong>
        <span>Рабочее пространство</span>
      </div>
    </header>
  );
}

