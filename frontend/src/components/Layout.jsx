import { useLocation } from 'react-router-dom';
import AnimatedFieldsBackground from './AnimatedFieldsBackground';
import BrandLogo from './BrandLogo';
import SidebarNav from './SidebarNav';
import SidebarUserBlock from './SidebarUserBlock';
import WorkspaceFooter from './WorkspaceFooter';
import WorkspaceHeader from './WorkspaceHeader';
import { roleHasModule } from '../config/module-access';

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

        <SidebarNav items={withEmployees} />

        <SidebarUserBlock
          user={user}
          backgroundAnimationEnabled={backgroundAnimationEnabled}
          onToggleBackgroundAnimation={onToggleBackgroundAnimation}
          onLogout={onLogout}
        />
      </aside>

      <main className="content">
        <WorkspaceHeader title={currentItem.label} />

        <div className="workspace-body">
          {children}
        </div>

        <WorkspaceFooter />
      </main>
    </div>
  );
}


