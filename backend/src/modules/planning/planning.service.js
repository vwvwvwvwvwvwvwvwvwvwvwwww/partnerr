import { query } from '../../db/pool.js';

export async function listTechnologyCards() {
  const result = await query(`
    SELECT
      tc.id,
      tc.title,
      tc.work_name AS "workName",
      tc.unit,
      tc.work_volume AS "workVolume",
      tc.conversion_coefficient AS "conversionCoefficient",
      tc.equivalent_area_ha AS "equivalentAreaHa",
      tc.aggregate_composition AS "aggregateComposition",
      tc.season_year AS "seasonYear",
      tc.area_ha AS "areaHa",
      tc.planned_start_date AS "plannedStartDate",
      tc.planned_end_date AS "plannedEndDate",
      tc.aggregates_count AS "aggregatesCount",
      tc.mechanizators_count AS "mechanizatorsCount",
      tc.workers_count AS "workersCount",
      tc.output_norm AS "outputNorm",
      tc.norm_shifts_count AS "normShiftsCount",
      tc.labor_costs AS "laborCosts",
      tc.tariff_rate AS "tariffRate",
      tc.tariff_fund AS "tariffFund",
      tc.extra_pay AS "extraPay",
      tc.fuel_rate AS "fuelRate",
      tc.fuel_total_liters AS "fuelTotalLiters",
      tc.seeds_required_kg AS "seedsRequiredKg",
      tc.fertilizer_required_kg AS "fertilizerRequiredKg",
      tc.notes,
      tc.created_at AS "createdAt",
      c.id AS "cropId",
      c.name AS "cropName"
    FROM technology_cards tc
    JOIN crops c ON c.id = tc.crop_id
    ORDER BY tc.created_at DESC
  `);

  return result.rows;
}

export async function createTechnologyCard(data, userId) {
  const cropResult = await query({
    name: 'planning-get-crop-rates',
    text: `
      SELECT
        id,
        default_seed_rate_kg_ha AS "defaultSeedRateKgHa",
        default_fertilizer_rate_kg_ha AS "defaultFertilizerRateKgHa"
      FROM crops
      WHERE id = $1
      LIMIT 1
    `,
    values: [data.cropId],
  });

  const crop = cropResult.rows[0];

  if (!crop) {
    const error = new Error('Культура не найдена');
    error.statusCode = 404;
    throw error;
  }

  const seedsRequiredKg = Number(data.areaHa) * Number(crop.defaultSeedRateKgHa ?? 0);
  const fertilizerRequiredKg = Number(data.areaHa) * Number(crop.defaultFertilizerRateKgHa ?? 0);

  const result = await query({
    name: 'planning-create-tech-card',
    text: `
      INSERT INTO technology_cards (
        title,
        work_name,
        unit,
        work_volume,
        conversion_coefficient,
        equivalent_area_ha,
        aggregate_composition,
        crop_id,
        season_year,
        area_ha,
        planned_start_date,
        planned_end_date,
        aggregates_count,
        mechanizators_count,
        workers_count,
        output_norm,
        norm_shifts_count,
        labor_costs,
        tariff_rate,
        tariff_fund,
        extra_pay,
        fuel_rate,
        fuel_total_liters,
        seeds_required_kg,
        fertilizer_required_kg,
        notes,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING
        id,
        title,
        work_name AS "workName",
        unit,
        work_volume AS "workVolume",
        conversion_coefficient AS "conversionCoefficient",
        equivalent_area_ha AS "equivalentAreaHa",
        aggregate_composition AS "aggregateComposition",
        crop_id AS "cropId",
        season_year AS "seasonYear",
        area_ha AS "areaHa",
        planned_start_date AS "plannedStartDate",
        planned_end_date AS "plannedEndDate",
        aggregates_count AS "aggregatesCount",
        mechanizators_count AS "mechanizatorsCount",
        workers_count AS "workersCount",
        output_norm AS "outputNorm",
        norm_shifts_count AS "normShiftsCount",
        labor_costs AS "laborCosts",
        tariff_rate AS "tariffRate",
        tariff_fund AS "tariffFund",
        extra_pay AS "extraPay",
        fuel_rate AS "fuelRate",
        fuel_total_liters AS "fuelTotalLiters",
        seeds_required_kg AS "seedsRequiredKg",
        fertilizer_required_kg AS "fertilizerRequiredKg",
        notes,
        created_at AS "createdAt"
    `,
    values: [
      data.title,
      data.workName,
      data.unit,
      data.workVolume,
      data.conversionCoefficient,
      data.equivalentAreaHa,
      data.aggregateComposition,
      data.cropId,
      data.seasonYear,
      data.areaHa,
      data.plannedStartDate,
      data.plannedEndDate,
      data.aggregatesCount,
      data.mechanizatorsCount,
      data.workersCount,
      data.outputNorm,
      data.normShiftsCount,
      data.laborCosts,
      data.tariffRate,
      data.tariffFund,
      data.extraPay,
      data.fuelRate,
      data.fuelTotalLiters,
      seedsRequiredKg,
      fertilizerRequiredKg,
      data.notes ?? null,
      userId,
    ],
  });

  return result.rows[0];
}

export async function updateTechnologyCard(id, data) {
  const cropResult = await query({
    name: 'planning-get-crop-rates-for-update',
    text: `
      SELECT
        id,
        default_seed_rate_kg_ha AS "defaultSeedRateKgHa",
        default_fertilizer_rate_kg_ha AS "defaultFertilizerRateKgHa"
      FROM crops
      WHERE id = $1
      LIMIT 1
    `,
    values: [data.cropId],
  });

  const crop = cropResult.rows[0];

  if (!crop) {
    const error = new Error('Культура не найдена');
    error.statusCode = 404;
    throw error;
  }

  const seedsRequiredKg = Number(data.areaHa) * Number(crop.defaultSeedRateKgHa ?? 0);
  const fertilizerRequiredKg = Number(data.areaHa) * Number(crop.defaultFertilizerRateKgHa ?? 0);

  const result = await query({
    name: 'planning-update-tech-card',
    text: `
      UPDATE technology_cards
      SET
        title = $2,
        work_name = $3,
        unit = $4,
        work_volume = $5,
        conversion_coefficient = $6,
        equivalent_area_ha = $7,
        aggregate_composition = $8,
        crop_id = $9,
        season_year = $10,
        area_ha = $11,
        planned_start_date = $12,
        planned_end_date = $13,
        aggregates_count = $14,
        mechanizators_count = $15,
        workers_count = $16,
        output_norm = $17,
        norm_shifts_count = $18,
        labor_costs = $19,
        tariff_rate = $20,
        tariff_fund = $21,
        extra_pay = $22,
        fuel_rate = $23,
        fuel_total_liters = $24,
        seeds_required_kg = $25,
        fertilizer_required_kg = $26,
        notes = $27
      WHERE id = $1
      RETURNING
        id,
        title,
        work_name AS "workName",
        unit,
        work_volume AS "workVolume",
        conversion_coefficient AS "conversionCoefficient",
        equivalent_area_ha AS "equivalentAreaHa",
        aggregate_composition AS "aggregateComposition",
        crop_id AS "cropId",
        season_year AS "seasonYear",
        area_ha AS "areaHa",
        planned_start_date AS "plannedStartDate",
        planned_end_date AS "plannedEndDate",
        aggregates_count AS "aggregatesCount",
        mechanizators_count AS "mechanizatorsCount",
        workers_count AS "workersCount",
        output_norm AS "outputNorm",
        norm_shifts_count AS "normShiftsCount",
        labor_costs AS "laborCosts",
        tariff_rate AS "tariffRate",
        tariff_fund AS "tariffFund",
        extra_pay AS "extraPay",
        fuel_rate AS "fuelRate",
        fuel_total_liters AS "fuelTotalLiters",
        seeds_required_kg AS "seedsRequiredKg",
        fertilizer_required_kg AS "fertilizerRequiredKg",
        notes,
        created_at AS "createdAt"
    `,
    values: [
      id,
      data.title,
      data.workName,
      data.unit,
      data.workVolume,
      data.conversionCoefficient,
      data.equivalentAreaHa,
      data.aggregateComposition,
      data.cropId,
      data.seasonYear,
      data.areaHa,
      data.plannedStartDate,
      data.plannedEndDate,
      data.aggregatesCount,
      data.mechanizatorsCount,
      data.workersCount,
      data.outputNorm,
      data.normShiftsCount,
      data.laborCosts,
      data.tariffRate,
      data.tariffFund,
      data.extraPay,
      data.fuelRate,
      data.fuelTotalLiters,
      seedsRequiredKg,
      fertilizerRequiredKg,
      data.notes ?? null,
    ],
  });

  if (!result.rows[0]) {
    const error = new Error('Технологическая карта не найдена');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
