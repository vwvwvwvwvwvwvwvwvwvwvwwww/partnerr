import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { authApi } from './api/client';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import FieldsPage from './pages/FieldsPage';
import MachineryPage from './pages/MachineryPage';
import CropsPage from './pages/CropsPage';
import LoginPage from './pages/LoginPage';
import PlanningPage from './pages/PlanningPage';
import WarehousePage from './pages/WarehousePage';
import HarvestPage from './pages/HarvestPage';
import FinancePage from './pages/FinancePage';
import EmployeesPage from './pages/EmployeesPage';
import ReportsPage from './pages/ReportsPage';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/app.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundAnimationEnabled, setBackgroundAnimationEnabled] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    const savedValue = window.localStorage.getItem('agro-erp-background-animation');

    if (savedValue !== null) {
      return savedValue === 'true';
    }

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    let isActive = true;

    authApi.me()
      .then((response) => {
        if (isActive) {
          setUser(response.data);
        }
      })
      .catch(() => {
        if (isActive) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('agro-erp-background-animation', String(backgroundAnimationEnabled));
  }, [backgroundAnimationEnabled]);

  async function handleLogin(credentials) {
    const response = await authApi.login(credentials);
    setUser(response.data);
  }

  async function handleLogout() {
    await authApi.logout();
    setUser(null);
  }

  if (isLoading) {
    return <div className="loading-screen">Загрузка…</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout
      backgroundAnimationEnabled={backgroundAnimationEnabled}
      onLogout={handleLogout}
      onToggleBackgroundAnimation={() => setBackgroundAnimationEnabled((prev) => !prev)}
      user={user}
    >
      <Routes>
        <Route element={<ProtectedRoute module="dashboard" user={user}><DashboardPage /></ProtectedRoute>} path="/" />
        <Route element={<ProtectedRoute module="fields" user={user}><FieldsPage /></ProtectedRoute>} path="/fields" />
        <Route element={<ProtectedRoute module="planning" user={user}><PlanningPage /></ProtectedRoute>} path="/planning" />
        <Route element={<ProtectedRoute module="machinery" user={user}><MachineryPage user={user} /></ProtectedRoute>} path="/machinery" />
        <Route element={<ProtectedRoute module="crops" user={user}><CropsPage user={user} /></ProtectedRoute>} path="/crops" />
        <Route element={<ProtectedRoute module="warehouse" user={user}><WarehousePage /></ProtectedRoute>} path="/warehouse" />
        <Route element={<ProtectedRoute module="harvest" user={user}><HarvestPage user={user} /></ProtectedRoute>} path="/harvest" />
        <Route element={<ProtectedRoute module="finance" user={user}><FinancePage /></ProtectedRoute>} path="/finance" />
        <Route element={<ProtectedRoute module="reports" user={user}><ReportsPage /></ProtectedRoute>} path="/reports" />
        <Route element={<ProtectedRoute module="employees" user={user}><EmployeesPage user={user} /></ProtectedRoute>} path="/employees" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </Layout>
  );
}

export default App;
