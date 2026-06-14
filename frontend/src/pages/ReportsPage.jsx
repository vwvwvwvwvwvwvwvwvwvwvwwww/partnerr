import { useCallback, useEffect, useMemo, useState } from 'react';
import { reportsApi } from '../api/client';
import DataTable from '../components/DataTable';
import PageStack from '../components/PageStack';
import StatCard from '../components/StatCard';

const roleLabels = {
  admin: 'Администратор',
  agronomist: 'Агроном',
  mechanic: 'Механик',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
  driver: 'Водитель',
};

function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return '—';
  }

  const parts = [];

  if (snapshot.fieldsCount != null) {
    parts.push(`полей: ${snapshot.fieldsCount}`);
  }

  if (snapshot.totalAreaHa != null) {
    parts.push(`площадь: ${Number(snapshot.totalAreaHa).toFixed(0)} га`);
  }

  if (snapshot.financeBalance != null) {
    parts.push(`сальдо: ${Number(snapshot.financeBalance).toLocaleString('ru-RU')} ₽`);
  }

  return parts.length ? parts.join(' · ') : '—';
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [migrateHint, setMigrateHint] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setMigrateHint(false);

    try {
      const response = await reportsApi.list();
      setHistory(response.data ?? []);
      setError('');
    } catch (err) {
      const message = err.message ?? 'Не удалось загрузить историю отчётов';

      if (message.includes('42P01') || message.toLowerCase().includes('report_exports')) {
        setMigrateHint(true);
        setHistory([]);
      } else {
        setError(message);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const downloadNew = useCallback(async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const blob = await reportsApi.summaryDocx();
      const fileName = `partner-svodka-${new Date().toISOString().slice(0, 10)}.docx`;
      triggerDownload(blob, fileName);
      setSuccess('Отчёт сформирован и добавлен в историю');
      await loadHistory();
    } catch (err) {
      setError(err.message ?? 'Не удалось сформировать отчёт');
    } finally {
      setLoading(false);
    }
  }, [loadHistory]);

  const downloadFromHistory = useCallback(async (row) => {
    setError('');
    setSuccess('');
    setDownloadingId(row.id);

    try {
      const blob = await reportsApi.downloadDocx(row.id);
      triggerDownload(blob, row.fileName ?? `partner-svodka-${row.id}.docx`);
      setSuccess(`Файл «${row.fileName}» загружен`);
    } catch (err) {
      setError(err.message ?? 'Не удалось скачать отчёт');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const historyColumns = useMemo(
    () => [
      {
        key: 'generatedAt',
        title: 'Дата',
        render: (value) => formatDateTime(value),
      },
      { key: 'title', title: 'Название' },
      { key: 'generatedByName', title: 'Автор' },
      {
        key: 'generatedByRole',
        title: 'Роль',
        render: (value) => roleLabels[value] ?? value ?? '—',
      },
      {
        key: 'snapshot',
        title: 'Показатели на момент выгрузки',
        render: (_, row) => formatSnapshot(row.snapshot),
      },
      { key: 'fileName', title: 'Файл' },
      {
        key: 'id',
        title: '',
        render: (id, row) => (
          <button
            className="button button--secondary report-history__download-btn"
            disabled={downloadingId === id || loading}
            onClick={(event) => {
              event.stopPropagation();
              downloadFromHistory(row);
            }}
            type="button"
          >
            {downloadingId === id ? '…' : 'Скачать'}
          </button>
        ),
      },
    ],
    [downloadFromHistory, downloadingId, loading],
  );

  const historyDetailsFields = [
    { key: 'title', label: 'Название' },
    { key: 'generatedAt', label: 'Дата', render: (v) => formatDateTime(v) },
    { key: 'generatedByName', label: 'Автор' },
    {
      key: 'generatedByRole',
      label: 'Роль в системе',
      render: (v) => roleLabels[v] ?? v,
    },
    { key: 'fileName', label: 'Имя файла' },
    {
      key: 'snapshot',
      label: 'Показатели',
      render: (_, row) => formatSnapshot(row.snapshot),
    },
  ];

  return (
    <PageStack error={error} success={success}>
      <section className="page-header">
        <div>
          <span className="eyebrow">Отчёты</span>
          <h2>Сводка</h2>
          <p className="section-header__hint">
            Сводный отчёт в Word по текущим данным ERP. Каждая выгрузка сохраняется в истории отчётов.
          </p>
        </div>
      </section>

      <section className="stats-grid stats-grid--compact">
        <StatCard
          title="В истории"
          value={historyLoading ? '…' : String(history.length)}
          hint="сохранённых выгрузок"
        />
        <StatCard title="Формат" value="DOCX" hint="Microsoft Word" />
        <StatCard title="Тип" value="Сводка" hint="поля, техника, урожай, финансы" />
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Новый отчёт</h2>
        </div>
        <div className="button-row">
          <button className="button" disabled={loading} onClick={downloadNew} type="button">
            {loading ? 'Формирование…' : 'Скачать отчёт (Word, .docx)'}
          </button>
        </div>
      </section>

      <section className="card report-history">
        <div className="section-header">
          <div>
            <h2>История отчётов</h2>
            <p className="section-header__hint">
              Журнал ранее сформированных сводок. Повторное скачивание создаёт актуальный файл с пометкой
              об архивной записи в документе.
            </p>
          </div>
          <button
            className="button button--secondary"
            disabled={historyLoading}
            onClick={loadHistory}
            type="button"
          >
            Обновить
          </button>
        </div>

        {migrateHint ? (
          <p className="report-history__empty report-history__migrate-hint">
            Таблица журнала ещё не создана. Выполните в корне проекта:{' '}
            <code>npm run migrate</code>
            , затем обновите страницу.
          </p>
        ) : null}

        <DataTable
          columns={historyColumns}
          detailsFields={historyDetailsFields}
          detailsTitle={(row) => row.title}
          emptyText={
            historyLoading
              ? 'Загрузка истории…'
              : 'Нет сохранённых отчётов. Нажмите «Скачать отчёт» — запись появится в таблице.'
          }
          renderModalContent={(row, close) => (
            <div className="report-history__modal">
              <dl className="details-grid">
                {historyDetailsFields.map((field) => (
                  <div className="details-item" key={field.key}>
                    <dt>{field.label}</dt>
                    <dd>
                      {field.render
                        ? field.render(row[field.key], row)
                        : (row[field.key] ?? '—')}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                className="button"
                disabled={downloadingId === row.id}
                onClick={async () => {
                  await downloadFromHistory(row);
                  close();
                }}
                type="button"
              >
                {downloadingId === row.id ? 'Скачивание…' : 'Скачать снова'}
              </button>
            </div>
          )}
          rowLabel="Открыть карточку отчёта"
          rows={history}
        />
      </section>
    </PageStack>
  );
};
