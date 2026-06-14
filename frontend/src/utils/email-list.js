const EMAIL_SPLIT = /[,;\s]+/;

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

export function hasEmailList(raw) {
  return parseEmailList(raw).length > 0;
}
