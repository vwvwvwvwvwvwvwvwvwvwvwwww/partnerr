import { query } from '../../db/pool.js';

export async function listFinanceEntries() {
  const result = await query(`
    SELECT
      id,
      entry_type AS "entryType",
      category,
      amount,
      operation_date AS "operationDate",
      reference_module AS "referenceModule",
      notes,
      created_at AS "createdAt"
    FROM finance_entries
    ORDER BY operation_date DESC, created_at DESC
  `);

  return result.rows;
}

export async function createFinanceEntry(data) {
  const result = await query({
    name: 'finance-create-entry',
    text: `
      INSERT INTO finance_entries (
        entry_type,
        category,
        amount,
        operation_date,
        reference_module,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        entry_type AS "entryType",
        category,
        amount,
        operation_date AS "operationDate",
        reference_module AS "referenceModule",
        notes,
        created_at AS "createdAt"
    `,
    values: [
      data.entryType,
      data.category,
      data.amount,
      data.operationDate,
      data.referenceModule,
      data.notes ?? null,
    ],
  });

  return result.rows[0];
}

export async function updateFinanceEntry(id, data) {
  const result = await query({
    name: 'finance-update-entry',
    text: `
      UPDATE finance_entries
      SET
        entry_type = $2,
        category = $3,
        amount = $4,
        operation_date = $5,
        reference_module = $6,
        notes = $7
      WHERE id = $1
      RETURNING
        id,
        entry_type AS "entryType",
        category,
        amount,
        operation_date AS "operationDate",
        reference_module AS "referenceModule",
        notes,
        created_at AS "createdAt"
    `,
    values: [
      id,
      data.entryType,
      data.category,
      data.amount,
      data.operationDate,
      data.referenceModule,
      data.notes ?? null,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Финансовая операция не найдена');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

export async function getFinanceSummary() {
  const result = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount END), 0) AS income_total,
      COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN amount END), 0) AS expense_total
    FROM finance_entries
  `);

  const row = result.rows[0];
  const incomeTotal = Number(row.income_total);
  const expenseTotal = Number(row.expense_total);

  return {
    incomeTotal,
    expenseTotal,
    balance: incomeTotal - expenseTotal,
  };
}
