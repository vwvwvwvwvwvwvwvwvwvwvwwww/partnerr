import { NavLink } from 'react-router-dom';

export default function SidebarNav({ items }) {
  return (
    <nav className="sidebar__nav" aria-label="Разделы приложения">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
