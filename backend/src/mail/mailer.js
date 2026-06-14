import nodemailer from 'nodemailer';
import { env, isSmtpConfigured } from '../config/env.js';

let transporter;

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }

  return transporter;
}

/**
 * @param {{ to: string[], subject: string, text: string, attachments?: { filename: string, content: Buffer }[] }} options
 */
export async function sendMail(options) {
  const transport = getTransporter();

  if (!transport) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const to = [...new Set(options.to.filter(Boolean))];

  if (to.length === 0) {
    return { sent: false, reason: 'no_recipients' };
  }

  try {
    await transport.sendMail({
      from: env.SMTP_FROM,
      to: to.join(', '),
      subject: options.subject,
      text: options.text,
      attachments: options.attachments,
    });

    return { sent: true, recipients: to };
  } catch (error) {
    console.error('[mailer] sendMail failed:', error);
    return { sent: false, reason: 'send_failed', error };
  }
}
