import { query } from '../../db/pool.js';

export async function getDashboardSummary() {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM fields) AS fields_count,
      (SELECT COALESCE(SUM(area_ha), 0) FROM fields) AS total_area_ha,
      (SELECT COUNT(*) FROM machinery WHERE status = 'active') AS active_machinery_count,
      (SELECT COUNT(*) FROM crops) AS crops_count,
      (SELECT COUNT(*) FROM app_users WHERE is_active = TRUE) AS employees_count,
      (SELECT COUNT(*) FROM warehouse_items) AS warehouse_items_count,
      (
        SELECT COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE -amount END), 0)
        FROM finance_entries
      ) AS finance_balance
  `;

  const result = await query(sql);
  const row = result.rows[0];

  return {
    fieldsCount: Number(row.fields_count),
    totalAreaHa: Number(row.total_area_ha),
    activeMachineryCount: Number(row.active_machinery_count),
    cropsCount: Number(row.crops_count),
    employeesCount: Number(row.employees_count),
    warehouseItemsCount: Number(row.warehouse_items_count),
    financeBalance: Number(row.finance_balance),
  };
}
