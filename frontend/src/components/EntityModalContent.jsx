import { useState } from 'react';
import AlertMessage from './AlertMessage';
import { fileToDataUrl } from '../utils/image';
import { validateForm } from '../utils/validation';

function renderField(field, value, onChange) {
  if (field.type === 'image') {
    return (
      <div className="image-field">
        <div className="image-field__preview">
          {value ? (
            <img alt={field.previewAlt ?? 'Загруженное изображение'} className="image-field__image" src={value} />
          ) : (
            <div className="image-field__empty">Фото не загружено</div>
          )}
        </div>

        <div className="button-row">
          <label className="button button--secondary image-field__upload">
            Загрузить фото
            <input
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                try {
                  const dataUrl = await fileToDataUrl(file);
                  onChange(field.name, dataUrl);
                } catch (error) {
                  console.error(error);
                }
              }}
              type="file"
            />
          </label>

          {value ? (
            <button className="button button--ghost" onClick={() => onChange(field.name, '')} type="button">
              Удалить фото
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <select
        maxLength={field.maxLength}
        minLength={field.minLength}
        required={field.required}
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
      >
        {field.allowEmpty ? <option value="">{field.emptyLabel ?? 'Не выбрано'}</option> : null}
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      max={field.max}
      maxLength={field.maxLength}
      min={field.min}
      minLength={field.minLength}
      pattern={field.pattern instanceof RegExp ? field.pattern.source : field.pattern}
      placeholder={field.placeholder}
      required={field.required}
      step={field.step}
      type={field.type ?? 'text'}
      value={value}
      onChange={(event) => onChange(field.name, event.target.value)}
    />
  );
}

export default function EntityModalContent({
  row,
  detailsFields,
  formFields,
  initialValues,
  onSave,
  saveLabel = 'Сохранить изменения',
  editLabel = 'Изменить данные',
  readOnly = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getDisplayValue(field) {
    const value = field.render ? field.render(row[field.key], row) : row[field.key];

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return value;
  }

  const primaryField = detailsFields[0];
  const secondaryFields = detailsFields.slice(1, 4);
  const titleValue = primaryField ? getDisplayValue(primaryField) : 'Карточка объекта';

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const validation = validateForm(form, formFields);

    if (validation.firstError) {
      setFieldErrors(validation.fieldErrors);
      setError(validation.firstError);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await onSave(form);
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  if (!isEditing) {
    return (
      <div className="entity-modal">
        <section className="entity-modal__hero">
          <div className="entity-modal__hero-content">
            <span className="eyebrow">Подробная информация</span>
            <h4>{titleValue}</h4>
          </div>

          {secondaryFields.length ? (
            <div className="entity-modal__chips">
              {secondaryFields.map((field) => (
                <span className="entity-modal__chip" key={field.key}>
                  {field.label}: {getDisplayValue(field)}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <dl className="details-grid">
          {detailsFields.map((field) => (
            <div className="details-item" key={field.key}>
              <dt>{field.label}</dt>
              <dd>{getDisplayValue(field)}</dd>
            </div>
          ))}
        </dl>

        <div className="button-row">
          {!readOnly ? (
            <button className="button" onClick={() => setIsEditing(true)} type="button">
              {editLabel}
            </button>
          ) : (
            <span className="field__hint">Редактирование недоступно для вашей роли</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="modal-form entity-modal" onSubmit={handleSubmit}>
      <section className="entity-modal__hero entity-modal__hero--edit">
        <div className="entity-modal__hero-content">
          <span className="eyebrow">Редактирование</span>
          <h4>{titleValue}</h4>
        </div>
      </section>

      <div className="form-grid">
        {formFields.map((field) => (
          <label
            className={`field ${field.fullWidth ? 'field--full' : ''} ${fieldErrors[field.name] ? 'field--error' : ''}`.trim()}
            key={field.name}
          >
            <span>{field.label}</span>
            {renderField(field, form[field.name] ?? '', handleChange)}
            {fieldErrors[field.name] ? <span className="field__error">{fieldErrors[field.name]}</span> : null}
            {field.hint || field.placeholder ? <span className="field__hint">{field.hint ?? field.placeholder}</span> : null}
          </label>
        ))}
      </div>

      <AlertMessage variant="error">{error}</AlertMessage>

      <div className="button-row">
        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Сохранение...' : saveLabel}
        </button>
        <button
          className="button button--secondary"
          onClick={() => {
            setForm(initialValues);
            setError('');
            setFieldErrors({});
            setIsEditing(false);
          }}
          type="button"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
