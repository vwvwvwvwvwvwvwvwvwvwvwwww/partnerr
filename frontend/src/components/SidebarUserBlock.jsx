import { getRoleLabel } from '../config/role-labels';

export default function SidebarUserBlock({
  user,
  backgroundAnimationEnabled,
  onToggleBackgroundAnimation,
  onLogout,
}) {
  const fullName = user?.fullName ?? user?.name ?? user?.email ?? 'Пользователь';

  return (
    <div className="sidebar__footer">
      <button type="button" className="background-toggle" onClick={onToggleBackgroundAnimation}>
        {backgroundAnimationEnabled ? 'Анимация фона: вкл.' : 'Анимация фона: выкл.'}
      </button>

      <div className="user-card">
        <strong>{fullName}</strong>
        <span>{getRoleLabel(user?.role)}</span>
      </div>

      <button type="button" className="button button--ghost" onClick={onLogout}>
        Выйти
      </button>
    </div>
  );
}

