import { query } from '../../db/pool.js';
import { isSqlite } from '../../db/dialect.js';

function timeColumn(column, alias) {
  if (isSqlite) {
    return `${column} AS "${alias}"`;
  }

  return `TO_CHAR(${column}, 'HH24:MI') AS "${alias}"`;
}

export async function listWaybills() {
  const result = await query(`
    SELECT
      hw.id,
      hw.field_id AS "fieldId",
      hw.crop_id AS "cropId",
      f.name AS "fieldName",
      COALESCE(c.name, hw.seed_type) AS "cropName",
      hw.document_number AS "documentNumber",
      hw.shift_number AS "shiftNumber",
      hw.action_type AS "actionType",
      hw.seed_type AS "seedType",
      hw.driver_name AS "driverName",
      hw.driver_email AS "driverEmail",
      hw.mechanizator_name AS "mechanizatorName",
      hw.vehicle_number AS "vehicleNumber",
      hw.trailer_number AS "trailerNumber",
      hw.tractor_model AS "tractorModel",
      hw.equipment_name AS "equipmentName",
      hw.trip_date AS "tripDate",
      ${timeColumn('hw.departure_time', 'departureTime')},
      ${timeColumn('hw.return_time', 'returnTime')},
      hw.work_volume_ha AS "workVolumeHa",
      hw.route_distance_km AS "routeDistanceKm",
      hw.start_odometer_km AS "startOdometerKm",
      hw.end_odometer_km AS "endOdometerKm",
      hw.start_engine_hours AS "startEngineHours",
      hw.end_engine_hours AS "endEngineHours",
      hw.gross_weight_kg AS "grossWeightKg",
      hw.tare_weight_kg AS "tareWeightKg",
      CASE
        WHEN hw.gross_weight_kg IS NOT NULL AND hw.tare_weight_kg IS NOT NULL
          THEN hw.gross_weight_kg - hw.tare_weight_kg
        ELSE NULL
      END AS "netWeightKg",
      hw.fuel_issued_liters AS "fuelIssuedLiters",
      hw.fuel_start_liters AS "fuelStartLiters",
      hw.fuel_end_liters AS "fuelEndLiters",
      hw.fuel_actual_liters AS "fuelActualLiters",
      hw.destination,
      hw.receiver_name AS "receiverName",
      hw.weather_conditions AS "weatherConditions",
      hw.route_description AS "routeDescription",
      hw.responsible_person AS "responsiblePerson",
      hw.notes,
      hw.ticket_photo_url AS "ticketPhotoUrl",
      hw.created_at AS "createdAt"
    FROM harvest_waybills hw
    JOIN fields f ON f.id = hw.field_id
    LEFT JOIN crops c ON c.id = hw.crop_id
    ORDER BY hw.created_at DESC
  `);

  return result.rows;
}

const waybillSelectSql = `
  SELECT
    hw.id,
    hw.field_id AS "fieldId",
    hw.crop_id AS "cropId",
    f.name AS "fieldName",
    COALESCE(c.name, hw.seed_type) AS "cropName",
    hw.document_number AS "documentNumber",
    hw.shift_number AS "shiftNumber",
    hw.action_type AS "actionType",
    hw.seed_type AS "seedType",
    hw.driver_name AS "driverName",
    hw.driver_email AS "driverEmail",
    hw.mechanizator_name AS "mechanizatorName",
    hw.vehicle_number AS "vehicleNumber",
    hw.trailer_number AS "trailerNumber",
    hw.tractor_model AS "tractorModel",
    hw.equipment_name AS "equipmentName",
    hw.trip_date AS "tripDate",
    ${timeColumn('hw.departure_time', 'departureTime')},
    ${timeColumn('hw.return_time', 'returnTime')},
    hw.work_volume_ha AS "workVolumeHa",
    hw.route_distance_km AS "routeDistanceKm",
    hw.start_odometer_km AS "startOdometerKm",
    hw.end_odometer_km AS "endOdometerKm",
    hw.start_engine_hours AS "startEngineHours",
    hw.end_engine_hours AS "endEngineHours",
    hw.gross_weight_kg AS "grossWeightKg",
    hw.tare_weight_kg AS "tareWeightKg",
    CASE
      WHEN hw.gross_weight_kg IS NOT NULL AND hw.tare_weight_kg IS NOT NULL
        THEN hw.gross_weight_kg - hw.tare_weight_kg
      ELSE NULL
    END AS "netWeightKg",
    hw.fuel_issued_liters AS "fuelIssuedLiters",
    hw.fuel_start_liters AS "fuelStartLiters",
    hw.fuel_end_liters AS "fuelEndLiters",
    hw.fuel_actual_liters AS "fuelActualLiters",
    hw.destination,
    hw.receiver_name AS "receiverName",
    hw.weather_conditions AS "weatherConditions",
    hw.route_description AS "routeDescription",
    hw.responsible_person AS "responsiblePerson",
    hw.notes,
    hw.ticket_photo_url AS "ticketPhotoUrl",
    hw.created_at AS "createdAt"
  FROM harvest_waybills hw
  JOIN fields f ON f.id = hw.field_id
  LEFT JOIN crops c ON c.id = hw.crop_id
`;

export async function getWaybillById(id) {
  const result = await query({
    name: 'harvest-get-waybill-by-id',
    text: `${waybillSelectSql} WHERE hw.id = $1`,
    values: [id],
  });

  return result.rows[0] ?? null;
}

export async function createWaybill(data) {
  const result = await query({
    name: 'harvest-create-waybill',
    text: `
      INSERT INTO harvest_waybills (
        field_id,
        crop_id,
        document_number,
        shift_number,
        action_type,
        seed_type,
        driver_name,
        driver_email,
        mechanizator_name,
        vehicle_number,
        trailer_number,
        tractor_model,
        equipment_name,
        trip_date,
        departure_time,
        return_time,
        work_volume_ha,
        route_distance_km,
        start_odometer_km,
        end_odometer_km,
        start_engine_hours,
        end_engine_hours,
        gross_weight_kg,
        tare_weight_kg,
        fuel_issued_liters,
        fuel_start_liters,
        fuel_end_liters,
        fuel_actual_liters,
        destination,
        receiver_name,
        weather_conditions,
        route_description,
        responsible_person,
        notes,
        ticket_photo_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
      RETURNING
        id,
        field_id AS "fieldId",
        crop_id AS "cropId",
        document_number AS "documentNumber",
        shift_number AS "shiftNumber",
        action_type AS "actionType",
        seed_type AS "seedType",
        driver_name AS "driverName",
        driver_email AS "driverEmail",
        mechanizator_name AS "mechanizatorName",
        vehicle_number AS "vehicleNumber",
        trailer_number AS "trailerNumber",
        tractor_model AS "tractorModel",
        equipment_name AS "equipmentName",
        trip_date AS "tripDate",
        ${timeColumn('departure_time', 'departureTime')},
        ${timeColumn('return_time', 'returnTime')},
        work_volume_ha AS "workVolumeHa",
        route_distance_km AS "routeDistanceKm",
        start_odometer_km AS "startOdometerKm",
        end_odometer_km AS "endOdometerKm",
        start_engine_hours AS "startEngineHours",
        end_engine_hours AS "endEngineHours",
        gross_weight_kg AS "grossWeightKg",
        tare_weight_kg AS "tareWeightKg",
        fuel_issued_liters AS "fuelIssuedLiters",
        fuel_start_liters AS "fuelStartLiters",
        fuel_end_liters AS "fuelEndLiters",
        fuel_actual_liters AS "fuelActualLiters",
        destination,
        receiver_name AS "receiverName",
        weather_conditions AS "weatherConditions",
        route_description AS "routeDescription",
        responsible_person AS "responsiblePerson",
        notes,
        ticket_photo_url AS "ticketPhotoUrl",
        created_at AS "createdAt"
    `,
    values: [
      data.fieldId,
      data.cropId ?? null,
      data.documentNumber,
      data.shiftNumber ?? null,
      data.actionType,
      data.seedType,
      data.driverName,
      data.driverEmail ?? null,
      data.mechanizatorName ?? null,
      data.vehicleNumber,
      data.trailerNumber ?? null,
      data.tractorModel ?? null,
      data.equipmentName ?? null,
      data.tripDate,
      data.departureTime ?? null,
      data.returnTime ?? null,
      data.workVolumeHa ?? null,
      data.routeDistanceKm ?? null,
      data.startOdometerKm ?? null,
      data.endOdometerKm ?? null,
      data.startEngineHours ?? null,
      data.endEngineHours ?? null,
      data.grossWeightKg ?? null,
      data.tareWeightKg ?? null,
      data.fuelIssuedLiters ?? null,
      data.fuelStartLiters ?? null,
      data.fuelEndLiters ?? null,
      data.fuelActualLiters ?? null,
      data.destination ?? null,
      data.receiverName ?? null,
      data.weatherConditions ?? null,
      data.routeDescription ?? null,
      data.responsiblePerson ?? null,
      data.notes ?? null,
      data.ticketPhotoUrl ?? null,
    ],
  });

  return result.rows[0];
}

export async function updateWaybill(id, data) {
  const result = await query({
    name: 'harvest-update-waybill',
    text: `
      UPDATE harvest_waybills
      SET
        field_id = $2,
        crop_id = $3,
        document_number = $4,
        shift_number = $5,
        action_type = $6,
        seed_type = $7,
        driver_name = $8,
        driver_email = $9,
        mechanizator_name = $10,
        vehicle_number = $11,
        trailer_number = $12,
        tractor_model = $13,
        equipment_name = $14,
        trip_date = $15,
        departure_time = $16,
        return_time = $17,
        work_volume_ha = $18,
        route_distance_km = $19,
        start_odometer_km = $20,
        end_odometer_km = $21,
        start_engine_hours = $22,
        end_engine_hours = $23,
        gross_weight_kg = $24,
        tare_weight_kg = $25,
        fuel_issued_liters = $26,
        fuel_start_liters = $27,
        fuel_end_liters = $28,
        fuel_actual_liters = $29,
        destination = $30,
        receiver_name = $31,
        weather_conditions = $32,
        route_description = $33,
        responsible_person = $34,
        notes = $35,
        ticket_photo_url = $36
      WHERE id = $1
      RETURNING
        id,
        field_id AS "fieldId",
        crop_id AS "cropId",
        document_number AS "documentNumber",
        shift_number AS "shiftNumber",
        action_type AS "actionType",
        seed_type AS "seedType",
        driver_name AS "driverName",
        driver_email AS "driverEmail",
        mechanizator_name AS "mechanizatorName",
        vehicle_number AS "vehicleNumber",
        trailer_number AS "trailerNumber",
        tractor_model AS "tractorModel",
        equipment_name AS "equipmentName",
        trip_date AS "tripDate",
        ${timeColumn('departure_time', 'departureTime')},
        ${timeColumn('return_time', 'returnTime')},
        work_volume_ha AS "workVolumeHa",
        route_distance_km AS "routeDistanceKm",
        start_odometer_km AS "startOdometerKm",
        end_odometer_km AS "endOdometerKm",
        start_engine_hours AS "startEngineHours",
        end_engine_hours AS "endEngineHours",
        gross_weight_kg AS "grossWeightKg",
        tare_weight_kg AS "tareWeightKg",
        fuel_issued_liters AS "fuelIssuedLiters",
        fuel_start_liters AS "fuelStartLiters",
        fuel_end_liters AS "fuelEndLiters",
        fuel_actual_liters AS "fuelActualLiters",
        destination,
        receiver_name AS "receiverName",
        weather_conditions AS "weatherConditions",
        route_description AS "routeDescription",
        responsible_person AS "responsiblePerson",
        notes,
        ticket_photo_url AS "ticketPhotoUrl",
        created_at AS "createdAt"
    `,
    values: [
      id,
      data.fieldId,
      data.cropId ?? null,
      data.documentNumber,
      data.shiftNumber ?? null,
      data.actionType,
      data.seedType,
      data.driverName,
      data.driverEmail ?? null,
      data.mechanizatorName ?? null,
      data.vehicleNumber,
      data.trailerNumber ?? null,
      data.tractorModel ?? null,
      data.equipmentName ?? null,
      data.tripDate,
      data.departureTime ?? null,
      data.returnTime ?? null,
      data.workVolumeHa ?? null,
      data.routeDistanceKm ?? null,
      data.startOdometerKm ?? null,
      data.endOdometerKm ?? null,
      data.startEngineHours ?? null,
      data.endEngineHours ?? null,
      data.grossWeightKg ?? null,
      data.tareWeightKg ?? null,
      data.fuelIssuedLiters ?? null,
      data.fuelStartLiters ?? null,
      data.fuelEndLiters ?? null,
      data.fuelActualLiters ?? null,
      data.destination ?? null,
      data.receiverName ?? null,
      data.weatherConditions ?? null,
      data.routeDescription ?? null,
      data.responsiblePerson ?? null,
      data.notes ?? null,
      data.ticketPhotoUrl ?? null,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Путевой лист не найден');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
