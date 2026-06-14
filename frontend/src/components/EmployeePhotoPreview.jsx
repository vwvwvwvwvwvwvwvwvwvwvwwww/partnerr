import { fileToDataUrl } from '../utils/image';

const roleLabels = {
  agronomist: 'Агроном',
  mechanic: 'Механик',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
  admin: 'Администратор',
};

function PlaceholderIllustration() {
  return (
    <svg viewBox="0 0 320 220">
      <circle cx="160" cy="76" r="38" fill="#d7e5d2" />
      <path d="M88 196 C94 146, 124 122, 160 122 C196 122, 226 146, 232 196" fill="#c2d6b8" />
      <rect x="92" y="172" width="136" height="12" rx="6" fill="#93ae89" opacity="0.6" />
    </svg>
  );
}

export default function EmployeePhotoPreview({ fullName, role, photoUrl, onPhotoChange }) {
  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      onPhotoChange(dataUrl);
    } catch (error) {
      console.error(error);
    }
  }

  function clearPreview() {
    onPhotoChange('');
  }

  return (
    <article className="card employee-preview">
      <div className="section-header">
        <div>
          <h2>Фото сотрудника</h2>
        </div>
      </div>

      <div className="employee-preview__frame">
        {photoUrl ? (
          <img alt={fullName || 'Фото сотрудника'} className="employee-preview__photo" src={photoUrl} />
        ) : (
          <div className="employee-preview__placeholder">
            <PlaceholderIllustration />
          </div>
        )}
      </div>

      <div className="employee-preview__meta">
        <strong>{fullName || 'Новый сотрудник'}</strong>
        <span>{roleLabels[role] ?? 'Роль в системе не выбрана'}</span>
        <span>{photoUrl ? 'Фото выбрано и будет сохранено в карточке сотрудника' : 'Можно загрузить фото или оставить карточку без изображения'}</span>
      </div>

      <div className="employee-preview__actions">
        <label className="button button--secondary employee-preview__upload">
          Загрузить фото
          <input accept="image/*" onChange={handleFileChange} type="file" />
        </label>
        <button className="button button--ghost" onClick={clearPreview} type="button">
          Без фото
        </button>
      </div>
    </article>
  );
}
