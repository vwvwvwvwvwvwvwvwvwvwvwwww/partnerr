import { isSmtpConfigured } from '../../config/env.js';
import { query } from '../../db/pool.js';
import { sendMail } from '../../mail/mailer.js';
import { getWaybillById } from './harvest.service.js';
import { buildWaybillDocx } from './waybill-docx.service.js';

const REASON_MESSAGES = {
  smtp_not_configured:
    'Почта не настроена на сервере (задайте SMTP_HOST и SMTP_FROM в backend/.env или Variables на хостинге).',
  no_recipients: 'У путевого листа не указан e-mail водителя.',
  waybill_not_found: 'Путевой лист не найден.',
  send_failed: 'Не удалось отправить письмо — проверьте настройки SMTP и логи сервера.',
};

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

/**
 * @returns {Promise<{ sent: boolean, reason?: string, message: string, recipients?: string[] }>}
 */
export async function sendWaybillEmail(waybillId) {
  if (!Number.isInteger(waybillId) || waybillId <= 0) {
    return {
      sent: false,
      reason: 'waybill_not_found',
      message: REASON_MESSAGES.waybill_not_found,
    };
  }

  if (!isSmtpConfigured()) {
    return {
      sent: false,
      reason: 'smtp_not_configured',
      message: REASON_MESSAGES.smtp_not_configured,
    };
  }

  const waybill = await getWaybillById(waybillId);

  if (!waybill) {
    return {
      sent: false,
      reason: 'waybill_not_found',
      message: REASON_MESSAGES.waybill_not_found,
    };
  }

  const driverEmail = waybill.driverEmail?.trim();

  if (!driverEmail) {
    return {
      sent: false,
      reason: 'no_recipients',
      message: REASON_MESSAGES.no_recipients,
    };
  }

  try {
    const docx = await buildWaybillDocx(waybill);
    const documentNumber = waybill.documentNumber ?? `#${waybillId}`;
    const tripDate = waybill.tripDate
      ? new Date(waybill.tripDate).toLocaleDateString('ru-RU')
      : 'не указана';

    const mailResult = await sendMail({
      to: [driverEmail],
      subject: `Путевой лист ${documentNumber}`,
      text: [
        `Здравствуйте, ${waybill.driverName || 'водитель'}!`,
        '',
        `Во вложении путевой лист ${documentNumber} от ${tripDate}.`,
        waybill.fieldName ? `Поле: ${waybill.fieldName}.` : '',
        waybill.destination ? `Пункт назначения: ${waybill.destination}.` : '',
        '',
        'С уважением,',
        'Система «Партнер»',
      ]
        .filter(Boolean)
        .join('\n'),
      attachments: [
        {
          filename: `waybill-${documentNumber.replace(/[^\w.-]+/g, '_')}.docx`,
          content: docx,
        },
      ],
    });

    if (!mailResult.sent) {
      return {
        sent: false,
        reason: mailResult.reason ?? 'send_failed',
        message: REASON_MESSAGES[mailResult.reason] ?? REASON_MESSAGES.send_failed,
      };
    }

    return {
      sent: true,
      recipients: mailResult.recipients,
      message: `Путевой лист отправлен на ${driverEmail}.`,
    };
  } catch (error) {
    console.error('[waybill-email] Ошибка отправки путевого листа:', error);
    return {
      sent: false,
      reason: 'send_failed',
      message: REASON_MESSAGES.send_failed,
    };
  }
}

/** @deprecated используйте sendWaybillEmail */
export function queueWaybillEmail(waybillId) {
  setImmediate(() => {
    sendWaybillEmail(waybillId).catch((error) => {
      console.error('[waybill-email] Фоновая отправка:', error);
    });
  });
}

export async function getSmtpStatus() {
  return {
    configured: isSmtpConfigured(),
    message: isSmtpConfigured()
      ? 'SMTP настроен — путевые листы можно отправлять на e-mail водителя.'
      : REASON_MESSAGES.smtp_not_configured,
  };
}
