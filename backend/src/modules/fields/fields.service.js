import { query } from '../../db/pool.js';
import { isSqlite } from '../../db/dialect.js';

function geometrySelect(alias = 'f') {
  return isSqlite
    ? `${alias}.geometry AS geometry`
    : `ST_AsGeoJSON(${alias}.geometry)::json AS geometry`;
}

function geometryWriteExpression(paramIndex) {
  return isSqlite
    ? `$${paramIndex}`
    : `ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326))`;
}

function normalizeGeometryRow(row) {
  if (!row) {
    return row;
  }

  if (isSqlite && typeof row.geometry === 'string') {
    try {
      return { ...row, geometry: JSON.parse(row.geometry) };
    } catch {
      return row;
    }
  }

  return row;
}

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
      ${geometrySelect('f')},
      f.created_at AS "createdAt"
    FROM fields f
    LEFT JOIN crops c ON c.id = f.current_crop_id
    ORDER BY f.created_at DESC
  `;

  const result = await query(sql);
  return result.rows.map(normalizeGeometryRow);
}

export async function createField(data, createdBy) {
  const geometryValue = isSqlite ? JSON.stringify(data.geometry) : JSON.stringify(data.geometry);

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
      ${geometryWriteExpression(7)},
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
      ${geometrySelect()},
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
      geometryValue,
      createdBy,
    ],
  });

  return normalizeGeometryRow(result.rows[0]);
}

export async function updateField(id, data) {
  const geometryValue = isSqlite ? JSON.stringify(data.geometry) : JSON.stringify(data.geometry);

  const text = `
    UPDATE fields
    SET
      name = $2,
      cadastral_number = $3,
      area_ha = $4,
      soil_type = $5,
      status = $6,
      current_crop_id = $7,
      geometry = ${geometryWriteExpression(8)}
    WHERE id = $1
    RETURNING
      id,
      name,
      cadastral_number AS "cadastralNumber",
      area_ha AS "areaHa",
      soil_type AS "soilType",
      status,
      current_crop_id AS "currentCropId",
      ${geometrySelect()},
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
      geometryValue,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Поле не найдено');
    error.statusCode = 404;
    throw error;
  }

  return normalizeGeometryRow(result.rows[0]);
}
