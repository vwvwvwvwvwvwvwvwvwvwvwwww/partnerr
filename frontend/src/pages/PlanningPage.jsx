import { useEffect, useMemo, useState } from 'react';
import { cropsApi, planningApi } from '../api/client';
import DataTable from '../components/DataTable';
import EntityModalContent from '../components/EntityModalContent';
import { validateForm } from '../utils/validation';

const columns = [
  { key: 'title', title: 'Технологическая карта' },
  { key: 'workName', title: 'Наименование работ' },
  { key: 'cropName', title: 'Культура' },
  { key: 'seasonYear', title: 'Сезон' },
  {
    key: 'workVolume',
    title: 'Объем',
    render: (value, row) => `${Number(value ?? 0).toFixed(2)} ${row.unit ?? ''}`.trim(),
  },
  { key: 'aggregatesCount', title: 'Агрегаты' },
];

const detailsFields = [
  { key: 'title', label: 'Название карты' },
  { key: 'workName', label: 'Наименование работ' },
  { key: 'cropName', label: 'Культура' },
  { key: 'unit', label: 'Единица измерения' },
  { key: 'workVolume', label: 'Объем работ' },
  { key: 'conversionCoefficient', label: 'Коэффициент перевода' },
  { key: 'equivalentAreaHa', label: 'Перевод в усл. эт. га' },
  { key: 'aggregateComposition', label: 'Состав агрегата' },
  { key: 'seasonYear', label: 'Сезон' },
  { key: 'areaHa', label: 'Площадь, га' },
  { key: 'plannedStartDate', label: 'Начало работ' },
  { key: 'plannedEndDate', label: 'Конец работ' },
  { key: 'aggregatesCount', label: 'Количество агрегатов' },
  { key: 'mechanizatorsCount', label: 'Механизаторов' },
  { key: 'workersCount', label: 'Рабочих' },
  { key: 'outputNorm', label: 'Норма выработки' },
  { key: 'normShiftsCount', label: 'Количество нормо-смен' },
  { key: 'laborCosts', label: 'Затраты труда' },
  { key: 'tariffRate', label: 'Тарифная ставка' },
  { key: 'tariffFund', label: 'Тарифный фонд' },
  { key: 'extraPay', label: 'Доплата' },
  { key: 'fuelRate', label: 'ГСМ на 1 га / 1 час, л' },
  { key: 'fuelTotalLiters', label: 'ГСМ на весь объем, л' },
  { key: 'seedsRequiredKg', label: 'Потребность в семенах, кг' },
  { key: 'fertilizerRequiredKg', label: 'Потребность в удобрениях, кг' },
  { key: 'notes', label: 'Комментарий' },
];

const initialForm = {
  title: '',
  workName: '',
  unit: 'га',
  workVolume: 100,
  conversionCoefficient: 1,
  equivalentAreaHa: 100,
  aggregateComposition: '',
  cropId: '',
  seasonYear: new Date().getFullYear(),
  areaHa: 100,
  plannedStartDate: '',
  plannedEndDate: '',
  aggregatesCount: 1,
  mechanizatorsCount: 1,
  workersCount: 0,
  outputNorm: 0,
  normShiftsCount: 0,
  laborCosts: 0,
  tariffRate: 0,
  tariffFund: 0,
  extraPay: 0,
  fuelRate: 0,
  fuelTotalLiters: 0,
  notes: '',
};

const currentYear = new Date().getFullYear();

export default function PlanningPage() {
  const [rows, setRows] = useState([]);
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isActive = true;

    Promise.all([planningApi.list(), cropsApi.list()])
      .then(([cardsResponse, cropsResponse]) => {
        if (!isActive) {
          return;
        }

        setRows(cardsResponse.data);
        setCrops(cropsResponse.data);
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

  const selectedCrop = useMemo(
    () => crops.find((crop) => crop.id === Number(form.cropId)),
    [crops, form.cropId],
  );
  const editFields = useMemo(
    () => [
      { name: 'title', label: 'Название карты', required: true, minLength: 3 },
      { name: 'workName', label: 'Наименование работ', required: true, minLength: 3 },
      { name: 'unit', label: 'Ед-ца изм-я', required: true, minLength: 1, placeholder: 'га, т, час' },
      { name: 'workVolume', label: 'Объем', type: 'number', min: 0, step: 0.1, required: true },
      { name: 'conversionCoefficient', label: 'Коэф. перевода в усл. эт. га', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'equivalentAreaHa', label: 'Усл. эт. га', type: 'number', min: 0, step: 0.1, required: true },
      { name: 'aggregateComposition', label: 'Состав агрегата / с/х машина', fullWidth: true, required: true, minLength: 3 },
      {
        name: 'cropId',
        label: 'Культура',
        type: 'select',
        required: true,
        options: crops.map((crop) => ({ value: String(crop.id), label: crop.name })),
      },
      { name: 'seasonYear', label: 'Сезон', type: 'number', min: 2000, max: currentYear + 5, required: true },
      { name: 'areaHa', label: 'Площадь, га', type: 'number', min: 0.1, step: 0.1, required: true },
      { name: 'plannedStartDate', label: 'Начало работ', type: 'date', required: true },
      {
        name: 'plannedEndDate',
        label: 'Конец работ',
        type: 'date',
        required: true,
        validate: (value, values) =>
          value && values.plannedStartDate && value < values.plannedStartDate
            ? 'Конец работ не может быть раньше даты начала'
            : '',
      },
      { name: 'aggregatesCount', label: 'Количество агрегатов', type: 'number', min: 0, step: 1, required: true },
      { name: 'mechanizatorsCount', label: 'Механизаторов', type: 'number', min: 0, step: 1, required: true },
      { name: 'workersCount', label: 'Рабочих', type: 'number', min: 0, step: 1, required: true },
      { name: 'outputNorm', label: 'Норма выработки, га / т', type: 'number', min: 0, step: 0.1, required: true },
      { name: 'normShiftsCount', label: 'Кол-во нормо-смен', type: 'number', min: 0, step: 0.1, required: true },
      { name: 'laborCosts', label: 'Затраты труда', type: 'number', min: 0, step: 0.1, required: true },
      { name: 'tariffRate', label: 'Тарифная ставка', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'tariffFund', label: 'Тарифный фонд', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'extraPay', label: 'Доплата', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'fuelRate', label: 'ГСМ на 1 га / 1 час, л', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'fuelTotalLiters', label: 'ГСМ на весь объем, л', type: 'number', min: 0, step: 0.01, required: true },
      { name: 'notes', label: 'Комментарий', fullWidth: true, maxLength: 1000 },
    ],
    [crops],
  );

  const seedsPreview = Number(form.areaHa || 0) * Number(selectedCrop?.defaultSeedRateKgHa ?? 0);
  const fertilizerPreview = Number(form.areaHa || 0) * Number(selectedCrop?.defaultFertilizerRateKgHa ?? 0);

  async function reload() {
    const response = await planningApi.list();
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
      await planningApi.create({
        title: form.title,
        workName: form.workName,
        unit: form.unit,
        workVolume: Number(form.workVolume),
        conversionCoefficient: Number(form.conversionCoefficient),
        equivalentAreaHa: Number(form.equivalentAreaHa),
        aggregateComposition: form.aggregateComposition,
        cropId: Number(form.cropId),
        seasonYear: Number(form.seasonYear),
        areaHa: Number(form.areaHa),
        plannedStartDate: form.plannedStartDate,
        plannedEndDate: form.plannedEndDate,
        aggregatesCount: Number(form.aggregatesCount),
        mechanizatorsCount: Number(form.mechanizatorsCount),
        workersCount: Number(form.workersCount),
        outputNorm: Number(form.outputNorm),
        normShiftsCount: Number(form.normShiftsCount),
        laborCosts: Number(form.laborCosts),
        tariffRate: Number(form.tariffRate),
        tariffFund: Number(form.tariffFund),
        extraPay: Number(form.extraPay),
        fuelRate: Number(form.fuelRate),
        fuelTotalLiters: Number(form.fuelTotalLiters),
        notes: form.notes || null,
      });

      setForm(initialForm);
      setSuccess('Технологическая карта создана');
      await reload();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateCard(row, values) {
    setError('');
    setSuccess('');

    await planningApi.update(row.id, {
      title: values.title,
      workName: values.workName,
      unit: values.unit,
      workVolume: Number(values.workVolume),
      conversionCoefficient: Number(values.conversionCoefficient),
      equivalentAreaHa: Number(values.equivalentAreaHa),
      aggregateComposition: values.aggregateComposition,
      cropId: Number(values.cropId),
      seasonYear: Number(values.seasonYear),
      areaHa: Number(values.areaHa),
      plannedStartDate: values.plannedStartDate,
      plannedEndDate: values.plannedEndDate,
      aggregatesCount: Number(values.aggregatesCount),
      mechanizatorsCount: Number(values.mechanizatorsCount),
      workersCount: Number(values.workersCount),
      outputNorm: Number(values.outputNorm),
      normShiftsCount: Number(values.normShiftsCount),
      laborCosts: Number(values.laborCosts),
      tariffRate: Number(values.tariffRate),
      tariffFund: Number(values.tariffFund),
      extraPay: Number(values.extraPay),
      fuelRate: Number(values.fuelRate),
      fuelTotalLiters: Number(values.fuelTotalLiters),
      notes: values.notes || null,
    });

    setSuccess('Технологическая карта обновлена');
    await reload();
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="eyebrow">Планирование</span>
          <h2>Технологические карты</h2>
        </div>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      <section className="content-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новая техкарта</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Название карты</span>
              <input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </label>

            <label className="field">
              <span>Наименование работ</span>
              <input required value={form.workName} onChange={(event) => setForm((prev) => ({ ...prev, workName: event.target.value }))} />
            </label>

            <label className="field">
              <span>Ед-ца изм-я</span>
              <input required value={form.unit} onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))} />
            </label>

            <label className="field">
              <span>Объем, га / т</span>
              <input type="number" min="0" step="0.1" value={form.workVolume} onChange={(event) => setForm((prev) => ({ ...prev, workVolume: event.target.value }))} />
            </label>

            <label className="field">
              <span>Коэф. перевода в усл. эт. га</span>
              <input type="number" min="0" step="0.01" value={form.conversionCoefficient} onChange={(event) => setForm((prev) => ({ ...prev, conversionCoefficient: event.target.value }))} />
            </label>

            <label className="field">
              <span>Перевод в усл. эт. га</span>
              <input type="number" min="0" step="0.1" value={form.equivalentAreaHa} onChange={(event) => setForm((prev) => ({ ...prev, equivalentAreaHa: event.target.value }))} />
            </label>

            <label className="field field--full">
              <span>Состав агрегата / с/х машина / оборудование</span>
              <input value={form.aggregateComposition} onChange={(event) => setForm((prev) => ({ ...prev, aggregateComposition: event.target.value }))} />
            </label>

            <label className="field">
              <span>Культура</span>
              <select required value={form.cropId} onChange={(event) => setForm((prev) => ({ ...prev, cropId: event.target.value }))}>
                <option value="">Выберите культуру</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Сезон</span>
              <input type="number" value={form.seasonYear} onChange={(event) => setForm((prev) => ({ ...prev, seasonYear: event.target.value }))} />
            </label>

            <label className="field">
              <span>Площадь, га</span>
              <input type="number" min="0.1" step="0.1" value={form.areaHa} onChange={(event) => setForm((prev) => ({ ...prev, areaHa: event.target.value }))} />
            </label>

            <label className="field">
              <span>Начало работ</span>
              <input required type="date" value={form.plannedStartDate} onChange={(event) => setForm((prev) => ({ ...prev, plannedStartDate: event.target.value }))} />
            </label>

            <label className="field">
              <span>Конец работ</span>
              <input required type="date" value={form.plannedEndDate} onChange={(event) => setForm((prev) => ({ ...prev, plannedEndDate: event.target.value }))} />
            </label>

            <label className="field">
              <span>Количество агрегатов</span>
              <input type="number" min="0" step="1" value={form.aggregatesCount} onChange={(event) => setForm((prev) => ({ ...prev, aggregatesCount: event.target.value }))} />
            </label>

            <label className="field">
              <span>Механизаторов</span>
              <input type="number" min="0" step="1" value={form.mechanizatorsCount} onChange={(event) => setForm((prev) => ({ ...prev, mechanizatorsCount: event.target.value }))} />
            </label>

            <label className="field">
              <span>Рабочих</span>
              <input type="number" min="0" step="1" value={form.workersCount} onChange={(event) => setForm((prev) => ({ ...prev, workersCount: event.target.value }))} />
            </label>

            <label className="field">
              <span>Норма выработки, га / т</span>
              <input type="number" min="0" step="0.1" value={form.outputNorm} onChange={(event) => setForm((prev) => ({ ...prev, outputNorm: event.target.value }))} />
            </label>

            <label className="field">
              <span>Кол-во нормо-смен</span>
              <input type="number" min="0" step="0.1" value={form.normShiftsCount} onChange={(event) => setForm((prev) => ({ ...prev, normShiftsCount: event.target.value }))} />
            </label>

            <label className="field">
              <span>Затраты труда</span>
              <input type="number" min="0" step="0.1" value={form.laborCosts} onChange={(event) => setForm((prev) => ({ ...prev, laborCosts: event.target.value }))} />
            </label>

            <label className="field">
              <span>Тарифная ставка</span>
              <input type="number" min="0" step="0.01" value={form.tariffRate} onChange={(event) => setForm((prev) => ({ ...prev, tariffRate: event.target.value }))} />
            </label>

            <label className="field">
              <span>Тарифный фонд</span>
              <input type="number" min="0" step="0.01" value={form.tariffFund} onChange={(event) => setForm((prev) => ({ ...prev, tariffFund: event.target.value }))} />
            </label>

            <label className="field">
              <span>Доплата</span>
              <input type="number" min="0" step="0.01" value={form.extraPay} onChange={(event) => setForm((prev) => ({ ...prev, extraPay: event.target.value }))} />
            </label>

            <label className="field">
              <span>ГСМ, л на 1 га / 1 час</span>
              <input type="number" min="0" step="0.01" value={form.fuelRate} onChange={(event) => setForm((prev) => ({ ...prev, fuelRate: event.target.value }))} />
            </label>

            <label className="field">
              <span>ГСМ на весь объем, л</span>
              <input type="number" min="0" step="0.01" value={form.fuelTotalLiters} onChange={(event) => setForm((prev) => ({ ...prev, fuelTotalLiters: event.target.value }))} />
            </label>

            <label className="field field--full">
              <span>Комментарий</span>
              <input value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </label>
          </div>

          <button className="button" type="submit">Сохранить техкарту</button>
        </form>

        <article className="card info-card">
          <div className="section-header">
            <div>
              <h2>Авторасчет</h2>
            </div>
          </div>
          <div className="stats-grid stats-grid--compact">
            <div className="stat-card">
              <span className="stat-card__title">Семена</span>
              <strong className="stat-card__value">{seedsPreview.toFixed(2)} кг</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__title">Удобрения</span>
              <strong className="stat-card__value">{fertilizerPreview.toFixed(2)} кг</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__title">ГСМ</span>
              <strong className="stat-card__value">{Number(form.fuelTotalLiters || 0).toFixed(2)} л</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__title">Тарифный фонд</span>
              <strong className="stat-card__value">{Number(form.tariffFund || 0).toFixed(2)} руб.</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Реестр технологических карт</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => row.title}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
              initialValues={{
                title: row.title ?? '',
                workName: row.workName ?? '',
                unit: row.unit ?? 'га',
                workVolume: row.workVolume ?? 0,
                conversionCoefficient: row.conversionCoefficient ?? 0,
                equivalentAreaHa: row.equivalentAreaHa ?? 0,
                aggregateComposition: row.aggregateComposition ?? '',
                cropId: row.cropId ? String(row.cropId) : '',
                seasonYear: row.seasonYear ?? new Date().getFullYear(),
                areaHa: row.areaHa ?? '',
                plannedStartDate: row.plannedStartDate ?? '',
                plannedEndDate: row.plannedEndDate ?? '',
                aggregatesCount: row.aggregatesCount ?? 0,
                mechanizatorsCount: row.mechanizatorsCount ?? 0,
                workersCount: row.workersCount ?? 0,
                outputNorm: row.outputNorm ?? 0,
                normShiftsCount: row.normShiftsCount ?? 0,
                laborCosts: row.laborCosts ?? 0,
                tariffRate: row.tariffRate ?? 0,
                tariffFund: row.tariffFund ?? 0,
                extraPay: row.extraPay ?? 0,
                fuelRate: row.fuelRate ?? 0,
                fuelTotalLiters: row.fuelTotalLiters ?? 0,
                notes: row.notes ?? '',
              }}
              onSave={async (values) => {
                await handleUpdateCard(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку технологической карты"
          rows={rows}
        />
      </section>
    </div>
  );
}
