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

const ROLE_LABELS = {
  admin: 'Администратор',
  agronomist: 'Агроном',
  mechanic: 'Механик',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
};

async function loadSummaryBlocks() {
  const summary = await getDashboardSummary();
  const waybillsResult = await query(`SELECT COUNT(*)::int AS c FROM harvest_waybills`);
  const waybillsCount = Number(waybillsResult.rows[0]?.c ?? 0);
  return { summary, waybillsCount };
}

/** @param {{ id: number, username: string, fullName: string, role: string }} user */
export async function buildSummaryDocx(user) {
  const { summary, waybillsCount } = await loadSummaryBlocks();
  const now = new Date();
  const dateStr = now.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  const children = [
    new Paragraph({
      text: 'Сводный отчёт по состоянию хозяйства',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'ERP сельхозпредприятия', italics: true }),
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
    creator: 'Agro ERP',
    description: `Отчёт от ${dateStr}`,
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
