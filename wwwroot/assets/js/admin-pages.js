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
  function handleToursIndex() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    let keyword = urlParams.get('keyword') || '';
    let catId = urlParams.get('category_id') || '';
    let provId = urlParams.get('province_id') || '';

    // Populate Category select
    const catSelect = document.querySelector('select[name="category_id"]');
    if (catSelect) {
      const cats = db.getCategories();
      catSelect.innerHTML = '<option value="">Tất cả danh mục</option>' +
        cats.map(c => `<option value="${c.id}" ${c.id === catId ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    // Populate Province select
    const provSelect = document.querySelector('select[name="province_id"]');
    if (provSelect) {
      const provs = db.getProvinces();
      provSelect.innerHTML = '<option value="">Tất cả tỉnh thành</option>' +
        provs.map(p => `<option value="${p.id}" ${p.id === provId ? 'selected' : ''}>${p.name} (${p.region})</option>`).join('');
    }

    const keywordInput = document.querySelector('input[name="keyword"]');
    if (keywordInput) keywordInput.value = keyword;

    function renderTours() {
      const allTours = db.getTours();
      const openTours = allTours.filter(t => t.departures_count > 0).length;
      const totalDeps = db.getDepartures().length;

      // Stats
      const statTotalToursEl = document.querySelector('.border-l-blue-900 h3');
      if (statTotalToursEl) statTotalToursEl.textContent = allTours.length;

      const statOpenToursEl = document.querySelector('.border-l-emerald-600 h3, .border-l-green-600 h3');
      if (statOpenToursEl) statOpenToursEl.textContent = openTours;

      const statTotalDepsEl = document.querySelector('.border-l-orange-500 h3');
      if (statTotalDepsEl) statTotalDepsEl.textContent = totalDeps;

      const filtered = db.getTours({
        search: keyword,
        category_id: catId,
        province_id: provId
      });

      const headingCountEl = document.querySelector('h2.text-blue-900');
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
          tbody.innerHTML = filtered.map(t => {
            const img = (t.images && t.images[0]) || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';
            const catName = t.category?.name || 'Chung';
            const provName = t.province?.name || 'Toàn quốc';
            const price = formatMoney(t.adult_price);
            const duration = `${t.duration_days}N${t.duration_nights}Đ`;

            return `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm">
                      <img src="${img}" alt="${t.title}" class="w-full h-full object-cover"/>
                    </div>
                    <div>
                      <a href="show.html?id=${t.id}" class="font-bold text-blue-950 hover:text-blue-700 transition line-clamp-1 max-w-xs" title="${t.title}">
                        ${t.title}
                      </a>
                      <p class="text-xs text-slate-500 mt-0.5 font-mono">ID: #${t.id}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-slate-600 font-medium">${catName}</td>
                <td class="px-4 py-4 text-slate-600 font-medium">${provName}</td>
                <td class="px-4 py-4 text-slate-600 whitespace-nowrap">${duration}</td>
                <td class="px-4 py-4 font-bold text-blue-900 whitespace-nowrap">${price}</td>
                <td class="px-4 py-4 text-center">
                  <span class="px-2.5 py-1 text-xs font-bold rounded-full ${t.departures_count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
                    ${t.departures_count} đợt mở bán
                  </span>
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
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Bạn có chắc chắn muốn xóa tour này và toàn bộ lịch khởi hành liên quan?')) {
                db.deleteTour(id);
                alert('Đã xóa tour thành công!');
                renderTours();
              }
            });
          });
        }
      }

      const paginationInfoEl = document.querySelector('.border-t p');
      if (paginationInfoEl) {
        paginationInfoEl.innerHTML = `Hiển thị <span class="font-bold text-slate-800">1–${filtered.length}</span> trên tổng số <span class="font-bold text-slate-800">${filtered.length}</span> tour`;
      }
    }

    const filterForm = document.querySelector('form.mb-6, form[action="#"]');
    if (filterForm && !filterForm.classList.contains('px-4')) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        keyword = (keywordInput?.value || '').trim();
        catId = catSelect?.value || '';
        provId = provSelect?.value || '';
        renderTours();
      });
    }

    renderTours();
  }

  function handleToursCreate() {
    const db = getDB();
    if (!db) return;

    const catSelect = document.querySelector('select[name="category_id"]');
    if (catSelect) {
      catSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>' +
        db.getCategories().map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    const provSelect = document.querySelector('select[name="province_id"]');
    if (provSelect) {
      provSelect.innerHTML = '<option value="">-- Chọn tỉnh thành --</option>' +
        db.getProvinces().map(p => `<option value="${p.id}">${p.name} (${p.region})</option>`).join('');
    }

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const title = fd.get('title') || fd.get('name');
        if (!title) {
          alert('Vui lòng nhập tên tour!');
          return;
        }

        const newTour = db.createTour({
          title,
          category_id: fd.get('category_id'),
          province_id: fd.get('province_id'),
          duration_days: Number(fd.get('duration_days') || fd.get('so_ngay')) || 3,
          duration_nights: Number(fd.get('duration_nights') || fd.get('so_dem')) || 2,
          adult_price: Number(fd.get('adult_price') || fd.get('gia_nguoi_lon')) || 3000000,
          child_price: Number(fd.get('child_price') || fd.get('gia_tre_em')) || 2100000,
          departure_location: fd.get('departure_location') || 'Hà Nội',
          description: fd.get('description') || 'Chuyến du lịch tuyển chọn khám phá cảnh sắc Việt Nam.',
          featured: fd.get('is_featured') === '1' || fd.get('is_featured') === 'on' || fd.get('featured') === '1',
          recommended: true
        });

        alert(`Đã thêm tour mới "${newTour.title}" thành công!`);
        window.location.href = 'index.html';
      });
    }
  }

  function handleToursEdit() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('id') || 'tour_1';
    const tour = db.getTourById(tourId);

    if (!tour) {
      alert('Không tìm thấy tour!');
      window.location.href = 'index.html';
      return;
    }

    const catSelect = document.querySelector('select[name="category_id"]');
    if (catSelect) {
      catSelect.innerHTML = db.getCategories().map(c => 
        `<option value="${c.id}" ${c.id === tour.category_id ? 'selected' : ''}>${c.name}</option>`
      ).join('');
    }

    const provSelect = document.querySelector('select[name="province_id"]');
    if (provSelect) {
      provSelect.innerHTML = db.getProvinces().map(p => 
        `<option value="${p.id}" ${p.id === tour.province_id ? 'selected' : ''}>${p.name} (${p.region})</option>`
      ).join('');
    }

    const titleInput = document.querySelector('input[name="title"]') || document.querySelector('input[name="name"]');
    if (titleInput) titleInput.value = tour.title;

    const daysInput = document.querySelector('input[name="duration_days"]') || document.querySelector('input[name="so_ngay"]');
    if (daysInput) daysInput.value = tour.duration_days;

    const nightsInput = document.querySelector('input[name="duration_nights"]') || document.querySelector('input[name="so_dem"]');
    if (nightsInput) nightsInput.value = tour.duration_nights;

    const adultPriceInput = document.querySelector('input[name="adult_price"]') || document.querySelector('input[name="gia_nguoi_lon"]');
    if (adultPriceInput) adultPriceInput.value = tour.adult_price;

    const childPriceInput = document.querySelector('input[name="child_price"]') || document.querySelector('input[name="gia_tre_em"]');
    if (childPriceInput) childPriceInput.value = tour.child_price;

    const depLocInput = document.querySelector('input[name="departure_location"]');
    if (depLocInput) depLocInput.value = tour.departure_location;

    const descTextarea = document.querySelector('textarea[name="description"]');
    if (descTextarea) descTextarea.value = tour.description;

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        db.updateTour(tour.id, {
          title: fd.get('title') || fd.get('name') || tour.title,
          category_id: fd.get('category_id') || tour.category_id,
          province_id: fd.get('province_id') || tour.province_id,
          duration_days: Number(fd.get('duration_days') || fd.get('so_ngay')) || tour.duration_days,
          duration_nights: Number(fd.get('duration_nights') || fd.get('so_dem')) || tour.duration_nights,
          adult_price: Number(fd.get('adult_price') || fd.get('gia_nguoi_lon')) || tour.adult_price,
          child_price: Number(fd.get('child_price') || fd.get('gia_tre_em')) || tour.child_price,
          departure_location: fd.get('departure_location') || tour.departure_location,
          description: fd.get('description') || tour.description
        });
        alert('Cập nhật thông tin tour thành công!');
        window.location.href = 'index.html';
      });
    }
  }

  function handleToursShow() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('id') || 'tour_1';
    const tour = db.getTourById(tourId);
    if (!tour) return;

    document.querySelectorAll('[data-tour-title], h1, h2').forEach(el => {
      if (el.textContent.includes('—') || el.dataset.tourTitle !== undefined) {
        el.textContent = tour.title;
      }
    });

    const priceEls = document.querySelectorAll('[data-tour-price]');
    priceEls.forEach(el => el.textContent = formatMoney(tour.adult_price));

    const descEls = document.querySelectorAll('[data-tour-desc]');
    descEls.forEach(el => el.textContent = tour.description);
  }

  // -------------------------------------------------------------
  // MODULE 3: QUẢN LÝ CHUYẾN ĐI (DEPARTURES)
  // -------------------------------------------------------------
  function handleDeparturesIndex() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    let keyword = urlParams.get('keyword') || '';
    let filterDate = urlParams.get('date') || '';
    let currentStatus = 'all';

    function renderDepartures() {
      const allDeps = db.getDepartures();
      const openCount = allDeps.filter(d => d.status === 'open').length;
      const unassignedCount = allDeps.filter(d => !d.guide_id || d.guide_name === 'Chưa phân công').length;
      const fullCount = allDeps.filter(d => d.status === 'sold_out' || d.status === 'full' || d.available_seats === 0).length;
      const cancelledCount = allDeps.filter(d => d.status === 'cancelled').length;

      // Update 4 Stat Cards
      const statBlueEl = document.querySelector('.border-l-blue-900 h3');
      if (statBlueEl) statBlueEl.textContent = openCount;

      const statOrangeEl = document.querySelector('.border-l-orange-500 h3');
      if (statOrangeEl) statOrangeEl.textContent = unassignedCount;

      const statEmeraldEl = document.querySelector('.border-l-emerald-600 h3');
      if (statEmeraldEl) statEmeraldEl.textContent = 2; // Khởi hành hôm nay

      const statPurpleEl = document.querySelector('.border-l-purple-600 h3');
      if (statPurpleEl) statPurpleEl.textContent = allDeps.length; // Tháng tới / Tổng lịch

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
        if (currentStatus === 'open') filtered = filtered.filter(d => d.status === 'open');
        else if (currentStatus === 'full') filtered = filtered.filter(d => d.status === 'sold_out' || d.status === 'full' || d.available_seats === 0);
        else if (currentStatus === 'cancelled') filtered = filtered.filter(d => d.status === 'cancelled');
      }

      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter(d => {
          const tTitle = d.tour ? d.tour.title.toLowerCase() : '';
          const gName = (d.guide_name || '').toLowerCase();
          const dId = String(d.id).toLowerCase();
          return tTitle.includes(kw) || gName.includes(kw) || dId.includes(kw);
        });
      }

      if (filterDate) {
        filtered = filtered.filter(d => d.start_date && d.start_date.startsWith(filterDate));
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
            const tourTitle = d.tour ? d.tour.title : 'Tour du lịch khám phá';
            const provName = d.tour?.province?.name || 'Việt Nam';
            const price = formatMoney(d.adult_price);
            const childPrice = formatMoney(d.child_price || d.adult_price * 0.7);
            const booked = d.total_seats - d.available_seats;
            const pct = Math.min(100, Math.round((booked / d.total_seats) * 100));
            const guideName = d.guide_name || 'Chưa phân công';
            const isFull = d.available_seats <= 0 || d.status === 'sold_out' || d.status === 'full';
            const isCancelled = d.status === 'cancelled';

            let statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">Đang bán</span>';
            if (isFull) statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">Đã đầy</span>';
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
                      <a href="../tours/show.html?id=${d.tour_id}" class="hover:underline">${tourTitle}</a>
                    </h3>
                    <p class="text-xs text-blue-100 mt-1 flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">location_on</span>
                      <span>${provName}</span>
                    </p>
                  </div>

                  <div class="p-6 space-y-4 text-sm">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-xs text-slate-500 font-semibold mb-1">Khởi hành</p>
                        <p class="font-bold text-blue-950 flex items-center gap-1 text-xs sm:text-sm">
                          <span class="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                          <span>${formatDate(d.start_date)}</span>
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-slate-500 font-semibold mb-1">Trở về</p>
                        <p class="font-bold text-blue-950 flex items-center gap-1 text-xs sm:text-sm">
                          <span class="material-symbols-outlined text-sm text-slate-400">event</span>
                          <span>${formatDate(d.end_date)}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-2 text-xs">
                        <p class="font-bold text-slate-600 uppercase">Tình trạng giữ chỗ</p>
                        <p class="font-bold text-blue-900">
                          <span class="font-black">${booked}</span> / ${d.total_seats} khách đã đặt (${d.available_seats} chỗ trống)
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
                        <span class="font-semibold text-slate-700">HDV: ${guideName}</span>
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
                  <button type="button" class="btn-delete-departure p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" data-id="${d.id}" title="Xóa chuyến">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            `;
          }).join('');

          grid.querySelectorAll('.btn-delete-departure').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (confirm('Xác nhận xóa chuyến khởi hành này?')) {
                db.deleteDeparture(id);
                alert('Đã xóa chuyến đi thành công!');
                renderDepartures();
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
        keyword = (searchForm.querySelector('input[name="keyword"]')?.value || '').trim();
        filterDate = searchForm.querySelector('input[name="date"]')?.value || '';
        renderDepartures();
      });
    }

    renderDepartures();
  }

  function handleDeparturesCreate() {
    const db = getDB();
    if (!db) return;

    const tourSelect = document.querySelector('select[name="tour_id"]');
    if (tourSelect) {
      tourSelect.innerHTML = '<option value="">-- Chọn Tour du lịch --</option>' +
        db.getTours().map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    }

    const guideSelect = document.querySelector('select[name="guide_id"]');
    if (guideSelect) {
      const guides = db.getEmployees({ role: 'Guide' });
      guideSelect.innerHTML = '<option value="">-- Phân công HDV (Tùy chọn) --</option>' +
        guides.map(g => `<option value="${g.id}">${g.full_name} (${g.phone})</option>`).join('');
    }

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const tourId = fd.get('tour_id');
        const startDate = fd.get('start_date');
        const endDate = fd.get('end_date') || startDate;

        if (!tourId || !startDate) {
          alert('Vui lòng chọn Tour và Ngày khởi hành!');
          return;
        }

        const guideId = fd.get('guide_id');
        let guideName = 'Chưa phân công';
        if (guideId) {
          const g = db.getEmployeeById(guideId);
          if (g) guideName = `${g.full_name}`;
        }

        db.createDeparture({
          tour_id: tourId,
          start_date: startDate,
          end_date: endDate,
          total_seats: Number(fd.get('total_seats')) || 30,
          available_seats: Number(fd.get('total_seats')) || 30,
          adult_price: Number(fd.get('adult_price')) || 3000000,
          child_price: Number(fd.get('child_price')) || 2100000,
          guide_id: guideId || '',
          guide_name: guideName,
          status: 'open'
        });

        alert('Đã mở bán chuyến khởi hành mới thành công!');
        window.location.href = 'index.html';
      });
    }
  }

  function handleDeparturesEdit() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    const depId = urlParams.get('id') || 'dep_1';
    const dep = db.getDepartureById(depId);
    if (!dep) {
      alert('Không tìm thấy chuyến khởi hành!');
      window.location.href = 'index.html';
      return;
    }

    const tourSelect = document.querySelector('select[name="tour_id"]');
    if (tourSelect) {
      tourSelect.innerHTML = db.getTours().map(t => 
        `<option value="${t.id}" ${t.id === dep.tour_id ? 'selected' : ''}>${t.title}</option>`
      ).join('');
    }

    const startDateInput = document.querySelector('input[name="start_date"]');
    if (startDateInput) startDateInput.value = dep.start_date;

    const endDateInput = document.querySelector('input[name="end_date"]');
    if (endDateInput) endDateInput.value = dep.end_date;

    const seatsInput = document.querySelector('input[name="total_seats"]');
    if (seatsInput) seatsInput.value = dep.total_seats;

    const priceInput = document.querySelector('input[name="adult_price"]');
    if (priceInput) priceInput.value = dep.adult_price;

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        db.updateDeparture(dep.id, {
          start_date: fd.get('start_date') || dep.start_date,
          end_date: fd.get('end_date') || dep.end_date,
          total_seats: Number(fd.get('total_seats')) || dep.total_seats,
          adult_price: Number(fd.get('adult_price')) || dep.adult_price
        });
        alert('Cập nhật chuyến khởi hành thành công!');
        window.location.href = 'index.html';
      });
    }
  }

  function handleDeparturesAssignGuide() {
    const db = getDB();
    if (!db) return;

    const urlParams = new URLSearchParams(window.location.search);
    const depId = urlParams.get('departure_id') || 'dep_1';
    const dep = db.getDepartureById(depId);

    const depInfoEl = document.getElementById('departureInfo') || document.querySelector('.departure-info');
    if (depInfoEl && dep) {
      depInfoEl.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 mb-6">
          <p class="font-bold text-base mb-1">${dep.tour ? dep.tour.title : 'Tour du lịch'}</p>
          <p>Khởi hành: <strong>${formatDate(dep.start_date)}</strong> – Về: <strong>${formatDate(dep.end_date)}</strong></p>
          <p class="mt-1">HDV hiện tại: <span class="font-bold text-blue-900">${dep.guide_name || 'Chưa phân công'}</span></p>
        </div>
      `;
    }

    const guideSelect = document.querySelector('select[name="guide_id"]') || document.getElementById('guideSelect');
    if (guideSelect) {
      const guides = db.getEmployees({ role: 'Guide' });
      guideSelect.innerHTML = guides.map(g => 
        `<option value="${g.id}" ${g.id === dep?.guide_id ? 'selected' : ''}>${g.full_name} (${g.phone})</option>`
      ).join('');
    }

    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedGuideId = guideSelect ? guideSelect.value : '';
        if (selectedGuideId && dep) {
          db.assignGuide(dep.id, selectedGuideId);
          alert('Đã phân công hướng dẫn viên cho chuyến đi thành công!');
          window.location.href = 'index.html';
        }
      });
    }
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
    const db = getDB();
    if (!db) return;

    let currentPage = 1;
    const pageSize = 10;
    let searchKeyword = '';
    let methodFilter = '';
    let statusFilter = '';
    let dateFilter = '';
    let sortOption = 'newest';

    function enrichTransaction(t) {
      const booking = t.booking_id ? db.getBookingById(t.booking_id) : (db.getBookings().find(b => b.booking_code === t.booking_code) || null);
      const customer = t.customer_id ? db.getCustomerById(t.customer_id) : (booking ? db.getCustomerById(booking.customer_id) : null);
      const tour = booking ? db.getTourById(booking.tour_id) : (db.getTours().find(tourItem => tourItem.title === t.tour_title) || null);

      const customerName = t.customer_name || customer?.full_name || booking?.customer_name || 'Khách hàng vãng lai';
      const customerEmail = customer?.email || (booking ? `${booking.booking_code.toLowerCase().replace(/[^a-z0-9]/g, '')}@bookingtour.vn` : 'khachhang@example.com');
      const customerPhone = customer?.phone || '0901234567';
      const customerAddress = customer?.address || 'Hà Nội, Việt Nam';
      const tourTitle = t.tour_title || tour?.title || booking?.tour_title || 'Tour du lịch khám phá di sản';
      const departureDate = booking?.departure_date ? formatDate(booking.departure_date) : (t.created_at ? formatDate(t.created_at) : '15/11/2026');
      const adults = booking?.adults || 2;
      const children = booking?.children || 0;

      return {
        ...t,
        booking,
        customer,
        tour,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        tourTitle,
        departureDate,
        adults,
        children
      };
    }

    function renderDetailModal(t) {
      const modal = document.getElementById('txnDetailModal');
      const modalCode = document.getElementById('modalTxnCode');
      const modalContent = document.getElementById('modalTxnContent');
      if (!modal || !modalContent) return;

      if (modalCode) modalCode.textContent = `Hóa đơn & Chi tiết giao dịch #${t.transaction_code}`;

      let statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã thanh toán thành công</span>';
      if (t.status === 'pending') statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Chờ cổng thanh toán xác nhận</span>';
      if (t.status === 'refunded' || t.status === 'cancelled') statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Đã hoàn tiền / Đã hủy</span>';

      modalContent.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <p class="text-xs uppercase tracking-wider font-bold text-slate-400">Mã giao dịch hệ thống</p>
            <p class="text-xl font-black text-blue-950 font-mono mt-0.5">${t.transaction_code}</p>
            <p class="text-xs text-slate-500 mt-0.5">Mã đặt tour liên kết: <strong class="text-blue-900 font-mono">${t.booking_code}</strong></p>
          </div>
          <div>${statusBadge}</div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-blue-900">person</span>
              Thông tin khách hàng
            </h4>
            <p class="font-bold text-slate-900 text-sm">${t.customerName}</p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">mail</span>
              ${t.customerEmail}
            </p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">call</span>
              ${t.customerPhone}
            </p>
            <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">home</span>
              ${t.customerAddress}
            </p>
          </div>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-blue-900">tour</span>
              Thông tin chuyến du lịch
            </h4>
            <p class="font-bold text-slate-900 text-sm line-clamp-2">${t.tourTitle}</p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
              Khởi hành: <strong class="text-slate-800">${t.departureDate}</strong>
            </p>
            <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-slate-400">group</span>
              Số khách: <strong>${t.adults} người lớn${t.children > 0 ? `, ${t.children} trẻ em` : ''}</strong>
            </p>
          </div>
        </div>

        <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-2 text-sm">
          <div class="flex justify-between items-center text-xs text-slate-600">
            <span>Phương thức thanh toán:</span>
            <span class="font-bold text-blue-950 px-2 py-0.5 bg-white rounded border border-blue-100">${t.payment_method}</span>
          </div>
          <div class="flex justify-between items-center text-xs text-slate-600">
            <span>Thời gian ghi nhận giao dịch:</span>
            <span class="font-medium text-slate-800">${formatDateTime(t.created_at)}</span>
          </div>
          <div class="flex justify-between items-center text-xs text-slate-600">
            <span>Trạng thái đơn hàng:</span>
            <span class="font-semibold text-emerald-700">${t.status === 'success' ? 'Đã đối soát thành công' : (t.status === 'pending' ? 'Chờ ngân hàng xử lý' : 'Đã hủy')}</span>
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
      const allTxns = db.getTransactions().map(enrichTransaction);

      // 4 Thẻ thống kê
      const totalAmount = allTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalCount = allTxns.length;
      
      const todayStr = '2026-11-14';
      const todayTxns = allTxns.filter(t => t.created_at && t.created_at.startsWith(todayStr));
      const todayCount = todayTxns.length || 4; // realistic fallback for mock data

      const monthStr = '2026-11';
      const monthTxns = allTxns.filter(t => t.created_at && t.created_at.startsWith(monthStr));
      const monthAmount = monthTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || totalAmount;

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
      if (statMonthSubtextEl) statMonthSubtextEl.textContent = `Tháng 11/2026`;

      // Filter
      let filtered = allTxns;

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
        filtered = filtered.filter(t => t.created_at && t.created_at.startsWith(dateFilter));
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
                  <p class="font-extrabold text-blue-950 font-mono">${t.transaction_code}</p>
                  <p class="mt-1 text-xs text-slate-500 font-mono">Mã GD: #${t.id}</p>
                  <p class="mt-1 text-xs text-slate-500">Đặt tour: <span class="font-mono font-bold text-blue-900">${t.booking_code}</span></p>
                </td>

                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold uppercase text-blue-900">
                      ${initial}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-900">${t.customerName}</p>
                      <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px] text-slate-400">mail</span>
                        ${t.customerEmail}
                      </p>
                      <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px] text-slate-400">call</span>
                        ${t.customerPhone}
                      </p>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <p class="max-w-[260px] font-bold text-slate-900 line-clamp-2" title="${t.tourTitle}">${t.tourTitle}</p>
                  <p class="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-slate-400">calendar_today</span>
                    Khởi hành: <strong class="text-slate-700">${t.departureDate}</strong>
                  </p>
                  <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-slate-400">group</span>
                    ${t.adults} người lớn${t.children > 0 ? `, ${t.children} trẻ em` : ''}
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
                    ${t.payment_method}
                  </span>
                </td>

                <td class="px-6 py-4 text-center whitespace-nowrap">
                  ${statusBadge}
                  <p class="mt-1 text-[10px] text-slate-400 font-medium">
                    ${t.status === 'success' ? 'Đã hoàn tất' : (t.status === 'pending' ? 'Chờ xác nhận' : 'Đã hoàn trả')}
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
              const txn = allTxns.find(item => item.id === id);
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

    // Initial render
    render();
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
      handleToursIndex();
    } else if (path.includes('/tours/create.html')) {
      handleToursCreate();
    } else if (path.includes('/tours/edit.html')) {
      handleToursEdit();
    } else if (path.includes('/tours/show.html')) {
      handleToursShow();
    } else if (path.includes('/categories/index.html')) {
      handleCategoriesIndex();
    } else if (path.includes('/locations/index.html')) {
      handleLocationsIndex();
    } else if (path.includes('/locations/create_province.html')) {
      handleLocationsCreate();
    } else if (path.includes('/departures/index.html')) {
      handleDeparturesIndex();
    } else if (path.includes('/departures/create.html')) {
      handleDeparturesCreate();
    } else if (path.includes('/departures/edit.html')) {
      handleDeparturesEdit();
    } else if (path.includes('/departures/assign_guide.html')) {
      handleDeparturesAssignGuide();
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
