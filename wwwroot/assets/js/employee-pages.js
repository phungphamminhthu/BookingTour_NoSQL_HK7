// Chỉ trang nhân viên dùng file này; các trang admin khác giữ nguyên script cũ.
(() => {
  const { $, text, escape: esc, request, requireUser, notice, failure } = window.Part2;
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

  // Thuật toán hiển thị dải số trang thông minh với dấu "..." đồng bộ Admin Portal
  function getPaginationRange(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  async function list(current, roles) {
    const PAGE_SIZE = 5;
    const form = $('main form');
    const params = getParams();

    if (form) {
      form.elements.keyword.value = params.get('search') || params.get('keyword') || '';
      form.elements.roleId.innerHTML =
        '<option value="">Tất cả vai trò</option>' +
        roles.map((r) => `<option value="${r.id}">${esc(r.role_name)}</option>`).join('');
      form.elements.roleId.value = params.get('roleId') || '';

      form.onsubmit = (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const q = getParams();
        const kw = (fd.get('keyword') || '').toString().trim();
        const rId = (fd.get('roleId') || '').toString().trim();

        if (kw) q.set('search', kw);
        else q.delete('search');
        q.delete('keyword');

        if (rId) q.set('roleId', rId);
        else q.delete('roleId');

        // Reset về trang 1 khi tìm kiếm hoặc lọc vai trò
        q.set('page', '1');
        window.history.pushState({}, '', '?' + q.toString());
        fetchAndRender();
      };

      const reset = form.querySelector('a');
      if (reset) {
        reset.onclick = (ev) => {
          ev.preventDefault();
          form.elements.keyword.value = '';
          form.elements.roleId.value = '';
          const q = new URLSearchParams();
          q.set('page', '1');
          window.history.pushState({}, '', '/admin/employees/index.html');
          fetchAndRender();
        };
      }
    }

    const createBtn = $('main header a');
    if (createBtn) createBtn.href = '/admin/employees/create.html';

    async function fetchStats() {
      try {
        const stats = await Promise.all([
          request('/api/employees?pageSize=1'),
          ...roles.map((r) => request('/api/employees?pageSize=1&roleId=' + r.id)),
        ]);
        const numbers = document.querySelectorAll('[data-employee-stat]');
        numbers.forEach((el, i) => (el.textContent = stats[i]?.total ?? 0));
      } catch (err) {
        console.warn('Lỗi cập nhật thống kê:', err);
      }
    }

    function renderCard(e, index, total) {
      const isCurrent = e.id === current.id;
      const initial = (e.full_name?.trim()?.charAt(0) || e.username?.charAt(0) || 'N').toUpperCase();
      const isLastOdd = total % 2 === 1 && index === total - 1;
      const layoutClass = isLastOdd ? 'employee-card-center-last' : '';

      let roleBadgeClass = 'bg-blue-50 text-blue-900 border-blue-200';
      let roleIcon = 'badge';
      let avatarBg = 'bg-gradient-to-br from-blue-800 to-blue-950';

      const roleName = (e.role_name || '').toLowerCase();
      if (roleName.includes('admin') || roleName.includes('quản trị')) {
        roleBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
        roleIcon = 'admin_panel_settings';
        avatarBg = 'bg-gradient-to-br from-purple-700 to-purple-900';
      } else if (roleName.includes('sale') || roleName.includes('kinh doanh') || roleName.includes('tư vấn')) {
        roleBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        roleIcon = 'sell';
        avatarBg = 'bg-gradient-to-br from-emerald-600 to-emerald-800';
      } else if (roleName.includes('guide') || roleName.includes('hướng dẫn')) {
        roleBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
        roleIcon = 'explore';
        avatarBg = 'bg-gradient-to-br from-amber-500 to-amber-700';
      }

      return `
        <article class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between group ${layoutClass}">
          <div>
            <!-- Card Header: Avatar, Name, Username & Role -->
            <div class="flex items-start justify-between gap-3 mb-3.5">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-xl ${avatarBg} text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs select-none">
                  ${esc(initial)}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <h4 class="font-extrabold text-blue-950 text-base truncate group-hover:text-blue-700 transition" title="${esc(e.full_name)}">
                      ${esc(e.full_name)}
                    </h4>
                    ${isCurrent ? `<span class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">Bạn</span>` : ''}
                  </div>
                  <p class="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <span class="font-bold text-slate-500">#${e.id}</span>
                    <span>·</span>
                    <span class="text-slate-500 font-sans truncate">@${esc(e.username)}</span>
                  </p>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${roleBadgeClass}">
                <span class="material-symbols-outlined text-xs">${roleIcon}</span>
                <span>${esc(e.role_name || 'Nhân viên')}</span>
              </span>
            </div>

            <!-- Contact Details Box -->
            <div class="space-y-1.5 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div class="flex items-center gap-2 text-slate-600 min-w-0" title="${esc(e.email)}">
                <span class="material-symbols-outlined text-slate-400 text-sm shrink-0">mail</span>
                <span class="truncate font-medium">${esc(e.email || '—')}</span>
              </div>
              <div class="flex items-center gap-2 text-slate-600 font-mono">
                <span class="material-symbols-outlined text-slate-400 text-sm shrink-0">call</span>
                <span class="font-medium">${esc(e.phone || 'Chưa cập nhật')}</span>
              </div>
            </div>
          </div>

          <!-- Card Footer: Actions -->
          <div class="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <div class="text-[11px] text-slate-400 font-medium truncate">
              Vai trò: <span class="font-bold text-slate-700">${esc(e.role_name || 'Nhân viên')}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <a href="/admin/employees/edit.html?id=${e.id}"
                 class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition shadow-xs"
                 title="Chỉnh sửa thông tin">
                <span class="material-symbols-outlined text-sm">edit</span>
                <span>Sửa</span>
              </a>
              ${isCurrent ? `
                <button type="button" disabled
                        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed opacity-60"
                        title="Không thể tự xóa tài khoản đang đăng nhập">
                  <span class="material-symbols-outlined text-sm">delete</span>
                  <span>Xóa</span>
                </button>
              ` : `
                <button type="button"
                        data-delete="${e.id}"
                        data-name="${esc(e.full_name)}"
                        class="btn-delete-employee inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition shadow-xs"
                        title="Xóa nhân viên">
                  <span class="material-symbols-outlined text-sm">delete</span>
                  <span>Xóa</span>
                </button>
              `}
            </div>
          </div>
        </article>
      `;
    }

    function renderPagination(totalItems, safeCurrentPage, safeTotalPages, pageSize) {
      const summaryEl = document.getElementById('employeePaginationSummary');
      if (summaryEl) {
        if (totalItems === 0) {
          summaryEl.innerHTML = `Hiển thị <span class="font-bold text-blue-900">0</span> trong tổng số <span class="font-bold text-blue-900">0</span> nhân viên`;
        } else {
          const start = (safeCurrentPage - 1) * pageSize + 1;
          const end = Math.min(safeCurrentPage * pageSize, totalItems);
          summaryEl.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trong tổng số <span class="font-bold text-blue-900">${totalItems}</span> nhân viên`;
        }
      }

      const totalBadge = document.getElementById('employeeTotalBadge');
      if (totalBadge) totalBadge.textContent = totalItems;

      const employeeTotalEl = document.getElementById('employeeTotal');
      if (employeeTotalEl) employeeTotalEl.textContent = `Tổng ${totalItems} nhân viên phù hợp`;

      const headingEl = document.getElementById('employeeListHeading');
      if (headingEl) headingEl.textContent = `Danh sách Nhân viên (${totalItems})`;

      const buttonsContainer =
        document.getElementById('employeePaginationButtons') || document.getElementById('employeePagination');
      if (!buttonsContainer) return;

      let btns = '';

      // Nút Previous
      if (safeCurrentPage > 1) {
        btns += `
          <button type="button" class="btn-page-prev w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" title="Trang trước">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed select-none" title="Trang trước">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      }

      // Nút số trang thông minh
      const pageNumbers = getPaginationRange(safeCurrentPage, safeTotalPages);
      for (const p of pageNumbers) {
        if (p === '...') {
          btns += `<span class="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm select-none">...</span>`;
        } else if (p === safeCurrentPage) {
          btns += `<span class="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-900 bg-blue-900 text-white font-bold text-sm shadow-xs select-none">${p}</span>`;
        } else {
          btns += `<button type="button" class="btn-page-num w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" data-page="${p}">${p}</button>`;
        }
      }

      // Nút Next
      if (safeCurrentPage < safeTotalPages) {
        btns += `
          <button type="button" class="btn-page-next w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" title="Trang tiếp theo">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed select-none" title="Trang tiếp theo">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      }

      buttonsContainer.innerHTML = btns;

      // Gắn sự kiện click cho các nút phân trang
      buttonsContainer.querySelector('.btn-page-prev')?.addEventListener('click', () => {
        if (safeCurrentPage > 1) goToPage(safeCurrentPage - 1);
      });

      buttonsContainer.querySelector('.btn-page-next')?.addEventListener('click', () => {
        if (safeCurrentPage < safeTotalPages) goToPage(safeCurrentPage + 1);
      });

      buttonsContainer.querySelectorAll('.btn-page-num').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetPage = Number(btn.getAttribute('data-page'));
          if (targetPage && targetPage !== safeCurrentPage) {
            goToPage(targetPage);
          }
        });
      });
    }

    function goToPage(page) {
      const q = getParams();
      q.set('page', String(page));
      window.history.pushState({}, '', '?' + q.toString());
      fetchAndRender();

      const scrollTarget = document.getElementById('employeeListHeading') || form;
      if (scrollTarget) {
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    async function fetchAndRender() {
      const q = getParams();
      q.set('pageSize', String(PAGE_SIZE));

      const listContainer = $('#employeeList');
      if (listContainer) {
        listContainer.innerHTML = `
          <div class="col-span-full py-16 text-center text-slate-400">
            <span class="material-symbols-outlined text-4xl animate-spin text-blue-900 mb-2">progress_activity</span>
            <p class="text-sm font-medium">Đang tải danh sách nhân viên...</p>
          </div>
        `;
      }

      try {
        const result = await request('/api/employees?' + q.toString());
        const totalItems = Number(result?.total) || 0;
        const requestedPage = Math.max(1, Number(q.get('page')) || 1);
        const pageSize = Number(result?.pageSize) || PAGE_SIZE;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const safeCurrentPage = Math.min(requestedPage, totalPages);

        // Render Cards
        if (!result.data || result.data.length === 0) {
          listContainer.innerHTML = `
            <div class="col-span-full bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs">
              <div class="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <span class="material-symbols-outlined text-3xl">badge</span>
              </div>
              <h4 class="text-base font-bold text-slate-700">Không tìm thấy nhân viên nào</h4>
              <p class="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc lọc theo vai trò khác.</p>
            </div>
          `;
        } else {
          listContainer.innerHTML = result.data.map((e, index, arr) => renderCard(e, index, arr.length)).join('');

          // Gắn sự kiện Xóa nhân viên
          document.querySelectorAll('.btn-delete-employee').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-delete');
              const name = btn.getAttribute('data-name') || `#${id}`;

              if (!confirm(`Xác nhận xóa nhân viên "${name}" (#${id})?\nHành động này không thể hoàn tác.`)) {
                return;
              }

              btn.disabled = true;
              try {
                await request('/api/employees/' + id, { method: 'DELETE' });
                notice(`Đã xóa nhân viên "${name}" thành công!`);

                // Nếu xóa bản ghi cuối cùng trên trang hiện tại và không phải trang 1, tự động lùi về trang trước
                if (result.data.length === 1 && safeCurrentPage > 1) {
                  const nextQ = getParams();
                  nextQ.set('page', String(safeCurrentPage - 1));
                  window.history.replaceState({}, '', '?' + nextQ.toString());
                }

                await fetchAndRender();
                await fetchStats();
              } catch (err) {
                failure(err);
                btn.disabled = false;
              }
            });
          });
        }

        // Render Pagination đồng bộ
        renderPagination(totalItems, safeCurrentPage, totalPages, pageSize);
      } catch (err) {
        if (listContainer) {
          listContainer.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
              <span class="material-symbols-outlined text-3xl text-red-500 mb-2">error</span>
              <p class="font-bold text-sm">Không thể tải danh sách nhân viên</p>
              <p class="text-xs mt-1 text-red-600">${esc(err.message || 'Lỗi không xác định')}</p>
              <button type="button" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition" onclick="location.reload()">
                Thử lại
              </button>
            </div>
          `;
        }
        failure(err);
      }
    }

    // Xử lý khi người dùng ấn nút Back/Forward trên trình duyệt
    window.addEventListener('popstate', () => {
      fetchAndRender();
    });

    await fetchStats();
    await fetchAndRender();
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

  window.Part2EmployeePages = { start, list, edit, getPaginationRange };
  start().catch(failure);
})();
