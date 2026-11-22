/**
 * Admin Pages Controller - Vietnam Expeditions
 * Centralized Administrative Management Engine powered by BookingTourDB.
 * Manages all 8 Admin modules:
 * 1. Dashboard (Overview)
 * 2. Quản lý Tour (Tours: Index, Create, Edit, Show)
 * 3. Quản lý Danh mục (Categories: Index, Create, Edit, Delete, Stats, Search, Pagination)
 * 4. Quản lý Chuyến đi (Departures: Index, Create, Edit, Assign Guide)
 * 5. Quản lý Địa điểm (Locations & Provinces: Index, Create)
 * 6. Quản lý Khách hàng (Customers: Index, Create, Edit, Show)
 * 7. Quản lý Giao dịch (Transactions: Index, Stats, Filter)
 * 8. Quản lý Nhân viên (Employees: Index, Create, Edit)
 */
(() => {
  function getDB() {
    return window.BookingTourDB;
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat('vi-VN').format(Number(amount) || 0) + ' đ';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (_) {
      return dateStr;
    }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return dateStr;
    }
  }

  function renderStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'active' || s === 'open' || s === 'confirmed' || s === 'success' || s === 'paid' || s === 'completed') {
      return '<span class="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">Hoạt động / Khả dụng</span>';
    } else if (s === 'pending' || s === 'processing') {
      return '<span class="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-200">Chờ duyệt</span>';
    } else if (s === 'sold_out' || s === 'full') {
      return '<span class="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase bg-purple-50 text-purple-700 border border-purple-200">Hết chỗ</span>';
    } else if (s === 'cancelled' || s === 'canceled' || s === 'inactive' || s === 'refunded') {
      return '<span class="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase bg-rose-50 text-rose-700 border border-rose-200">Đã hủy / Tạm ngưng</span>';
    }
    return `<span class="px-2.5 py-1 text-[11px] font-bold rounded-full uppercase bg-slate-100 text-slate-700">${status || 'Chưa rõ'}</span>`;
  }

  function getLoginUrl() {
    const isSubfolder = window.location.pathname.includes('/admin/') && window.location.pathname.split('/admin/')[1].includes('/');
    return isSubfolder ? '../../client/auth/login.html' : '../client/auth/login.html';
  }

  // Universal Header, User Display, and Logout Handler
  function setupAdminHeader() {
    const db = getDB();
    const token = localStorage.getItem('bookingtour_token') || sessionStorage.getItem('bookingtour_token');
    const isLoggedOut = sessionStorage.getItem('bookingtour_logged_out') === 'true';

    // If explicitly logged out, ensure we don't display authenticated state
    if (isLoggedOut && !token) {
      window.location.href = getLoginUrl();
      return;
    }

    let user = null;
    try {
      const raw = localStorage.getItem('bookingtour_user') || sessionStorage.getItem('bookingtour_user');
      if (raw) user = JSON.parse(raw);
    } catch (_) {}

    if (!user) {
      user = {
        fullName: 'Trần Quản Trị',
        role: 'Admin',
        roleName: 'Quản trị viên'
      };
    }

    const header = document.querySelector('header');
    if (header) {
      const nameEl = header.querySelector('p.text-blue-900') || document.getElementById('adminUserDisplayName');
      const avatarEl = header.querySelector('img') || document.getElementById('adminUserAvatar');
      const roleEl = document.getElementById('adminUserRole');

      const displayName = user.fullName || user.full_name || user.name || 'Trần Quản Trị';
      const roleName = user.roleName || user.role_name || user.role || 'Admin';

      if (nameEl) nameEl.textContent = displayName;
      if (roleEl) roleEl.textContent = roleName === 'Sale' ? 'Nhân viên Sale' : (roleName === 'Guide' ? 'Hướng dẫn viên' : 'Quản trị viên');
      if (avatarEl) {
        avatarEl.src = 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_admin_1e3a8a_80x80.png';
      }
    }

    // Universal Logout Handler
    function handleLogout(e) {
      if (e) e.preventDefault();
      sessionStorage.setItem('bookingtour_logged_out', 'true');
      localStorage.removeItem('bookingtour_token');
      localStorage.removeItem('bookingtour_user');
      localStorage.removeItem('bookingtour_role');
      sessionStorage.removeItem('bookingtour_token');
      sessionStorage.removeItem('bookingtour_user');
      sessionStorage.removeItem('bookingtour_role');

      // Call API logout if client is available
      if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
        window.BookingTourApi.apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
      }

      window.location.href = getLoginUrl();
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = handleLogout;
    }

    document.querySelectorAll('button, a').forEach(el => {
      const text = el.textContent.trim().toLowerCase();
      if (text === 'đăng xuất' || text.includes('logout') || el.dataset.logout !== undefined) {
        el.onclick = handleLogout;
      }
    });

    // Hide any residual empty alert divs
    document.querySelectorAll('.bg-green-100, .bg-red-100, .bg-emerald-50, .bg-rose-50, .bg-red-50').forEach(box => {
      if (box.id) return; // Keep structured alerts with ID
      const txt = box.textContent.trim();
      if (txt === '—' || txt === '' || txt === 'error' || txt === 'check_circle' || box.querySelector('ul:empty')) {
        box.classList.add('hidden');
      }
    });

    // Ensure any residual/stale reset button is completely removed from DOM
    const staleResetBtn = document.getElementById('btnResetMockDB');
    if (staleResetBtn) {
      staleResetBtn.closest('div')?.remove() || staleResetBtn.remove();
    }
    document.querySelectorAll('aside button, aside a, aside div').forEach(el => {
      if (el.textContent && el.textContent.includes('Khôi phục Dữ liệu mẫu')) {
        el.remove();
      }
    });

    // Active Sidebar Nav Highlighting
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll('aside nav a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const hrefLower = href.toLowerCase();
      const isActive = (currentPath.includes('dashboard') && hrefLower.includes('dashboard')) ||
        (currentPath.includes('/tours/') && hrefLower.includes('/tours/')) ||
        (currentPath.includes('/categories/') && hrefLower.includes('/categories/')) ||
        (currentPath.includes('/departures/') && hrefLower.includes('/departures/')) ||
        (currentPath.includes('/locations/') && hrefLower.includes('/locations/')) ||
        (currentPath.includes('/customers/') && hrefLower.includes('/customers/')) ||
        (currentPath.includes('/transactions/') && hrefLower.includes('/transactions/')) ||
        (currentPath.includes('/employees/') && hrefLower.includes('/employees/'));

      if (isActive) {
        a.className = 'rounded-xl mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all font-semibold text-sm bg-blue-900 text-white shadow-sm';
      } else {
        a.className = 'rounded-xl mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all font-semibold text-sm text-slate-600 hover:bg-slate-100 hover:text-blue-900';
      }
    });
  }

  // -------------------------------------------------------------
  // MODULE 1: QUẢN LÝ DANH MỤC (CATEGORIES)
  // -------------------------------------------------------------
  function handleCategoriesIndex() {
    const db = getDB();
    if (!db) return;

    let currentPage = 1;
    const pageSize = 8;
    let searchKeyword = '';

    const alertSuccess = document.getElementById('categoryAlertSuccess');
    const alertSuccessText = document.getElementById('categoryAlertSuccessText');
    const alertError = document.getElementById('categoryAlertError');
    const alertErrorText = document.getElementById('categoryAlertErrorText');

    function showSuccess(msg) {
      if (alertSuccess && alertSuccessText) {
        alertSuccessText.textContent = msg;
        alertSuccess.classList.remove('hidden');
        if (alertError) alertError.classList.add('hidden');
        setTimeout(() => alertSuccess?.classList.add('hidden'), 5000);
      } else {
        alert(msg);
      }
    }

    function showError(msg) {
      if (alertError && alertErrorText) {
        alertErrorText.textContent = msg;
        alertError.classList.remove('hidden');
        if (alertSuccess) alertSuccess.classList.add('hidden');
      } else {
        alert(msg);
      }
    }

    function render() {
      const allCategories = db.getCategories();
      const allTours = db.getTours();

      // Stats
      const totalCategoriesEl = document.getElementById('statTotalCategories');
      const totalClassifiedToursEl = document.getElementById('statTotalClassifiedTours');
      if (totalCategoriesEl) totalCategoriesEl.textContent = allCategories.length;
      if (totalClassifiedToursEl) {
        const classifiedCount = allTours.filter(t => t.category_id).length;
        totalClassifiedToursEl.textContent = classifiedCount;
      }

      // Filter
      let filtered = allCategories;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        filtered = filtered.filter(c => 
          (c.name && c.name.toLowerCase().includes(kw)) ||
          (c.description && c.description.toLowerCase().includes(kw))
        );
      }

      // Heading and Page Badge
      const heading = document.getElementById('categoryListHeading');
      if (heading) heading.textContent = `Danh sách Danh mục (${filtered.length})`;

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;

      const pageBadge = document.getElementById('categoryPageBadge');
      if (pageBadge) pageBadge.textContent = `Trang ${currentPage} / ${totalPages}`;

      // Slice for pagination
      const startIdx = (currentPage - 1) * pageSize;
      const paged = filtered.slice(startIdx, startIdx + pageSize);

      // Render Table Rows (Exact 5 columns)
      const tbody = document.getElementById('categoryTableBody') || document.querySelector('table tbody');
      if (tbody) {
        if (paged.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">category</span>
                <p>Không tìm thấy danh mục tour nào phù hợp.</p>
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = paged.map(c => `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 font-mono font-bold text-slate-500 text-xs">#${c.id}</td>
              <td class="px-6 py-4 font-bold text-blue-950">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-blue-900 text-lg">${c.icon || 'category'}</span>
                  <span>${c.name}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600 max-w-md">${c.description || '—'}</td>
              <td class="px-6 py-4 text-center">
                <span class="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-bold rounded-full border border-blue-100">
                  ${c.tour_count} tour
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button type="button" class="btn-edit-category p-2 hover:bg-orange-50 rounded-lg transition text-orange-600"
                          data-id="${c.id}" data-name="${encodeURIComponent(c.name)}" data-desc="${encodeURIComponent(c.description || '')}" title="Chỉnh sửa">
                    <span class="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button type="button" class="btn-delete-category p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                          data-id="${c.id}" data-name="${c.name}" title="Xóa">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          `).join('');

          // Wire Edit buttons
          tbody.querySelectorAll('.btn-edit-category').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              const name = decodeURIComponent(btn.getAttribute('data-name') || '');
              const desc = decodeURIComponent(btn.getAttribute('data-desc') || '');
              if (typeof window.openEditCategoryModal === 'function') {
                window.openEditCategoryModal(id, name, desc);
              } else {
                const editModal = document.getElementById('editCategoryModal');
                const editId = document.getElementById('editCategoryId');
                const editName = document.getElementById('editCategoryName');
                const editDesc = document.getElementById('editCategoryDescription');
                if (editId) editId.value = id;
                if (editName) editName.value = name;
                if (editDesc) editDesc.value = desc;
                if (editModal) editModal.classList.remove('hidden');
              }
            });
          });

          // Wire Delete buttons
          tbody.querySelectorAll('.btn-delete-category').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              const name = btn.getAttribute('data-name');
              if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) {
                db.deleteCategory(id);
                showSuccess(`Đã xóa danh mục "${name}" thành công!`);
                render();
              }
            });
          });
        }
      }

      // Render Pagination
      const summary = document.getElementById('categoryPaginationSummary');
      if (summary) {
        const start = filtered.length === 0 ? 0 : startIdx + 1;
        const end = Math.min(startIdx + pageSize, filtered.length);
        summary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${filtered.length}</span> danh mục`;
      }

      const buttonsContainer = document.getElementById('categoryPaginationButtons');
      if (buttonsContainer) {
        if (totalPages <= 1) {
          buttonsContainer.innerHTML = '';
        } else {
          let btns = '';
          // Prev
          if (currentPage > 1) {
            btns += `<button type="button" class="btn-page-prev w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"><span class="material-symbols-outlined text-lg">chevron_left</span></button>`;
          } else {
            btns += `<span class="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"><span class="material-symbols-outlined text-lg">chevron_left</span></span>`;
          }

          // Pages
          for (let p = 1; p <= totalPages; p++) {
            if (p === currentPage) {
              btns += `<span class="w-9 h-9 flex items-center justify-center rounded-lg border border-blue-900 bg-blue-900 text-white font-bold text-xs">${p}</span>`;
            } else {
              btns += `<button type="button" class="btn-page-num w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs" data-page="${p}">${p}</button>`;
            }
          }

          // Next
          if (currentPage < totalPages) {
            btns += `<button type="button" class="btn-page-next w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"><span class="material-symbols-outlined text-lg">chevron_right</span></button>`;
          } else {
            btns += `<span class="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"><span class="material-symbols-outlined text-lg">chevron_right</span></span>`;
          }

          buttonsContainer.innerHTML = btns;

          buttonsContainer.querySelector('.btn-page-prev')?.addEventListener('click', () => {
            if (currentPage > 1) {
              currentPage--;
              render();
            }
          });
          buttonsContainer.querySelector('.btn-page-next')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
              currentPage++;
              render();
            }
          });
          buttonsContainer.querySelectorAll('.btn-page-num').forEach(b => {
            b.addEventListener('click', () => {
              currentPage = Number(b.getAttribute('data-page')) || 1;
              render();
            });
          });
        }
      }
    }

    // Search Form Handler
    const searchForm = document.getElementById('searchCategoryForm') || document.querySelector('#category-manager-content form');
    const searchInput = document.getElementById('categorySearchInput') || document.querySelector('input[name="keyword"]');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchKeyword = (searchInput?.value || '').trim();
        currentPage = 1;
        render();
      });
    }

    const btnResetSearch = document.getElementById('btnResetCategorySearch');
    if (btnResetSearch) {
      btnResetSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchKeyword = '';
        currentPage = 1;
        render();
      });
    }

    // Add Category Form Handler
    const addForm = document.getElementById('addCategoryForm') || document.querySelector('#addCategoryModal form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const name = (fd.get('category_name') || fd.get('name') || '').trim();
        const description = (fd.get('description') || '').trim();

        if (!name) {
          showError('Vui lòng nhập tên danh mục!');
          return;
        }

        db.createCategory({
          name,
          description: description || 'Danh mục du lịch đặc sắc',
          icon: 'category',
          slug: name.toLowerCase().replace(/\s+/g, '-')
        });

        document.getElementById('addCategoryModal')?.classList.add('hidden');
        addForm.reset();
        showSuccess(`Đã thêm mới danh mục "${name}" thành công!`);
        render();
      });
    }

    // Edit Category Form Handler
    const editForm = document.getElementById('editCategoryForm') || document.querySelector('#editCategoryModal form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(editForm);
        const id = document.getElementById('editCategoryId')?.value || fd.get('category_id');
        const name = (fd.get('category_name') || fd.get('name') || '').trim();
        const description = (fd.get('description') || '').trim();

        if (!id || !name) {
          showError('Vui lòng nhập đầy đủ thông tin danh mục!');
          return;
        }

        db.updateCategory(id, { name, description });
        document.getElementById('editCategoryModal')?.classList.add('hidden');
        showSuccess(`Đã cập nhật danh mục "${name}" thành công!`);
        render();
      });
    }

    // Initial render
    render();
  }

  // -------------------------------------------------------------
  // MODULE 2: QUẢN LÝ TOUR (TOURS)
  // -------------------------------------------------------------
  async function renderPendingPayments(onConfirmed) {
    const container = document.getElementById('pendingPayments');
    try {
      const api = window.BookingTourApi;
      const { data: transfers } = await api.apiRequest('/api/bookings/pending-payments');
      container.replaceChildren();
      if (!transfers.length) container.textContent = 'Không có đơn chờ xác nhận thanh toán.';
      for (const transfer of transfers) {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3';
        const label = document.createElement('span');
        label.textContent = [transfer.bookingCode, transfer.tourTitle, transfer.paymentOption === "cash" ? "Tiền mặt" : "Chuyển khoản", formatMoney(transfer.totalAmount)].join(' · ');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'rounded-lg bg-blue-900 px-3 py-2 font-bold text-white disabled:opacity-50';
        button.textContent = 'Xác nhận đã nhận tiền';
        button.onclick = async () => {
          if (!confirm('Đã đối chiếu giao dịch ' + transfer.bookingCode + ' với số tiền ' + formatMoney(transfer.totalAmount) + '?')) return;
          button.disabled = true;
          try {
            await api.apiRequest('/api/bookings/' + transfer.id + '/confirm-payment', { method: 'POST' });
            await renderPendingPayments(onConfirmed);
            await onConfirmed();
          } catch (error) {
            alert(error.message);
            button.disabled = false;
          }
        };
        row.append(label, button);
        container.append(row);
      }
    } catch (error) {
      container.textContent = error.message;
    }
  }

  function escapeTourHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  async function adminTourRequest(path, options) {
    const response = await window.BookingTourApi.apiRequest(path, options);
    return response.data;
  }

  async function loadTourOptions() {
    const [categories, provinces] = await Promise.all([
      adminTourRequest('/api/categories'),
      adminTourRequest('/api/provinces')
    ]);
    return {
      categories: categories.map(c => ({ ...c, name: c.category_name })),
      provinces: provinces.map(p => ({ ...p, name: p.province_name }))
    };
  }

  async function loadAdminTours() {
    const tours = [];
    for (let page = 1; ; page++) {
      const response = await window.BookingTourApi.apiRequest('/api/tours?pageSize=100&page=' + page);
      tours.push(...response.data.map(t => ({ ...t, departures: t.departures || [] })));
      if (!response.data.length || tours.length >= response.total) return tours;
    }
  }

  function adminTourId() {
    const id = new URLSearchParams(location.search).get('id');
    if (!/^[1-9][0-9]*$/.test(id || '')) throw new Error('Mã tour không hợp lệ.');
    return id;
  }

  const tourDayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

  function isPastTourDeparture(departure) {
    return tourDayFormat.format(new Date(departure.departure_date)) < tourDayFormat.format(new Date());
  }

  async function handleToursIndex() {
    const { categories, provinces } = await loadTourOptions();
    const isOpen = d => d.status === 'open' && d.available_seats > 0 && !isPastTourDeparture(d);
    let allTours = await loadAdminTours();

    const urlParams = new URLSearchParams(window.location.search);
    let page = 1;
    const pageSize = 10;
    const previous = document.querySelector('[data-tour-prev]');
    const next = document.querySelector('[data-tour-next]');
    let keyword = urlParams.get('keyword') || '';
    let catId = urlParams.get('category_id') || '';
    let provId = urlParams.get('province_id') || '';

    // Populate Category select
    const catSelect = document.querySelector('select[name="category_id"]');
    if (catSelect) {
      const cats = categories;
      catSelect.innerHTML = '<option value="">Tất cả danh mục</option>' +
        cats.map(c => `<option value="${c.id}" ${String(c.id) === catId ? 'selected' : ''}>${escapeTourHtml(c.name)}</option>`).join('');
    }

    // Populate Province select
    const provSelect = document.querySelector('select[name="province_id"]');
    if (provSelect) {
      const provs = provinces;
      provSelect.innerHTML = '<option value="">Tất cả tỉnh thành</option>' +
        provs.map(p => `<option value="${p.id}" ${String(p.id) === provId ? 'selected' : ''}>${escapeTourHtml(p.name)} (${escapeTourHtml(p.region)})</option>`).join('');
    }

    const keywordInput = document.querySelector('input[name="keyword"]');
    if (keywordInput) keywordInput.value = keyword;

    function renderTours() {
      const openTours = allTours.filter(t => t.departures.some(isOpen)).length;
      const totalDeps = allTours.reduce((sum, t) => sum + t.departures.length, 0);

      // Stats
      const statTotalToursEl = document.querySelector('.border-l-blue-900 h3');
      if (statTotalToursEl) statTotalToursEl.textContent = allTours.length;

      const statOpenToursEl = document.querySelector('.border-l-emerald-600 h3, .border-l-green-600 h3');
      if (statOpenToursEl) statOpenToursEl.textContent = openTours;

      const statTotalDepsEl = document.querySelector('.border-l-orange-500 h3');
      if (statTotalDepsEl) statTotalDepsEl.textContent = totalDeps;

      const q = keyword.toLocaleLowerCase('vi');
      const filtered = allTours.filter(t =>
        (!catId || String(t.category_id) === catId) &&
        (!provId || String(t.province_id) === provId) &&
        (!q || [t.title, t.pickup_point, t.province_name].some(value => value?.toLocaleLowerCase('vi').includes(q)))
      );

      const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = Math.min(page, pages);
      const offset = (page - 1) * pageSize;
      const visible = filtered.slice(offset, offset + pageSize);
      previous.disabled = page <= 1;
      next.disabled = page >= pages;
      const pageLabel = page + ' / ' + pages;
      document.querySelector('[data-tour-page]').textContent = pageLabel;
      document.querySelector('[data-tour-page-badge]').textContent = 'Trang ' + pageLabel;
      const headingCountEl = document.querySelector('[data-tour-list-title]');
      if (headingCountEl) headingCountEl.textContent = `Danh sách Tour (${filtered.length})`;

      const tbody = document.querySelector('table tbody');
      if (tbody) {
        if (filtered.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="px-8 py-12 text-center text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">tour</span>
                <p>Không tìm thấy tour du lịch nào phù hợp với bộ lọc.</p>
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = visible.map(t => {
            const img = t.thumbnail_url || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';
            const catName = t.category_name || 'Chung';
            const provName = t.province_name || 'Toàn quốc';
            const price = formatMoney(t.min_price);
            const openCount = t.departures.filter(isOpen).length;
            const duration = `${t.duration_days}N${t.duration_nights}Đ`;

            return `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm">
                      <img src="${escapeTourHtml(img)}" alt="${escapeTourHtml(t.title)}" class="w-full h-full object-cover"/>
                    </div>
                    <div>
                      <a href="show.html?id=${t.id}" class="font-bold text-blue-950 hover:text-blue-700 transition line-clamp-1 max-w-xs" title="${escapeTourHtml(t.title)}">
                        ${escapeTourHtml(t.title)}
                      </a>
                      <p class="text-xs text-slate-500 mt-0.5 font-mono">ID: #${t.id}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-slate-600 font-medium">${escapeTourHtml(catName)}</td>
                <td class="px-4 py-4 text-slate-600 font-medium">${escapeTourHtml(provName)}</td>
                <td class="px-4 py-4 text-slate-600 whitespace-nowrap">${duration}</td>
                <td class="px-4 py-4 font-bold text-blue-900 whitespace-nowrap">${price}</td>
                <td class="px-4 py-4 text-center">
                  <span class="px-2.5 py-1 text-xs font-bold rounded-full ${openCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
                    ${openCount} đợt mở bán
                  </span>
                  <a href="show.html?id=${t.id}#schedules" class="block mt-2 text-xs font-bold text-blue-900 hover:underline">
                    ${t.schedules_count ?? 0} ngày lịch trình
                  </a>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-2">
                    <a href="show.html?id=${t.id}" class="p-2 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition" title="Xem chi tiết">
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </a>
                    <a href="edit.html?id=${t.id}" class="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Chỉnh sửa">
                      <span class="material-symbols-outlined text-lg">edit</span>
                    </a>
                    <button type="button" class="btn-delete-tour p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" data-id="${t.id}" title="Xóa tour">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');

          tbody.querySelectorAll('.btn-delete-tour').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Bạn có chắc chắn muốn xóa tour này và toàn bộ lịch khởi hành liên quan?')) {
                btn.disabled = true;
                try {
                  await adminTourRequest('/api/tours/' + id, { method: 'DELETE' });
                  allTours = allTours.filter(t => String(t.id) !== id);
                  renderTours();
                } catch (error) {
                  alert(error.message);
                  btn.disabled = false;
                }
              }
            });
          });
        }
      }

      const paginationInfoEl = document.querySelector('[data-tour-list-pagination]');
      if (paginationInfoEl) {
        paginationInfoEl.textContent = visible.length
          ? 'Hiển thị ' + (offset + 1) + '–' + (offset + visible.length) + ' trên ' + filtered.length + ' tour'
          : 'Không có tour';
      }
    }

    const filterForm = catSelect?.form;
    if (filterForm && !filterForm.classList.contains('px-4')) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        page = 1;
        keyword = (keywordInput?.value || '').trim();
        catId = catSelect?.value || '';
        provId = provSelect?.value || '';
        renderTours();
      });
    }

    previous.onclick = () => { page--; renderTours(); };
    next.onclick = () => { page++; renderTours(); };
    renderTours();
  }

  async function handleTourForm(isEdit) {
    const id = isEdit ? adminTourId() : null;
    const [{ categories, provinces }, tour] = await Promise.all([
      loadTourOptions(),
      id ? adminTourRequest('/api/tours/' + id) : null
    ]);
    const form = document.querySelector('main form');
    const fields = form.elements;
    function fillSelect(select, items, selected, label) {
      select.replaceChildren(new Option(label, ''));
      for (const item of items) select.add(new Option(item.name, item.id));
      select.value = selected ?? '';
    }
    fillSelect(fields.categoryId, categories, tour?.category_id, 'Chọn danh mục');
    fillSelect(fields.provinceId, provinces, tour?.province_id, 'Chọn tỉnh thành');
    if (tour) {
      for (const [field, value] of Object.entries({
        title: tour.title, durationDays: tour.duration_days, durationNights: tour.duration_nights,
        minPrice: tour.min_price, pickupPoint: tour.pickup_point, description: tour.description,
        itinerarySummary: tour.itinerary_summary, includedServices: tour.included_services
      })) fields[field].value = value ?? '';
      const cover = form.querySelector('img[alt="Ảnh đại diện tour"]');
      cover.hidden = !tour.thumbnail_url;
      if (tour.thumbnail_url) cover.src = tour.thumbnail_url;
      const coverUrl = form.querySelector('p.break-all');
      if (coverUrl) coverUrl.textContent = tour.thumbnail_url || 'Chưa có ảnh';
    }
    const cancel = form.querySelector('a[href="#"]');
    if (cancel) cancel.href = id ? 'show.html?id=' + id : 'index.html';
    const button = form.querySelector('button[type="submit"]');
    button.disabled = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      const data = new FormData(form);
      const text = name => String(data.get(name) ?? '').trim();
      const file = data.get('thumbnailImage');
      const thumbnailUrl = text('thumbnailUrl');
      const payload = {
        title: text('title'), categoryId: Number(text('categoryId')), provinceId: Number(text('provinceId')),
        durationDays: Number(text('durationDays')), durationNights: Number(text('durationNights')),
        minPrice: Number(text('minPrice')), pickupPoint: text('pickupPoint'), description: text('description'),
        itinerarySummary: text('itinerarySummary'), includedServices: text('includedServices'),
        thumbnailUrl: file?.size || thumbnailUrl === tour?.thumbnail_url ? null : thumbnailUrl
      };
      if (!payload.title || !payload.categoryId || !payload.provinceId || !payload.durationDays || payload.minPrice < 0) {
        alert('Vui lòng nhập đủ thông tin tour và giá hợp lệ.');
        return;
      }
      button.disabled = true;
      let saved;
      try {
        saved = await adminTourRequest('/api/tours' + (id ? '/' + id : ''), {
          method: id ? 'PUT' : 'POST', body: JSON.stringify(payload)
        });
        if (file?.size) {
          const upload = new FormData();
          upload.set('file', file);
          upload.set('isThumbnail', 'true');
          await adminTourRequest('/api/tours/' + saved.id + '/images', { method: 'POST', body: upload });
        }
        location.href = 'show.html?id=' + saved.id;
      } catch (error) {
        if (saved) {
          alert('Tour đã lưu. Tải ảnh thất bại: ' + error.message);
          location.href = 'edit.html?id=' + saved.id;
        } else {
          alert(error.message);
          button.disabled = false;
        }
      }
    });
  }

  async function handleToursShow() {
    const id = adminTourId();
    const tour = await adminTourRequest('/api/tours/' + id);
    const root = document.getElementById('tour-detail-content');
    const set = (selector, text) => {
      const field = root.querySelector(selector);
      if (field) field.textContent = text || '—';
    };
    set('h1', tour.title);
    set('[data-tour-category]', tour.category_name);
    set('[data-tour-province]', tour.province_name);
    set('[data-tour-header-duration]', tour.duration_days + ' ngày ' + tour.duration_nights + ' đêm');
    const descriptions = root.querySelectorAll('p.text-slate-700.leading-relaxed');
    [tour.description, tour.itinerary_summary, tour.included_services].forEach((text, index) => {
      descriptions[index].textContent = text || '—';
    });
    const stats = root.querySelectorAll('ul.space-y-3\\.5 > li > span:last-child');
    ['#' + id, tour.category_name, tour.duration_days + ' ngày ' + tour.duration_nights + ' đêm',
      tour.pickup_point, formatMoney(tour.min_price)].forEach((text, index) => {
      if (stats[index]) stats[index].textContent = text || '—';
    });
    root.querySelector('[data-tour-edit]').href = 'edit.html?id=' + id;
    root.querySelector('[data-tour-list]').href = 'index.html';
    const scheduleSection = root.querySelector('#schedules');
    const scheduleList = scheduleSection.querySelector('[data-tour-schedules]');
    const editForm = document.getElementById('editScheduleForm');
    let schedules = tour.schedules || [];

    function renderSchedules() {
      set('[data-tour-schedule-count]', String(schedules.length));
      scheduleList.innerHTML = schedules.map(schedule => `
        <div class="border-l-4 border-blue-500 pl-4 py-3 pr-4 bg-slate-50 rounded-r-xl flex justify-between gap-3">
          <div class="min-w-0">
            <h4 class="font-bold text-blue-950 text-sm">Ngày ${schedule.day_number} · ${escapeTourHtml(schedule.title.replace(new RegExp(`^Ngày\\s+${schedule.day_number}\\s*[:·–-]\\s*`, 'iu'), '') || schedule.title)}</h4>
            <p class="text-xs text-slate-600 mt-2 whitespace-pre-line">${escapeTourHtml(schedule.activities)}</p>
          </div>
          <div class="flex items-start gap-2 shrink-0">
            <button type="button" data-edit-schedule="${schedule.id}" class="text-blue-900 text-xs font-bold px-2 py-1" aria-label="Sửa ngày ${schedule.day_number}">Sửa</button>
            <button type="button" data-delete-schedule="${schedule.id}" class="text-red-700 text-xs font-bold px-2 py-1" aria-label="Xóa ngày ${schedule.day_number}">Xóa</button>
          </div>
        </div>`).join('') || '<p class="text-sm text-slate-500">Chưa có lịch trình.</p>';
    }

    async function refreshSchedules() {
      const latest = await adminTourRequest('/api/tours/' + id);
      schedules = latest.schedules || [];
      renderSchedules();
    }

    function bindScheduleForm(form, modal, method) {
      const button = form.querySelector('button[type="submit"]');
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (button.disabled) return;
        const fields = new FormData(form);
        const payload = {
          day_number: Number(fields.get('day_number')),
          title: String(fields.get('title') || '').trim(),
          activities: String(fields.get('activities') || '').trim()
        };
        if (!payload.title) {
          alert('Vui lòng nhập tiêu đề lịch trình.');
          return;
        }
        button.disabled = true;
        try {
          const path = method === 'POST' ? '/api/tours/' + id + '/schedules' : '/api/schedules/' + form.dataset.scheduleId;
          await adminTourRequest(path, { method, body: JSON.stringify(payload) });
          modal.classList.add('hidden');
          if (method === 'POST') form.reset();
          await refreshSchedules();
        } catch (error) {
          alert(error.message);
        } finally {
          button.disabled = false;
        }
      });
    }

    const editModal = document.getElementById('editScheduleModal');
    bindScheduleForm(document.getElementById('addScheduleForm'), document.getElementById('addScheduleModal'), 'POST');
    bindScheduleForm(editForm, editModal, 'PUT');
    scheduleSection.querySelector('[data-add-schedule]').disabled = false;
    scheduleList.addEventListener('click', async event => {
      const button = event.target.closest('[data-edit-schedule], [data-delete-schedule]');
      if (!button || button.disabled) return;
      const schedule = schedules.find(row => String(row.id) === (button.dataset.editSchedule || button.dataset.deleteSchedule));
      if (!schedule) return;
      if (button.dataset.editSchedule) {
        editForm.dataset.scheduleId = schedule.id;
        for (const field of ['day_number', 'title', 'activities']) {
          editForm.elements[field].value = schedule[field] ?? '';
        }
        editModal.classList.remove('hidden');
        editForm.elements.day_number.focus();
        return;
      }
      if (!confirm('Xóa lịch trình ngày ' + schedule.day_number + '?')) return;
      button.disabled = true;
      try {
        await adminTourRequest('/api/schedules/' + schedule.id, { method: 'DELETE' });
        await refreshSchedules();
      } catch (error) {
        alert(error.message);
        button.disabled = false;
      }
    });
    renderSchedules();
    const departures = tour.departures || [];
    root.querySelector('tbody').innerHTML = departures.map(d => `
      <tr>
        <td class="px-4 py-3">#${d.id}</td>
        <td class="px-4 py-3">${formatDate(d.departure_date)} – ${formatDate(d.return_date)}</td>
        <td class="px-4 py-3">${d.available_seats} / ${d.max_seats}</td>
        <td class="px-4 py-3">${formatMoney(d.adult_price)}</td>
        <td class="px-4 py-3">${escapeTourHtml(d.guide_name || '—')}</td>
        <td class="px-4 py-3">${escapeTourHtml((d.status === 'open' && isPastTourDeparture(d) ? 'Đã qua ngày khởi hành' : ({ open: 'Mở bán', full: 'Hết chỗ', cancelled: 'Đã hủy' })[d.status] || d.status))}</td>
        <td class="px-4 py-3"></td>
      </tr>`).join('') || '<tr><td colspan="7" class="p-4 text-slate-500">Chưa có đợt khởi hành.</td></tr>';
    set('[data-tour-departure-count]', String(departures.length));
    const images = tour.images || [];
    set('[data-tour-image-count]', String(images.length));
    const gallery = root.querySelector('[data-tour-gallery]');
    gallery.innerHTML = images.map(image => `
      <div class="aspect-square bg-slate-100 rounded-xl overflow-hidden relative group">
        <img src="${escapeTourHtml(image.img_url)}" alt="Ảnh tour" class="w-full h-full object-cover">
        ${image.is_thumbnail ? '<span class="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 rounded-full">Bìa</span>' : ''}
        <button type="button" data-image-id="${image.id}" class="absolute top-2 right-2 bg-red-700 text-white rounded-full px-2" aria-label="Xóa ảnh">×</button>
      </div>`).join('') || '<p class="text-sm text-slate-500">Chưa có ảnh.</p>';
    gallery.addEventListener('click', async event => {
      const button = event.target.closest('[data-image-id]');
      if (!button || !confirm('Xóa ảnh này khỏi tour?')) return;
      button.disabled = true;
      try {
        await adminTourRequest('/api/tours/images/' + button.dataset.imageId, { method: 'DELETE' });
        location.reload();
      } catch (error) {
        alert(error.message);
        button.disabled = false;
      }
    });
    const uploadForm = document.querySelector('#uploadModal form');
    root.querySelector('[data-tour-upload]').disabled = false;
    uploadForm.addEventListener('submit', async event => {
      event.preventDefault();
      const fields = new FormData(uploadForm);
      const file = fields.get('imageFile');
      const url = String(fields.get('imageUrl') || '').trim();
      if (!file?.size && !url) {
        alert('Vui lòng chọn tệp hoặc nhập URL ảnh.');
        return;
      }
      const payload = new FormData();
      if (file?.size) payload.set('file', file);
      else payload.set('imageUrl', url);
      payload.set('isThumbnail', String(fields.has('isThumbnail')));
      const button = uploadForm.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await adminTourRequest('/api/tours/' + id + '/images', { method: 'POST', body: payload });
        location.reload();
      } catch (error) {
        alert(error.message);
        button.disabled = false;
      }
    });
  }

  function showTourError(error) {
    const message = document.createElement('p');
    message.className = 'm-6 p-4 rounded-xl bg-red-50 text-red-700';
    message.setAttribute('role', 'alert');
    message.textContent = error.message;
    document.querySelector('main').prepend(message);
  }

  // -------------------------------------------------------------
  // MODULE 3: QUẢN LÝ CHUYẾN ĐI (DEPARTURES)
  // -------------------------------------------------------------
  async function handleDeparturesIndex() {
    let allDeps = [];
    for (let page = 1; ; page++) {
      const response = await window.BookingTourApi.apiRequest('/api/departures?pageSize=100&page=' + page);
      allDeps.push(...response.data);
      if (!response.data.length || allDeps.length >= response.total) break;
    }
    const today = tourDayFormat.format(new Date());
    const [year, month] = today.split('-').map(Number);
    const nextMonth = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7);
    const departureDay = d => tourDayFormat.format(new Date(d.departure_date));
    const isOpen = d => d.status === 'open' && d.available_seats > 0 && departureDay(d) >= today;
    const isFull = d => d.status !== 'cancelled' && (d.status === 'full' || d.available_seats <= 0);
    const canDelete = readAdminRole() === 'admin';
    allDeps.sort((a, b) => Number(isPastTourDeparture(a)) - Number(isPastTourDeparture(b)) ||
      new Date(a.departure_date) - new Date(b.departure_date));

    const urlParams = new URLSearchParams(window.location.search);
    let keyword = urlParams.get('keyword') || '';
    let filterDate = urlParams.get('date') || '';
    let currentStatus = 'all';

    function renderDepartures() {
      const openCount = allDeps.filter(isOpen).length;
      const unassignedCount = allDeps.filter(d => !d.guide_id && d.status !== 'cancelled' && departureDay(d) >= today).length;
      const fullCount = allDeps.filter(isFull).length;
      const cancelledCount = allDeps.filter(d => d.status === 'cancelled').length;

      // Update 4 Stat Cards
      const statBlueEl = document.querySelector('.border-l-blue-900 h3');
      if (statBlueEl) statBlueEl.textContent = openCount;

      const statOrangeEl = document.querySelector('.border-l-orange-500 h3');
      if (statOrangeEl) statOrangeEl.textContent = unassignedCount;

      const statEmeraldEl = document.querySelector('.border-l-emerald-600 h3');
      if (statEmeraldEl) statEmeraldEl.textContent = allDeps.filter(d => d.status !== 'cancelled' && departureDay(d) === today).length;

      const statPurpleEl = document.querySelector('.border-l-purple-600 h3');
      if (statPurpleEl) statPurpleEl.textContent = allDeps.filter(d => d.status !== 'cancelled' && departureDay(d).startsWith(nextMonth)).length;

      // Update Status Filter Tabs
      const tabEls = document.querySelectorAll('.flex.flex-wrap.gap-2.mb-6 a');
      if (tabEls.length >= 4) {
        tabEls[0].textContent = `Tất cả (${allDeps.length})`;
        tabEls[1].textContent = `Đang bán (${openCount})`;
        tabEls[2].textContent = `Đã đầy (${fullCount})`;
        tabEls[3].textContent = `Đã hủy (${cancelledCount})`;

        tabEls.forEach((tab, idx) => {
          tab.onclick = (e) => {
            e.preventDefault();
            if (idx === 0) currentStatus = 'all';
            else if (idx === 1) currentStatus = 'open';
            else if (idx === 2) currentStatus = 'full';
            else if (idx === 3) currentStatus = 'cancelled';

            tabEls.forEach(t => t.className = 'px-4 py-2 rounded-xl font-bold text-xs transition bg-slate-100 text-slate-600 hover:bg-slate-200');
            tab.className = 'px-4 py-2 rounded-xl font-bold text-xs transition bg-blue-900 text-white shadow-sm';
            renderDepartures();
          };
        });
      }

      // Filter
      let filtered = allDeps;
      if (currentStatus !== 'all') {
        if (currentStatus === 'open') filtered = filtered.filter(isOpen);
        else if (currentStatus === 'full') filtered = filtered.filter(isFull);
        else if (currentStatus === 'unassigned') filtered = filtered.filter(d => !d.guide_id && d.status !== 'cancelled' && departureDay(d) >= today);
        else if (currentStatus === 'cancelled') filtered = filtered.filter(d => d.status === 'cancelled');
      }

      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter(d => {
          const tTitle = (d.tour?.title || d.tour_title || '').toLowerCase();
          const gName = (d.guide_name || '').toLowerCase();
          const dId = String(d.id).toLowerCase();
          return tTitle.includes(kw) || gName.includes(kw) || ("dep-" + dId).includes(kw) ||
            (d.tour?.province_name || "").toLowerCase().includes(kw);
        });
      }

      if (filterDate) {
        filtered = filtered.filter(d => departureDay(d) === filterDate);
      }

      // Render Card Grid
      const grid = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2.gap-6');
      if (grid) {
        if (filtered.length === 0) {
          grid.innerHTML = `
            <div class="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">flight_takeoff</span>
              <p class="font-medium">Không tìm thấy chuyến khởi hành nào phù hợp.</p>
            </div>`;
        } else {
          grid.innerHTML = filtered.map(d => {
            const tourTitle = d.tour?.title || d.tour_title || '—';
            const provName = d.tour?.province_name || 'Việt Nam';
            const price = formatMoney(d.adult_price);
            const childPrice = formatMoney(d.child_price);
            const booked = d.max_seats - d.available_seats;
            const pct = Math.min(100, Math.round((booked / d.max_seats) * 100));
            const guideName = d.guide_name || 'Chưa phân công';

            const isCancelled = d.status === 'cancelled';

            let statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">Đang bán</span>';
            if (isPastTourDeparture(d)) statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-600 text-white">Đã qua ngày khởi hành</span>';
            else if (isFull(d)) statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">Đã đầy</span>';
            if (isCancelled) statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">Đã hủy</span>';

            return `
              <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div class="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4 text-white">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-semibold uppercase tracking-wider text-blue-200 font-mono">Mã chuyến: #DEP-${d.id}</span>
                      ${statusBadge}
                    </div>
                    <h3 class="text-base font-bold line-clamp-1">
                      <a href="../tours/show.html?id=${d.tour_id}" class="hover:underline">${escapeTourHtml(tourTitle)}</a>
                    </h3>
                    <p class="text-xs text-blue-100 mt-1 flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">location_on</span>
                      <span>${escapeTourHtml(provName)}</span>
                    </p>
                  </div>

                  <div class="p-6 space-y-4 text-sm">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-xs text-slate-500 font-semibold mb-1">Khởi hành</p>
                        <p class="font-bold text-blue-950 flex items-center gap-1 text-xs sm:text-sm">
                          <span class="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                          <span>${formatDate(d.departure_date)}</span>
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-slate-500 font-semibold mb-1">Trở về</p>
                        <p class="font-bold text-blue-950 flex items-center gap-1 text-xs sm:text-sm">
                          <span class="material-symbols-outlined text-sm text-slate-400">event</span>
                          <span>${formatDate(d.return_date)}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-2 text-xs">
                        <p class="font-bold text-slate-600 uppercase">Tình trạng giữ chỗ</p>
                        <p class="font-bold text-blue-900">
                          <span class="font-black">${booked}</span> / ${d.max_seats} khách đã đặt (${d.available_seats} chỗ trống)
                        </p>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div class="h-2.5 rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-rose-500' : (pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500')}" style="width: ${pct}%"></div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <p class="text-slate-500 font-semibold mb-1">Giá người lớn</p>
                        <p class="font-black text-blue-900 text-base">${price}</p>
                      </div>
                      <div>
                        <p class="text-slate-500 font-semibold mb-1">Giá trẻ em</p>
                        <p class="font-black text-blue-900 text-base">${childPrice}</p>
                      </div>
                    </div>

                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-slate-400 text-base">badge</span>
                        <span class="font-semibold text-slate-700">HDV: ${escapeTourHtml(guideName)}</span>
                      </div>
                      ${!d.guide_id ? `<a href="assign_guide.html?departure_id=${d.id}" class="text-orange-600 font-bold hover:underline flex items-center gap-0.5"><span class="material-symbols-outlined text-sm">person_add</span>Phân công</a>` : ''}
                    </div>
                  </div>
                </div>

                <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <a href="assign_guide.html?departure_id=${d.id}" class="p-2 text-blue-900 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1" title="Phân công HDV">
                    <span class="material-symbols-outlined text-base">person_add</span>
                  </a>
                  <a href="edit.html?id=${d.id}" class="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Sửa chuyến">
                    <span class="material-symbols-outlined text-base">edit</span>
                  </a>
                  ${canDelete ? `<button type="button" class="btn-delete-departure p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" data-id="${d.id}" title="Xóa chuyến">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>` : ''}
                </div>
              </div>
            `;
          }).join('');

          grid.querySelectorAll('.btn-delete-departure').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Xác nhận xóa chuyến khởi hành này?')) {
                btn.disabled = true;
                try {
                  await adminTourRequest('/api/departures/' + id, { method: 'DELETE' });
                  allDeps = allDeps.filter(d => String(d.id) !== id);
                  renderDepartures();
                } catch (error) {
                  alert(error.message);
                  btn.disabled = false;
                }
              }
            });
          });
        }
      }
    }

    const searchForm = document.querySelector('main form');
    if (searchForm) {
      searchForm.elements.keyword.value = keyword;
      searchForm.elements.date.value = filterDate;
    }
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        keyword = (searchForm.querySelector('input[name="keyword"]')?.value || '').trim();
        filterDate = searchForm.querySelector('input[name="date"]')?.value || '';
        renderDepartures();
      });
    }

    document.querySelector('[data-unassigned-departures]')?.addEventListener('click', event => {
      event.preventDefault();
      currentStatus = 'unassigned';
      renderDepartures();
    });
    renderDepartures();
  }

  function readAdminRole() {
    const raw = localStorage.getItem('bookingtour_user') || sessionStorage.getItem('bookingtour_user');
    try {
      const user = JSON.parse(raw);
      return String(user?.roleName || user?.role_name || user?.role || '').toLowerCase();
    } catch {
      return '';
    }
  }

  async function handleDepartureForm(mode) {
    const params = new URLSearchParams(location.search);
    const id = params.get(mode === 'guide' ? 'departure_id' : 'id');
    if (mode !== 'create' && !/^[1-9][0-9]*$/.test(id || '')) throw new Error('Mã chuyến khởi hành không hợp lệ.');
    const [departure, tours, guides] = await Promise.all([
      mode === 'create' ? null : adminTourRequest('/api/departures/' + id),
      mode === 'guide' ? [] : loadAdminTours(),
      adminTourRequest('/api/departures/guides')
    ]);
    const form = document.querySelector('main form');
    const fields = form.elements;
    const fill = (select, items, label, selected) => {
      select.replaceChildren(new Option(label, ''), ...items.map(item => new Option(item.label, item.id)));
      select.value = selected ?? '';
    };
    fill(fields.guideId, guides.map(g => ({ id: g.id, label: g.fullName })), 'Chọn hướng dẫn viên', departure?.guide_id);
    if (mode !== 'guide') {
      fill(fields.tourId, tours.map(t => ({ id: t.id, label: t.title })), 'Chọn tour', departure?.tour_id ?? params.get('tour_id'));
      if (departure) {
        fields.departureDate.value = tourDayFormat.format(new Date(departure.departure_date));
        fields.returnDate.value = tourDayFormat.format(new Date(departure.return_date));
        fields.maxSeats.value = departure.max_seats;
        fields.adultPrice.value = departure.adult_price;
        fields.childPrice.value = departure.child_price;
        fields.status.value = departure.status;
      }
    } else {
      const info = document.querySelector('[data-guide-departure]');
      info.textContent = (departure.tour?.title || departure.tour_title || '—') + ' · ' +
        formatDate(departure.departure_date) + ' · HDV: ' + (departure.guide_name || 'Chưa phân công');
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (button.disabled) return;
      let payload = { guide_id: Number(fields.guideId.value) || null };
      if (mode !== 'guide') {
        const start = fields.departureDate.value;
        const end = fields.returnDate.value;
        if (!start || !end || end < start) {
          alert('Ngày về phải bằng hoặc sau ngày khởi hành.');
          return;
        }
        const toInstant = (value, current) =>
          current && tourDayFormat.format(new Date(current)) === value ? current : new Date(value + 'T00:00:00+07:00').toISOString();
        payload = { ...payload,
          tour_id: Number(fields.tourId.value),
          departure_date: toInstant(start, departure?.departure_date),
          return_date: toInstant(end, departure?.return_date),
          max_seats: Number(fields.maxSeats.value), adult_price: Number(fields.adultPrice.value),
          child_price: Number(fields.childPrice.value), status: fields.status.value
        };
      }

      button.disabled = true;
      try {
        const path = mode === 'create' ? '/api/departures' : '/api/departures/' + id +
          (mode === 'guide' ? '/assign-guide' : '');
        await adminTourRequest(path, { method: mode === 'edit' ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        location.href = 'index.html';
      } catch (error) {
        alert(error.message);
        button.disabled = false;
      }
    });
  }

  // -------------------------------------------------------------
  // MODULE 4: QUẢN LÝ ĐỊA ĐIỂM (LOCATIONS & PROVINCES)
  // -------------------------------------------------------------
  function handleLocationsIndex() {
    const db = getDB();
    if (!db) return;

    const provs = db.getProvinces();
    const tours = db.getTours();

    // Stats
    const northCount = provs.filter(p => p.region.includes('Bắc')).length;
    const centralCount = provs.filter(p => p.region.includes('Trung')).length;
    const southCount = provs.filter(p => p.region.includes('Nam')).length;

    const statProvsEl = document.querySelector('.border-l-blue-900 p.text-3xl');
    if (statProvsEl) {
      statProvsEl.textContent = provs.length;
      const sub = statProvsEl.nextElementSibling;
      if (sub) sub.textContent = `Bắc: ${northCount} • Trung: ${centralCount} • Nam: ${southCount}`;
    }

    const statToursEl = document.querySelector('.border-l-emerald-600 p.text-3xl');
    if (statToursEl) statToursEl.textContent = tours.length;

    const statActiveProvsEl = document.querySelector('.border-l-purple-600 p.text-3xl');
    if (statActiveProvsEl) {
      const activeCount = provs.filter(p => p.tour_count > 0).length;
      statActiveProvsEl.textContent = activeCount;
    }

    const statAirportsEl = document.querySelector('.border-l-amber-500 p.text-3xl');
    if (statAirportsEl) statAirportsEl.textContent = 8; // Điểm đón khách chính

    // Render Province Cards Grid
    const provGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-5');
    if (provGrid) {
      provGrid.innerHTML = provs.map(p => `
        <div class="bg-slate-50 rounded-2xl p-5 hover:bg-blue-50/50 hover:border-blue-200 transition-all border border-slate-100 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <h4 class="font-black text-blue-950 text-base truncate">${p.name}</h4>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">${p.region}</span>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2 mt-1">${p.description || 'Điểm đến du lịch hấp dẫn với nhiều cảnh quan đẹp.'}</p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <span class="text-xs font-bold text-blue-900 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">tour</span>
              ${p.tour_count} tour khai thác
            </span>
            <button type="button" class="btn-delete-prov text-rose-500 hover:text-rose-700 p-1" data-id="${p.id}" title="Xóa tỉnh thành">
              <span class="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </div>
      `).join('');

      provGrid.querySelectorAll('.btn-delete-prov').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (confirm('Xác nhận xóa tỉnh thành này?')) {
            db.deleteProvince(id);
            alert('Đã xóa tỉnh thành!');
            handleLocationsIndex();
          }
        });
      });
    }

    // Render Tuyến Tour / Điểm Tham Quan Table
    const tbody = document.querySelector('table tbody');
    if (tbody) {
      tbody.innerHTML = tours.map(t => {
        const provName = t.province?.name || 'Việt Nam';
        const catName = t.category?.name || 'Khám phá';
        const img = (t.images && t.images[0]) || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';
        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3.5 px-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  <img src="${img}" alt="${t.title}" class="w-full h-full object-cover"/>
                </div>
                <span class="font-bold text-blue-950">${t.title}</span>
              </div>
            </td>
            <td class="py-3.5 px-4 font-medium text-slate-700">${provName}</td>
            <td class="py-3.5 px-4">
              <span class="bg-blue-50 text-blue-900 px-2.5 py-1 rounded-full text-xs font-bold">${catName}</span>
            </td>
            <td class="py-3.5 px-4">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Mở bán</span>
            </td>
            <td class="py-3.5 px-4 text-center font-bold text-blue-900">
              ${(t.departures_count || 1) * 18} khách
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  function handleLocationsCreate() {
    const db = getDB();
    if (!db) return;

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const name = (fd.get('name') || fd.get('province_name') || '').trim();
        if (!name) {
          alert('Vui lòng nhập tên tỉnh thành!');
          return;
        }
        db.createProvince({
          name,
          region: fd.get('region') || 'Miền Bắc',
          description: fd.get('description') || 'Điểm đến du lịch hấp dẫn',
          image: fd.get('image') || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg'
        });
        alert(`Đã thêm tỉnh thành "${name}" thành công!`);
        window.location.href = 'index.html';
      });
    }
  }

  // -------------------------------------------------------------
  // MODULE 5: QUẢN LÝ KHÁCH HÀNG (CUSTOMERS)
  // -------------------------------------------------------------
  function handleCustomersIndex() {
    const db = getDB();
    if (!db) return;

    let searchKeyword = '';

    function renderCustomers() {
      const allCustomers = db.getCustomers();

      // Stats
      const statTotalEl = document.querySelector('.border-slate-100 p.text-3xl');
      const stats = document.querySelectorAll('section.grid .bg-white');
      if (stats.length >= 3) {
        const p1 = stats[0].querySelector('p.text-3xl');
        if (p1) p1.textContent = allCustomers.length;

        const p2 = stats[1].querySelector('p.text-3xl');
        if (p2) p2.textContent = 6; // Khách mới tháng này

        const p3 = stats[2].querySelector('p.text-3xl');
        if (p3) p3.textContent = 2; // Đăng ký hôm nay
      }

      let filtered = allCustomers;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        filtered = filtered.filter(c => 
          (c.full_name && c.full_name.toLowerCase().includes(kw)) ||
          (c.email && c.email.toLowerCase().includes(kw)) ||
          (c.phone && c.phone.includes(kw))
        );
      }

      // Render 6 Table Columns
      const tbody = document.querySelector('table tbody');
      if (tbody) {
        if (filtered.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-slate-400">Không tìm thấy khách hàng nào.</td></tr>`;
        } else {
          tbody.innerHTML = filtered.map(c => {
            const initial = (c.full_name.charAt(0) || 'K').toUpperCase();
            return `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      ${initial}
                    </div>
                    <div>
                      <a href="show.html?id=${c.id}" class="font-bold text-blue-900 hover:text-blue-700">${c.full_name}</a>
                      <p class="text-xs text-slate-500 font-mono mt-0.5">#${c.id}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-slate-400">call</span>
                    ${c.phone}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-slate-400">mail</span>
                    ${c.email}
                  </p>
                </td>
                <td class="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">${c.address || 'Hà Nội'}</td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center justify-center min-w-10 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-900 border border-blue-100">
                    ${c.booking_count || 1} tour
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">${formatDate(c.created_at)}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-center gap-2">
                    <a href="show.html?id=${c.id}" class="p-2 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-blue-50 transition" title="Xem chi tiết">
                      <span class="material-symbols-outlined text-base">visibility</span>
                    </a>
                    <a href="edit.html?id=${c.id}" class="p-2 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition" title="Chỉnh sửa">
                      <span class="material-symbols-outlined text-base">edit</span>
                    </a>
                    <button type="button" class="btn-delete-cust p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition" data-id="${c.id}" title="Xóa">
                      <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');

          tbody.querySelectorAll('.btn-delete-cust').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Xác nhận xóa tài khoản khách hàng này?')) {
                db.deleteCustomer(id);
                alert('Đã xóa khách hàng thành công!');
                renderCustomers();
              }
            });
          });
        }
      }
    }

    const searchForm = document.querySelector('form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchKeyword = (searchForm.querySelector('input[name="keyword"]')?.value || '').trim();
        renderCustomers();
      });
    }

    renderCustomers();
  }

  function handleCustomersCreate() {
    const db = getDB();
    if (!db) return;

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const fullName = (fd.get('full_name') || fd.get('name') || '').trim();
        if (!fullName) {
          alert('Vui lòng nhập họ tên khách hàng!');
          return;
        }
        db.createCustomer({
          full_name: fullName,
          email: fd.get('email') || 'khach@example.com',
          phone: fd.get('phone') || '0901234567',
          address: fd.get('address') || 'Hà Nội'
        });
        alert(`Đã thêm khách hàng "${fullName}" thành công!`);
        window.location.href = 'index.html';
      });
    }
  }

  function handleCustomersEdit() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    const custId = urlParams.get('id') || 'cust_1';
    const customer = db.getCustomerById(custId);
    if (!customer) {
      alert('Không tìm thấy khách hàng!');
      window.location.href = 'index.html';
      return;
    }

    const nameInput = document.querySelector('input[name="full_name"]') || document.querySelector('input[name="name"]');
    if (nameInput) nameInput.value = customer.full_name;

    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) emailInput.value = customer.email;

    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) phoneInput.value = customer.phone;

    const addressInput = document.querySelector('input[name="address"]') || document.querySelector('textarea[name="address"]');
    if (addressInput) addressInput.value = customer.address;

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        db.updateCustomer(customer.id, {
          full_name: fd.get('full_name') || fd.get('name') || customer.full_name,
          email: fd.get('email') || customer.email,
          phone: fd.get('phone') || customer.phone,
          address: fd.get('address') || customer.address
        });
        alert('Cập nhật thông tin khách hàng thành công!');
        window.location.href = 'index.html';
      });
    }
  }

  function handleCustomersShow() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    const custId = urlParams.get('id') || 'cust_1';
    const customer = db.getCustomerById(custId);
    if (!customer) return;

    const nameEl = document.querySelector('[data-cust-name], h2');
    if (nameEl) nameEl.textContent = customer.full_name;

    const emailEl = document.querySelector('[data-cust-email]');
    if (emailEl) emailEl.textContent = customer.email;

    const phoneEl = document.querySelector('[data-cust-phone]');
    if (phoneEl) phoneEl.textContent = customer.phone;

    const addressEl = document.querySelector('[data-cust-address]');
    if (addressEl) addressEl.textContent = customer.address;

    // Booking History
    const bookings = db.getBookings({ customer_id: customer.id });
    const tbody = document.querySelector('table tbody');
    if (tbody) {
      if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">Khách hàng chưa có lượt đặt tour nào.</td></tr>';
      } else {
        tbody.innerHTML = bookings.map(b => `
          <tr class="hover:bg-slate-50 transition">
            <td class="px-6 py-4 font-mono font-bold text-blue-900">${b.booking_code}</td>
            <td class="px-4 py-4 font-medium text-slate-800">${b.tour_title}</td>
            <td class="px-4 py-4 text-slate-500 text-sm whitespace-nowrap">${formatDate(b.departure_date)}</td>
            <td class="px-4 py-4 font-bold text-emerald-700 whitespace-nowrap">${formatMoney(b.total_amount)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${renderStatusBadge(b.booking_status)}</td>
          </tr>
        `).join('');
      }
    }
  }

  // -------------------------------------------------------------
  // MODULE 6: QUẢN LÝ GIAO DỊCH (TRANSACTIONS)
  // -------------------------------------------------------------
  function handleTransactionsIndex() {
    let allTxns = [];
    const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const localDay = value => value ? dayFormat.format(new Date(value)) : '';
    const bookingLabels = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận',
      completed: 'Đã hoàn tất', cancelled: 'Đã hủy', canceled: 'Đã hủy' };

    async function refreshTransactions() {
      try {
        const entries = [];
        for (let page = 1; ; page++) {
          const result = await window.BookingTourApi.apiRequest('/api/transactions?pageSize=100&page=' + page);
          entries.push(...result.data);
          if (!result.data.length || entries.length >= result.total) break;
        }
        allTxns = entries.filter(t => !t.awaiting_payment_confirmation).map(enrichTransaction);
        const methodSelect = document.getElementById('txnMethodSelect');
        const methods = [...new Set(allTxns.map(t => t.payment_method).filter(Boolean))].sort();
        methodSelect.replaceChildren(new Option('Tất cả phương thức', ''));
        for (const method of methods) methodSelect.add(new Option(method, method));
        if (methods.includes(methodFilter)) methodSelect.value = methodFilter;
        else methodFilter = '';
        render();
      } catch (error) {
        showTourError(error);
      }
    }

    let currentPage = 1;
    const pageSize = 10;
    let searchKeyword = '';
    let methodFilter = '';
    let statusFilter = '';
    let dateFilter = '';
    let sortOption = 'newest';

    function enrichTransaction(t) {
      return {
        ...t, status: 'success',
        transaction_code: t.bill_number || ('GD-' + t.id),
        customerName: t.customer_name || '—',
        customerEmail: t.customer_email || '—',
        customerPhone: t.customer_phone || '—',
        customerAddress: t.customer_address || '—',
        tourTitle: t.tour_title || '—',
        departureDate: formatDate(t.departure_date),
        adults: t.total_adults,
        children: t.total_children
      };
    }

    function renderDetailModal(t) {
      const modal = document.getElementById('txnDetailModal');
      const modalCode = document.getElementById('modalTxnCode');
      const modalContent = document.getElementById('modalTxnContent');
      if (!modal || !modalContent) return;

      if (modalCode) modalCode.textContent = `Hóa đơn & Chi tiết giao dịch #${escapeTourHtml(t.transaction_code)}`;

      let statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã thanh toán thành công</span>';
      if (t.status === 'pending') statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Chờ cổng thanh toán xác nhận</span>';
      if (t.status === 'refunded' || t.status === 'cancelled') statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Đã hoàn tiền / Đã hủy</span>';

      modalContent.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-400">Mã giao dịch hệ thống</p>
            <p class="text-xl font-black text-blue-950 font-mono mt-0.5">${escapeTourHtml(t.transaction_code)}</p>
            <p class="text-xs text-slate-500 mt-0.5">Mã đặt tour liên kết: <strong class="text-blue-900 font-mono">${escapeTourHtml(t.booking_code)}</strong></p>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-blue-900">person</span>
              Thông tin khách hàng
            </h4>
            <p class="font-bold text-slate-900 text-sm">${escapeTourHtml(t.customerName)}</p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">mail</span>
              ${escapeTourHtml(t.customerEmail)}
            </p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">call</span>
              ${escapeTourHtml(t.customerPhone)}
            </p>
            <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">home</span>
              ${escapeTourHtml(t.customerAddress)}
            </p>
          </div>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-blue-900">tour</span>
              Thông tin chuyến du lịch
            </h4>
            <p class="font-bold text-slate-900 text-sm line-clamp-2">${escapeTourHtml(t.tourTitle)}</p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
              Khởi hành: <strong class="text-slate-800">${t.departureDate}</strong>
            </p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">group</span>
              Số khách: <strong>${t.adults == null ? '—' : t.adults + ' người lớn' + (t.children > 0 ? ', ' + t.children + ' trẻ em' : '')}</strong>
            </p>
          </div>
        </div>

        <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-2 text-sm">
          <div class="flex justify-between items-center text-xs text-slate-600">
            <span>Phương thức thanh toán:</span>
            <span class="font-bold text-blue-950 px-2 py-0.5 bg-white rounded border border-blue-100">${escapeTourHtml(t.payment_method)}</span>
          </div>
          <div class="flex justify-between items-center text-xs text-slate-600">
            <span>Thời gian ghi nhận giao dịch:</span>
            <span class="font-medium text-slate-800">${formatDateTime(t.created_at)}</span>
          </div>
          <div class="flex justify-between items-center text-xs text-slate-600">
            <span>Trạng thái đơn hàng:</span>
            <span class="font-semibold text-emerald-700">${bookingLabels[t.booking_status] || '—'}</span>
          </div>
          <div class="pt-2 border-t border-blue-200/60 flex justify-between items-center">
            <span class="font-bold text-slate-800">Tổng số tiền giao dịch:</span>
            <span class="text-xl font-black text-blue-950">${formatMoney(t.amount)}</span>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
    }

    function render() {

      // 4 Thẻ thống kê
      const totalAmount = allTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalCount = allTxns.length;
      
      const todayStr = localDay(Date.now());
      const todayTxns = allTxns.filter(t => localDay(t.created_at) === todayStr);
      const todayCount = todayTxns.length

      const monthStr = todayStr.slice(0, 7);
      const monthTxns = allTxns.filter(t => localDay(t.created_at).startsWith(monthStr));
      const monthAmount = monthTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const statTotalAmountEl = document.getElementById('statTotalAmount');
      if (statTotalAmountEl) statTotalAmountEl.textContent = formatMoney(totalAmount);

      const statTotalTxnsEl = document.getElementById('statTotalTxns');
      if (statTotalTxnsEl) statTotalTxnsEl.textContent = String(totalCount);

      const statTodayTxnsEl = document.getElementById('statTodayTxns');
      if (statTodayTxnsEl) statTodayTxnsEl.textContent = String(todayCount);

      const statTodaySubtextEl = document.getElementById('statTodaySubtext');
      if (statTodaySubtextEl) statTodaySubtextEl.textContent = `Ngày ${formatDate(todayStr)}`;

      const statMonthAmountEl = document.getElementById('statMonthAmount');
      if (statMonthAmountEl) statMonthAmountEl.textContent = formatMoney(monthAmount);

      const statMonthSubtextEl = document.getElementById('statMonthSubtext');
      if (statMonthSubtextEl) statMonthSubtextEl.textContent = `Tháng ${monthStr.slice(5)}/${monthStr.slice(0, 4)}`;

      // Filter
      let filtered = [...allTxns];

      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        filtered = filtered.filter(t => 
          (t.transaction_code && t.transaction_code.toLowerCase().includes(kw)) ||
          (t.id && String(t.id).toLowerCase().includes(kw)) ||
          (t.booking_code && t.booking_code.toLowerCase().includes(kw)) ||
          (t.customerName && t.customerName.toLowerCase().includes(kw)) ||
          (t.customerEmail && t.customerEmail.toLowerCase().includes(kw)) ||
          (t.customerPhone && t.customerPhone.includes(kw)) ||
          (t.tourTitle && t.tourTitle.toLowerCase().includes(kw))
        );
      }

      if (methodFilter) {
        filtered = filtered.filter(t => t.payment_method === methodFilter);
      }

      if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
      }

      if (dateFilter) {
        filtered = filtered.filter(t => localDay(t.created_at) === dateFilter);
      }

      // Sort
      if (sortOption === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortOption === 'oldest') {
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (sortOption === 'amount_desc') {
        filtered.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
      } else if (sortOption === 'amount_asc') {
        filtered.sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
      }

      // Header Total Badge
      const totalBadge = document.getElementById('txnTotalBadge');
      if (totalBadge) totalBadge.textContent = `${filtered.length} giao dịch`;

      // Pagination
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;

      const startIdx = (currentPage - 1) * pageSize;
      const paged = filtered.slice(startIdx, startIdx + pageSize);

      // Render Table
      const tbody = document.getElementById('txnTableBody') || document.querySelector('table tbody');
      if (tbody) {
        if (paged.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="8" class="px-6 py-16 text-center">
                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <span class="material-symbols-outlined text-3xl">receipt_long</span>
                </div>
                <h3 class="mt-4 text-base font-bold text-slate-800">Không tìm thấy giao dịch</h3>
                <p class="mt-2 text-sm text-slate-500">Chưa có dữ liệu phù hợp với điều kiện tìm kiếm hiện tại.</p>
                <button type="button" id="btnResetFilterEmpty" class="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:underline">
                  <span class="material-symbols-outlined text-base">restart_alt</span>
                  Xóa bộ lọc và xem lại
                </button>
              </td>
            </tr>`;

          document.getElementById('btnResetFilterEmpty')?.addEventListener('click', resetFilter);
        } else {
          tbody.innerHTML = paged.map(t => {
            const initial = (t.customerName.charAt(0) || 'K').toUpperCase();

            let statusBadge = '<span class="inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200">Đã thanh toán</span>';
            if (t.status === 'pending') {
              statusBadge = '<span class="inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border-amber-200">Chờ thanh toán</span>';
            } else if (t.status === 'refunded' || t.status === 'cancelled') {
              statusBadge = '<span class="inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold bg-rose-50 text-rose-700 border-rose-200">Đã hoàn tiền</span>';
            }

            return `
              <tr class="transition hover:bg-slate-50">
                <td class="px-6 py-4">
                  <p class="font-extrabold text-blue-950 font-mono">${escapeTourHtml(t.transaction_code)}</p>
                  <p class="mt-1 text-xs text-slate-500 font-mono">Mã GD: #${t.id}</p>
                  <p class="mt-1 text-xs text-slate-500">Đặt tour: <span class="font-mono font-bold text-blue-900">${escapeTourHtml(t.booking_code)}</span></p>
                </td>

                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold uppercase text-blue-900">
                      ${escapeTourHtml(initial)}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-900">${escapeTourHtml(t.customerName)}</p>
                      <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px] text-slate-400">mail</span>
                        ${escapeTourHtml(t.customerEmail)}
                      </p>
                      <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px] text-slate-400">call</span>
                        ${escapeTourHtml(t.customerPhone)}
                      </p>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <p class="max-w-[260px] font-bold text-slate-900 line-clamp-2" title="${escapeTourHtml(t.tourTitle)}">${escapeTourHtml(t.tourTitle)}</p>
                  <p class="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-slate-400">calendar_today</span>
                    Khởi hành: <strong class="text-slate-700">${t.departureDate}</strong>
                  </p>
                  <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-slate-400">group</span>
                    ${t.adults == null ? '—' : t.adults + ' người lớn' + (t.children > 0 ? ', ' + t.children + ' trẻ em' : '')}
                  </p>
                </td>

                <td class="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-600">
                  <p class="font-semibold text-slate-800">${formatDateTime(t.created_at)}</p>
                  <p class="mt-1 text-slate-400 font-mono">${formatDate(t.created_at)}</p>
                </td>

                <td class="whitespace-nowrap px-6 py-4 text-right">
                  <p class="text-base font-black text-blue-950">${formatMoney(t.amount)}</p>
                </td>

                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <span class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                    ${escapeTourHtml(t.payment_method)}
                  </span>
                </td>

                <td class="px-6 py-4 text-center whitespace-nowrap">
                  ${statusBadge}
                  <p class="mt-1 text-[10px] text-slate-400 font-medium">
                    ${bookingLabels[t.booking_status] || '—'}
                  </p>
                </td>

                <td class="no-print px-6 py-4 text-center whitespace-nowrap">
                  <button type="button" class="btn-show-txn inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-900" data-id="${t.id}" title="Xem chi tiết giao dịch">
                    <span class="material-symbols-outlined text-xl">visibility</span>
                  </button>
                </td>
              </tr>
            `;
          }).join('');

          // Wire view buttons
          tbody.querySelectorAll('.btn-show-txn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              const txn = allTxns.find(item => String(item.id) === id);
              if (txn) renderDetailModal(txn);
            });
          });
        }
      }

      // Pagination summary & buttons
      const summary = document.getElementById('txnPaginationSummary');
      if (summary) {
        const start = filtered.length === 0 ? 0 : startIdx + 1;
        const end = Math.min(startIdx + pageSize, filtered.length);
        summary.innerHTML = `Hiển thị <span class="font-bold text-slate-800">${start}–${end}</span> trên tổng số <span class="font-bold text-slate-800">${filtered.length}</span> giao dịch`;
      }

      const buttonsContainer = document.getElementById('txnPaginationButtons');
      if (buttonsContainer) {
        if (totalPages <= 1) {
          buttonsContainer.innerHTML = '';
        } else {
          let btns = '';
          // Prev
          if (currentPage > 1) {
            btns += `<button type="button" class="btn-page-prev flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"><span class="material-symbols-outlined text-lg">chevron_left</span></button>`;
          } else {
            btns += `<span class="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 text-slate-300"><span class="material-symbols-outlined text-lg">chevron_left</span></span>`;
          }

          // Pages
          for (let p = 1; p <= totalPages; p++) {
            if (p === currentPage) {
              btns += `<span class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900 text-xs font-bold text-white shadow-sm">${p}</span>`;
            } else {
              btns += `<button type="button" class="btn-page-num flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-900" data-page="${p}">${p}</button>`;
            }
          }

          // Next
          if (currentPage < totalPages) {
            btns += `<button type="button" class="btn-page-next flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"><span class="material-symbols-outlined text-lg">chevron_right</span></button>`;
          } else {
            btns += `<span class="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 text-slate-300"><span class="material-symbols-outlined text-lg">chevron_right</span></span>`;
          }

          buttonsContainer.innerHTML = btns;

          buttonsContainer.querySelector('.btn-page-prev')?.addEventListener('click', () => {
            if (currentPage > 1) {
              currentPage--;
              render();
            }
          });
          buttonsContainer.querySelector('.btn-page-next')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
              currentPage++;
              render();
            }
          });
          buttonsContainer.querySelectorAll('.btn-page-num').forEach(b => {
            b.addEventListener('click', () => {
              currentPage = Number(b.getAttribute('data-page')) || 1;
              render();
            });
          });
        }
      }
    }

    function resetFilter() {
      const keywordInput = document.getElementById('txnKeywordInput');
      const methodSelect = document.getElementById('txnMethodSelect');
      const statusSelect = document.getElementById('txnStatusSelect');
      const dateInput = document.getElementById('txnDateInput');
      const sortSelect = document.getElementById('txnSortSelect');

      if (keywordInput) keywordInput.value = '';
      if (methodSelect) methodSelect.value = '';
      if (statusSelect) statusSelect.value = '';
      if (dateInput) dateInput.value = '';
      if (sortSelect) sortSelect.value = 'newest';

      searchKeyword = '';
      methodFilter = '';
      statusFilter = '';
      dateFilter = '';
      sortOption = 'newest';
      currentPage = 1;
      render();
    }

    const filterForm = document.getElementById('txnFilterForm') || document.querySelector('form.mb-6');
    if (filterForm) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchKeyword = (document.getElementById('txnKeywordInput')?.value || '').trim();
        methodFilter = document.getElementById('txnMethodSelect')?.value || '';
        statusFilter = document.getElementById('txnStatusSelect')?.value || '';
        dateFilter = document.getElementById('txnDateInput')?.value || '';
        sortOption = document.getElementById('txnSortSelect')?.value || 'newest';
        currentPage = 1;
        render();
      });
    }

    document.getElementById('btnResetTxnFilter')?.addEventListener('click', resetFilter);

    const refresh = () => Promise.all([
      refreshTransactions(), renderPendingPayments(refreshTransactions)
    ]);
    document.getElementById('btnRefreshTransactions').addEventListener('click', event => {
      event.preventDefault();
      refresh();
    });
    refresh();
  }

  // -------------------------------------------------------------
  // MODULE 7: QUẢN LÝ NHÂN VIÊN (EMPLOYEES)
  // -------------------------------------------------------------
  function handleEmployeesIndex() {
    const db = getDB();
    if (!db) return;

    let searchKeyword = '';
    let roleFilter = '';

    function renderEmployees() {
      const allEmps = db.getEmployees();
      const adminCount = allEmps.filter(e => e.role === 'Admin').length;
      const saleCount = allEmps.filter(e => e.role === 'Sale').length;
      const guideCount = allEmps.filter(e => e.role === 'Guide').length;

      // 4 Stats
      const statBoxes = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-4.gap-6 .bg-white');
      if (statBoxes.length >= 4) {
        statBoxes[0].querySelector('p.text-3xl').textContent = allEmps.length;
        statBoxes[1].querySelector('p.text-3xl').textContent = adminCount;
        statBoxes[2].querySelector('p.text-3xl').textContent = saleCount;
        statBoxes[3].querySelector('p.text-3xl').textContent = guideCount;
      }

      let filtered = allEmps;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        filtered = filtered.filter(e => 
          e.full_name.toLowerCase().includes(kw) ||
          e.email.toLowerCase().includes(kw) ||
          e.phone.includes(kw)
        );
      }
      if (roleFilter) {
        filtered = filtered.filter(e => e.role.toLowerCase() === roleFilter.toLowerCase());
      }

      // Render into <div class="space-y-4"> cards
      const container = document.querySelector('.space-y-4');
      if (container) {
        if (filtered.length === 0) {
          container.innerHTML = `
            <div class="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">badge</span>
              <p>Không tìm thấy nhân viên nào phù hợp.</p>
            </div>`;
        } else {
          container.innerHTML = filtered.map(e => {
            const initial = (e.full_name.charAt(0) || 'N').toUpperCase();
            let roleBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">Quản trị viên</span>';
            if (e.role === 'Sale') roleBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900">Kinh doanh / CSKH</span>';
            if (e.role === 'Guide') roleBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">Hướng dẫn viên</span>';

            return `
              <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-lg shrink-0">
                    ${initial}
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-base font-extrabold text-blue-950">${e.full_name}</h3>
                    <p class="text-xs text-slate-500 mt-1 break-all">
                      Mã NV: <span class="font-bold text-slate-700">#${e.id}</span> · ${e.email} · ${e.phone}
                    </p>
                    <div class="mt-2 flex items-center gap-2">
                      ${roleBadge}
                      ${renderStatusBadge(e.status)}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a href="edit.html?id=${e.id}" class="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition text-sm flex items-center gap-1.5" title="Sửa thông tin">
                    <span class="material-symbols-outlined text-base">edit</span>
                    Sửa
                  </a>
                  <button type="button" class="btn-delete-emp p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition" data-id="${e.id}" title="Xóa nhân viên">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            `;
          }).join('');

          container.querySelectorAll('.btn-delete-emp').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Xác nhận xóa tài khoản nhân viên này?')) {
                db.deleteEmployee(id);
                alert('Đã xóa nhân viên thành công!');
                renderEmployees();
              }
            });
          });
        }
      }
    }

    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        searchKeyword = (form.querySelector('input[name="keyword"]')?.value || '').trim();
        roleFilter = form.querySelector('select[name="roleId"]')?.value || '';
        renderEmployees();
      });
    }

    renderEmployees();
  }

  function handleEmployeesCreate() {
    const db = getDB();
    if (!db) return;

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const name = (fd.get('full_name') || fd.get('name') || '').trim();
        if (!name) {
          alert('Vui lòng nhập họ tên nhân viên!');
          return;
        }
        db.createEmployee({
          full_name: name,
          email: fd.get('email') || 'staff@bookingtour.vn',
          phone: fd.get('phone') || '0900000000',
          role: fd.get('role') || 'Sale',
          status: 'active'
        });
        alert(`Đã thêm nhân viên "${name}" thành công!`);
        window.location.href = 'index.html';
      });
    }
  }

  function handleEmployeesEdit() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('id') || 'emp_1';
    const emp = db.getEmployeeById(empId);
    if (!emp) {
      alert('Không tìm thấy nhân viên!');
      window.location.href = 'index.html';
      return;
    }

    const nameInput = document.querySelector('input[name="full_name"]') || document.querySelector('input[name="name"]');
    if (nameInput) nameInput.value = emp.full_name;

    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) emailInput.value = emp.email;

    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) phoneInput.value = emp.phone;

    const roleSelect = document.querySelector('select[name="role"]');
    if (roleSelect) roleSelect.value = emp.role;

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        db.updateEmployee(emp.id, {
          full_name: fd.get('full_name') || fd.get('name') || emp.full_name,
          email: fd.get('email') || emp.email,
          phone: fd.get('phone') || emp.phone,
          role: fd.get('role') || emp.role
        });
        alert('Cập nhật nhân viên thành công!');
        window.location.href = 'index.html';
      });
    }
  }

  // -------------------------------------------------------------
  // MASTER ROUTER
  // -------------------------------------------------------------
  function initPage() {
    const path = window.location.pathname.toLowerCase();
    setupAdminHeader();

    if (path.includes('/tours/index.html')) {
      handleToursIndex().catch(showTourError);
    } else if (path.includes('/tours/create.html')) {
      handleTourForm(false).catch(showTourError);
    } else if (path.includes('/tours/edit.html')) {
      handleTourForm(true).catch(showTourError);
    } else if (path.includes('/tours/show.html')) {
      handleToursShow().catch(showTourError);
    } else if (path.includes('/categories/index.html')) {
      handleCategoriesIndex();
    } else if (path.includes('/locations/index.html')) {
      handleLocationsIndex();
    } else if (path.includes('/locations/create_province.html')) {
      handleLocationsCreate();
    } else if (path.includes('/departures/index.html')) {
      handleDeparturesIndex().catch(showTourError);
    } else if (path.includes('/departures/create.html')) {
      handleDepartureForm('create').catch(showTourError);
    } else if (path.includes('/departures/edit.html')) {
      handleDepartureForm('edit').catch(showTourError);
    } else if (path.includes('/departures/assign_guide.html')) {
      handleDepartureForm('guide').catch(showTourError);
    } else if (path.includes('/customers/index.html')) {
      handleCustomersIndex();
    } else if (path.includes('/customers/create.html')) {
      handleCustomersCreate();
    } else if (path.includes('/customers/edit.html')) {
      handleCustomersEdit();
    } else if (path.includes('/customers/show.html')) {
      handleCustomersShow();
    } else if (path.includes('/transactions/index.html')) {
      handleTransactionsIndex();
    } else if (path.includes('/employees/index.html')) {
      handleEmployeesIndex();
    } else if (path.includes('/employees/create.html')) {
      handleEmployeesCreate();
    } else if (path.includes('/employees/edit.html')) {
      handleEmployeesEdit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();
