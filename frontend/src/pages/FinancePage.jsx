import { useEffect, useState } from 'react';
import { financeApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import EntityModalContent from '../components/EntityModalContent';
import StatCard from '../components/StatCard';
import { validateForm } from '../utils/validation';
import { todayIsoDate } from '../utils/form-quick';

const financeCategoryPresets = [
  'Реализация пшеницы озимой',
  'Реализация подсолнечника',
  'ГСМ (дизель)',
  'Заработная плата',
  'Семена и удобрения',
  'Ремонт техники',
  'Субсидия АПК',
];

const columns = [
  { key: 'operationDate', title: 'Дата' },
  { key: 'entryType', title: 'Тип' },
  { key: 'category', title: 'Категория' },
  { key: 'referenceModule', title: 'Модуль' },
  {
    key: 'amount',
    title: 'Сумма',
    render: (value) => `${Number(value).toFixed(2)} руб.`,
  },
  { key: 'notes', title: 'Комментарий' },
];

const entryTypeLabels = {
  expense: 'Расход',
  income: 'Доход',
};

const moduleLabels = {
  fields: 'Поля',
  planning: 'Планирование',
  machinery: 'Техника',
  warehouse: 'Склад',
  harvest: 'Урожай',
  finance: 'Финансы',
  hr: 'Сотрудники',
  other: 'Другое',
};

const detailsFields = [
  { key: 'operationDate', label: 'Дата операции' },
  {
    key: 'entryType',
    label: 'Тип',
    render: (value) => entryTypeLabels[value] ?? value,
  },
  { key: 'category', label: 'Категория' },
  {
    key: 'amount',
    label: 'Сумма',
    render: (value) => `${Number(value).toFixed(2)} руб.`,
  },
  {
    key: 'referenceModule',
    label: 'Модуль-источник',
    render: (value) => moduleLabels[value] ?? value,
  },
  { key: 'notes', label: 'Комментарий' },
];

const editFields = [
  {
    name: 'entryType',
    label: 'Тип',
    type: 'select',
    required: true,
    options: Object.entries(entryTypeLabels).map(([value, label]) => ({ value, label })),
  },
  { name: 'category', label: 'Категория', required: true, minLength: 2 },
  { name: 'amount', label: 'Сумма', type: 'number', min: 0.01, step: 0.01, required: true },
  { name: 'operationDate', label: 'Дата операции', type: 'date', required: true },
  {
    name: 'referenceModule',
    label: 'Модуль-источник',
    type: 'select',
    required: true,
    options: Object.entries(moduleLabels).map(([value, label]) => ({ value, label })),
  },
  { name: 'notes', label: 'Комментарий', fullWidth: true, maxLength: 1000 },
];

const initialForm = {
  entryType: 'income',
  category: '',
  amount: '',
  operationDate: todayIsoDate(),
  referenceModule: 'harvest',
  notes: '',
};

export default function FinancePage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isActive = true;

    Promise.all([financeApi.list(), financeApi.summary()])
      .then(([entriesResponse, summaryResponse]) => {
        if (!isActive) {
          return;
        }

        setRows(entriesResponse.data);
        setSummary(summaryResponse.data);
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
    const [entriesResponse, summaryResponse] = await Promise.all([
      financeApi.list(),
      financeApi.summary(),
    ]);

    setRows(entriesResponse.data);
    setSummary(summaryResponse.data);
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
      await financeApi.create({
        entryType: form.entryType,
        category: form.category,
        amount: Number(form.amount),
        operationDate: form.operationDate,
        referenceModule: form.referenceModule,
        notes: form.notes || null,
      });

      setForm({
        ...initialForm,
        operationDate: todayIsoDate(),
      });
      setSuccess('Финансовая операция сохранена');
      await reload();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateFinanceEntry(row, values) {
    setError('');
    setSuccess('');

    await financeApi.update(row.id, {
      entryType: values.entryType,
      category: values.category,
      amount: Number(values.amount),
      operationDate: values.operationDate,
      referenceModule: values.referenceModule,
      notes: values.notes || null,
    });

    setSuccess('Финансовая операция обновлена');
    await reload();
  }

  return (
    <PageStack error={error} success={success}>
      <section className="page-header">
        <div>
          <span className="eyebrow">Аналитика</span>
          <h2>Финансы</h2>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="Доходы" value={summary ? `${summary.incomeTotal.toFixed(2)} руб.` : '...'} hint="суммарный приход" />
        <StatCard title="Расходы" value={summary ? `${summary.expenseTotal.toFixed(2)} руб.` : '...'} hint="суммарный расход" />
        <StatCard title="Баланс" value={summary ? `${summary.balance.toFixed(2)} руб.` : '...'} hint="доходы минус расходы" />
      </section>

      <section className="content-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новая операция</h2>
              <p className="section-header__hint">Дата подставляется автоматически. Категорию можно выбрать из списка.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Тип *</span>
              <select value={form.entryType} onChange={(event) => setForm((prev) => ({ ...prev, entryType: event.target.value }))}>
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
              </select>
            </label>
            <label className="field">
              <span>Категория *</span>
              <input required list="finance-categories" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
              <datalist id="finance-categories">
                {financeCategoryPresets.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Сумма, ₽ *</span>
              <input required type="number" min="0.01" step="0.01" placeholder="100000" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
            </label>
            <label className="field">
              <span>Дата *</span>
              <input required type="date" value={form.operationDate} onChange={(event) => setForm((prev) => ({ ...prev, operationDate: event.target.value }))} />
            </label>
            <label className="field field--full">
              <span>Комментарий</span>
              <input placeholder="Необязательно" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </label>
          </div>

          <button className="button" type="submit">Сохранить операцию</button>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Журнал финансовых операций</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => `${entryTypeLabels[row.entryType] ?? 'Операция'}: ${row.category}`}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
              initialValues={{
                entryType: row.entryType ?? 'expense',
                category: row.category ?? '',
                amount: row.amount ?? 0,
                operationDate: row.operationDate ?? '',
                referenceModule: row.referenceModule ?? 'warehouse',
                notes: row.notes ?? '',
              }}
              onSave={async (values) => {
                await handleUpdateFinanceEntry(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку финансовой операции"
          rows={rows}
        />
      </section>
    </PageStack>
  );
}
