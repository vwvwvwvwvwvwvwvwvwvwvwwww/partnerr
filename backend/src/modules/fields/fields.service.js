import { query } from '../../db/pool.js';

export async function listFields() {
  const sql = `
    SELECT
      f.id,
      f.name,
      f.cadastral_number AS "cadastralNumber",
      f.area_ha AS "areaHa",
      f.soil_type AS "soilType",
      f.status,
      f.current_crop_id AS "currentCropId",
      c.name AS "currentCropName",
      ST_AsGeoJSON(f.geometry)::json AS geometry,
      f.created_at AS "createdAt"
    FROM fields f
    LEFT JOIN crops c ON c.id = f.current_crop_id
    ORDER BY f.created_at DESC
  `;

  const result = await query(sql);
  return result.rows;
}

export async function createField(data, createdBy) {
  const text = `
    INSERT INTO fields (
      name,
      cadastral_number,
      area_ha,
      soil_type,
      status,
      current_crop_id,
      geometry,
      created_by
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($7), 4326)),
      $8
    )
    RETURNING
      id,
      name,
      cadastral_number AS "cadastralNumber",
      area_ha AS "areaHa",
      soil_type AS "soilType",
      status,
      current_crop_id AS "currentCropId",
      ST_AsGeoJSON(geometry)::json AS geometry,
      created_at AS "createdAt"
  `;

  const result = await query({
    name: 'fields-create-field',
    text,
    values: [
      data.name,
      data.cadastralNumber ?? null,
      data.areaHa,
      data.soilType ?? null,
      data.status,
      data.currentCropId ?? null,
      JSON.stringify(data.geometry),
      createdBy,
    ],
  });
  return result.rows[0];
}

export async function updateField(id, data) {
  const text = `
    UPDATE fields
    SET
      name = $2,
      cadastral_number = $3,
      area_ha = $4,
      soil_type = $5,
      status = $6,
      current_crop_id = $7,
      geometry = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($8), 4326))
    WHERE id = $1
    RETURNING
      id,
      name,
      cadastral_number AS "cadastralNumber",
      area_ha AS "areaHa",
      soil_type AS "soilType",
      status,
      current_crop_id AS "currentCropId",
      ST_AsGeoJSON(geometry)::json AS geometry,
      created_at AS "createdAt"
  `;

  const result = await query({
    name: 'fields-update-field',
    text,
    values: [
      id,
      data.name,
      data.cadastralNumber ?? null,
      data.areaHa,
      data.soilType ?? null,
      data.status,
      data.currentCropId ?? null,
      JSON.stringify(data.geometry),
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Поле не найдено');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
