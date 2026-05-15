/** Синхронно с backend/src/config/module-access.js */
export const MODULE_ACCESS = {
  dashboard: ['admin', 'agronomist', 'mechanic', 'storekeeper', 'accountant'],
  fields: ['admin', 'agronomist'],
  planning: ['admin', 'agronomist'],
  crops: ['admin', 'agronomist', 'storekeeper'],
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
