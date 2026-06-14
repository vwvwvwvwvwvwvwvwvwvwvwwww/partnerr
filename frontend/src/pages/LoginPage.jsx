import { useState } from 'react';
import AlertMessage from '../components/AlertMessage';
import BrandLogo from '../components/BrandLogo';
import { validateForm } from '../utils/validation';

const loginFields = [
  { name: 'username', label: 'Логин', required: true, minLength: 3 },
  { name: 'password', label: 'Пароль', required: true },
];

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const validation = validateForm(form, loginFields);

    if (validation.firstError) {
      setError(validation.firstError);
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(form);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="card__title-block">
          <div>
            <BrandLogo />
            <h1 className="login-card__title">Вход в систему</h1>
          </div>
        </div>

        <label className="field">
          <span>Логин</span>
          <input
            type="text"
            autoComplete="username"
            placeholder="Логин"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            required
          />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input
            type="password"
            placeholder="Введите пароль"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>

        <AlertMessage variant="error">{error}</AlertMessage>

        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Проверка...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
