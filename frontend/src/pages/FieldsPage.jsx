import { useCallback, useEffect, useMemo, useState } from 'react';
import { cropsApi, fieldsApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import EntityModalContent from '../components/EntityModalContent';
import FieldMap from '../components/FieldMap';
import { calculatePolygonAreaSqMeters, convertSqMetersToHectares } from '../utils/geo';
import { validateForm } from '../utils/validation';

const statusLabels = {
  prepared: 'Подготовлено',
  sown: 'Засеяно',
  growing: 'Растёт',
  harvest: 'Уборка',
  fallow: 'Пар',
};

const columns = [
  { key: 'name', title: 'Поле' },
  { key: 'areaHa', title: 'Площадь, га' },
  {
    key: 'status',
    title: 'Статус',
    render: (value) => statusLabels[value] ?? value,
  },
  { key: 'soilType', title: 'Тип почвы' },
  { key: 'currentCropName', title: 'Культура' },
];

const detailsFields = [
  { key: 'name', label: 'Название' },
  { key: 'cadastralNumber', label: 'Кадастровый номер' },
  { key: 'areaHa', label: 'Площадь, га' },
  {
    key: 'status',
    label: 'Статус',
    render: (value) => statusLabels[value] ?? value,
  },
  { key: 'soilType', label: 'Тип почвы' },
  { key: 'currentCropName', label: 'Культура' },
];

const editFields = [
  { name: 'name', label: 'Название', required: true, minLength: 3 },
  { name: 'cadastralNumber', label: 'Кадастровый номер', maxLength: 50 },
  { name: 'areaHa', label: 'Площадь, га', type: 'number', min: 0.01, step: 0.01, required: true },
  {
    name: 'status',
    label: 'Статус',
    type: 'select',
    required: true,
    options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
  },
  { name: 'soilType', label: 'Тип почвы', maxLength: 100 },
  {
    name: 'currentCropId',
    label: 'Культура',
    type: 'select',
    allowEmpty: true,
    emptyLabel: 'Не выбрано',
  },
];

const initialForm = {
  name: '',
  cadastralNumber: '',
  areaHa: '',
  soilType: '',
  status: 'prepared',
  currentCropId: '',
};

function buildPolygonGeometry(draftPoints) {
  if (draftPoints.length < 3) {
    return null;
  }

  const ring = draftPoints.map((point) => [point.lng, point.lat]);
  ring.push([ring[0][0], ring[0][1]]);

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

export default function FieldsPage() {
  const [rows, setRows] = useState([]);
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [draftPoints, setDraftPoints] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const editFieldsWithCrops = useMemo(
    () => [
      ...editFields.slice(0, 5),
      {
        ...editFields[5],
        options: crops.map((crop) => ({ value: String(crop.id), label: crop.name })),
      },
    ],
    [crops],
  );

  const mapFields = useMemo(() => {
    const preview =
      draftPoints.length >= 3
        ? [
            {
              id: 'preview',
              name: form.name || 'Новый контур',
              areaHa: form.areaHa || '—',
              status: form.status,
              geometry: buildPolygonGeometry(draftPoints),
            },
          ]
        : [];

    return [...rows, ...preview];
  }, [rows, draftPoints, form.name, form.areaHa, form.status]);

  const syncAreaFromDraft = useCallback((points) => {
    if (points.length < 3) {
      return;
    }

    const areaSqM = calculatePolygonAreaSqMeters(points);
    const areaHa = convertSqMetersToHectares(areaSqM);
    setForm((prev) => ({ ...prev, areaHa: areaHa.toFixed(2) }));
  }, []);

  const loadData = useCallback(async () => {
    const [fieldsResponse, cropsResponse] = await Promise.all([fieldsApi.list(), cropsApi.list()]);
    setRows(fieldsResponse.data);
    setCrops(cropsResponse.data);
  }, []);

  useEffect(() => {
    let isActive = true;

    loadData()
      .catch((apiError) => {
        if (isActive) {
          setError(apiError.message);
        }
      });

    return () => {
      isActive = false;
    };
  }, [loadData]);

  function handleAddDraftPoint(point) {
    setSelectedFieldId(null);
    setDraftPoints((prev) => {
      const next = [...prev, point];
      syncAreaFromDraft(next);
      return next;
    });
  }

  function handleClearDraft() {
    setDraftPoints([]);
    setForm((prev) => ({ ...prev, areaHa: '' }));
  }

  function handleMoveDraftPoint(index, point) {
    setDraftPoints((prev) => {
      const next = prev.map((item, i) => (i === index ? point : item));
      syncAreaFromDraft(next);
      return next;
    });
  }

  function handleRemoveDraftPoint(index) {
    setDraftPoints((prev) => {
      const next = prev.filter((_, i) => i !== index);
      syncAreaFromDraft(next);
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const geometry = buildPolygonGeometry(draftPoints);

    if (!geometry) {
      setError('Укажите контур поля на карте (не менее 3 точек).');
      return;
    }

    const validation = validateForm({ ...form, areaHa: form.areaHa }, editFieldsWithCrops);

    if (validation.firstError) {
      setError(validation.firstError);
      return;
    }

    try {
      await fieldsApi.create({
        name: form.name,
        cadastralNumber: form.cadastralNumber || null,
        areaHa: Number(form.areaHa),
        soilType: form.soilType || null,
        status: form.status,
        currentCropId: form.currentCropId ? Number(form.currentCropId) : null,
        geometry,
      });

      setForm(initialForm);
      setDraftPoints([]);
      setSelectedFieldId(null);
      setSuccess('Поле успешно создано');
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateField(row, values) {
    setError('');
    setSuccess('');

    const geometry = row.geometry ?? buildPolygonGeometry(draftPoints);

    if (!geometry) {
      setError('Для поля нужна геометрия (контур на карте).');
      return;
    }

    await fieldsApi.update(row.id, {
      name: values.name,
      cadastralNumber: values.cadastralNumber || null,
      areaHa: Number(values.areaHa),
      soilType: values.soilType || null,
      status: values.status,
      currentCropId: values.currentCropId ? Number(values.currentCropId) : null,
      geometry,
    });

    setSuccess('Поле обновлено');
    await loadData();
  }

  return (
    <PageStack error={error} success={success}>
      <section className="content-grid content-grid--map">
        <FieldMap
          draftPoints={draftPoints}
          drawingContour={draftPoints.length > 0}
          fields={mapFields}
          onAddDraftPoint={handleAddDraftPoint}
          onRemoveDraftPoint={handleRemoveDraftPoint}
          onSelectField={setSelectedFieldId}
          selectedFieldId={selectedFieldId}
        />

        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новое поле</h2>
              <p className="section-header__hint">
                Кликайте по карте (в т.ч. поверх существующих полей) — ставятся точки контура. Минимум 3 точки.
                Площадь пересчитывается автоматически.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Название</span>
              <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="field">
              <span>Кадастровый номер</span>
              <input value={form.cadastralNumber} onChange={(e) => setForm((p) => ({ ...p, cadastralNumber: e.target.value }))} />
            </label>
            <label className="field">
              <span>Площадь, га</span>
              <input required type="number" min="0.01" step="0.01" value={form.areaHa} onChange={(e) => setForm((p) => ({ ...p, areaHa: e.target.value }))} />
            </label>
            <label className="field">
              <span>Статус</span>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Тип почвы</span>
              <input value={form.soilType} onChange={(e) => setForm((p) => ({ ...p, soilType: e.target.value }))} />
            </label>
            <label className="field">
              <span>Культура</span>
              <select value={form.currentCropId} onChange={(e) => setForm((p) => ({ ...p, currentCropId: e.target.value }))}>
                <option value="">Не выбрано</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="button-row">
            <button className="button" type="submit">Сохранить поле</button>
            {draftPoints.length > 0 ? (
              <button className="button button--secondary" onClick={handleClearDraft} type="button">
                Сбросить контур ({draftPoints.length} т.)
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Реестр полей</h2>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => row.name}
          onRowClick={(row) => setSelectedFieldId(row.id)}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFieldsWithCrops}
              initialValues={{
                name: row.name ?? '',
                cadastralNumber: row.cadastralNumber ?? '',
                areaHa: row.areaHa ?? '',
                soilType: row.soilType ?? '',
                status: row.status ?? 'prepared',
                currentCropId: row.currentCropId ? String(row.currentCropId) : '',
              }}
              onSave={async (values) => {
                await handleUpdateField(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку поля"
          rows={rows}
        />
      </section>
    </PageStack>
  );
}
