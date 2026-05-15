import { useCallback, useEffect, useMemo, useState } from 'react';
import { cropsApi, fieldsApi } from '../api/client';
import DataTable from '../components/DataTable';
import EntityModalContent from '../components/EntityModalContent';
import FieldMap from '../components/FieldMap';
import { calculatePolygonAreaSqMeters, convertSqMetersToHectares } from '../utils/geo';
import { validateForm } from '../utils/validation';

const columns = [
  { key: 'name', title: 'Поле' },
  { key: 'areaHa', title: 'Площадь, га' },
  { key: 'status', title: 'Статус' },
  { key: 'soilType', title: 'Тип почвы' },
  { key: 'currentCropName', title: 'Культура' },
];

const statusLabels = {
  prepared: 'Подготовлено',
  sown: 'Посеяно',
  growing: 'Вегетация',
  harvest: 'Уборка',
  fallow: 'Пар',
};

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
  { key: 'currentCropName', label: 'Текущая культура' },
];

const initialForm = {
  name: '',
  cadastralNumber: '',
  soilType: 'Чернозем',
  status: 'prepared',
  currentCropId: '',
};

const locationFilters = [
  { key: 'sadovy', label: 'Садовый' },
  { key: 'filippovka', label: 'Филипповка' },
  { key: 'yapryntsevo', label: 'Япрынцево' },
];

const createFields = [
  { name: 'name', label: 'Название', required: true, minLength: 3 },
  { name: 'cadastralNumber', label: 'Кадастровый номер', maxLength: 50 },
  { name: 'soilType', label: 'Тип почвы', maxLength: 100 },
  { name: 'status', label: 'Статус', required: true, type: 'select' },
];

function geometryToDraftPoints(geometry) {
  if (!geometry) {
    return [];
  }

  let coordinates = [];

  if (geometry.type === 'Polygon') {
    coordinates = geometry.coordinates?.[0] ?? [];
  } else if (geometry.type === 'MultiPolygon') {
    coordinates = geometry.coordinates?.[0]?.[0] ?? [];
  }

  if (coordinates.length <= 1) {
    return [];
  }

  return coordinates
    .slice(0, -1)
    .map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }));
}

function buildPolygonFromPoints(points) {
  if (points.length < 3) {
    return null;
  }

  const coordinates = points.map(({ lat, lng }) => [lng, lat]);
  coordinates.push([points[0].lng, points[0].lat]);

  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

export default function FieldsPage() {
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [draftPoints, setDraftPoints] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [editingBoundaryFieldId, setEditingBoundaryFieldId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    const [fieldsResponse, cropsResponse] = await Promise.all([
      fieldsApi.list(),
      cropsApi.list(),
    ]);

    setFields(fieldsResponse.data);
    setCrops(cropsResponse.data);
  }, []);

  useEffect(() => {
    let isActive = true;

    Promise.all([fieldsApi.list(), cropsApi.list()])
      .then(([fieldsResponse, cropsResponse]) => {
        if (!isActive) {
          return;
        }

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

  const previewGeometry = useMemo(() => buildPolygonFromPoints(draftPoints), [draftPoints]);
  const previewAreaSqMeters = useMemo(() => calculatePolygonAreaSqMeters(draftPoints), [draftPoints]);
  const previewAreaHa = useMemo(
    () => Number(convertSqMetersToHectares(previewAreaSqMeters).toFixed(2)),
    [previewAreaSqMeters],
  );
  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId],
  );
  const seededLocationFields = useMemo(() => ({
    sadovy: fields.filter((field) => field.name?.startsWith('Садовый')),
    filippovka: fields.filter((field) => field.name?.startsWith('Филипповка')),
    yapryntsevo: fields.filter((field) => field.name?.startsWith('Япрынцево')),
  }), [fields]);
  const editFields = useMemo(
    () => [
      { name: 'name', label: 'Название', required: true, minLength: 3 },
      { name: 'cadastralNumber', label: 'Кадастровый номер', maxLength: 50 },
      { name: 'areaHa', label: 'Площадь, га', type: 'number', min: 0.1, step: 0.1, required: true },
      { name: 'soilType', label: 'Тип почвы', maxLength: 100 },
      {
        name: 'status',
        label: 'Статус',
        type: 'select',
        required: true,
        options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
      },
      {
        name: 'currentCropId',
        label: 'Культура',
        type: 'select',
        allowEmpty: true,
        emptyLabel: 'Не выбрано',
        options: crops.map((crop) => ({ value: String(crop.id), label: crop.name })),
      },
    ],
    [crops],
  );

  function handleClearContour() {
    setDraftPoints([]);
  }

  function handleRemoveDraftPoint(indexToRemove) {
    setDraftPoints((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  function handleMoveDraftPoint(pointIndex, nextPoint) {
    setDraftPoints((prev) => prev.map((point, index) => (index === pointIndex ? nextPoint : point)));
  }

  useEffect(() => {
    if (selectedFieldId || fields.length === 0) {
      return;
    }

    const firstSeededField = fields.find(
      (field) =>
        field.name?.startsWith('Садовый') ||
        field.name?.startsWith('Филипповка') ||
        field.name?.startsWith('Япрынцево'),
    );

    if (firstSeededField) {
      setSelectedFieldId(firstSeededField.id);
    }
  }, [fields, selectedFieldId]);

  function focusSeededLocation(locationKey) {
    const field = seededLocationFields[locationKey]?.[0];

    if (!field) {
      setError('Для этой локации поля еще не загружены в базу');
      return;
    }

    setError('');
    setSelectedFieldId(field.id);
  }

  function handleStartBoundaryEdit() {
    if (!selectedField) {
      setError('Сначала выберите поле в таблице или на карте');
      return;
    }

    const editablePoints = geometryToDraftPoints(selectedField.geometry);

    if (editablePoints.length < 3) {
      setError('У выбранного поля недостаточно точек для редактирования');
      return;
    }

    setError('');
    setSuccess('');
    setEditingBoundaryFieldId(selectedField.id);
    setDraftPoints(editablePoints);
  }

  function handleCancelBoundaryEdit() {
    setEditingBoundaryFieldId(null);
    setDraftPoints([]);
    setError('');
  }

  async function handleSaveBoundaryEdit() {
    if (!selectedField || editingBoundaryFieldId !== selectedField.id) {
      setError('Поле для редактирования не выбрано');
      return;
    }

    if (!previewGeometry || draftPoints.length < 3) {
      setError('Для сохранения границ нужно минимум 3 точки');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await fieldsApi.update(selectedField.id, {
        name: selectedField.name,
        cadastralNumber: selectedField.cadastralNumber || null,
        areaHa: previewAreaHa,
        soilType: selectedField.soilType || null,
        status: selectedField.status,
        currentCropId: selectedField.currentCropId ? Number(selectedField.currentCropId) : null,
        geometry: previewGeometry,
      });

      setEditingBoundaryFieldId(null);
      setDraftPoints([]);
      setSuccess('Границы поля обновлены');
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
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

    if (!previewGeometry) {
      setError('Отметьте минимум 3 точки на карте');
      return;
    }

    try {
      await fieldsApi.create({
        name: form.name,
        cadastralNumber: form.cadastralNumber || null,
        areaHa: previewAreaHa,
        soilType: form.soilType || null,
        status: form.status,
        currentCropId: form.currentCropId ? Number(form.currentCropId) : null,
        geometry: previewGeometry,
      });

      setForm(initialForm);
      setDraftPoints([]);
      setSelectedFieldId(null);
      setSuccess('Поле создано');
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateField(row, values) {
    setError('');
    setSuccess('');

    await fieldsApi.update(row.id, {
      name: values.name,
      cadastralNumber: values.cadastralNumber || null,
      areaHa: Number(values.areaHa),
      soilType: values.soilType || null,
      status: values.status,
      currentCropId: values.currentCropId ? Number(values.currentCropId) : null,
      geometry: row.geometry,
    });

    setSuccess('Поле обновлено');
    await loadData();
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="eyebrow">Агро-ГИС</span>
          <h2>Поля и ГИС</h2>
        </div>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Быстрый переход и границы</h2>
          </div>
        </div>

        <div className="button-row">
          {locationFilters.map((location) => (
            <button
              className="button button--secondary"
              key={location.key}
              onClick={() => focusSeededLocation(location.key)}
              type="button"
            >
              {location.label}
            </button>
          ))}
          <button className="button" onClick={handleStartBoundaryEdit} type="button">
            Редактировать границы
          </button>
          {editingBoundaryFieldId ? (
            <button className="button" onClick={handleSaveBoundaryEdit} type="button">
              Сохранить границы
            </button>
          ) : null}
          {editingBoundaryFieldId ? (
            <button className="button button--secondary" onClick={handleCancelBoundaryEdit} type="button">
              Отменить редактирование
            </button>
          ) : null}
        </div>
        {editingBoundaryFieldId ? (
          <div className="field-boundary-note">
            Режим редактирования включен: перетаскивайте точки на карте, нажимайте на точку для удаления и кликайте по карте для добавления новых.
          </div>
        ) : null}
      </section>

      <section className="content-grid content-grid--map">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Новое поле</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Название</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Кадастровый номер</span>
              <input
                value={form.cadastralNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, cadastralNumber: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Площадь, га</span>
              <input
                type="number"
                value={previewAreaHa || ''}
                readOnly
              />
              <small className="field__hint">
                {draftPoints.length >= 3
                  ? `${previewAreaSqMeters.toFixed(0)} кв. м рассчитывается автоматически по контуру`
                  : 'Площадь появится автоматически после выделения минимум 3 точек на карте'}
              </small>
            </label>

            <label className="field">
              <span>Тип почвы</span>
              <input
                value={form.soilType}
                onChange={(event) => setForm((prev) => ({ ...prev, soilType: event.target.value }))}
              />
            </label>

            <label className="field">
              <span>Статус</span>
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="prepared">Подготовлено</option>
                <option value="sown">Посеяно</option>
                <option value="growing">Вегетация</option>
                <option value="harvest">Уборка</option>
                <option value="fallow">Пар</option>
              </select>
            </label>

            <label className="field">
              <span>Культура</span>
              <select
                value={form.currentCropId}
                onChange={(event) => setForm((prev) => ({ ...prev, currentCropId: event.target.value }))}
              >
                <option value="">Не выбрано</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="button-row">
            <button className="button" type="submit">
              Сохранить поле
            </button>
            <button className="button button--secondary" onClick={handleClearContour} type="button">
              Очистить контур
            </button>
          </div>
        </form>

        <FieldMap
          contourMode={editingBoundaryFieldId ? 'edit' : 'create'}
          draftPoints={draftPoints}
          fields={[
            ...fields,
            ...(previewGeometry ? [{ id: 'preview', ...form, areaHa: previewAreaHa, geometry: previewGeometry }] : []),
          ]}
          onAddDraftPoint={(point) => setDraftPoints((prev) => [...prev, point])}
          onMoveDraftPoint={handleMoveDraftPoint}
          onRemoveDraftPoint={handleRemoveDraftPoint}
          onSelectField={setSelectedFieldId}
          selectedFieldId={selectedFieldId}
        />
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Реестр полей</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => `Поле: ${row.name}`}
          onRowClick={(row) => setSelectedFieldId(row.id)}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
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
          rows={fields}
        />
      </section>
    </div>
  );
}
