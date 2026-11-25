// BookingTour API client. Frontend and API are served by the same ASP.NET Core host.
// For a separately hosted frontend, set window.BOOKINGTOUR_API_BASE_URL before this file.
const API_BASE_URL = (window.BOOKINGTOUR_API_BASE_URL || window.location.origin).replace(/\/$/, '');

function getAuthToken() {
  return localStorage.getItem('bookingtour_token') || sessionStorage.getItem('bookingtour_token');
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok || payload?.success === false) {
    const validation = payload?.errors ? Object.values(payload.errors).flat().filter(x => typeof x === 'string').join(' ') : '';
    const message = validation || payload?.message || payload?.title || (typeof payload === 'string' ? payload : `HTTP ${response.status}`);
    const error = new Error(message);
    error.status = response.status;
    error.errors = payload?.errors;
    throw error;
  }
  return payload;
}

window.BookingTourApi = { API_BASE_URL, apiRequest, getAuthToken };
