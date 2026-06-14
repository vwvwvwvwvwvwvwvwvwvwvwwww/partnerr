import { getCookie } from '../utils/cookies';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4010/api';
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME ?? 'csrf_token';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('text/plain')) {
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? 'Ошибка запроса');
    }

    return response.text();
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ?? 'Ошибка запроса');
  }

  return payload;
}

async function ensureCsrfToken() {
  let token = getCookie(CSRF_COOKIE_NAME);

  if (!token) {
    const response = await request('/auth/csrf');
    token = response.csrfToken;
  }

  return token;
}

export async function apiGet(path) {
  return request(path, { method: 'GET' });
}

/** GET бинарного ответа (например .docx); CSRF для GET не требуется */
export async function apiGetBinary(path) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    method: 'GET',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Ошибка запроса');
  }

  return response.blob();
}

export async function apiPost(path, body) {
  const csrfToken = await ensureCsrfToken();

  return request(path, {
    method: 'POST',
    headers: {
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify(body),
  });
}

export async function apiPut(path, body) {
  const csrfToken = await ensureCsrfToken();

  return request(path, {
    method: 'PUT',
    headers: {
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify(body),
  });
}

export const authApi = {
  login: (payload) => apiPost('/auth/login', payload),
  me: () => apiGet('/auth/me'),
  logout: () => apiPost('/auth/logout', {}),
};

export const dashboardApi = {
  summary: () => apiGet('/dashboard/summary'),
};

export const fieldsApi = {
  list: () => apiGet('/fields'),
  create: (payload) => apiPost('/fields', payload),
  update: (id, payload) => apiPut(`/fields/${id}`, payload),
};

export const machineryApi = {
  list: () => apiGet('/machinery'),
  create: (payload) => apiPost('/machinery', payload),
  update: (id, payload) => apiPut(`/machinery/${id}`, payload),
};

export const cropsApi = {
  list: () => apiGet('/crops'),
  create: (payload) => apiPost('/crops', payload),
  update: (id, payload) => apiPut(`/crops/${id}`, payload),
};

export const employeesApi = {
  list: () => apiGet('/employees'),
  create: (payload) => apiPost('/employees', payload),
  update: (id, payload) => apiPut(`/employees/${id}`, payload),
};

export const planningApi = {
  list: () => apiGet('/planning'),
  create: (payload) => apiPost('/planning', payload),
  update: (id, payload) => apiPut(`/planning/${id}`, payload),
};

export const warehouseApi = {
  list: () => apiGet('/warehouse'),
  create: (payload) => apiPost('/warehouse', payload),
  update: (id, payload) => apiPut(`/warehouse/${id}`, payload),
};

export const harvestApi = {
  list: () => apiGet('/harvest'),
  listDrivers: () => apiGet('/harvest/drivers'),
  emailStatus: () => apiGet('/harvest/email-status'),
  create: (payload) => apiPost('/harvest', payload),
  update: (id, payload) => apiPut(`/harvest/${id}`, payload),
  sendEmail: (id) => apiPost(`/harvest/${id}/send-email`, {}),
};

export const financeApi = {
  list: () => apiGet('/finance'),
  summary: () => apiGet('/finance/summary'),
  create: (payload) => apiPost('/finance', payload),
  update: (id, payload) => apiPut(`/finance/${id}`, payload),
};

export const reportsApi = {
  list: () => apiGet('/reports'),
  summaryDocx: () => apiGetBinary('/reports/summary.docx'),
  downloadDocx: (id) => apiGetBinary(`/reports/${id}/docx`),
};
