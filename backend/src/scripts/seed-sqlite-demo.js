import { pool } from '../db/pool.js';
import { isSqlite } from '../db/dialect.js';

const DEMO_FIELDS = [
  {
    name: 'Садовый - Южный контур',
    cadastralNumber: '56:23:1204001:001',
    soilType: 'Чернозем южный',
    status: 'prepared',
    cropName: 'Пшеница озимая',
    areaHa: 42.5,
    geometry: {
      type: 'Polygon',
      coordinates: [[[54.0742, 51.7862], [54.0796, 51.7848], [54.0828, 51.7881], [54.0799, 51.7912], [54.0748, 51.7901], [54.0742, 51.7862]]],
    },
  },
  {
    name: 'Садовый - Восточный клин',
    cadastralNumber: '56:23:1204001:002',
    soilType: 'Чернозем обыкновенный',
    status: 'sown',
    cropName: 'Подсолнечник',
    areaHa: 38.2,
    geometry: {
      type: 'Polygon',
      coordinates: [[[54.0908, 51.7928], [54.0978, 51.7914], [54.1015, 51.7949], [54.0987, 51.7980], [54.0924, 51.7972], [54.0908, 51.7928]]],
    },
  },
  {
    name: 'Садовый - Северное поле',
    cadastralNumber: '56:23:1204002:003',
    soilType: 'Чернозем южный',
    status: 'growing',
    cropName: 'Кукуруза',
    areaHa: 51.0,
    geometry: {
      type: 'Polygon',
      coordinates: [[[54.0987, 51.7863], [54.1049, 51.7856], [54.1078, 51.7890], [54.1042, 51.7922], [54.0991, 51.7911], [54.0987, 51.7863]]],
    },
  },
];

const DEMO_WAREHOUSE = [
  ['Главный склад', 'Пшеница озимая «Богдана»', 'seeds', 'кг', 'SEM-2025-014', 4200, '2027-03-31', 'АгроСемена Поволжье'],
  ['Главный склад', 'NPK 16:16:16 (гранула)', 'fertilizers', 'кг', 'FERT-2025-088', 18500, '2028-12-01', 'ФосАгро'],
  ['Склад СЗР', 'Гербицид «Глифосат 360»', 'szr', 'л', 'SZR-2026-011', 420, '2027-08-01', 'Сингента Рус'],
  ['Склад ГСМ', 'Дизельное топливо (летнее)', 'fuel', 'л', 'FUEL-2026-04', 12800, null, 'Лукойл-Агро'],
];

async function seedSqliteDemo() {
  if (!isSqlite) {
    console.log('seed-sqlite-demo: пропуск (DB_DRIVER не sqlite)');
    return;
  }

  const cropsCheck = await pool.query('SELECT COUNT(*) AS c FROM crops');
  if (Number(cropsCheck.rows[0]?.c ?? 0) === 0) {
    await pool.query(`
      INSERT INTO crops (name, category, default_seed_rate_kg_ha, default_fertilizer_rate_kg_ha)
      VALUES
        ('Пшеница озимая', 'Зерновые', 220, 180),
        ('Подсолнечник', 'Масличные', 8.5, 120),
        ('Кукуруза', 'Зерновые', 25, 150)
    `);
    console.log('Добавлены культуры');
  }

  const machineryCheck = await pool.query('SELECT COUNT(*) AS c FROM machinery');
  if (Number(machineryCheck.rows[0]?.c ?? 0) === 0) {
    await pool.query(`
      INSERT INTO machinery (inventory_number, type, brand, model, registration_number, year_of_manufacture, engine_hours, status)
      VALUES
        ('TR-001', 'tractor', 'Беларус', '1221.2', 'А123ВС', 2021, 1450.5, 'active'),
        ('CM-001', 'combine', 'Ростсельмаш', 'ACROS 595', 'К456МН', 2020, 2380, 'maintenance')
    `);
    console.log('Добавлена техника');
  }

  const users = await pool.query('SELECT id FROM app_users ORDER BY id LIMIT 1');
  const createdBy = users.rows[0]?.id;

  const fieldsCheck = await pool.query('SELECT COUNT(*) AS c FROM fields');
  if (Number(fieldsCheck.rows[0]?.c ?? 0) === 0 && createdBy) {
    for (const field of DEMO_FIELDS) {
      const crop = await pool.query('SELECT id FROM crops WHERE name = $1 LIMIT 1', [field.cropName]);
      await pool.query({
        text: `
          INSERT INTO fields (
            name, cadastral_number, area_ha, soil_type, status, current_crop_id, geometry, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        values: [
          field.name,
          field.cadastralNumber,
          field.areaHa,
          field.soilType,
          field.status,
          crop.rows[0]?.id ?? null,
          JSON.stringify(field.geometry),
          createdBy,
        ],
      });
    }
    console.log(`Добавлено полей: ${DEMO_FIELDS.length}`);
  }

  const warehouseCheck = await pool.query('SELECT COUNT(*) AS c FROM warehouse_items');
  if (Number(warehouseCheck.rows[0]?.c ?? 0) === 0) {
    for (const row of DEMO_WAREHOUSE) {
      await pool.query({
        text: `
          INSERT INTO warehouse_items (
            warehouse_name, item_name, category, unit, batch_number, quantity, expiry_date, supplier_name
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        values: row,
      });
    }
    console.log(`Добавлено складских позиций: ${DEMO_WAREHOUSE.length}`);
  }

  await pool.end();
}

seedSqliteDemo().catch(async (error) => {
  console.error('Не удалось заполнить демо-данные SQLite:', error);
  await pool.end();
  process.exit(1);
});
