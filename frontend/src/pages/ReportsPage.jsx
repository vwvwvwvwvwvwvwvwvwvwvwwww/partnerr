import { useCallback, useState } from 'react';
import { reportsApi } from '../api/client';

export default function ReportsPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const download = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const blob = await reportsApi.summaryDocx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agro-erp-svodka-${new Date().toISOString().slice(0, 10)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message ?? 'Не удалось сформировать отчёт');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <span className="eyebrow">Отчёты</span>
          <h2>Сводка</h2>
        </div>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}

      <div className="button-row">
        <button className="button" disabled={loading} onClick={download} type="button">
          {loading ? 'Формирование…' : 'Скачать отчёт (Word, .docx)'}
        </button>
      </div>
    </div>
  );
}
