export const ROLE_LABELS = {
  admin: 'Администратор',
  agronomist: 'Агроном',
  mechanic: 'Механик',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role ?? 'Сотрудник';
}

