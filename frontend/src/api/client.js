/**
 * Krishi Setu — Centralized API Client
 *
 * Connects the frontend to the Express/TypeScript backend.
 * Base URL is configurable via VITE_API_BASE_URL environment variable.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '');

const TOKEN_KEY = 'krishi_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore localStorage access failures
  }
}

/**
 * Standard fetch wrapper that handles JSON parsing and unified error envelopes.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const json = isJson ? await res.json() : null;

    if (!res.ok) {
      // Backend error envelope: { status: "error", error: { code, message, details } }
      const errMessage = json?.error?.message || json?.message || `Request failed with status ${res.status}`;
      const errCode = json?.error?.code || 'HTTP_ERROR';
      const details = json?.error?.details || null;
      return {
        ok: false,
        error: errMessage,
        code: errCode,
        details,
        status: res.status,
      };
    }

    // Backend success envelope: { status: "success", data: ..., pagination?: ..., disclaimer?: ... }
    return {
      ok: true,
      data: json?.data !== undefined ? json.data : json,
      pagination: json?.pagination,
      disclaimer: json?.disclaimer,
      status: res.status,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Network error: Unable to reach backend at ${BASE_URL}. Ensure the backend server is running. (${err.message})`,
      code: 'NETWORK_ERROR',
      status: 0,
    };
  }
}

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      q.append(key, String(val));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const api = {
  baseUrl: BASE_URL,

  // ── Authentication ───────────────────────────────────────────────────────
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request('/auth/me'),

  updateProfile: (payload) =>
    request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  logout: () => {
    setStoredToken(null);
  },

  // ── Health & Meta ────────────────────────────────────────────────────────
  getHealth: () => request('/health'),
  getDataSourcesStatus: () => request('/data-sources/status'),
  getOgdStatus: () => request('/mandi/ogd-status'),

  // ── Module 1: Crops & Mandis (Reference Data) ───────────────────────────
  getCrops: (params = {}) => request(`/crops${buildQuery(params)}`),
  getCropById: (id) => request(`/crops/${id}`),

  getMandis: (params = {}) => request(`/mandis${buildQuery(params)}`),
  getMandiById: (id) => request(`/mandis/${id}`),

  getPrices: (params = {}) => request(`/prices${buildQuery(params)}`),
  getMandiPrices: (params = {}) => request(`/prices${buildQuery(params)}`),

  // ── Module 1: Smart Mandi Decision Engine ───────────────────────────────
  compareMandis: (payload) =>
    request('/mandi-comparison', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Module 2: Crop Opportunity Engine ───────────────────────────────────
  assessCrops: (payload) =>
    request('/crop-assessments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Module 3: Climate Risk Engine ───────────────────────────────────────
  getWeather: (params) => request(`/weather${buildQuery(params)}`),
  getDailyForecast: (latOrParams, lon, days = 7) => {
    if (typeof latOrParams === 'object' && latOrParams !== null) {
      return request(`/weather${buildQuery(latOrParams)}`);
    }
    return request(`/weather${buildQuery({ latitude: latOrParams, longitude: lon, days })}`);
  },
  getWeatherHistorical: (params) => request(`/weather/historical${buildQuery(params)}`),

  // ── Module 4: Government Support Engine ─────────────────────────────────
  getSchemes: (params = {}) => request(`/schemes${buildQuery(params)}`),
  getSchemeById: (id) => request(`/schemes/${id}`),

  // ── Module 5: Village Agriculture Dashboard ─────────────────────────────
  getVillages: (params = {}) => request(`/villages${buildQuery(params)}`),
  getVillageById: (id) => request(`/villages/${id}`),
  getVillageDashboard: (villageId) => request(`/villages/${villageId}/dashboard`),

  // ── Module 6: Farming Schedule & Tasks ──────────────────────────────────
  getTasks: () => request('/tasks'),
  createTask: (payload) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTask: (id, payload) =>
    request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteTask: (id) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // ── Module 7: AI Agriculture Assistant ──────────────────────────────────
  sendAiChat: (payload) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ── Module 8: Notification Center ───────────────────────────────────────
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    request('/notifications/mark-all-read', {
      method: 'POST',
    }),
};

export default api;
