import { query } from '../../db/pool.js';

export async function listMachinery() {
  const sql = `
    SELECT
      id,
      inventory_number AS "inventoryNumber",
      type,
      brand,
      model,
      registration_number AS "registrationNumber",
      year_of_manufacture AS "yearOfManufacture",
      engine_hours AS "engineHours",
      status,
      created_at AS "createdAt"
    FROM machinery
    ORDER BY created_at DESC
  `;

  const result = await query(sql);
  return result.rows;
}

export async function createMachinery(data) {
  const text = `
    INSERT INTO machinery (
      inventory_number,
      type,
      brand,
      model,
      registration_number,
      year_of_manufacture,
      engine_hours,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      inventory_number AS "inventoryNumber",
      type,
      brand,
      model,
      registration_number AS "registrationNumber",
      year_of_manufacture AS "yearOfManufacture",
      engine_hours AS "engineHours",
      status,
      created_at AS "createdAt"
  `;

  const result = await query({
    name: 'machinery-create-item',
    text,
    values: [
      data.inventoryNumber,
      data.type,
      data.brand,
      data.model,
      data.registrationNumber ?? null,
      data.yearOfManufacture ?? null,
      data.engineHours,
      data.status,
    ],
  });
  return result.rows[0];
}

export async function updateMachinery(id, data) {
  const result = await query({
    name: 'machinery-update-item',
    text: `
      UPDATE machinery
      SET
        inventory_number = $2,
        type = $3,
        brand = $4,
        model = $5,
        registration_number = $6,
        year_of_manufacture = $7,
        engine_hours = $8,
        status = $9
      WHERE id = $1
      RETURNING
        id,
        inventory_number AS "inventoryNumber",
        type,
        brand,
        model,
        registration_number AS "registrationNumber",
        year_of_manufacture AS "yearOfManufacture",
        engine_hours AS "engineHours",
        status,
        created_at AS "createdAt"
    `,
    values: [
      id,
      data.inventoryNumber,
      data.type,
      data.brand,
      data.model,
      data.registrationNumber ?? null,
      data.yearOfManufacture ?? null,
      data.engineHours,
      data.status,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Единица техники не найдена');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
