import { useEffect, useMemo, useState } from 'react';
import { cropsApi, fieldsApi, harvestApi } from '../api/client';
import DataTable from '../components/DataTable';
import EntityModalContent from '../components/EntityModalContent';
import { validateForm } from '../utils/validation';

const actionOptions = [
  'Боронование',
  'Культивация',
  'Посев',
  'Уборка',
  'Глубокорыхление',
  'Опрыскивание',
  'Внесение удобрения',
];

const seedOptions = [
  'Гречиха',
  'Подсолнечник',
  'Нут',
  'Озимая пшеница',
];

const columns = [
  { key: 'documentNumber', title: '№ листа' },
  { key: 'tripDate', title: 'Дата' },
  { key: 'actionType', title: 'Действие' },
  { key: 'seedType', title: 'Семена' },
  { key: 'fieldName', title: 'Поле' },
  { key: 'driverName', title: 'Водитель' },
  { key: 'vehicleNumber', title: 'Транспорт' },
  { key: 'workVolumeHa', title: 'Объем, га', render: (value) => value ?? '—' },
  { key: 'fuelActualLiters', title: 'ГСМ, л', render: (value) => value ?? '—' },
];

const detailsFields = [
  { key: 'documentNumber', label: 'Номер путевого листа' },
  { key: 'shiftNumber', label: 'Смена' },
  { key: 'tripDate', label: 'Дата рейса' },
  { key: 'actionType', label: 'Вид работ' },
  { key: 'seedType', label: 'Семена' },
  { key: 'fieldName', label: 'Поле' },
  { key: 'cropName', label: 'Культура из справочника' },
  { key: 'driverName', label: 'Водитель' },
  { key: 'mechanizatorName', label: 'Механизатор' },
  { key: 'vehicleNumber', label: 'Транспорт' },
  { key: 'trailerNumber', label: 'Прицеп / полуприцеп' },
  { key: 'tractorModel', label: 'Трактор / тягач' },
  { key: 'equipmentName', label: 'Оборудование' },
  { key: 'departureTime', label: 'Время выезда' },
  { key: 'returnTime', label: 'Время возврата' },
  { key: 'workVolumeHa', label: 'Объем работ, га / т' },
  { key: 'routeDistanceKm', label: 'Пробег по маршруту, км' },
  { key: 'startOdometerKm', label: 'Одометр начало, км' },
  { key: 'endOdometerKm', label: 'Одометр конец, км' },
  { key: 'startEngineHours', label: 'Моточасы начало' },
  { key: 'endEngineHours', label: 'Моточасы конец' },
  { key: 'grossWeightKg', label: 'Брутто, кг' },
  { key: 'tareWeightKg', label: 'Тара, кг' },
  { key: 'netWeightKg', label: 'Нетто, кг' },
  { key: 'fuelIssuedLiters', label: 'Выдано ГСМ, л' },
  { key: 'fuelStartLiters', label: 'Остаток ГСМ на начало, л' },
  { key: 'fuelEndLiters', label: 'Остаток ГСМ на конец, л' },
  { key: 'fuelActualLiters', label: 'Фактический расход ГСМ, л' },
  { key: 'destination', label: 'Пункт назначения' },
  { key: 'receiverName', label: 'Получатель / склад' },
  { key: 'weatherConditions', label: 'Погодные условия' },
  { key: 'routeDescription', label: 'Маршрут / описание рейса' },
  { key: 'responsiblePerson', label: 'Ответственный' },
  { key: 'notes', label: 'Примечание' },
  {
    key: 'ticketPhotoUrl',
    label: 'Фото чека',
    render: (value) => (value ? <a href={value} rel="noreferrer" target="_blank">Открыть</a> : '—'),
  },
];

const initialForm = {
  documentNumber: '',
  shiftNumber: '',
  fieldId: '',
  cropId: '',
  actionType: 'Посев',
  seedType: 'Подсолнечник',
  driverName: '',
  mechanizatorName: '',
  vehicleNumber: '',
  trailerNumber: '',
  tractorModel: '',
  equipmentName: '',
  tripDate: '',
  departureTime: '',
  returnTime: '',
  workVolumeHa: '',
  routeDistanceKm: '',
  startOdometerKm: '',
  endOdometerKm: '',
  startEngineHours: '',
  endEngineHours: '',
  grossWeightKg: '',
  tareWeightKg: '',
  fuelIssuedLiters: '',
  fuelStartLiters: '',
  fuelEndLiters: '',
  fuelActualLiters: '',
  destination: '',
  receiverName: '',
  weatherConditions: '',
  routeDescription: '',
  responsiblePerson: '',
  notes: '',
  ticketPhotoUrl: '',
};

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function toNumberValue(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function calculateDurationHours(start, end) {
  if (!start || !end) {
    return 0;
  }

  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);

  if ([startHours, startMinutes, endHours, endMinutes].some((item) => Number.isNaN(item))) {
    return 0;
  }

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  const diffMinutes = Math.max(endTotal - startTotal, 0);

  return diffMinutes / 60;
}

export default function HarvestPage({ user }) {
  const canEditHarvest = user && ['admin', 'agronomist', 'storekeeper'].includes(user.role);
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const editFields = useMemo(
    () => [
      { name: 'documentNumber', label: 'Номер путевого листа', required: true, minLength: 2 },
      { name: 'shiftNumber', label: 'Смена' },
      {
        name: 'fieldId',
        label: 'Поле',
        type: 'select',
        required: true,
        options: fields.map((field) => ({ value: String(field.id), label: field.name })),
      },
      {
        name: 'actionType',
        label: 'Вид работ',
        type: 'select',
        required: true,
        options: actionOptions.map((value) => ({ value, label: value })),
      },
      {
        name: 'seedType',
        label: 'Семена',
        type: 'select',
        required: true,
        options: seedOptions.map((value) => ({ value, label: value })),
      },
      {
        name: 'cropId',
        label: 'Культура из справочника',
        type: 'select',
        allowEmpty: true,
        emptyLabel: 'Не выбрано',
        options: crops.map((crop) => ({ value: String(crop.id), label: crop.name })),
      },
      { name: 'driverName', label: 'Водитель', required: true, minLength: 3 },
      { name: 'mechanizatorName', label: 'Механизатор', minLength: 3 },
      { name: 'vehicleNumber', label: 'Транспорт', required: true, minLength: 2 },
      { name: 'trailerNumber', label: 'Прицеп / полуприцеп' },
      { name: 'tractorModel', label: 'Трактор / тягач' },
      { name: 'equipmentName', label: 'С/х машина / оборудование' },
      { name: 'tripDate', label: 'Дата рейса', type: 'date', required: true },
      { name: 'departureTime', label: 'Выезд', type: 'time' },
      {
        name: 'returnTime',
        label: 'Возврат',
        type: 'time',
        validate: (value, values) =>
          value && values.departureTime && value < values.departureTime
            ? 'Время возврата не может быть раньше времени выезда'
            : '',
      },
      { name: 'workVolumeHa', label: 'Объем работ, га / т', type: 'number', min: 0, step: 0.01 },
      { name: 'routeDistanceKm', label: 'Пробег по маршруту, км', type: 'number', min: 0, step: 0.01 },
      { name: 'startOdometerKm', label: 'Одометр начало, км', type: 'number', min: 0, step: 0.01 },
      {
        name: 'endOdometerKm',
        label: 'Одометр конец, км',
        type: 'number',
        min: 0,
        step: 0.01,
        validate: (value, values) =>
          value !== '' && values.startOdometerKm !== '' && Number(value) < Number(values.startOdometerKm)
            ? 'Одометр на конец не может быть меньше начального'
            : '',
      },
      { name: 'startEngineHours', label: 'Моточасы начало', type: 'number', min: 0, step: 0.01 },
      {
        name: 'endEngineHours',
        label: 'Моточасы конец',
        type: 'number',
        min: 0,
        step: 0.01,
        validate: (value, values) =>
          value !== '' && values.startEngineHours !== '' && Number(value) < Number(values.startEngineHours)
            ? 'Моточасы на конец не могут быть меньше начальных'
            : '',
      },
      { name: 'grossWeightKg', label: 'Брутто, кг', type: 'number', min: 0, step: 0.01 },
      {
        name: 'tareWeightKg',
        label: 'Тара, кг',
        type: 'number',
        min: 0,
        step: 0.01,
        validate: (value, values) =>
          value !== '' && values.grossWeightKg !== '' && Number(value) > Number(values.grossWeightKg)
            ? 'Тара не может быть больше брутто'
            : '',
      },
      { name: 'fuelIssuedLiters', label: 'Выдано ГСМ, л', type: 'number', min: 0, step: 0.01 },
      { name: 'fuelStartLiters', label: 'Остаток на начало, л', type: 'number', min: 0, step: 0.01 },
      { name: 'fuelEndLiters', label: 'Остаток на конец, л', type: 'number', min: 0, step: 0.01 },
      { name: 'fuelActualLiters', label: 'Фактический расход, л', type: 'number', min: 0, step: 0.01 },
      { name: 'destination', label: 'Пункт назначения' },
      { name: 'receiverName', label: 'Получатель / склад' },
      { name: 'weatherConditions', label: 'Погодные условия' },
      { name: 'responsiblePerson', label: 'Ответственный', minLength: 3 },
      { name: 'routeDescription', label: 'Маршрут / описание рейса', fullWidth: true, maxLength: 1000 },
      { name: 'notes', label: 'Примечание', fullWidth: true, maxLength: 1000 },
      { name: 'ticketPhotoUrl', label: 'Ссылка на фото чека', type: 'url', fullWidth: true },
    ],
    [crops, fields],
  );

  useEffect(() => {
    let isActive = true;

    Promise.all([harvestApi.list(), fieldsApi.list(), cropsApi.list()])
      .then(([waybillsResponse, fieldsResponse, cropsResponse]) => {
        if (!isActive) {
          return;
        }

        setRows(waybillsResponse.data);
        setFields(fieldsResponse.data);
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

  async function reload() {
    const response = await harvestApi.list();
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
      await harvestApi.create({
        documentNumber: form.documentNumber,
        shiftNumber: form.shiftNumber || null,
        fieldId: Number(form.fieldId),
        cropId: form.cropId ? Number(form.cropId) : null,
        actionType: form.actionType,
        seedType: form.seedType,
        driverName: form.driverName,
        mechanizatorName: form.mechanizatorName || null,
        vehicleNumber: form.vehicleNumber,
        trailerNumber: form.trailerNumber || null,
        tractorModel: form.tractorModel || null,
        equipmentName: form.equipmentName || null,
        tripDate: form.tripDate,
        departureTime: form.departureTime || null,
        returnTime: form.returnTime || null,
        workVolumeHa: toNumberOrNull(form.workVolumeHa),
        routeDistanceKm: toNumberOrNull(form.routeDistanceKm),
        startOdometerKm: toNumberOrNull(form.startOdometerKm),
        endOdometerKm: toNumberOrNull(form.endOdometerKm),
        startEngineHours: toNumberOrNull(form.startEngineHours),
        endEngineHours: toNumberOrNull(form.endEngineHours),
        grossWeightKg: toNumberOrNull(form.grossWeightKg),
        tareWeightKg: toNumberOrNull(form.tareWeightKg),
        fuelIssuedLiters: toNumberOrNull(form.fuelIssuedLiters),
        fuelStartLiters: toNumberOrNull(form.fuelStartLiters),
        fuelEndLiters: toNumberOrNull(form.fuelEndLiters),
        fuelActualLiters: toNumberOrNull(form.fuelActualLiters),
        destination: form.destination || null,
        receiverName: form.receiverName || null,
        weatherConditions: form.weatherConditions || null,
        routeDescription: form.routeDescription || null,
        responsiblePerson: form.responsiblePerson || null,
        notes: form.notes || null,
        ticketPhotoUrl: form.ticketPhotoUrl || null,
      });

      setForm(initialForm);
      setSuccess('Путевой лист сохранен');
      await reload();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateWaybill(row, values) {
    setError('');
    setSuccess('');

    await harvestApi.update(row.id, {
      documentNumber: values.documentNumber,
      shiftNumber: values.shiftNumber || null,
      fieldId: Number(values.fieldId),
      cropId: values.cropId ? Number(values.cropId) : null,
      actionType: values.actionType,
      seedType: values.seedType,
      driverName: values.driverName,
      mechanizatorName: values.mechanizatorName || null,
      vehicleNumber: values.vehicleNumber,
      trailerNumber: values.trailerNumber || null,
      tractorModel: values.tractorModel || null,
      equipmentName: values.equipmentName || null,
      tripDate: values.tripDate,
      departureTime: values.departureTime || null,
      returnTime: values.returnTime || null,
      workVolumeHa: toNumberOrNull(values.workVolumeHa),
      routeDistanceKm: toNumberOrNull(values.routeDistanceKm),
      startOdometerKm: toNumberOrNull(values.startOdometerKm),
      endOdometerKm: toNumberOrNull(values.endOdometerKm),
      startEngineHours: toNumberOrNull(values.startEngineHours),
      endEngineHours: toNumberOrNull(values.endEngineHours),
      grossWeightKg: toNumberOrNull(values.grossWeightKg),
      tareWeightKg: toNumberOrNull(values.tareWeightKg),
      fuelIssuedLiters: toNumberOrNull(values.fuelIssuedLiters),
      fuelStartLiters: toNumberOrNull(values.fuelStartLiters),
      fuelEndLiters: toNumberOrNull(values.fuelEndLiters),
      fuelActualLiters: toNumberOrNull(values.fuelActualLiters),
      destination: values.destination || null,
      receiverName: values.receiverName || null,
      weatherConditions: values.weatherConditions || null,
      routeDescription: values.routeDescription || null,
      responsiblePerson: values.responsiblePerson || null,
      notes: values.notes || null,
      ticketPhotoUrl: values.ticketPhotoUrl || null,
    });

    setSuccess('Путевой лист обновлен');
    await reload();
  }

  const netWeight = useMemo(() => {
    const gross = toNumberOrNull(form.grossWeightKg);
    const tare = toNumberOrNull(form.tareWeightKg);

    if (gross === null || tare === null) {
      return 0;
    }

    return Math.max(gross - tare, 0);
  }, [form.grossWeightKg, form.tareWeightKg]);

  const fuelActual = useMemo(() => {
    const explicitFuel = toNumberOrNull(form.fuelActualLiters);
    if (explicitFuel !== null) {
      return explicitFuel;
    }

    const issued = toNumberValue(form.fuelIssuedLiters);
    const start = toNumberValue(form.fuelStartLiters);
    const end = toNumberValue(form.fuelEndLiters);

    return Math.max(start + issued - end, 0);
  }, [form.fuelActualLiters, form.fuelEndLiters, form.fuelIssuedLiters, form.fuelStartLiters]);

  const routeDuration = useMemo(
    () => calculateDurationHours(form.departureTime, form.returnTime),
    [form.departureTime, form.returnTime],
  );

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="eyebrow">Урожай и логистика</span>
          <h2>Логистика</h2>
        </div>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      <section className="content-grid">
        {canEditHarvest ? (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новый путевой лист</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Номер путевого листа</span>
              <input required value={form.documentNumber} onChange={(event) => setForm((prev) => ({ ...prev, documentNumber: event.target.value }))} />
            </label>
            <label className="field">
              <span>Смена</span>
              <input value={form.shiftNumber} onChange={(event) => setForm((prev) => ({ ...prev, shiftNumber: event.target.value }))} />
            </label>
            <label className="field">
              <span>Поле</span>
              <select required value={form.fieldId} onChange={(event) => setForm((prev) => ({ ...prev, fieldId: event.target.value }))}>
                <option value="">Выберите поле</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Вид работ</span>
              <select value={form.actionType} onChange={(event) => setForm((prev) => ({ ...prev, actionType: event.target.value }))}>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Семена</span>
              <select value={form.seedType} onChange={(event) => setForm((prev) => ({ ...prev, seedType: event.target.value }))}>
                {seedOptions.map((seed) => (
                  <option key={seed} value={seed}>{seed}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Культура из справочника</span>
              <select value={form.cropId} onChange={(event) => setForm((prev) => ({ ...prev, cropId: event.target.value }))}>
                <option value="">Не выбрано</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Водитель</span>
              <input required value={form.driverName} onChange={(event) => setForm((prev) => ({ ...prev, driverName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Механизатор</span>
              <input value={form.mechanizatorName} onChange={(event) => setForm((prev) => ({ ...prev, mechanizatorName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Транспорт</span>
              <input required value={form.vehicleNumber} onChange={(event) => setForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))} />
            </label>
            <label className="field">
              <span>Прицеп / полуприцеп</span>
              <input value={form.trailerNumber} onChange={(event) => setForm((prev) => ({ ...prev, trailerNumber: event.target.value }))} />
            </label>
            <label className="field">
              <span>Трактор / тягач</span>
              <input value={form.tractorModel} onChange={(event) => setForm((prev) => ({ ...prev, tractorModel: event.target.value }))} />
            </label>
            <label className="field">
              <span>С/х машина / оборудование</span>
              <input value={form.equipmentName} onChange={(event) => setForm((prev) => ({ ...prev, equipmentName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Дата рейса</span>
              <input required type="date" value={form.tripDate} onChange={(event) => setForm((prev) => ({ ...prev, tripDate: event.target.value }))} />
            </label>
            <label className="field">
              <span>Время выезда</span>
              <input type="time" value={form.departureTime} onChange={(event) => setForm((prev) => ({ ...prev, departureTime: event.target.value }))} />
            </label>
            <label className="field">
              <span>Время возврата</span>
              <input type="time" value={form.returnTime} onChange={(event) => setForm((prev) => ({ ...prev, returnTime: event.target.value }))} />
            </label>
            <label className="field">
              <span>Объем работ, га / т</span>
              <input type="number" min="0" step="0.01" value={form.workVolumeHa} onChange={(event) => setForm((prev) => ({ ...prev, workVolumeHa: event.target.value }))} />
            </label>
            <label className="field">
              <span>Пробег по маршруту, км</span>
              <input type="number" min="0" step="0.01" value={form.routeDistanceKm} onChange={(event) => setForm((prev) => ({ ...prev, routeDistanceKm: event.target.value }))} />
            </label>
            <label className="field">
              <span>Одометр начало, км</span>
              <input type="number" min="0" step="0.01" value={form.startOdometerKm} onChange={(event) => setForm((prev) => ({ ...prev, startOdometerKm: event.target.value }))} />
            </label>
            <label className="field">
              <span>Одометр конец, км</span>
              <input type="number" min="0" step="0.01" value={form.endOdometerKm} onChange={(event) => setForm((prev) => ({ ...prev, endOdometerKm: event.target.value }))} />
            </label>
            <label className="field">
              <span>Моточасы начало</span>
              <input type="number" min="0" step="0.01" value={form.startEngineHours} onChange={(event) => setForm((prev) => ({ ...prev, startEngineHours: event.target.value }))} />
            </label>
            <label className="field">
              <span>Моточасы конец</span>
              <input type="number" min="0" step="0.01" value={form.endEngineHours} onChange={(event) => setForm((prev) => ({ ...prev, endEngineHours: event.target.value }))} />
            </label>
            <label className="field">
              <span>Пункт назначения</span>
              <input value={form.destination} onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))} />
            </label>
            <label className="field">
              <span>Получатель / склад</span>
              <input value={form.receiverName} onChange={(event) => setForm((prev) => ({ ...prev, receiverName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Погодные условия</span>
              <input value={form.weatherConditions} onChange={(event) => setForm((prev) => ({ ...prev, weatherConditions: event.target.value }))} />
            </label>
            <label className="field">
              <span>Ответственный</span>
              <input value={form.responsiblePerson} onChange={(event) => setForm((prev) => ({ ...prev, responsiblePerson: event.target.value }))} />
            </label>
            <label className="field">
              <span>Вес брутто, кг</span>
              <input type="number" min="0" step="0.01" value={form.grossWeightKg} onChange={(event) => setForm((prev) => ({ ...prev, grossWeightKg: event.target.value }))} />
            </label>
            <label className="field">
              <span>Тара, кг</span>
              <input type="number" min="0" step="0.01" value={form.tareWeightKg} onChange={(event) => setForm((prev) => ({ ...prev, tareWeightKg: event.target.value }))} />
            </label>
            <label className="field">
              <span>Выдано ГСМ, л</span>
              <input type="number" min="0" step="0.01" value={form.fuelIssuedLiters} onChange={(event) => setForm((prev) => ({ ...prev, fuelIssuedLiters: event.target.value }))} />
            </label>
            <label className="field">
              <span>Остаток ГСМ на начало, л</span>
              <input type="number" min="0" step="0.01" value={form.fuelStartLiters} onChange={(event) => setForm((prev) => ({ ...prev, fuelStartLiters: event.target.value }))} />
            </label>
            <label className="field">
              <span>Остаток ГСМ на конец, л</span>
              <input type="number" min="0" step="0.01" value={form.fuelEndLiters} onChange={(event) => setForm((prev) => ({ ...prev, fuelEndLiters: event.target.value }))} />
            </label>
            <label className="field">
              <span>Фактический расход ГСМ, л</span>
              <input type="number" min="0" step="0.01" value={form.fuelActualLiters} onChange={(event) => setForm((prev) => ({ ...prev, fuelActualLiters: event.target.value }))} />
            </label>
            <label className="field field--full">
              <span>Маршрут / описание рейса</span>
              <input value={form.routeDescription} onChange={(event) => setForm((prev) => ({ ...prev, routeDescription: event.target.value }))} />
            </label>
            <label className="field field--full">
              <span>Примечание</span>
              <input value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </label>
            <label className="field field--full">
              <span>Ссылка на фото чека</span>
              <input value={form.ticketPhotoUrl} onChange={(event) => setForm((prev) => ({ ...prev, ticketPhotoUrl: event.target.value }))} />
            </label>
          </div>

          <button className="button" type="submit">Сохранить рейс</button>
        </form>
        ) : (
          <div className="card form-card">
            <p className="field__hint" style={{ margin: 0 }}>
              Добавление и изменение путевых листов доступны агроному, кладовщику и администратору. У вас режим просмотра журнала.
            </p>
          </div>
        )}

        {canEditHarvest ? (
        <section className="card info-card">
          <div className="section-header">
            <div>
              <h2>Вес</h2>
            </div>
          </div>
          <div className="stats-grid stats-grid--compact">
            <div className="stat-card">
              <span className="stat-card__title">Брутто</span>
              <strong className="stat-card__value">{toNumberValue(form.grossWeightKg).toFixed(0)} кг</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__title">Нетто</span>
              <strong className="stat-card__value">{netWeight.toFixed(0)} кг</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__title">ГСМ</span>
              <strong className="stat-card__value">{fuelActual.toFixed(2)} л</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__title">В рейсе</span>
              <strong className="stat-card__value">{routeDuration.toFixed(2)} ч</strong>
            </div>
          </div>
        </section>
        ) : null}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Журнал рейсов</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => `Рейс ${row.tripDate}`}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
              readOnly={!canEditHarvest}
              initialValues={{
                documentNumber: row.documentNumber ?? '',
                shiftNumber: row.shiftNumber ?? '',
                fieldId: row.fieldId ? String(row.fieldId) : '',
                cropId: row.cropId ? String(row.cropId) : '',
                actionType: row.actionType ?? 'Посев',
                seedType: row.seedType ?? 'Подсолнечник',
                driverName: row.driverName ?? '',
                mechanizatorName: row.mechanizatorName ?? '',
                vehicleNumber: row.vehicleNumber ?? '',
                trailerNumber: row.trailerNumber ?? '',
                tractorModel: row.tractorModel ?? '',
                equipmentName: row.equipmentName ?? '',
                tripDate: row.tripDate ?? '',
                departureTime: row.departureTime ?? '',
                returnTime: row.returnTime ?? '',
                workVolumeHa: row.workVolumeHa ?? '',
                routeDistanceKm: row.routeDistanceKm ?? '',
                startOdometerKm: row.startOdometerKm ?? '',
                endOdometerKm: row.endOdometerKm ?? '',
                startEngineHours: row.startEngineHours ?? '',
                endEngineHours: row.endEngineHours ?? '',
                destination: row.destination ?? '',
                receiverName: row.receiverName ?? '',
                weatherConditions: row.weatherConditions ?? '',
                responsiblePerson: row.responsiblePerson ?? '',
                grossWeightKg: row.grossWeightKg ?? '',
                tareWeightKg: row.tareWeightKg ?? '',
                fuelIssuedLiters: row.fuelIssuedLiters ?? '',
                fuelStartLiters: row.fuelStartLiters ?? '',
                fuelEndLiters: row.fuelEndLiters ?? '',
                fuelActualLiters: row.fuelActualLiters ?? '',
                routeDescription: row.routeDescription ?? '',
                notes: row.notes ?? '',
                ticketPhotoUrl: row.ticketPhotoUrl ?? '',
              }}
              onSave={async (values) => {
                await handleUpdateWaybill(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку рейса"
          rows={rows}
        />
      </section>
    </div>
  );
}
