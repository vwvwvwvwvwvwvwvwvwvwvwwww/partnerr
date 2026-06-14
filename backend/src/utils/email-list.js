import { z } from 'zod';

const EMAIL_SPLIT = /[,;\s]+/;

/** Разбор списка e-mail (запятая, точка с запятой, пробел). */
export function parseEmailList(raw) {
  if (raw === null || raw === undefined) {
    return [];
  }

  const text = String(raw).trim();
  if (!text) {
    return [];
  }

  return [...new Set(text.split(EMAIL_SPLIT).map((part) => part.trim()).filter(Boolean))];
}

export function isValidEmailAddress(email) {
  return z.string().email().safeParse(email).success;
}

export function normalizeEmailList(raw) {
  const list = parseEmailList(raw).filter(isValidEmailAddress);
  return list.length ? list.join(', ') : null;
}

export const multiEmailStringSchema = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .nullable()
  .refine(
    (val) => !val || parseEmailList(val).every(isValidEmailAddress),
    'Укажите корректные e-mail через запятую или точку с запятой',
  )
  .transform((val) => normalizeEmailList(val));
