import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/client';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.summary()
      .then((response) => setSummary(response.data))
      .catch((apiError) => setError(apiError.message));
  }, []);

  return (
    <div className="page-stack">
      {error ? <div className="alert alert--error">{error}</div> : null}

      <section className="stats-grid">
        <StatCard title="Поля" value={summary ? summary.fieldsCount : '...'} />
        <StatCard title="Площадь" value={summary ? `${summary.totalAreaHa} га` : '...'} />
        <StatCard title="Техника" value={summary ? summary.activeMachineryCount : '...'} />
        <StatCard title="Культуры" value={summary ? summary.cropsCount : '...'} />
        <StatCard title="Сотрудники" value={summary ? summary.employeesCount : '...'} />
        <StatCard title="Склад" value={summary ? summary.warehouseItemsCount : '...'} />
        <StatCard title="Баланс" value={summary ? `${summary.financeBalance} руб.` : '...'} />
      </section>
    </div>
  );
}
