import { pool } from '../db/pool.js';

/** Демо-операции, включая реализацию урожая (продажи) — аналог migrations/012_seed_demo_finance.sql */
const DEMO_ENTRIES = [
  ['income', 'Реализация пшеницы озимой', 4520000, '2026-02-15', 'harvest', 'Отгрузка на элеватор'],
  ['income', 'Реализация подсолнечника', 2840000, '2026-03-20', 'harvest', 'Маслозавод'],
  ['income', 'Субсидия АПК (региональная)', 1150000, '2026-04-01', 'other', 'Поддержка СХП'],
  ['income', 'Реализация кукурузы на зерно', 980000, '2026-04-28', 'harvest', 'Поле № 4'],
  ['expense', 'ГСМ (дизель для тракторов)', 890000, '2026-03-05', 'machinery', 'Март'],
  ['expense', 'Семена и посадматериалы', 1450000, '2026-02-10', 'warehouse', 'Склад №1'],
  ['expense', 'Минеральные удобрения (NPK)', 980000, '2026-02-18', 'warehouse', 'Подкормка озимых'],
  ['expense', 'Заработная плата механизаторов', 2100000, '2026-03-31', 'hr', 'Ведомость за март'],
  ['expense', 'Ремонт зерноуборочного комбайна', 340000, '2026-01-22', 'machinery', 'ACROS 595'],
  ['expense', 'Аренда сельхозтехники', 180000, '2026-02-01', 'machinery', 'Весенняя кампания'],
  ['expense', 'Страхование посевов', 125000, '2026-01-15', 'fields', '695 га'],
  ['expense', 'Агрономическое сопровождение', 45000, '2026-01-30', 'planning', 'Техкарты'],
  ['expense', 'Услуги элеватора (приёмка и сушка)', 220000, '2026-02-20', 'harvest', 'Подработка зерна'],
  ['expense', 'Средства защиты растений (СЗР)', 310000, '2026-05-10', 'warehouse', 'Гербициды'],
  ['expense', 'Коммунальные и административные', 78500, '2026-03-15', 'finance', 'Офис, связь'],
];

async function seedFinance() {
  let added = 0;

  for (const [entryType, category, amount, operationDate, referenceModule, notes] of DEMO_ENTRIES) {
    const exists = await pool.query(
      `
        SELECT 1 FROM finance_entries
        WHERE entry_type = $1 AND category = $2 AND operation_date = $3 AND amount = $4
        LIMIT 1
      `,
      [entryType, category, operationDate, amount],
    );

    if (exists.rows.length > 0) {
      continue;
    }

    await pool.query({
      text: `
        INSERT INTO finance_entries (entry_type, category, amount, operation_date, reference_module, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      values: [entryType, category, amount, operationDate, referenceModule, notes],
    });
    added += 1;
  }

  console.log(
    added > 0
      ? `Добавлено финансовых операций: ${added} (в т.ч. реализация урожая)`
      : 'Финансовые демо-данные уже есть',
  );

  await pool.end();
}

seedFinance().catch(async (error) => {
  console.error('Не удалось заполнить финансовые демо-данные:', error);
  await pool.end();
  process.exit(1);
});
