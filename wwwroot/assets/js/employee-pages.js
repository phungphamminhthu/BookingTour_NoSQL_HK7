// Chỉ trang nhân viên dùng file này; các trang admin khác giữ nguyên script cũ.
(() => {
  const { $, text, escape: esc, request, requireUser, notice, failure, pagination } = window.Part2;
  const getParams = () => new URLSearchParams(window.location.search);

  // Chỉ dịch tên hiển thị; giữ nguyên mã vai trò dùng cho phân quyền và API.
  // Dịch nhãn vai trò sang tiếng Việt, giữ nguyên giá trị phân quyền trên API.
  function roleLabel(name) {
    const labels = {
      Admin: 'Quản trị viên',
      Sale: 'Nhân viên kinh doanh',
      Guide: 'Hướng dẫn viên',
    };
    return labels[name] || name;
  }

  let starting = null;
  let initializedForm = null;

  // Điều phối khởi tạo module, tránh gắn nhiều lần xử lý trên cùng một form.
  function start() {
    // Các lần gọi từ router cùng đợi lần tải đang chạy, không khởi tạo chồng lên nhau.
    if (starting) return starting.then(() => start());
    const pageForm = $('main form');
    if (pageForm && pageForm === initializedForm) return Promise.resolve();
    starting = loadPage(pageForm);
    return starting;
  }

  // Kiểm tra quyền Admin, nạp CSS/vai trò rồi chọn trang danh sách hoặc form.
  async function loadPage(pageForm) {
    // Router chỉ thay nội dung trang, nên nạp CSS nhân viên khi mở module lần đầu.
    if (!document.getElementById('employeeStyles')) {
      const link = document.createElement('link');
      link.id = 'employeeStyles';
      link.rel = 'stylesheet';
      link.href = '/assets/css/employees.css';
      document.head.appendChild(link);
    }
    try {
      const buttons = [...document.querySelectorAll('main form [type="submit"]')];
      buttons.forEach((button) => (button.disabled = true));
      notice('Đang tải nhân viên...');
      const current = await requireUser('Admin');
      if (!current) return;

      const logoutBtn = $('#adminLogoutBtn');
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          for (const storage of [localStorage, sessionStorage]) {
            for (const key of ['bookingtour_token', 'bookingtour_user', 'bookingtour_role'])
              storage.removeItem(key);
          }
          location.href = '/client/auth/login.html';
        };
      }

      const { data: roles } = await request('/api/employees/roles');
      if (pageForm !== $('main form')) return;
      const path = location.pathname.toLowerCase();
      const isIndex =
        path.endsWith('/index.html') || path.endsWith('/employees') || path.endsWith('/employees/');
      if (isIndex) await list(current, roles);
      else await edit(roles);
      // Giữ dữ liệu đang nhập nếu router gọi lại module trên cùng form.
      initializedForm = pageForm;
      notice('');
      buttons.forEach((button) => (button.disabled = false));
    } finally {
      starting = null;
    }
  }

  // Gọi API tìm kiếm/thống kê nhân viên, dựng các dòng dữ liệu và gắn thao tác xóa.
  async function list(current, roles) {
    const params = getParams();
    const form = $('main form');
    if (form) {
      form.elements.keyword.value = params.get('search') || '';
      form.elements.roleId.innerHTML =
        '<option value="">Tất cả vai trò</option>' +
        roles
          .map((r) => `<option value="${r.id}">${esc(roleLabel(r.role_name))}</option>`)
          .join('');
      form.elements.roleId.value = params.get('roleId') || '';
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const query = new URLSearchParams();
        if (fd.get('keyword')) query.set('search', fd.get('keyword'));
        if (fd.get('roleId')) query.set('roleId', fd.get('roleId'));
        location.search = query;
      };
      const reset = form.querySelector('a');
      if (reset) reset.href = '/admin/employees/index.html';
    }

    const createBtn = $('main header a');
    if (createBtn) createBtn.href = '/admin/employees/create.html';

    const result = await request('/api/employees?' + params);
    const stats = await Promise.all([
      request('/api/employees?pageSize=1'),
      ...roles.map((r) => request('/api/employees?pageSize=1&roleId=' + r.id)),
    ]);
    const numbers = document.querySelectorAll('[data-employee-stat]');
    numbers.forEach((el, i) => (el.textContent = stats[i]?.total ?? 0));

    $('#employeeList').innerHTML =
      result.data
        .map(
          (e) => {
            // Tài khoản đang đăng nhập không được tự xóa; backend cũng kiểm tra lại điều kiện này.
            const isCurrent = e.id === current.id;
            return `<article class="employee-row bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div class="employee-identity flex items-center gap-4 min-w-0"><div class="w-14 h-14 shrink-0 rounded-full bg-blue-900 text-white flex items-center justify-center font-black">${esc(e.full_name.slice(0, 1))}</div><div class="min-w-0 break-words"><h3 class="font-extrabold text-blue-950">${esc(e.full_name)}</h3><p class="text-xs text-slate-500 mt-1 break-all">#${e.id} · ${esc(e.email)}</p><p class="text-xs mt-1 break-all">${esc(e.phone)} · ${esc(e.username)}</p>${isCurrent ? `<p id="employee-delete-reason-${e.id}" class="text-xs text-slate-500 mt-2">Tài khoản đang đăng nhập — không thể tự xóa.</p>` : ''}</div></div>
      <span class="employee-role text-xs font-bold text-purple-700">${esc(roleLabel(e.role_name))}</span><div class="employee-actions flex gap-4"><a class="text-primary font-bold" href="/admin/employees/edit.html?id=${e.id}">Sửa</a><button type="button" class="text-red-600" data-delete="${e.id}" ${isCurrent ? `disabled title="Không thể xóa tài khoản đang đăng nhập" aria-describedby="employee-delete-reason-${e.id}"` : ''}>Xóa</button></div></article>`;
          },
        )
        .join('') || '<p class="p-8 text-center">Không tìm thấy nhân viên.</p>';
    text('#employeeTotal', `Tổng ${result.total} nhân viên phù hợp`);
    pagination($('#employeePagination'), result, params, (next) => {
      location.search = next;
    });

    document.querySelectorAll('[data-delete]').forEach(
      (button) =>
        (button.onclick = async () => {
          if (!confirm('Xóa nhân viên này?')) return;
          button.disabled = true;
          try {
            await request('/api/employees/' + button.dataset.delete, { method: 'DELETE' });
            location.reload();
          } catch (error) {
            failure(error);
            $('#part2Message')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            button.disabled = false;
          }
        }),
    );
  }

  // Điền dữ liệu form thêm/sửa và thiết lập kiểm tra trường nhập.
  async function edit(roles) {
    const form = $('main form');
    if (!form) return;
    const params = getParams();
    const id = params.get('id');
    const creating = location.pathname.endsWith('/create.html');
    if (!creating && !/^\d+$/.test(id || '')) {
      throw new Error('Mã nhân viên không hợp lệ.');
    }

    if (form.elements.role_id) {
      form.elements.role_id.innerHTML =
        '<option value="">-- Chọn vai trò --</option>' +
        roles
          .map((r) => `<option value="${r.id}">${esc(roleLabel(r.role_name))}</option>`)
          .join('');
    }

    if (!creating) {
      const { data: employee } = await request('/api/employees/' + id);
      if (!employee) throw new Error(`Không tìm thấy nhân viên mã ${id}.`);

      for (const key of ['full_name', 'email', 'phone', 'username', 'role_id']) {
        if (form.elements[key]) form.elements[key].value = employee[key] ?? '';
      }

      if (form.elements.username) {
        form.elements.username.readOnly = true;
        form.elements.username.classList.add(
          'bg-slate-100',
          'cursor-not-allowed',
          'text-slate-500',
        );
      }

      if (form.elements.password) {
        form.elements.password.required = false;
        form.elements.password.value = '';
      }
      if (form.elements.password_confirmation) {
        form.elements.password_confirmation.required = false;
        form.elements.password_confirmation.value = '';
      }

      const titleEl =
        document.getElementById('editEmployeeTitle') || $('main header h2') || $('h2');
      if (titleEl) {
        titleEl.textContent = `Chỉnh Sửa Nhân Viên #${employee.id} - ${employee.full_name}`;
      }
      document.title = `Chỉnh sửa Nhân viên #${employee.id} - Vietnam Expeditions`;
    }

    setupEmployeeValidation(form, creating, id, roles);
    const cancel = form.querySelector('a');
    if (cancel) cancel.href = '/admin/employees/index.html';
  }

  // Gắn kiểm tra đầu vào và hiển thị lỗi tiếng Việt trước khi gửi API.
  function setupEmployeeValidation(form, creating, id, roles) {
    // Trang mở trực tiếp và admin router có thể cùng khởi tạo một form.
    if (form.dataset.employeeValidationReady === 'true') return;
    form.dataset.employeeValidationReady = 'true';
    form.noValidate = true; // Dùng thông báo tiếng Việt dưới từng ô thay cho popup mặc định.
    const fields = [
      'full_name',
      'email',
      'phone',
      'username',
      'password',
      'password_confirmation',
      'role_id',
    ];
    const touched = new Set();
    for (const name of fields) {
      const input = form.elements[name];
      input.id = 'employee_' + name;
      input.parentElement.querySelector('label').htmlFor = input.id;
      const error = document.createElement('p');
      error.id = input.id + '_error';
      error.className = 'mt-2 text-xs text-red-600';
      error.setAttribute('aria-live', 'polite');
      error.hidden = true;
      input.insertAdjacentElement('afterend', error);
      input.setAttribute('aria-describedby', error.id);
      input.addEventListener('blur', (event) => {
        touched.add(name);
        // Nút submit sẽ kiểm tra toàn form; tránh dời nút giữa lúc người dùng đang nhấn.
        if (event.relatedTarget?.closest('button, a')) return;
        showErrors(validate(readValues()), touched);
      });
      input.addEventListener('input', () => {
        if (touched.has(name)) showErrors(validate(readValues()), touched);
      });
      input.addEventListener('change', () => {
        touched.add(name);
        showErrors(validate(readValues()), touched);
      });
    }
    // Lấy giá trị form, cắt khoảng trắng và chuẩn hóa số điện thoại/mã vai trò.
    function readValues() {
      const values = Object.fromEntries(new FormData(form));
      for (const name of ['full_name', 'email', 'phone', 'username'])
        values[name] = String(values[name] || '').trim();
      values.phone = values.phone.replace(/[\s().-]/g, '').replace(/^\+84/, '0');
      values.role_id = Number(values.role_id);
      return values;
    }
    // Kiểm tra tên, email, điện thoại, username, mật khẩu và vai trò ở giao diện.
    function validate(values) {
      const errors = {};
      if (!values.full_name) errors.full_name = 'Vui lòng nhập họ và tên.';
      else if (values.full_name.length < 2 || values.full_name.length > 100)
        errors.full_name = 'Họ và tên có từ 2 đến 100 ký tự.';
      else if (!/^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u.test(values.full_name))
        errors.full_name =
          'Họ và tên chỉ gồm chữ, khoảng trắng, dấu chấm, dấu nháy hoặc gạch ngang.';
      if (!values.email) errors.email = 'Vui lòng nhập email.';
      else if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
        errors.email = 'Vui lòng nhập email đầy đủ, ví dụ nhanvien@example.com.';
      if (!values.phone) errors.phone = 'Vui lòng nhập số điện thoại.';
      else if (!/^0[35789][0-9]{8}$/.test(values.phone))
        errors.phone = 'Vui lòng nhập số di động Việt Nam hợp lệ (10 số hoặc +84).';
      if (creating && !values.username) errors.username = 'Vui lòng nhập tên đăng nhập.';
      else if (creating && !/^[A-Za-z][A-Za-z0-9_.-]{3,49}$/.test(values.username))
        errors.username =
          'Tên đăng nhập có 4–50 ký tự, bắt đầu bằng chữ; chỉ dùng chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.';
      if (creating || values.password || values.password_confirmation) {
        if (!values.password.trim())
          errors.password = 'Vui lòng nhập mật khẩu, không chỉ gồm khoảng trắng.';
        else if (values.password.length < 8 || values.password.length > 64)
          errors.password = 'Mật khẩu có từ 8 đến 64 ký tự.';
        else if (new TextEncoder().encode(values.password).length > 72)
          errors.password = 'Mật khẩu quá dài; vui lòng sử dụng mật khẩu ngắn hơn.';
        if (!values.password_confirmation)
          errors.password_confirmation = 'Vui lòng xác nhận mật khẩu.';
        else if (values.password_confirmation !== values.password)
          errors.password_confirmation = 'Mật khẩu xác nhận không khớp.';
      }
      if (!roles.some((role) => role.id === values.role_id))
        errors.role_id = 'Vui lòng chọn vai trò hợp lệ.';
      return errors;
    }
    // Đưa lỗi vào đúng ô nhập và cập nhật trạng thái hỗ trợ trình đọc màn hình.
    function showErrors(errors, names = fields) {
      for (const name of names) {
        const input = form.elements[name];
        const message = errors[name] || '';
        const error = document.getElementById(input.id + '_error');
        error.textContent = message;
        error.hidden = !message;
        input.setAttribute('aria-invalid', String(!!message));
        input.classList.toggle('border-red-500', !!message);
      }
    }
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = readValues();
      const errors = validate(body);
      fields.forEach((name) => touched.add(name));
      showErrors(errors);
      if (Object.keys(errors).length) {
        form.elements[Object.keys(errors)[0]].focus();
        return;
      }
      if (!creating && !body.password) {
        delete body.password;
        delete body.password_confirmation;
      }
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        await request('/api/employees' + (creating ? '' : '/' + id), {
          method: creating ? 'POST' : 'PUT',
          body: JSON.stringify(body),
        });
        location.href = '/admin/employees/index.html';
      } catch (error) {
        // API có thể trả lỗi theo tên thuộc tính C# hoặc tên JSON; quy về tên ô trên form.
        const serverErrors = {};
        for (const [key, messages] of Object.entries(error.errors || {})) {
          const name = key
            .split('.')
            .pop()
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .toLowerCase();
          if (fields.includes(name)) serverErrors[name] = [].concat(messages).join(' ');
        }
        showErrors(serverErrors);
        const first = Object.keys(serverErrors)[0];
        if (first) form.elements[first].focus();
        else failure(error);
      } finally {
        button.disabled = false;
      }
    });
  }
  window.Part2EmployeePages = { start, list, edit };
  start().catch(failure);
})();
