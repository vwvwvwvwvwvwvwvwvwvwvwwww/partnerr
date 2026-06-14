import { useCallback, useEffect, useState } from 'react';
import { machineryApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import EntityModalContent from '../components/EntityModalContent';
import { validateForm } from '../utils/validation';

const columns = [
  { key: 'inventoryNumber', title: 'Инв. номер' },
  { key: 'type', title: 'Тип' },
  { key: 'brand', title: 'Марка' },
  { key: 'model', title: 'Модель' },
  { key: 'engineHours', title: 'Моточасы' },
  { key: 'status', title: 'Статус' },
];

const typeLabels = {
  tractor: 'Трактор',
  combine: 'Комбайн',
  sprayer: 'Опрыскиватель',
  seeder: 'Сеялка',
  truck: 'Грузовик',
  other: 'Другое',
};

const statusLabels = {
  active: 'Активна',
  maintenance: 'ТО',
  repair: 'Ремонт',
  retired: 'Списана',
};

const detailsFields = [
  { key: 'inventoryNumber', label: 'Инвентарный номер' },
  {
    key: 'type',
    label: 'Тип',
    render: (value) => typeLabels[value] ?? value,
  },
  { key: 'brand', label: 'Марка' },
  { key: 'model', label: 'Модель' },
  { key: 'registrationNumber', label: 'Госномер' },
  { key: 'yearOfManufacture', label: 'Год выпуска' },
  { key: 'engineHours', label: 'Моточасы' },
  {
    key: 'status',
    label: 'Статус',
    render: (value) => statusLabels[value] ?? value,
  },
];

const currentYear = new Date().getFullYear();

const editFields = [
  { name: 'inventoryNumber', label: 'Инвентарный номер', required: true },
  {
    name: 'type',
    label: 'Тип',
    type: 'select',
    required: true,
    options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
  },
  { name: 'brand', label: 'Марка', required: true },
  { name: 'model', label: 'Модель', required: true },
  { name: 'registrationNumber', label: 'Госномер' },
  { name: 'yearOfManufacture', label: 'Год выпуска', type: 'number', min: 1950, max: currentYear + 1 },
  { name: 'engineHours', label: 'Моточасы', type: 'number', min: 0, step: 0.1 },
  {
    name: 'status',
    label: 'Статус',
    type: 'select',
    required: true,
    options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
  },
];

const initialForm = {
  inventoryNumber: '',
  type: 'tractor',
  brand: '',
  model: '',
  registrationNumber: '',
  yearOfManufacture: 2022,
  engineHours: 0,
  status: 'active',
};

export default function MachineryPage({ user }) {
  const canEditMachinery = user && ['admin', 'mechanic'].includes(user.role);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    const response = await machineryApi.list();
    setRows(response.data);
  }, []);

  useEffect(() => {
    let isActive = true;

    machineryApi.list()
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
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validation = validateForm(form, editFields);

    if (validation.firstError) {
      setError(validation.firstError);
      return;
    }

    try {
      await machineryApi.create({
        ...form,
        yearOfManufacture: Number(form.yearOfManufacture),
        engineHours: Number(form.engineHours),
      });

      setForm(initialForm);
      setSuccess('Техника добавлена');
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateMachinery(row, values) {
    setError('');
    setSuccess('');

    await machineryApi.update(row.id, {
      inventoryNumber: values.inventoryNumber,
      type: values.type,
      brand: values.brand,
      model: values.model,
      registrationNumber: values.registrationNumber || null,
      yearOfManufacture: values.yearOfManufacture ? Number(values.yearOfManufacture) : null,
      engineHours: Number(values.engineHours || 0),
      status: values.status,
    });

    setSuccess('Техника обновлена');
    await loadData();
  }

  return (
    <PageStack error={error} success={success}>
      <section className="page-header">
        <div>
          <span className="eyebrow">МТП и услуги</span>
          <h2>Реестр техники</h2>
        </div>
      </section>

      <section>
        {canEditMachinery ? (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Добавить единицу техники</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Инвентарный номер</span>
              <input
                required
                value={form.inventoryNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, inventoryNumber: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Тип</span>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="tractor">Трактор</option>
                <option value="combine">Комбайн</option>
                <option value="sprayer">Опрыскиватель</option>
                <option value="seeder">Сеялка</option>
                <option value="truck">Грузовик</option>
                <option value="other">Другое</option>
              </select>
            </label>

            <label className="field">
              <span>Марка</span>
              <input
                required
                value={form.brand}
                onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Модель</span>
              <input
                required
                value={form.model}
                onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Госномер</span>
              <input
                value={form.registrationNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, registrationNumber: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Год выпуска</span>
              <input
                type="number"
                value={form.yearOfManufacture}
                onChange={(event) => setForm((prev) => ({ ...prev, yearOfManufacture: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Моточасы</span>
              <input
                min="0"
                step="0.1"
                type="number"
                value={form.engineHours}
                onChange={(event) => setForm((prev) => ({ ...prev, engineHours: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Статус</span>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="active">Активна</option>
                <option value="maintenance">ТО</option>
                <option value="repair">Ремонт</option>
                <option value="retired">Списана</option>
              </select>
            </label>
          </div>

          <button className="button" type="submit">
            Добавить технику
          </button>
        </form>
        ) : (
          <div className="card form-card">
            <p className="field__hint" style={{ margin: 0 }}>
              Добавление и правка техники доступны механику и администратору. Агроном видит реестр в режиме просмотра.
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Реестр техники</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => `${row.brand} ${row.model}`}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
              readOnly={!canEditMachinery}
              initialValues={{
                inventoryNumber: row.inventoryNumber ?? '',
                type: row.type ?? 'tractor',
                brand: row.brand ?? '',
                model: row.model ?? '',
                registrationNumber: row.registrationNumber ?? '',
                yearOfManufacture: row.yearOfManufacture ?? '',
                engineHours: row.engineHours ?? 0,
                status: row.status ?? 'active',
              }}
              onSave={async (values) => {
                await handleUpdateMachinery(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку техники"
          rows={rows}
        />
      </section>
    </PageStack>
  );
}
