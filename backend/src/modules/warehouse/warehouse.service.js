import { query } from '../../db/pool.js';

export async function listWarehouseItems() {
  const result = await query(`
    SELECT
      id,
      warehouse_name AS "warehouseName",
      item_name AS "itemName",
      category,
      unit,
      batch_number AS "batchNumber",
      quantity,
      expiry_date AS "expiryDate",
      supplier_name AS "supplierName",
      created_at AS "createdAt"
    FROM warehouse_items
    ORDER BY created_at DESC
  `);

  return result.rows;
}

export async function createWarehouseItem(data) {
  const result = await query({
    name: 'warehouse-create-item',
    text: `
      INSERT INTO warehouse_items (
        warehouse_name,
        item_name,
        category,
        unit,
        batch_number,
        quantity,
        expiry_date,
        supplier_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        warehouse_name AS "warehouseName",
        item_name AS "itemName",
        category,
        unit,
        batch_number AS "batchNumber",
        quantity,
        expiry_date AS "expiryDate",
        supplier_name AS "supplierName",
        created_at AS "createdAt"
    `,
    values: [
      data.warehouseName,
      data.itemName,
      data.category,
      data.unit,
      data.batchNumber ?? null,
      data.quantity,
      data.expiryDate ?? null,
      data.supplierName ?? null,
    ],
  });

  return result.rows[0];
}

export async function updateWarehouseItem(id, data) {
  const result = await query({
    name: 'warehouse-update-item',
    text: `
      UPDATE warehouse_items
      SET
        warehouse_name = $2,
        item_name = $3,
        category = $4,
        unit = $5,
        batch_number = $6,
        quantity = $7,
        expiry_date = $8,
        supplier_name = $9
      WHERE id = $1
      RETURNING
        id,
        warehouse_name AS "warehouseName",
        item_name AS "itemName",
        category,
        unit,
        batch_number AS "batchNumber",
        quantity,
        expiry_date AS "expiryDate",
        supplier_name AS "supplierName",
        created_at AS "createdAt"
    `,
    values: [
      id,
      data.warehouseName,
      data.itemName,
      data.category,
      data.unit,
      data.batchNumber ?? null,
      data.quantity,
      data.expiryDate ?? null,
      data.supplierName ?? null,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Складская позиция не найдена');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
