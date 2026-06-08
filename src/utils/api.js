const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Guard: in production, VITE_API_URL MUST be set as a Vercel environment variable.
// If it is missing, all API calls will hit Vercel's SPA fallback (index.html) and return HTML, not JSON.
// To fix: go to Vercel dashboard → Project → Settings → Environment Variables
// and set VITE_API_URL to your Railway backend URL (e.g. https://your-app.up.railway.app)
if (import.meta.env.PROD && !API_BASE) {
  console.error(
    '[TutorAI] CRITICAL: VITE_API_URL is not set.\n' +
    'All API calls will fail. Set it in Vercel → Settings → Environment Variables.'
  );
}

export function apiUrl(path) {
  if (!path) return API_BASE || '/';
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
