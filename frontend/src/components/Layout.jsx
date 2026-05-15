import { NavLink, useLocation } from 'react-router-dom';
import AnimatedFieldsBackground from './AnimatedFieldsBackground';
import BrandLogo from './BrandLogo';
import { roleHasModule } from '../config/module-access';

const roleLabels = {
  admin: 'Администратор',
  agronomist: 'Агроном',
  mechanic: 'Механик',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
};

const navItems = [
  { to: '/', label: 'Сводка', module: 'dashboard' },
  { to: '/fields', label: 'Поля и ГИС', module: 'fields' },
  { to: '/planning', label: 'Тех. карты', module: 'planning' },
  { to: '/machinery', label: 'Техника', module: 'machinery' },
  { to: '/crops', label: 'Культуры', module: 'crops' },
  { to: '/warehouse', label: 'Склад и МТО', module: 'warehouse' },
  { to: '/harvest', label: 'Урожай и логистика', module: 'harvest' },
  { to: '/finance', label: 'Финансы и KPI', module: 'finance' },
  { to: '/reports', label: 'Отчёты', module: 'reports' },
];

export default function Layout({
  user,
  onLogout,
  children,
  backgroundAnimationEnabled,
  onToggleBackgroundAnimation,
}) {
  const location = useLocation();
  const navigation = navItems.filter((item) => roleHasModule(user.role, item.module));
  const withEmployees =
    user.role === 'admin'
      ? [...navigation, { to: '/employees', label: 'Сотрудники', module: 'employees' }]
      : navigation;
  const currentItem = withEmployees.find((item) => item.to === location.pathname) ?? withEmployees[0];

  return (
    <div className="shell">
      <AnimatedFieldsBackground enabled={backgroundAnimationEnabled} />
      <aside className="sidebar">
        <div className="brand">
          <BrandLogo light />
        </div>

        <nav className="sidebar__nav">
          {withEmployees.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="user-card">
            <strong>{user.fullName}</strong>
            <span>{roleLabels[user.role] ?? user.role}</span>
          </div>
          <button className="background-toggle" onClick={onToggleBackgroundAnimation} type="button">
            Анимация фона: {backgroundAnimationEnabled ? 'вкл' : 'выкл'}
          </button>
          <button className="button button--ghost" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="workspace-header">
          <div className="workspace-header__lead">
            <h2>{currentItem.label}</h2>
          </div>
        </header>

        <div className="workspace-body">
          {children}
        </div>
      </main>
    </div>
  );
}
