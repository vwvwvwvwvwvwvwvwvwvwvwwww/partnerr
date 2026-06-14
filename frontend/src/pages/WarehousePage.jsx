import { useEffect, useState } from 'react';
import { warehouseApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import EntityModalContent from '../components/EntityModalContent';
import { validateForm } from '../utils/validation';

const columns = [
  { key: 'warehouseName', title: 'Склад' },
  { key: 'itemName', title: 'Позиция' },
  { key: 'category', title: 'Категория' },
  { key: 'batchNumber', title: 'Партия' },
  {
    key: 'quantity',
    title: 'Количество',
    render: (value, row) => `${value} ${row.unit}`,
  },
  { key: 'expiryDate', title: 'Срок годности' },
];

const categoryLabels = {
  seeds: 'Семена',
  fertilizers: 'Удобрения',
  szr: 'СЗР',
  parts: 'Запчасти',
  fuel: 'ГСМ',
  other: 'Другое',
};

const detailsFields = [
  { key: 'warehouseName', label: 'Склад' },
  { key: 'itemName', label: 'Позиция' },
  {
    key: 'category',
    label: 'Категория',
    render: (value) => categoryLabels[value] ?? value,
  },
  { key: 'batchNumber', label: 'Партия' },
  {
    key: 'quantity',
    label: 'Количество',
    render: (value, row) => `${value} ${row.unit ?? ''}`.trim(),
  },
  { key: 'supplierName', label: 'Поставщик' },
  { key: 'expiryDate', label: 'Срок годности' },
];

const editFields = [
  { name: 'warehouseName', label: 'Склад', required: true, minLength: 2 },
  { name: 'itemName', label: 'Позиция', required: true, minLength: 2 },
  {
    name: 'category',
    label: 'Категория',
    type: 'select',
    required: true,
    options: Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
  },
  { name: 'unit', label: 'Ед. изм.', required: true, minLength: 1 },
  { name: 'batchNumber', label: 'Партия' },
  { name: 'quantity', label: 'Количество', type: 'number', min: 0, step: 0.01, required: true },
  { name: 'expiryDate', label: 'Срок годности', type: 'date' },
  { name: 'supplierName', label: 'Поставщик', maxLength: 150 },
];

const initialForm = {
  warehouseName: 'Главный склад',
  itemName: '',
  category: 'seeds',
  unit: 'кг',
  batchNumber: '',
  quantity: 0,
  expiryDate: '',
  supplierName: '',
};

export default function WarehousePage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isActive = true;

    warehouseApi.list()
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

  async function reload() {
    const response = await warehouseApi.list();
    setRows(response.data);
  }

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
      await warehouseApi.create({
        ...form,
        quantity: Number(form.quantity),
        expiryDate: form.expiryDate || null,
        batchNumber: form.batchNumber || null,
        supplierName: form.supplierName || null,
      });

      setForm(initialForm);
      setSuccess('Позиция добавлена на склад');
      await reload();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateWarehouseItem(row, values) {
    setError('');
    setSuccess('');

    await warehouseApi.update(row.id, {
      warehouseName: values.warehouseName,
      itemName: values.itemName,
      category: values.category,
      unit: values.unit,
      batchNumber: values.batchNumber || null,
      quantity: Number(values.quantity),
      expiryDate: values.expiryDate || null,
      supplierName: values.supplierName || null,
    });

    setSuccess('Складская позиция обновлена');
    await reload();
  }

  return (
    <PageStack error={error} success={success}>
      <section className="page-header">
        <div>
          <span className="eyebrow">Склад и МТО</span>
          <h2>Склад</h2>
        </div>
      </section>

      <section className="content-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новая складская позиция</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Склад</span>
              <input value={form.warehouseName} onChange={(event) => setForm((prev) => ({ ...prev, warehouseName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Позиция</span>
              <input required value={form.itemName} onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Категория</span>
              <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                <option value="seeds">Семена</option>
                <option value="fertilizers">Удобрения</option>
                <option value="szr">СЗР</option>
                <option value="parts">Запчасти</option>
                <option value="fuel">ГСМ</option>
                <option value="other">Другое</option>
              </select>
            </label>
            <label className="field">
              <span>Ед. изм.</span>
              <input value={form.unit} onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))} />
            </label>
            <label className="field">
              <span>Партия</span>
              <input value={form.batchNumber} onChange={(event) => setForm((prev) => ({ ...prev, batchNumber: event.target.value }))} />
            </label>
            <label className="field">
              <span>Количество</span>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} />
            </label>
            <label className="field">
              <span>Срок годности</span>
              <input type="date" value={form.expiryDate} onChange={(event) => setForm((prev) => ({ ...prev, expiryDate: event.target.value }))} />
            </label>
            <label className="field">
              <span>Поставщик</span>
              <input value={form.supplierName} onChange={(event) => setForm((prev) => ({ ...prev, supplierName: event.target.value }))} />
            </label>
          </div>

          <button className="button" type="submit">Добавить на склад</button>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Остатки и партии</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => row.itemName}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
              initialValues={{
                warehouseName: row.warehouseName ?? '',
                itemName: row.itemName ?? '',
                category: row.category ?? 'seeds',
                unit: row.unit ?? 'кг',
                batchNumber: row.batchNumber ?? '',
                quantity: row.quantity ?? 0,
                expiryDate: row.expiryDate ?? '',
                supplierName: row.supplierName ?? '',
              }}
              onSave={async (values) => {
                await handleUpdateWarehouseItem(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку складской позиции"
          rows={rows}
        />
      </section>
    </PageStack>
  );
}
