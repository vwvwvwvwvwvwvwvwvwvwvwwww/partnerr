import { query } from '../../db/pool.js';

export async function listCrops() {
  const sql = `
    SELECT
      id,
      name,
      category,
      default_seed_rate_kg_ha AS "defaultSeedRateKgHa",
      default_fertilizer_rate_kg_ha AS "defaultFertilizerRateKgHa",
      created_at AS "createdAt"
    FROM crops
    ORDER BY name ASC
  `;

  const result = await query(sql);
  return result.rows;
}

export async function createCrop(data) {
  const text = `
    INSERT INTO crops (
      name,
      category,
      default_seed_rate_kg_ha,
      default_fertilizer_rate_kg_ha
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      name,
      category,
      default_seed_rate_kg_ha AS "defaultSeedRateKgHa",
      default_fertilizer_rate_kg_ha AS "defaultFertilizerRateKgHa",
      created_at AS "createdAt"
  `;

  const result = await query({
    name: 'crops-create-item',
    text,
    values: [
      data.name,
      data.category,
      data.defaultSeedRateKgHa ?? null,
      data.defaultFertilizerRateKgHa ?? null,
    ],
  });
  return result.rows[0];
}

export async function updateCrop(id, data) {
  const result = await query({
    name: 'crops-update-item',
    text: `
      UPDATE crops
      SET
        name = $2,
        category = $3,
        default_seed_rate_kg_ha = $4,
        default_fertilizer_rate_kg_ha = $5
      WHERE id = $1
      RETURNING
        id,
        name,
        category,
        default_seed_rate_kg_ha AS "defaultSeedRateKgHa",
        default_fertilizer_rate_kg_ha AS "defaultFertilizerRateKgHa",
        created_at AS "createdAt"
    `,
    values: [
      id,
      data.name,
      data.category,
      data.defaultSeedRateKgHa ?? null,
      data.defaultFertilizerRateKgHa ?? null,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Культура не найдена');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
