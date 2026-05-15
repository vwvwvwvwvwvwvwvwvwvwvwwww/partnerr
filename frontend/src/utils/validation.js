const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function isEmptyValue(value) {
  return value === null || value === undefined || (typeof value === 'string' ? value.trim() === '' : value === '');
}

function getLabel(field) {
  return field.label ?? field.name ?? 'Поле';
}

function validateNumberField(field, value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return `${getLabel(field)}: введите корректное число`;
  }

  if (field.min !== undefined && numericValue < field.min) {
    return `${getLabel(field)}: значение не может быть меньше ${field.min}`;
  }

  if (field.max !== undefined && numericValue > field.max) {
    return `${getLabel(field)}: значение не может быть больше ${field.max}`;
  }

  return '';
}

function validateStringField(field, value) {
  const stringValue = String(value ?? '').trim();

  if (field.minLength !== undefined && stringValue.length < field.minLength) {
    return `${getLabel(field)}: минимум ${field.minLength} символа(ов)`;
  }

  if (field.maxLength !== undefined && stringValue.length > field.maxLength) {
    return `${getLabel(field)}: максимум ${field.maxLength} символа(ов)`;
  }

  if (field.pattern) {
    const pattern = field.pattern instanceof RegExp ? field.pattern : new RegExp(field.pattern);

    if (!pattern.test(stringValue)) {
      return field.patternMessage ?? `${getLabel(field)}: неверный формат`;
    }
  }

  if (field.type === 'date' && !DATE_PATTERN.test(stringValue)) {
    return `${getLabel(field)}: укажите корректную дату`;
  }

  if (field.type === 'time' && !TIME_PATTERN.test(stringValue)) {
    return `${getLabel(field)}: укажите корректное время`;
  }

  if (field.type === 'url') {
    try {
      new URL(stringValue);
    } catch {
      return `${getLabel(field)}: укажите корректную ссылку`;
    }
  }

  return '';
}

export function validateField(field, values) {
  const value = values[field.name];

  if (field.required && isEmptyValue(value)) {
    return `${getLabel(field)}: заполните это поле`;
  }

  if (!field.required && isEmptyValue(value)) {
    return '';
  }

  if (field.type === 'number') {
    return validateNumberField(field, value);
  }

  const stringError = validateStringField(field, value);

  if (stringError) {
    return stringError;
  }

  if (typeof field.validate === 'function') {
    return field.validate(value, values, field) ?? '';
  }

  return '';
}

export function validateForm(values, fields = []) {
  const fieldErrors = {};

  fields.forEach((field) => {
    const error = validateField(field, values);

    if (error) {
      fieldErrors[field.name] = error;
    }
  });

  return {
    fieldErrors,
    firstError: Object.values(fieldErrors)[0] ?? '',
  };
}
