import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { query } from '../../db/pool.js';
import { getDashboardSummary } from '../dashboard/dashboard.service.js';
import { isSqlite } from '../../db/dialect.js';

const ROLE_LABELS = {
  admin: 'Администратор',
  agronomist: 'Агроном',
  mechanic: 'Механик',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
  driver: 'Водитель',
};

async function loadSummaryBlocks() {
  const summary = await getDashboardSummary();
  const waybillsResult = await query(
    isSqlite
      ? 'SELECT CAST(COUNT(*) AS INTEGER) AS c FROM harvest_waybills'
      : 'SELECT COUNT(*)::int AS c FROM harvest_waybills',
  );
  const waybillsCount = Number(waybillsResult.rows[0]?.c ?? 0);
  return { summary, waybillsCount };
}

function buildSnapshot(summary, waybillsCount) {
  return {
    fieldsCount: summary.fieldsCount,
    totalAreaHa: Number(summary.totalAreaHa),
    cropsCount: summary.cropsCount,
    activeMachineryCount: summary.activeMachineryCount,
    warehouseItemsCount: summary.warehouseItemsCount,
    waybillsCount,
    employeesCount: summary.employeesCount,
    financeBalance: Number(summary.financeBalance),
  };
}

export async function listReportExports() {
  try {
    const result = await query(`
      SELECT
        re.id,
        re.report_type AS "reportType",
        re.title,
        re.file_name AS "fileName",
        re.generated_at AS "generatedAt",
        re.snapshot,
        u.full_name AS "generatedByName",
        u.role AS "generatedByRole"
      FROM report_exports re
      JOIN app_users u ON u.id = re.generated_by
      ORDER BY re.generated_at DESC
      LIMIT 50
    `);

    return result.rows;
  } catch (error) {
    if (error.code === '42P01' || String(error.message ?? '').includes('no such table: report_exports')) {
      const err = new Error('Таблица report_exports не найдена. Выполните npm run migrate.');
      err.statusCode = 503;
      throw err;
    }

    throw error;
  }
}

export async function getReportExportById(id) {
  const result = await query({
    name: 'reports-get-export-by-id',
    text: `
      SELECT
        re.id,
        re.report_type AS "reportType",
        re.title,
        re.file_name AS "fileName",
        re.generated_at AS "generatedAt",
        re.snapshot,
        u.full_name AS "generatedByName",
        u.role AS "generatedByRole"
      FROM report_exports re
      JOIN app_users u ON u.id = re.generated_by
      WHERE re.id = $1
      LIMIT 1
    `,
    values: [id],
  });

  return result.rows[0] ?? null;
}

export async function recordReportExport(user, { title, fileName, snapshot }) {
  const result = await query({
    name: 'reports-record-export',
    text: `
      INSERT INTO report_exports (report_type, title, file_name, generated_by, snapshot)
      VALUES ('summary', $1, $2, $3, ${isSqlite ? '$4' : '$4::jsonb'})
      RETURNING id, title, file_name AS "fileName", generated_at AS "generatedAt"
    `,
    values: [title, fileName, user.id, JSON.stringify(snapshot)],
  });

  return result.rows[0];
}

/** @param {{ id: number, username: string, fullName: string, role: string }} user */
/** @param {{ archiveLabel?: string }} [options] */
export async function buildSummaryDocx(user, options = {}) {
  const { summary, waybillsCount } = await loadSummaryBlocks();
  const now = new Date();
  const dateStr = now.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const archiveLabel = options.archiveLabel?.trim();

  const children = [
    new Paragraph({
      text: 'Сводный отчёт по состоянию хозяйства',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Система «Партнер»', italics: true }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Дата и время: ', bold: true }),
        new TextRun(dateStr),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Сформировал: ', bold: true }),
        new TextRun(`${user.fullName} (${roleLabel})`),
      ],
    }),
    ...(archiveLabel
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Архивная запись: ', bold: true }),
              new TextRun({ text: archiveLabel, italics: true }),
            ],
          }),
        ]
      : []),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Поля и посевы', heading: HeadingLevel.HEADING_2 }),
    new Paragraph({
      children: [
        new TextRun('Полей в учёте: '),
        new TextRun({ text: String(summary.fieldsCount), bold: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun('Площадь полей, га: '),
        new TextRun({ text: Number(summary.totalAreaHa).toFixed(2), bold: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun('Номенклатура культур: '),
        new TextRun({ text: String(summary.cropsCount), bold: true }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Техника и склад', heading: HeadingLevel.HEADING_2 }),
    new Paragraph({
      children: [
        new TextRun('Техника в работе, ед.: '),
        new TextRun({ text: String(summary.activeMachineryCount), bold: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun('Позиций на складе: '),
        new TextRun({ text: String(summary.warehouseItemsCount), bold: true }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Урожай и логистика', heading: HeadingLevel.HEADING_2 }),
    new Paragraph({
      children: [
        new TextRun('Путевых листов в журнале: '),
        new TextRun({ text: String(waybillsCount), bold: true }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: 'Персонал и финансы', heading: HeadingLevel.HEADING_2 }),
    new Paragraph({
      children: [
        new TextRun('Активных учётных записей: '),
        new TextRun({ text: String(summary.employeesCount), bold: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun('Сальдо по проводкам: '),
        new TextRun({
          text: `${Number(summary.financeBalance).toFixed(2)} руб.`,
          bold: true,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [new TextRun({ text: 'Конец отчёта', italics: true })],
    }),
  ];

  const doc = new Document({
    title: 'Сводный отчёт',
    creator: 'Партнер',
    description: `Отчёт от ${dateStr}`,
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

/** Сформировать сводку, сохранить в журнал и вернуть файл */
export async function createSummaryReport(user) {
  const { summary, waybillsCount } = await loadSummaryBlocks();
  const snapshot = buildSnapshot(summary, waybillsCount);
  const dateSlug = new Date().toISOString().slice(0, 10);
  const fileName = `partner-svodka-${dateSlug}.docx`;
  const title = `Сводка по хозяйству — ${new Date().toLocaleDateString('ru-RU')}`;

  const buffer = await buildSummaryDocx(user);
  const record = await recordReportExport(user, { title, fileName, snapshot });

  return { buffer, fileName, record, snapshot };
}

/** Повторная выгрузка по записи журнала (актуальные данные + пометка об архиве) */
export async function buildSummaryDocxFromExport(user, exportRow) {
  const archiveLabel = `${exportRow.title}, ${new Date(exportRow.generatedAt).toLocaleString('ru-RU')}`;
  const buffer = await buildSummaryDocx(user, { archiveLabel });
  return { buffer, fileName: exportRow.fileName };
}
