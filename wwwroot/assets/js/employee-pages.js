// Chỉ trang nhân viên dùng file này; các trang admin khác giữ nguyên script cũ.
(() => {
  const { $, text, escape: esc, request, requireUser, notice, failure, pagination } = window.Part2;
  const getParams = () => new URLSearchParams(window.location.search);

  let starting = false;

  async function start() {
    if (starting) return;
    starting = true;
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
      const path = location.pathname.toLowerCase();
      const isIndex = path.endsWith('/index.html') || path.endsWith('/employees') || path.endsWith('/employees/');
      if (isIndex) await list(current, roles);
      else await edit(roles);
      notice('');
      buttons.forEach((button) => (button.disabled = false));
    } finally {
      starting = false;
    }
  }

  async function list(current, roles) {
    const params = getParams();
    const form = $('main form');
    if (form) {
      form.elements.keyword.value = params.get('search') || '';
      form.elements.roleId.innerHTML =
        '<option value="">Tất cả vai trò</option>' +
        roles.map((r) => `<option value="${r.id}">${esc(r.role_name)}</option>`).join('');
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
          (
            e,
          ) => `<article class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
      <div class="flex items-center gap-4"><div class="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-black">${esc(e.full_name.slice(0, 1))}</div><div><h3 class="font-extrabold text-blue-950">${esc(e.full_name)}</h3><p class="text-xs text-slate-500 mt-1">#${e.id} · ${esc(e.email)}</p><p class="text-xs mt-1">${esc(e.phone)} · ${esc(e.username)}</p></div></div>
      <span class="text-xs font-bold text-purple-700">${esc(e.role_name)}</span><div class="flex gap-4"><a class="text-primary font-bold" href="/admin/employees/edit.html?id=${e.id}">Sửa</a><button type="button" class="text-red-600" data-delete="${e.id}" ${e.id === current.id ? 'disabled' : ''}>Xóa</button></div></article>`,
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
            button.disabled = false;
          }
        }),
    );
  }

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
        roles.map((r) => `<option value="${r.id}">${esc(r.role_name)}</option>`).join('');
    }

    if (!creating) {
      const { data: employee } = await request('/api/employees/' + id);
      if (!employee) throw new Error(`Không tìm thấy nhân viên mã ${id}.`);

      for (const key of ['full_name', 'email', 'phone', 'username', 'role_id']) {
        if (form.elements[key]) form.elements[key].value = employee[key] ?? '';
      }

      if (form.elements.username) {
        form.elements.username.readOnly = true;
        form.elements.username.classList.add('bg-slate-100', 'cursor-not-allowed', 'text-slate-500');
      }

      if (form.elements.password) {
        form.elements.password.required = false;
        form.elements.password.value = '';
      }
      if (form.elements.password_confirmation) {
        form.elements.password_confirmation.required = false;
        form.elements.password_confirmation.value = '';
      }

      const titleEl = document.getElementById('editEmployeeTitle') || $('main header h2') || $('h2');
      if (titleEl) {
        titleEl.textContent = `Chỉnh Sửa Nhân Viên #${employee.id} - ${employee.full_name}`;
      }
      document.title = `Chỉnh sửa Nhân viên #${employee.id} - Vietnam Expeditions`;
    }

    form.onsubmit = async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      try {
        const fd = new FormData(form);
        const pwd = (fd.get('password') || '').toString().trim();
        const pwdConf = (fd.get('password_confirmation') || '').toString().trim();

        if (creating && !pwd) {
          throw new Error('Vui lòng nhập mật khẩu.');
        }

        if (pwd || pwdConf) {
          if (pwd !== pwdConf) {
            throw new Error('Mật khẩu xác nhận không khớp.');
          }
          if (pwd.length < 8) {
            throw new Error('Mật khẩu phải có ít nhất 8 ký tự.');
          }
        }

        const body = Object.fromEntries(fd);
        body.role_id = Number(body.role_id);
        delete body.password_confirmation;

        if (!pwd && !creating) {
          delete body.password;
        } else if (pwd) {
          body.password = pwd;
        }

        if (!creating) {
          delete body.username;
        }

        await request('/api/employees' + (creating ? '' : '/' + id), {
          method: creating ? 'POST' : 'PUT',
          body: JSON.stringify(body),
        });

        notice(creating ? 'Thêm nhân viên mới thành công!' : 'Cập nhật nhân viên thành công!');
        setTimeout(() => {
          location.href = '/admin/employees/index.html';
        }, 600);
      } catch (error) {
        failure(error);
      } finally {
        if (button) button.disabled = false;
      }
    };
  }

  window.Part2EmployeePages = { start, list, edit };
  start().catch(failure);
})();
