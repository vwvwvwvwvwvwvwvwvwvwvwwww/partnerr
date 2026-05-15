/**
 * Какие роли видят раздел API (совпадает с логикой на фронте).
 * admin всегда имеет полный доступ через проверку includes('admin').
 */
export const MODULE_ACCESS = {
  dashboard: ['admin', 'agronomist', 'mechanic', 'storekeeper', 'accountant'],
  /** Поля и техкарты — агрономия */
  fields: ['admin', 'agronomist'],
  planning: ['admin', 'agronomist'],
  crops: ['admin', 'agronomist', 'storekeeper'],
  /** Техника — механики и админ; агроном для согласования работ */
  machinery: ['admin', 'mechanic', 'agronomist'],
  warehouse: ['admin', 'storekeeper'],
  harvest: ['admin', 'agronomist', 'storekeeper', 'accountant'],
  finance: ['admin', 'accountant'],
  employees: ['admin'],
  reports: ['admin', 'agronomist', 'accountant'],
};

export function roleHasModule(role, moduleKey) {
  const list = MODULE_ACCESS[moduleKey];
  return Array.isArray(list) && list.includes(role);
}
