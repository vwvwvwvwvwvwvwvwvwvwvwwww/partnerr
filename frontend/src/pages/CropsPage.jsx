import { useCallback, useEffect, useMemo, useState } from 'react';
import { cropsApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import EntityModalContent from '../components/EntityModalContent';
import StatCard from '../components/StatCard';
import { validateForm } from '../utils/validation';

const columns = [
  { key: 'name', title: 'Культура' },
  { key: 'category', title: 'Категория' },
  { key: 'defaultSeedRateKgHa', title: 'Норма семян, кг/га' },
  { key: 'defaultFertilizerRateKgHa', title: 'Норма удобрений, кг/га' },
];

const detailsFields = [
  { key: 'name', label: 'Название' },
  { key: 'category', label: 'Категория' },
  {
    key: 'defaultSeedRateKgHa',
    label: 'Норма семян, кг/га',
    render: (value) => (value === null || value === undefined ? '—' : `${value} кг/га`),
  },
  {
    key: 'defaultFertilizerRateKgHa',
    label: 'Норма удобрений, кг/га',
    render: (value) => (value === null || value === undefined ? '—' : `${value} кг/га`),
  },
];

const editFields = [
  { name: 'name', label: 'Название', required: true, minLength: 2 },
  { name: 'category', label: 'Категория', required: true, minLength: 2 },
  { name: 'defaultSeedRateKgHa', label: 'Семена, кг/га', type: 'number', min: 0, step: 0.1 },
  { name: 'defaultFertilizerRateKgHa', label: 'Удобрения, кг/га', type: 'number', min: 0, step: 0.1 },
];

const initialForm = {
  name: '',
  category: '',
  defaultSeedRateKgHa: 0,
  defaultFertilizerRateKgHa: 0,
};

function getNumberValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatRate(value) {
  return `${getNumberValue(value).toFixed(1)} кг/га`;
}

function buildCropProfile(crop) {
  const source = `${crop.name ?? ''} ${crop.category ?? ''}`.toLowerCase();
  const seedRate = getNumberValue(crop.defaultSeedRateKgHa);
  const fertilizerRate = getNumberValue(crop.defaultFertilizerRateKgHa);

  let direction = crop.category || 'Универсальная';
  if (source.includes('пшени') || source.includes('ячмен') || source.includes('рож') || source.includes('кукуруз')) {
    direction = 'Зерновая';
  } else if (source.includes('подсолне') || source.includes('рапс') || source.includes('соя')) {
    direction = 'Масличная';
  } else if (source.includes('люцер') || source.includes('силос') || source.includes('корм')) {
    direction = 'Кормовая';
  }

  let season = 'Сезон не указан';
  if (source.includes('озим')) {
    season = 'Озимая';
  } else if (source.includes('яров')) {
    season = 'Яровая';
  } else if (source.includes('подсолне') || source.includes('кукуруз') || source.includes('рапс')) {
    season = 'Весенний цикл';
  }

  let seeding = 'Низкая норма высева';
  if (seedRate >= 180) {
    seeding = 'Высокая норма высева';
  } else if (seedRate >= 80) {
    seeding = 'Средняя норма высева';
  }

  let nutrition = 'Базовое питание';
  if (fertilizerRate >= 150) {
    nutrition = 'Повышенное питание';
  } else if (fertilizerRate >= 60) {
    nutrition = 'Умеренное питание';
  }

  let focus = 'Стандартная позиция для производственного плана';
  if (source.includes('пшени')) {
    focus = 'Подходит для ключевых площадей и планирования валового сбора';
  } else if (source.includes('подсолне')) {
    focus = 'Важно контролировать севооборот и нагрузку на питание';
  } else if (source.includes('кукуруз')) {
    focus = 'Требует контроля влаги и точной нормы высева';
  } else if (source.includes('рапс')) {
    focus = 'Чувствительна к срокам работ и защите посевов';
  }

  return {
    direction,
    season,
    seeding,
    nutrition,
    focus,
    seedRate: formatRate(seedRate),
    fertilizerRate: formatRate(fertilizerRate),
  };
}

export default function CropsPage({ user }) {
  const canEditCrops = user && ['admin', 'agronomist'].includes(user.role);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const summary = useMemo(() => {
    const categories = new Map();
    let seedRateTotal = 0;
    let fertilizerRateTotal = 0;

    rows.forEach((row) => {
      const categoryName = row.category || 'Без категории';
      categories.set(categoryName, (categories.get(categoryName) ?? 0) + 1);
      seedRateTotal += getNumberValue(row.defaultSeedRateKgHa);
      fertilizerRateTotal += getNumberValue(row.defaultFertilizerRateKgHa);
    });

    const averageSeedRate = rows.length ? seedRateTotal / rows.length : 0;
    const averageFertilizerRate = rows.length ? fertilizerRateTotal / rows.length : 0;
    const topCategory = [...categories.entries()].sort((left, right) => right[1] - left[1])[0];

    return {
      categories,
      cropsCount: rows.length,
      categoriesCount: categories.size,
      averageSeedRate,
      averageFertilizerRate,
      topCategory: topCategory ? `${topCategory[0]} (${topCategory[1]})` : 'Пока нет данных',
    };
  }, [rows]);

  const activeCrop = useMemo(() => {
    const hasDraftData = form.name || form.category || Number(form.defaultSeedRateKgHa) > 0 || Number(form.defaultFertilizerRateKgHa) > 0;

    if (hasDraftData) {
      return form;
    }

    return rows[0] ?? initialForm;
  }, [form, rows]);

  const cropProfile = useMemo(() => buildCropProfile(activeCrop), [activeCrop]);

  const loadData = useCallback(async () => {
    const response = await cropsApi.list();
    setRows(response.data);
  }, []);

  useEffect(() => {
    let isActive = true;

    cropsApi.list()
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
      await cropsApi.create({
        name: form.name,
        category: form.category,
        defaultSeedRateKgHa: Number(form.defaultSeedRateKgHa),
        defaultFertilizerRateKgHa: Number(form.defaultFertilizerRateKgHa),
      });

      setForm(initialForm);
      setSuccess('Культура добавлена');
      await loadData();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleUpdateCrop(row, values) {
    setError('');
    setSuccess('');

    await cropsApi.update(row.id, {
      name: values.name,
      category: values.category,
      defaultSeedRateKgHa: values.defaultSeedRateKgHa === '' ? null : Number(values.defaultSeedRateKgHa),
      defaultFertilizerRateKgHa:
        values.defaultFertilizerRateKgHa === '' ? null : Number(values.defaultFertilizerRateKgHa),
    });

    setSuccess('Культура обновлена');
    await loadData();
  }

  return (
    <PageStack error={error} success={success}>
      <section className="page-header">
        <div>
          <span className="eyebrow">Культуры</span>
          <h2>Культуры</h2>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          hint="в справочнике культур"
          title="Всего культур"
          value={summary.cropsCount}
        />
        <StatCard
          hint="отдельных направлений"
          title="Категории"
          value={summary.categoriesCount}
        />
        <StatCard
          hint="среднее значение по всем культурам"
          title="Средняя норма семян"
          value={formatRate(summary.averageSeedRate)}
        />
        <StatCard
          hint="наиболее частая категория"
          title="Основная категория"
          value={summary.topCategory}
        />
      </section>

      <section>
        {canEditCrops ? (
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h2>Добавить культуру</h2>
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
              <span className="field__hint">Например: озимая пшеница, подсолнечник, кукуруза.</span>
            </label>

            <label className="field">
              <span>Категория</span>
              <input
                required
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              />
              <span className="field__hint">Укажите направление: зерновая, масличная, кормовая и т.д.</span>
            </label>

            <label className="field">
              <span>Семена, кг/га</span>
              <input
                min="0"
                step="0.1"
                type="number"
                value={form.defaultSeedRateKgHa}
                onChange={(event) => setForm((prev) => ({ ...prev, defaultSeedRateKgHa: event.target.value }))}
              />
              <span className="field__hint">Базовая норма для автоматических расчетов в техкартах.</span>
            </label>

            <label className="field">
              <span>Удобрения, кг/га</span>
              <input
                min="0"
                step="0.1"
                type="number"
                value={form.defaultFertilizerRateKgHa}
                onChange={(event) => setForm((prev) => ({ ...prev, defaultFertilizerRateKgHa: event.target.value }))}
              />
              <span className="field__hint">Используется для планирования потребности по площади поля.</span>
            </label>
          </div>

          <button className="button" type="submit">
            Добавить культуру
          </button>
        </form>
        ) : (
          <div className="card form-card">
            <p className="field__hint" style={{ margin: 0 }}>
              Редактирование справочника культур доступно агроному и администратору. Кладовщик использует справочник для складских операций без права изменения.
            </p>
          </div>
        )}
      </section>

      <section className="content-grid">
        <article className="card">
          <div className="section-header">
            <div>
              <h2>Агрономический профиль</h2>
            </div>
          </div>

          <dl className="details-grid">
            <div className="details-item">
              <dt>Культура в фокусе</dt>
              <dd>{activeCrop.name || 'Новая культура'}</dd>
            </div>
            <div className="details-item">
              <dt>Направление</dt>
              <dd>{cropProfile.direction}</dd>
            </div>
            <div className="details-item">
              <dt>Сезонность</dt>
              <dd>{cropProfile.season}</dd>
            </div>
            <div className="details-item">
              <dt>Норма высева</dt>
              <dd>{cropProfile.seeding}</dd>
            </div>
            <div className="details-item">
              <dt>Питание</dt>
              <dd>{cropProfile.nutrition}</dd>
            </div>
            <div className="details-item">
              <dt>Плановый ориентир</dt>
              <dd>{cropProfile.focus}</dd>
            </div>
          </dl>
        </article>

        <article className="card">
          <div className="section-header">
            <div>
              <h2>Структура справочника</h2>
            </div>
          </div>

          <div className="summary-list">
            {[...summary.categories.entries()].map(([category, count]) => (
              <div className="summary-list__item" key={category}>
                <strong>{category}</strong>
                <span>{count} поз.</span>
              </div>
            ))}
            {summary.categories.size === 0 ? (
              <div className="summary-list__item">
                <strong>Справочник пуст</strong>
                <span>Добавьте первую культуру, чтобы увидеть детализацию.</span>
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <h2>Справочник культур</h2>
          </div>
        </div>
        <DataTable
          columns={columns}
          detailsFields={detailsFields}
          detailsTitle={(row) => `Культура: ${row.name}`}
          renderModalContent={(row, closeModal) => (
            <EntityModalContent
              detailsFields={detailsFields}
              formFields={editFields}
              readOnly={!canEditCrops}
              initialValues={{
                name: row.name ?? '',
                category: row.category ?? '',
                defaultSeedRateKgHa: row.defaultSeedRateKgHa ?? '',
                defaultFertilizerRateKgHa: row.defaultFertilizerRateKgHa ?? '',
              }}
              onSave={async (values) => {
                await handleUpdateCrop(row, values);
                closeModal();
              }}
              row={row}
            />
          )}
          rowLabel="Открыть карточку культуры"
          rows={rows}
        />
      </section>
    </PageStack>
  );
}
