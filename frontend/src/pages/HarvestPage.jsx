import { useEffect, useMemo, useState } from 'react';
import { cropsApi, fieldsApi, harvestApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import EntityModalContent from '../components/EntityModalContent';
import { validateForm } from '../utils/validation';
import { hasEmailList } from '../utils/email-list';
import { buildWaybillDemoForm, nextWaybillNumber, todayIsoDate } from '../utils/form-quick';

const QUICK_WAYBILL_FIELDS = new Set([
  'documentNumber',
  'tripDate',
  'fieldId',
  'actionType',
  'seedType',
  'driverName',
  'driverEmail',
  'vehicleNumber',
]);

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

function formatTripDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString('ru-RU');
}

const columns = [
  { key: 'documentNumber', title: '№ листа' },
  { key: 'tripDate', title: 'Дата', render: (value) => formatTripDate(value) },
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
  { key: 'driverEmail', label: 'E-mail для уведомлений' },
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
  actionType: 'Уборка',
  seedType: 'Подсолнечник',
  driverName: '',
  driverEmail: '',
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

function formatEmailFeedback(email) {
  if (!email?.message) {
    return '';
  }

  return email.sent ? email.message : `E-mail: ${email.message}`;
}

export default function HarvestPage({ user }) {
  const canEditHarvest = user && ['admin', 'agronomist', 'storekeeper'].includes(user.role);
  const [rows, setRows] = useState([]);
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
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
      { name: 'driverEmail', label: 'E-mail для уведомлений', placeholder: 'voditel@mail.ru, buh@mail.ru — через запятую' },
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

  const quickCreateFields = useMemo(
    () => editFields.filter((field) => QUICK_WAYBILL_FIELDS.has(field.name)),
    [editFields],
  );

  const advancedEditFields = useMemo(
    () => editFields.filter((field) => !QUICK_WAYBILL_FIELDS.has(field.name)),
    [editFields],
  );

  useEffect(() => {
    if (!fields.length) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      tripDate: prev.tripDate || todayIsoDate(),
      documentNumber: prev.documentNumber || nextWaybillNumber(rows),
      fieldId: prev.fieldId || String(fields[0]?.id ?? ''),
    }));
  }, [fields, rows]);

  useEffect(() => {
    let isActive = true;

    async function loadPageData() {
      const errors = [];

      const [waybillsResult, driversResult, fieldsResult, cropsResult, smtpResult] = await Promise.allSettled([
        harvestApi.list(),
        harvestApi.listDrivers(),
        fieldsApi.list(),
        cropsApi.list(),
        harvestApi.emailStatus(),
      ]);

      if (!isActive) {
        return;
      }

      if (waybillsResult.status === 'fulfilled') {
        setRows(waybillsResult.value.data ?? []);
      } else {
        errors.push(waybillsResult.reason?.message ?? 'Не удалось загрузить журнал рейсов');
      }

      if (driversResult.status === 'fulfilled') {
        setDrivers(driversResult.value.data ?? []);
      }

      if (fieldsResult.status === 'fulfilled') {
        setFields(fieldsResult.value.data ?? []);
      } else {
        errors.push(fieldsResult.reason?.message ?? 'Не удалось загрузить поля');
      }

      if (cropsResult.status === 'fulfilled') {
        setCrops(cropsResult.value.data ?? []);
      } else {
        errors.push(cropsResult.reason?.message ?? 'Не удалось загрузить культуры');
      }

      if (smtpResult.status === 'fulfilled') {
        setSmtpStatus(smtpResult.value.data ?? null);
      }

      setError(errors.length > 0 ? errors.join('. ') : '');
    }

    loadPageData();

    return () => {
      isActive = false;
    };
  }, []);

  async function reload() {
    const response = await harvestApi.list();
    setRows(response.data);
  }

  async function handleSendWaybillEmail(row) {
    setError('');
    setSuccess('');
    setSendingEmailId(row.id);

    try {
      const response = await harvestApi.sendEmail(row.id);
      const email = response.email ?? response;

      if (email.sent) {
        setSuccess(email.message ?? 'Путевой лист отправлен на e-mail');
      } else {
        setError(email.message ?? 'Не удалось отправить путевой лист на e-mail');
      }
    } catch (apiError) {
      setError(apiError.message ?? 'Не удалось отправить путевой лист на e-mail');
    } finally {
      setSendingEmailId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validation = validateForm(form, quickCreateFields);

    if (validation.firstError) {
      setError(validation.firstError);
      return;
    }

    try {
      const response = await harvestApi.create({
        documentNumber: form.documentNumber,
        shiftNumber: form.shiftNumber || null,
        fieldId: Number(form.fieldId),
        cropId: form.cropId ? Number(form.cropId) : null,
        actionType: form.actionType,
        seedType: form.seedType,
        driverName: form.driverName,
        driverEmail: form.driverEmail?.trim() || null,
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

      setForm({
        ...initialForm,
        tripDate: todayIsoDate(),
        documentNumber: nextWaybillNumber(rows.length ? rows : [{ documentNumber: form.documentNumber }]),
        fieldId: fields[0] ? String(fields[0].id) : '',
      });
      const emailNote = formatEmailFeedback(response.email);
      setSuccess(
        emailNote ? `Путевой лист сохранён. ${emailNote}` : 'Путевой лист сохранён',
      );
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
      driverEmail: values.driverEmail?.trim() || null,
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

  function fillDemoForm() {
    setForm(buildWaybillDemoForm({ fields, crops, rows }));
    setSuccess('Форма заполнена примером — проверьте и нажмите «Сохранить»');
    setError('');
  }

  const routeDuration = useMemo(
    () => calculateDurationHours(form.departureTime, form.returnTime),
    [form.departureTime, form.returnTime],
  );

  return (
    <PageStack error={error} success={success}>
      <section className="page-header">
        <div>
          <span className="eyebrow">Урожай и логистика</span>
          <h2>Логистика</h2>
        </div>
      </section>

      <section className="content-grid">
        {canEditHarvest ? (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новый путевой лист</h2>
              <p className="section-header__hint">
                Для демонстрации достаточно 8 полей ниже. Остальное — в блоке «Дополнительно» или кнопка «Заполнить примером».
              </p>
              {smtpStatus && !smtpStatus.configured ? (
                <p className="section-header__hint field__error" style={{ marginTop: '0.5rem' }}>
                  {smtpStatus.message}
                </p>
              ) : null}
            </div>
            <div className="button-row">
              <button className="button button--secondary" onClick={fillDemoForm} type="button">
                Заполнить примером
              </button>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>№ путевого листа *</span>
              <input required value={form.documentNumber} onChange={(event) => setForm((prev) => ({ ...prev, documentNumber: event.target.value }))} />
            </label>
            <label className="field">
              <span>Дата рейса *</span>
              <input required type="date" value={form.tripDate} onChange={(event) => setForm((prev) => ({ ...prev, tripDate: event.target.value }))} />
            </label>
            <label className="field">
              <span>Поле *</span>
              <select required value={form.fieldId} onChange={(event) => setForm((prev) => ({ ...prev, fieldId: event.target.value }))}>
                <option value="">Выберите поле</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>{field.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Вид работ *</span>
              <select value={form.actionType} onChange={(event) => setForm((prev) => ({ ...prev, actionType: event.target.value }))}>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Семена / культура *</span>
              <select value={form.seedType} onChange={(event) => setForm((prev) => ({ ...prev, seedType: event.target.value }))}>
                {seedOptions.map((seed) => (
                  <option key={seed} value={seed}>{seed}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Водитель *</span>
              <input
                required
                list="harvest-drivers"
                placeholder="Иванов Пётр Сергеевич"
                value={form.driverName}
                onChange={(event) => setForm((prev) => ({ ...prev, driverName: event.target.value }))}
              />
              <datalist id="harvest-drivers">
                {drivers.map((driver) => (
                  <option key={`${driver.driverName}-${driver.driverEmail}`} value={driver.driverName} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>E-mail (через запятую)</span>
              <input
                placeholder="voditel@mail.ru, buh@mail.ru"
                value={form.driverEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, driverEmail: event.target.value }))}
                onBlur={() => {
                  const match = drivers.find(
                    (d) => d.driverName?.trim().toLowerCase() === form.driverName.trim().toLowerCase(),
                  );
                  if (match?.driverEmail && !form.driverEmail) {
                    setForm((prev) => ({ ...prev, driverEmail: match.driverEmail }));
                  }
                }}
              />
            </label>
            <label className="field">
              <span>Гос. номер ТС *</span>
              <input required placeholder="К456МН56" value={form.vehicleNumber} onChange={(event) => setForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))} />
            </label>
          </div>

          <details className="form-details">
            <summary>Дополнительно (необязательно)</summary>
            <div className="form-grid form-details__grid">
            <label className="field">
              <span>Смена</span>
              <input value={form.shiftNumber} onChange={(event) => setForm((prev) => ({ ...prev, shiftNumber: event.target.value }))} />
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
              <span>Механизатор</span>
              <input value={form.mechanizatorName} onChange={(event) => setForm((prev) => ({ ...prev, mechanizatorName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Прицеп</span>
              <input value={form.trailerNumber} onChange={(event) => setForm((prev) => ({ ...prev, trailerNumber: event.target.value }))} />
            </label>
            <label className="field">
              <span>Трактор</span>
              <input value={form.tractorModel} onChange={(event) => setForm((prev) => ({ ...prev, tractorModel: event.target.value }))} />
            </label>
            <label className="field">
              <span>Оборудование</span>
              <input value={form.equipmentName} onChange={(event) => setForm((prev) => ({ ...prev, equipmentName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Выезд</span>
              <input type="time" value={form.departureTime} onChange={(event) => setForm((prev) => ({ ...prev, departureTime: event.target.value }))} />
            </label>
            <label className="field">
              <span>Возврат</span>
              <input type="time" value={form.returnTime} onChange={(event) => setForm((prev) => ({ ...prev, returnTime: event.target.value }))} />
            </label>
            <label className="field">
              <span>Объём, га</span>
              <input type="number" min="0" step="0.01" value={form.workVolumeHa} onChange={(event) => setForm((prev) => ({ ...prev, workVolumeHa: event.target.value }))} />
            </label>
            <label className="field">
              <span>Пробег, км</span>
              <input type="number" min="0" step="0.01" value={form.routeDistanceKm} onChange={(event) => setForm((prev) => ({ ...prev, routeDistanceKm: event.target.value }))} />
            </label>
            <label className="field">
              <span>Брутто, кг</span>
              <input type="number" min="0" step="0.01" value={form.grossWeightKg} onChange={(event) => setForm((prev) => ({ ...prev, grossWeightKg: event.target.value }))} />
            </label>
            <label className="field">
              <span>Тара, кг</span>
              <input type="number" min="0" step="0.01" value={form.tareWeightKg} onChange={(event) => setForm((prev) => ({ ...prev, tareWeightKg: event.target.value }))} />
            </label>
            <label className="field">
              <span>ГСМ, л</span>
              <input type="number" min="0" step="0.01" value={form.fuelActualLiters} onChange={(event) => setForm((prev) => ({ ...prev, fuelActualLiters: event.target.value }))} />
            </label>
            <label className="field">
              <span>Куда</span>
              <input value={form.destination} onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))} />
            </label>
            <label className="field">
              <span>Получатель</span>
              <input value={form.receiverName} onChange={(event) => setForm((prev) => ({ ...prev, receiverName: event.target.value }))} />
            </label>
            <label className="field field--full">
              <span>Примечание</span>
              <input value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </label>
            </div>
          </details>

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
              formFields={quickCreateFields}
              advancedFormFields={advancedEditFields}
              readOnly={!canEditHarvest}
              renderViewActions={
                canEditHarvest
                  ? () => (
                      <button
                        className="button button--secondary"
                        disabled={!hasEmailList(row.driverEmail) || sendingEmailId === row.id}
                        onClick={() => handleSendWaybillEmail(row)}
                        type="button"
                      >
                        {sendingEmailId === row.id ? 'Отправка…' : 'Отправить на e-mail'}
                      </button>
                    )
                  : undefined
              }
              initialValues={{
                documentNumber: row.documentNumber ?? '',
                shiftNumber: row.shiftNumber ?? '',
                fieldId: row.fieldId ? String(row.fieldId) : '',
                cropId: row.cropId ? String(row.cropId) : '',
                actionType: row.actionType ?? 'Посев',
                seedType: row.seedType ?? 'Подсолнечник',
                driverName: row.driverName ?? '',
                driverEmail: row.driverEmail ?? '',
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
    </PageStack>
  );
}
