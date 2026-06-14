import { query } from '../../db/pool.js';
import { sendMail } from '../../mail/mailer.js';
import { getWaybillById } from './harvest.service.js';
import { buildWaybillDocx } from './waybill-docx.service.js';

export async function listDriverContacts() {
  const result = await query(`
    SELECT
      driver_name AS "driverName",
      driver_email AS "driverEmail",
      MAX(created_at) AS "lastUsedAt"
    FROM harvest_waybills
    WHERE driver_email IS NOT NULL
      AND driver_email <> ''
    GROUP BY driver_name, driver_email
    ORDER BY "lastUsedAt" DESC, "driverName" ASC
  `);

  return result.rows.map(({ driverName, driverEmail }) => ({ driverName, driverEmail }));
}

export function queueWaybillEmail(waybillId) {
  if (!Number.isInteger(waybillId) || waybillId <= 0) {
    return;
  }

  setImmediate(async () => {
    try {
      const waybill = await getWaybillById(waybillId);

      if (!waybill?.driverEmail) {
        return;
      }

      const docx = await buildWaybillDocx(waybill);
      const documentNumber = waybill.documentNumber ?? `#${waybillId}`;
      const tripDate = waybill.tripDate
        ? new Date(waybill.tripDate).toLocaleDateString('ru-RU')
        : 'не указана';

      await sendMail({
        to: [waybill.driverEmail],
        subject: `Путевой лист ${documentNumber}`,
        text: `Здравствуйте!\n\nВо вложении путевой лист ${documentNumber} от ${tripDate}.\n\nС уважением,\nСистема «Партнер»`,
        attachments: [
          {
            filename: `waybill-${waybillId}.docx`,
            content: docx,
          },
        ],
      });
    } catch (error) {
      console.error('[waybill-email] Ошибка отправки путевого листа:', error);
    }
  });
}

