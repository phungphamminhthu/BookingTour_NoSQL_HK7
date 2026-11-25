(() => {
  const api = window.BookingTourApi;
  if (!api) return;

  function messageBox(form) {
    let box = form.querySelector('[data-auth-message]');
    if (!box) {
      box = document.createElement('div');
      box.dataset.authMessage = 'true';
      box.className = 'hidden rounded-xl border p-3 text-sm';
      box.setAttribute('role', 'alert');
      form.prepend(box);
    }
    return box;
  }

  function showMessage(form, text, success = false) {
    const box = messageBox(form);
    box.textContent = text;
    box.className = success
      ? 'rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700'
      : 'rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700';
  }

  function setBusy(form, busy, label) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent.trim();
      button.disabled = true;
      button.textContent = label;
      button.classList.add('opacity-70', 'cursor-wait');
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
      button.classList.remove('opacity-70', 'cursor-wait');
    }
  }

  function unwrap(result) { return result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result; }

  function redirectByRole(data) {
    const role = String(data.role || data.user?.roleName || data.user?.role_name || '').toLowerCase();
    const userType = String(data.userType || '').toLowerCase();
    // These are initial landing pages available in the supplied static UI.
    if (userType === 'customer' || role === 'customer') {
      const returnTo = new URLSearchParams(window.location.search).get('returnTo');
      const allowed = /^\/client\/(?:booking\/(?:create|passengers)|payments\/(?:invoice|history)|my_tours\/(?:index|show|review))\.html(?:\?[^#]*)?$/;
      window.location.href = returnTo && allowed.test(returnTo) ? returnTo : '/client/home.html';
    } else if (role === 'admin') {
      window.location.href = '/admin/dashboard.html';
    } else if (role === 'sale') {
      window.location.href = '/admin/dashboard.html';
    } else if (role === 'guide') {
      window.location.href = '/admin/departures/index.html';
    } else {
      showMessage(document.querySelector('#loginForm'), 'Tài khoản chưa được gán vai trò hợp lệ. Vui lòng liên hệ quản trị viên.');
    }
  }

  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(loginForm);
      const usernameOrEmail = String(form.get('usernameOrEmail') || '').trim();
      const password = String(form.get('password') || '');
      if (!usernameOrEmail || !password) return showMessage(loginForm, 'Vui lòng nhập tên đăng nhập/email và mật khẩu.');
      setBusy(loginForm, true, 'Đang đăng nhập...');
      try {
        const result = await api.apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ usernameOrEmail, password, remember: form.get('remember') === '1' })
        });
        const data = unwrap(result);
        if (!data?.token) throw new Error('API đăng nhập không trả về JWT token.');
        sessionStorage.removeItem('bookingtour_logged_out');
        localStorage.removeItem('bookingtour_logged_out');
        localStorage.removeItem('bookingtour_token');
        sessionStorage.removeItem('bookingtour_token');
        for (const target of [localStorage, sessionStorage]) {
          target.removeItem('bookingtour_user'); target.removeItem('bookingtour_role');
          target.removeItem('bookingtour_api_booking_draft');
          target.removeItem('booking_passengers_draft');
        }
        const storage = form.get('remember') === '1' ? localStorage : sessionStorage;
        storage.setItem('bookingtour_token', data.token);
        storage.setItem('bookingtour_user', JSON.stringify(data.user || {}));
        storage.setItem('bookingtour_role', data.role || '');
        redirectByRole(data);
      } catch (error) {
        showMessage(loginForm, error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      } finally {
        setBusy(loginForm, false);
      }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') showMessage(loginForm, 'Đăng ký thành công! Em hãy đăng nhập bằng tài khoản vừa tạo.', true);
  }

  const registerForm = document.querySelector('#registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(registerForm);
      const fullName = String(form.get('full_name') || '').trim();
      const email = String(form.get('email') || '').trim();
      const phone = String(form.get('phone') || '').trim();
      const address = String(form.get('address') || '').trim();
      const password = String(form.get('password') || '');
      const confirmation = String(form.get('password_confirmation') || '');
      if (!fullName || !email || !phone || !password) return showMessage(registerForm, 'Vui lòng nhập đầy đủ họ tên, email, số điện thoại và mật khẩu.');
      if (password.length < 6) return showMessage(registerForm, 'Mật khẩu phải có ít nhất 6 ký tự.');
      if (password !== confirmation) return showMessage(registerForm, 'Mật khẩu xác nhận không khớp.');
      if (!form.get('terms')) return showMessage(registerForm, 'Vui lòng đồng ý với điều khoản dịch vụ.');
      setBusy(registerForm, true, 'Đang tạo tài khoản...');
      try {
        await api.apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, password_confirmation: confirmation, full_name: fullName, phone, address: address || null })
        });
        window.location.href = '/client/auth/login.html?registered=1';
      } catch (error) {
        showMessage(registerForm, error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      } finally {
        setBusy(registerForm, false);
      }
    });
  }
})();
