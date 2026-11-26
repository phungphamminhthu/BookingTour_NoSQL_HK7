// Bộ gọi API dùng chung; giao diện và API chạy trên cùng máy chủ ASP.NET Core.
// Nếu giao diện chạy riêng, đặt window.BOOKINGTOUR_API_BASE_URL trước khi nạp file này.
const API_BASE_URL = (window.BOOKINGTOUR_API_BASE_URL || window.location.origin).replace(/\/$/, '');

// Đọc JWT của phiên hiện tại từ bộ nhớ trình duyệt.
function getAuthToken() {
  return localStorage.getItem('bookingtour_token') || sessionStorage.getItem('bookingtour_token');
}

// Gọi API kèm JWT, đọc JSON và chuyển lỗi HTTP/validation cho trang xử lý.
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
