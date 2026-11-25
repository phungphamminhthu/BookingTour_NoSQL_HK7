// Các hàm dùng chung cho trang Phần 2; không lưu dữ liệu nghiệp vụ trong localStorage.
(() => {
  const api = window.BookingTourApi;
  const $ = (selector) => document.querySelector(selector);
  const text = (selector, value) => {
    const el = $(selector);
    if (el) el.textContent = value ?? '—';
  };
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
    );
  const imageUrl = (value) => {
    try {
      const url = new URL(value, location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? escape(url.href) : '';
    } catch {
      return '';
    }
  };
  function notice(message, error = false) {
    let box = $('#part2Message');
    if (!box) {
      box = document.createElement('div');
      box.id = 'part2Message';
      box.setAttribute('role', 'status');
      const container = $('main') || $('#provinceToursGrid')?.parentElement || $('body > section');
      (container || document.body).prepend(box);
    }
    box.className = `p-4 my-4 rounded-xl text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-900'}`;
    box.textContent = message;
    box.hidden = !message;
  }
  function failure(error) {
    if (error.status === 401) {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem('bookingtour_token');
        storage.removeItem('bookingtour_user');
        storage.removeItem('bookingtour_role');
      }
      location.href = '/client/auth/login.html';
    } else
      notice(error.status === 403 ? 'Tài khoản không có quyền sử dụng chức năng này.' : error.message, true);
  }
  async function requireUser(role) {
    if (!api.getAuthToken()) {
      location.href = '/client/auth/login.html';
      return null;
    }
    const { data } = await api.apiRequest('/api/auth/me');
    const actualRole = data.userType === 'customer' ? 'Customer' : data.roleName;
    if (actualRole !== role) {
      const error = new Error('Không đủ quyền.');
      error.status = 403;
      throw error;
    }
    text('aside h2', `Chào ${data.fullName}`);
    text('aside p.truncate', data.email);
    return data;
  }
  function bindForm(form, action) {
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      try {
        await action(new FormData(form));
      } catch (error) {
        failure(error);
      } finally {
        if (button) button.disabled = false;
      }
    });
  }
  function pagination(container, result, params, onPage) {
    if (!container) return;
    const pages = Math.ceil(result.total / result.pageSize);
    container.replaceChildren();
    for (let page = 1; page <= pages; page++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = page;
      button.className = `w-10 h-10 rounded-full font-bold ${page === result.page ? 'bg-blue-900 text-white' : 'bg-slate-100 text-blue-900'}`;
      button.disabled = page === result.page;
      button.onclick = () => {
        params.set('page', page);
        onPage(params);
      };
      container.append(button);
    }
  }
  const money = (value) => Number(value || 0).toLocaleString('vi-VN') + ' đ';
  const date = (value) =>
    value ? new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—';
  window.Part2 = {
    $,
    text,
    escape,
    imageUrl,
    notice,
    failure,
    requireUser,
    bindForm,
    pagination,
    money,
    date,
    request: api.apiRequest,
    json: (value) => ({ body: JSON.stringify(value) }),
  };
})();
