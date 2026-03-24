const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  if (!path) return API_BASE || '/';
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
