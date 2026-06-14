import { useEffect, useState } from 'react';
import { employeesApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import EmployeePhotoPreview from '../components/EmployeePhotoPreview';
import EntityModalContent from '../components/EntityModalContent';
import { validateForm } from '../utils/validation';

const columns = [
  {
    key: 'photoUrl',
    title: 'Фото',
    render: (value, row) => (
      <div className="employee-avatar">
        {value ? (
          <img alt={row.fullName} className="employee-avatar__image" src={value} />
        ) : (
          <span className="employee-avatar__placeholder">{row.fullName?.trim()?.[0] ?? '—'}</span>
        )}
      </div>
    ),
  },
  { key: 'fullName', title: 'ФИО' },
  { key: 'username', title: 'Логин' },
  { key: 'role', title: 'Роль в системе' },
  { key: 'position', title: 'Должность' },
  { key: 'phone', title: 'Телефон' },
  {
    key: 'isActive',
    title: 'Статус',
    render: (value) => (value ? 'Активен' : 'Отключен'),
  },
];

const roleLabels = {
  agronomist: 'Агроном',
  mechanic: 'Механик',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
  admin: 'Администратор',
  driver: 'Водитель',
};

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU').format(date);
}

function normalizeDateInput(value) {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

const detailsFields = [
  { key: 'fullName', label: 'ФИО' },
  { key: 'username', label: 'Логин' },
  {
    key: 'role',
    label: 'Роль в системе',
    render: (value) => roleLabels[value] ?? value,
  },
  { key: 'position', label: 'Должность' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Телефон' },
  {
    key: 'hiredAt',
    label: 'Дата приема',
    render: (value) => formatDate(value),
  },
  {
    key: 'isActive',
    label: 'Статус',
    render: (value) => (value ? 'Активен' : 'Отключен'),
  },
  {
    key: 'photoUrl',
    label: 'Фото',
    render: (value, row) => (
      <div className="employee-avatar employee-avatar--detail">
        {value ? (
          <img alt={row.fullName} className="employee-avatar__image" src={value} />
        ) : (
          <span className="employee-avatar__placeholder">{row.fullName?.trim()?.[0] ?? '—'}</span>
        )}
      </div>
    ),
  },
];

const editFields = [
  { name: 'fullName', label: 'ФИО', required: true, minLength: 3 },
  {
    name: 'photoUrl',
    label: 'Фото сотрудника',
    type: 'image',
    fullWidth: true,
    hint: 'Можно загрузить новое фото или удалить текущее изображение.',
    previewAlt: 'Фото сотрудника',
  },
  { name: 'username', label: 'Логин', required: true, minLength: 3 },
  {
    name: 'password',
    label: 'Новый пароль',
    type: 'password',
    minLength: 10,
    placeholder: 'Оставьте пустым, чтобы не менять',
  },
  {
    name: 'role',
    label: 'Роль в системе',
    type: 'select',
    required: true,
    options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })),
  },
  { name: 'position', label: 'Должность' },
  { name: 'email', label: 'E-mail', type: 'email' },
  {
    name: 'phone',
    label: 'Телефон',
    pattern: /^[0-9+\-()\s]{6,30}$/,
    patternMessage: 'Телефон: используйте цифры, пробелы и символы + - ( )',
  },
  { name: 'hiredAt', label: 'Дата приема', type: 'date' },
  {
    name: 'isActive',
    label: 'Статус',
    type: 'select',
    required: true,
    options: [
      { value: 'true', label: 'Активен' },
      { value: 'false', label: 'Отключен' },
    ],
  },
];

const createFields = [
  { name: 'fullName', label: 'ФИО', required: true, minLength: 3 },
  { name: 'username', label: 'Логин', required: true, minLength: 3 },
  { name: 'password', label: 'Пароль', required: true, minLength: 10 },
  { name: 'role', label: 'Роль в системе', required: true, type: 'select' },
  { name: 'email', label: 'E-mail (для путевых листов)', type: 'email' },
  {
    name: 'phone',
    label: 'Телефон',
    pattern: /^[0-9+\-()\s]{6,30}$/,
    patternMessage: 'Телефон: используйте цифры, пробелы и символы + - ( )',
  },
  { name: 'hiredAt', label: 'Дата приема', type: 'date' },
];

const initialForm = {
  username: '',
  password: '',
  fullName: '',
  photoUrl: '',
  role: 'agronomist',
  email: '',
  position: '',
  phone: '',
  hiredAt: '',
};

export default function EmployeesPage({ user }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user.role !== 'admin') {
      return undefined;
    }

    let isActive = true;

    employeesApi.list()
      .then((response) => {
        if (isActive) {
          setRows(response.data);
        }
      })
      .catch((apiError) => {
        if (isActive) {
          setError(apiError.message);
        }
      });

    return () => {
      isActive = false;
    };
  }, [user.role]);

  async function reload() {
    const response = await employeesApi.list();
    setRows(response.data);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validation = validateForm(form, createFields);

    if (validation.firstError) {
      setError(validation.firstError);
      return;
    }

    try {
      await employeesApi.create({
        ...form,
        hiredAt: form.hiredAt || null,
        photoUrl: form.photoUrl || null,
      });

      setForm(initialForm);
      setSuccess('Сотрудник добавлен');
      await reload();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateEmployee(row, values) {
    setError('');
    setSuccess('');

    await employeesApi.update(row.id, {
      username: values.username,
      password: values.password || null,
      fullName: values.fullName,
      role: values.role,
      email: values.email?.trim() || null,
      position: values.position || null,
      phone: values.phone || null,
      hiredAt: values.hiredAt || null,
      photoUrl: values.photoUrl || null,
      isActive: values.isActive === 'true',
    });

    setSuccess('Сотрудник обновлен');
    await reload();
  }

  if (user.role !== 'admin') {
    return (
      <PageStack error="У вашей учетной записи нет прав на управление сотрудниками.">
        <section className="page-header">
          <div>
            <span className="eyebrow">Сотрудники</span>
            <h2>Сотрудники</h2>
          </div>
        </section>
      </PageStack>
    );
  }

  return (
    <PageStack error={error} success={success}>
      <section className="page-header">
        <div>
          <span className="eyebrow">Сотрудники</span>
          <h2>Сотрудники</h2>
        </div>
      </section>

      <section className="content-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новый сотрудник</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>ФИО</span>
              <input required value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
            </label>

            <label className="field">
              <span>Логин</span>
              <input required value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
            </label>

            <label className="field">
              <span>Пароль</span>
              <input required minLength="8" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
            </label>

            <label className="field">
              <span>Роль в системе</span>
              <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
                <option value="agronomist">Агроном</option>
                <option value="mechanic">Механик</option>
                <option value="storekeeper">Кладовщик</option>
                <option value="accountant">Бухгалтер</option>
                <option value="admin">Администратор</option>
                <option value="driver">Водитель</option>
              </select>
            </label>

            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Должность</span>
              <input value={form.position} onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))} />
            </label>

            <label className="field">
              <span>Телефон</span>
              <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </label>

            <label className="field">
              <span>Дата приема</span>
              <input type="date" value={form.hiredAt} onChange={(event) => setForm((prev) => ({ ...prev, hiredAt: event.target.value }))} />
            </label>
          </div>

          <button className="button" type="submit">Добавить сотрудника</button>
        </form>

        <EmployeePhotoPreview
          fullName={form.fullName}
          onPhotoChange={(photoUrl) => setForm((prev) => ({ ...prev, photoUrl }))}
          photoUrl={form.photoUrl}
          role={form.role}
        />
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Штат предприятия</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => row.fullName}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
              initialValues={{
                fullName: row.fullName ?? '',
                photoUrl: row.photoUrl ?? '',
                username: row.username ?? '',
                password: '',
                role: row.role ?? 'agronomist',
                email: row.email ?? '',
                position: row.position ?? '',
                phone: row.phone ?? '',
                hiredAt: normalizeDateInput(row.hiredAt),
                isActive: String(Boolean(row.isActive)),
              }}
              onSave={async (values) => {
                await handleUpdateEmployee(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку сотрудника"
          rows={rows}
        />
      </section>
    </PageStack>
  );
}
