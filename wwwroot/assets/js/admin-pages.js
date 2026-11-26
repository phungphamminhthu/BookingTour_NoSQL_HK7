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
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
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
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      });
    } catch (_) {
      return dateStr;
    }
  }

  function toVietnamDateInput(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d);
    } catch (_) {
      return '';
    }
  }

  window.BookingTourUtils = window.BookingTourUtils || {};
  window.BookingTourUtils.formatDate = formatDate;
  window.BookingTourUtils.formatDateTime = formatDateTime;
  window.BookingTourUtils.toVietnamDateInput = toVietnamDateInput;

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
    } catch (_) { }

    if (!user) {
      user = {
        fullName: 'Trần Quản Trị',
        role: 'Admin',
        roleName: 'Quản trị viên'
      };
    }

    const header = document.querySelector('header');
    if (header) {
      const nameEl = document.getElementById('adminUserDisplayName') || header.querySelector('p.text-blue-900') || header.querySelector('p');
      let roleEl = document.getElementById('adminUserRole') || header.querySelector('span.text-slate-400') || header.querySelector('span.text-xs');
      const avatarEl = document.getElementById('adminUserAvatar') || header.querySelector('img');

      if (!roleEl && nameEl && nameEl.parentElement) {
        roleEl = document.createElement('span');
        roleEl.id = 'adminUserRole';
        roleEl.className = 'text-xs text-slate-400 font-medium block';
        nameEl.parentElement.appendChild(roleEl);
      }

      const displayName = user.fullName || user.full_name || user.name || user.username || 'Nguyễn Văn Thanh';
      let roleName = user.roleName || user.role_name || user.role || 'Admin';
      const rLower = String(roleName).toLowerCase();
      if (rLower === 'admin' || rLower.includes('quản trị')) roleName = 'Quản trị viên';
      else if (rLower === 'sale' || rLower.includes('kinh doanh') || rLower.includes('sale')) roleName = 'Nhân viên Sale';
      else if (rLower === 'guide' || rLower.includes('hướng dẫn')) roleName = 'Hướng dẫn viên';

      if (nameEl) nameEl.textContent = displayName;
      if (roleEl) roleEl.textContent = roleName;
      if (avatarEl) {
        avatarEl.src = user.avatarUrl || user.avatar || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_admin_1e3a8a_80x80.png';
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
        window.BookingTourApi.apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => { });
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
    let currentPage = 1;
    const pageSize = 5;
    let searchKeyword = '';
    let isLoading = false;

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

    function showTableLoading() {
      const tbody = document.getElementById('categoryTableBody') || document.querySelector('table tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="px-6 py-12 text-center text-slate-400">
              <span class="material-symbols-outlined text-4xl mb-2 text-blue-900 animate-spin">sync</span>
              <p class="font-semibold text-slate-700">Đang tải danh sách danh mục...</p>
            </td>
          </tr>`;
      }
    }

    async function fetchAndRender() {
      if (isLoading) return;
      isLoading = true;
      showTableLoading();

      let items = [];
      let totalItems = 0;
      let totalPages = 1;
      let totalClassifiedTours = 0;

      // 1. Try real Backend MongoDB API
      if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
        try {
          const params = new URLSearchParams();
          params.set('page', currentPage);
          params.set('pageSize', pageSize);
          if (searchKeyword) params.set('search', searchKeyword);

          const res = await window.BookingTourApi.apiRequest(`/api/categories?${params.toString()}`);
          const payload = res?.data || res?.items || [];
          items = Array.isArray(payload) ? payload : [];
          totalItems = Number(res?.total ?? res?.totalItems ?? items.length);
          totalPages = Number(res?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize)));

          // Count classified tours across returned items or total
          const allToursRes = await window.BookingTourApi.apiRequest('/api/tours?pageSize=1').catch(() => null);
          if (allToursRes && allToursRes.total) {
            totalClassifiedTours = allToursRes.total;
          }
        } catch (apiErr) {
          console.error('Backend Categories API error:', apiErr);
          items = null;
        }
      }

      isLoading = false;

      if (!items) {
        const tbody = document.querySelector('table tbody');
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" class="px-8 py-12 text-center text-rose-500 font-bold">
                <span class="material-symbols-outlined text-4xl mb-2 text-rose-400">error</span>
                <p>Không thể kết nối đến máy chủ MongoDB để tải danh mục.</p>
              </td>
            </tr>`;
        }
        return;
      }

      // Stats
      const totalCategoriesEl = document.getElementById('statTotalCategories');
      const totalClassifiedToursEl = document.getElementById('statTotalClassifiedTours');
      if (totalCategoriesEl) totalCategoriesEl.textContent = totalItems;
      if (totalClassifiedToursEl && totalClassifiedTours > 0) {
        totalClassifiedToursEl.textContent = totalClassifiedTours;
      }

      // Heading and Page Badge
      const heading = document.getElementById('categoryListHeading');
      if (heading) heading.textContent = `Danh sách Danh mục (${totalItems})`;

      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }

      const pageBadge = document.getElementById('categoryPageBadge');
      if (pageBadge) pageBadge.textContent = `Trang ${currentPage} / ${totalPages}`;

      // Render Table Rows
      const tbody = document.getElementById('categoryTableBody') || document.querySelector('table tbody');
      if (tbody) {
        if (!items || items.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">category</span>
                <p class="font-medium text-slate-600">Không tìm thấy danh mục tour nào phù hợp.</p>
                ${searchKeyword ? '<p class="text-xs text-slate-400 mt-1">Thử tìm kiếm với từ khóa khác hoặc nhấn Đặt lại.</p>' : ''}
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = items.map(c => {
            const name = c.category_name || c.name || 'Danh mục';
            const desc = c.description || '—';
            const count = c.tours_count ?? c.tour_count ?? 0;
            return `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-mono font-bold text-slate-500 text-xs">#${c.id}</td>
                <td class="px-6 py-4 font-bold text-blue-950">
                  <button type="button" class="btn-view-category-tours flex items-center gap-2 text-left hover:text-blue-700 transition group cursor-pointer"
                          data-id="${c.id}" data-name="${encodeURIComponent(name)}" data-desc="${encodeURIComponent(desc === '—' ? '' : desc)}" data-count="${count}"
                          title="Nhấn để xem danh sách tour thuộc danh mục ${name}">
                    <span class="material-symbols-outlined text-blue-900 group-hover:scale-110 transition-transform text-lg">category</span>
                    <span class="font-bold underline decoration-blue-300 group-hover:decoration-blue-700">${name}</span>
                    <span class="material-symbols-outlined text-slate-400 group-hover:text-blue-900 text-sm opacity-60 group-hover:opacity-100 transition-opacity">visibility</span>
                  </button>
                </td>
                <td class="px-6 py-4 text-slate-600 max-w-md">${desc}</td>
                <td class="px-6 py-4 text-center">
                  <button type="button" class="btn-view-category-tours px-3 py-1 bg-blue-50 text-blue-900 hover:bg-blue-100 hover:border-blue-300 text-xs font-bold rounded-full border border-blue-100 transition cursor-pointer"
                          data-id="${c.id}" data-name="${encodeURIComponent(name)}" data-desc="${encodeURIComponent(desc === '—' ? '' : desc)}" data-count="${count}"
                          title="Xem ${count} tour thuộc danh mục ${name}">
                    ${count} tour
                  </button>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button type="button" class="btn-view-category-tours p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                            data-id="${c.id}" data-name="${encodeURIComponent(name)}" data-desc="${encodeURIComponent(desc === '—' ? '' : desc)}" data-count="${count}"
                            title="Xem danh sách tour">
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button type="button" class="btn-edit-category p-2 hover:bg-orange-50 rounded-lg transition text-orange-600"
                            data-id="${c.id}" data-name="${encodeURIComponent(name)}" data-desc="${encodeURIComponent(desc === '—' ? '' : desc)}" title="Chỉnh sửa">
                      <span class="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button type="button" class="btn-delete-category p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                            data-id="${c.id}" data-name="${encodeURIComponent(name)}" title="Xóa">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');

          // Wire View Category Tours click
          tbody.querySelectorAll('.btn-view-category-tours').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              const catId = btn.getAttribute('data-id');
              const catName = decodeURIComponent(btn.getAttribute('data-name') || '');
              const catDesc = decodeURIComponent(btn.getAttribute('data-desc') || '');
              const catCount = btn.getAttribute('data-count') || '0';
              openCategoryToursModal(catId, catName, catDesc, catCount);
            });
          });

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
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              const name = decodeURIComponent(btn.getAttribute('data-name') || '');
              if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"?`)) return;

              try {
                if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
                  await window.BookingTourApi.apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
                } else if (window.BookingTourDB) {
                  window.BookingTourDB.deleteCategory(id);
                }

                showSuccess(`Đã xóa danh mục "${name}" thành công!`);

                // If this was the only item on current page and not page 1, step back
                if (items.length === 1 && currentPage > 1) {
                  currentPage--;
                }
                fetchAndRender();
              } catch (delErr) {
                console.error('Lỗi xóa danh mục:', delErr);
                showError(delErr.message || 'Không thể xóa danh mục này.');
              }
            });
          });
        }
      }

      // Render Pagination
      renderPagination(totalItems, totalPages);
    }

    function renderPagination(totalItems, totalPages) {
      const summary = document.getElementById('categoryPaginationSummary');
      const safeTotalPages = Math.max(1, Number(totalPages) || 1);
      const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

      if (summary) {
        const start = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
        const end = Math.min(safeCurrentPage * pageSize, totalItems);
        summary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${totalItems}</span> danh mục`;
      }

      const buttonsContainer = document.getElementById('categoryPaginationButtons');
      if (!buttonsContainer) return;

      let btns = '';

      // Nút Previous <
      if (safeCurrentPage > 1) {
        btns += `
          <button type="button" class="btn-page-prev w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm font-bold text-sm" title="Trang trước">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      }

      // Numeric buttons with smart ellipsis
      const pageNumbers = getPaginationRange(safeCurrentPage, safeTotalPages);
      for (const p of pageNumbers) {
        if (p === '...') {
          btns += `<span class="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm select-none">...</span>`;
        } else if (p === safeCurrentPage) {
          btns += `<span class="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-900 bg-blue-900 text-white font-bold text-sm shadow-sm select-none">${p}</span>`;
        } else {
          btns += `<button type="button" class="btn-page-num w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-sm font-bold text-sm" data-page="${p}">${p}</button>`;
        }
      }

      // Nút Next >
      if (safeCurrentPage < safeTotalPages) {
        btns += `
          <button type="button" class="btn-page-next w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm font-bold text-sm" title="Trang tiếp theo">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      }

      buttonsContainer.innerHTML = btns;

      // Event listeners for pagination
      buttonsContainer.querySelector('.btn-page-prev')?.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          fetchAndRender();
        }
      });

      buttonsContainer.querySelector('.btn-page-next')?.addEventListener('click', () => {
        if (currentPage < safeTotalPages) {
          currentPage++;
          fetchAndRender();
        }
      });

      buttonsContainer.querySelectorAll('.btn-page-num').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = Number(btn.getAttribute('data-page'));
          if (p && p !== currentPage) {
            currentPage = p;
            fetchAndRender();
          }
        });
      });
    }

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

    // Search Form Handler
    const searchForm = document.getElementById('searchCategoryForm') || document.querySelector('#category-manager-content form');
    const searchInput = document.getElementById('categorySearchInput') || document.querySelector('input[name="keyword"]');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchKeyword = (searchInput?.value || '').trim();
        currentPage = 1;
        fetchAndRender();
      });
    }

    const btnResetSearch = document.getElementById('btnResetCategorySearch');
    if (btnResetSearch) {
      btnResetSearch.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchKeyword = '';
        currentPage = 1;
        fetchAndRender();
      });
    }

    // Add Category Form Handler
    const addForm = document.getElementById('addCategoryForm') || document.querySelector('#addCategoryModal form');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const name = (fd.get('category_name') || fd.get('name') || '').trim();
        const description = (fd.get('description') || '').trim();

        if (!name) {
          showError('Vui lòng nhập tên danh mục!');
          return;
        }

        try {
          if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
            await window.BookingTourApi.apiRequest('/api/categories', {
              method: 'POST',
              body: JSON.stringify({ category_name: name, description })
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.createCategory({
              name,
              description: description || 'Danh mục du lịch đặc sắc',
              icon: 'category',
              slug: name.toLowerCase().replace(/\s+/g, '-')
            });
          }

          document.getElementById('addCategoryModal')?.classList.add('hidden');
          addForm.reset();
          showSuccess(`Đã thêm mới danh mục "${name}" thành công!`);
          currentPage = 1;
          fetchAndRender();
        } catch (addErr) {
          console.error('Lỗi thêm danh mục:', addErr);
          showError(addErr.message || 'Không thể tạo danh mục. Vui lòng thử lại.');
        }
      });
    }

    // Edit Category Form Handler
    const editForm = document.getElementById('editCategoryForm') || document.querySelector('#editCategoryModal form');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(editForm);
        const id = document.getElementById('editCategoryId')?.value || fd.get('category_id');
        const name = (fd.get('category_name') || fd.get('name') || '').trim();
        const description = (fd.get('description') || '').trim();

        if (!id || !name) {
          showError('Vui lòng nhập đầy đủ thông tin danh mục!');
          return;
        }

        try {
          if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
            await window.BookingTourApi.apiRequest(`/api/categories/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ category_name: name, description })
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.updateCategory(id, { name, description });
          }

          document.getElementById('editCategoryModal')?.classList.add('hidden');
          showSuccess(`Đã cập nhật danh mục "${name}" thành công!`);
          fetchAndRender();
        } catch (editErr) {
          console.error('Lỗi cập nhật danh mục:', editErr);
          showError(editErr.message || 'Không thể cập nhật danh mục. Vui lòng thử lại.');
        }
      });
    }

    // -------------------------------------------------------------
    // MODAL XEM DANH SÁCH TOUR THUỘC DANH MỤC
    // -------------------------------------------------------------
    let currentModalCatId = null;
    let currentModalPage = 1;
    const modalPageSize = 5;

    function openCategoryToursModal(catId, catName, catDesc, catCount) {
      currentModalCatId = catId;
      currentModalPage = 1;

      const modal = document.getElementById('categoryToursModal');
      const titleEl = document.getElementById('modalCategoryTitle');
      const subtitleEl = document.getElementById('modalCategorySubtitle');
      const descEl = document.getElementById('modalCategoryDesc');
      const badgeEl = document.getElementById('modalCategoryTotalBadge');

      if (titleEl) titleEl.textContent = catName;
      if (subtitleEl) subtitleEl.textContent = `Danh mục mã #${catId}`;
      if (descEl) descEl.textContent = catDesc || 'Không có mô tả';
      if (badgeEl) badgeEl.textContent = `${catCount} tour`;

      // Clear previous content
      const tbody = document.getElementById('modalCategoryToursTableBody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-slate-400">
              <span class="material-symbols-outlined text-4xl mb-2 text-blue-900 animate-spin">sync</span>
              <p class="font-semibold text-slate-700">Đang tải danh sách tour...</p>
            </td>
          </tr>`;
      }
      const buttonsContainer = document.getElementById('modalCategoryToursPaginationButtons');
      if (buttonsContainer) buttonsContainer.innerHTML = '';

      if (modal) modal.classList.remove('hidden');

      loadCategoryTours(catId, 1);
    }

    async function loadCategoryTours(catId, page) {
      currentModalPage = page;
      const tbody = document.getElementById('modalCategoryToursTableBody');
      const paginationSummary = document.getElementById('modalCategoryToursPaginationSummary');
      const buttonsContainer = document.getElementById('modalCategoryToursPaginationButtons');

      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="px-6 py-12 text-center text-slate-400">
              <span class="material-symbols-outlined text-4xl mb-2 text-blue-900 animate-spin">sync</span>
              <p class="font-semibold text-slate-700">Đang tải danh sách tour...</p>
            </td>
          </tr>`;
      }

      try {
        let items = [];
        let totalItems = 0;
        let totalPages = 1;

        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          const res = await window.BookingTourApi.apiRequest(`/api/categories/${catId}/tours?page=${page}&pageSize=${modalPageSize}`);
          items = res?.data || [];
          totalItems = Number(res?.total ?? res?.totalItems ?? items.length);
          totalPages = Number(res?.totalPages ?? Math.max(1, Math.ceil(totalItems / modalPageSize)));
        } else if (window.BookingTourDB) {
          const allTours = window.BookingTourDB.getTours() || [];
          const filtered = allTours.filter(t => String(t.category_id) === String(catId));
          totalItems = filtered.length;
          totalPages = Math.max(1, Math.ceil(totalItems / modalPageSize));
          const start = (page - 1) * modalPageSize;
          items = filtered.slice(start, start + modalPageSize);
        }

        // Update badge total
        const badgeEl = document.getElementById('modalCategoryTotalBadge');
        if (badgeEl) badgeEl.textContent = `${totalItems} tour`;

        // Render Table Rows
        if (!tbody) return;
        if (!items || items.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">tour</span>
                <p class="font-medium text-slate-600">Danh mục này hiện chưa có tour du lịch nào liên kết.</p>
                <p class="text-xs text-slate-400 mt-1">Các tour mới được thêm vào danh mục này sẽ xuất hiện tại đây.</p>
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = items.map(t => {
            const thumb = t.thumbnail_url || 'https://pub-33beb9a3cd824c58a79f91874499c9b4.r2.dev/Images_Project/DLHN1.jpg';
            const priceFormatted = t.min_price ? new Intl.NumberFormat('vi-VN').format(t.min_price) + ' đ' : 'Liên hệ';
            const duration = t.duration_text || (t.duration_days ? `${t.duration_days}N${t.duration_nights || 0}Đ` : '—');
            const province = t.province_name || 'Toàn quốc';
            const statusText = t.status_text || (t.departures_count > 0 ? 'Đang mở bán' : 'Chờ lịch');
            const statusClass = t.departures_count > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200';

            return `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-mono font-bold text-slate-500 text-xs">#${t.id}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <img src="${thumb}" alt="${t.title}" class="w-12 h-10 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100'"/>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-800 text-sm truncate max-w-xs" title="${t.title}">${t.title}</p>
                      <p class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <span class="material-symbols-outlined text-xs">schedule</span>
                        <span>${duration}</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-slate-600">
                  <div class="flex items-center gap-1 text-xs">
                    <span class="material-symbols-outlined text-xs text-rose-500">location_on</span>
                    <span>${province}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600">${duration}</td>
                <td class="px-4 py-3 text-right font-bold text-blue-900 text-sm">${priceFormatted}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusClass}">
                    ${statusText}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <a href="../tours/show.html?id=${t.id}" target="_blank"
                     class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition shadow-2xs"
                     title="Xem chi tiết tour #${t.id}">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                    <span>Xem tour</span>
                  </a>
                </td>
              </tr>
            `;
          }).join('');
        }

        // Render Pagination Summary
        if (paginationSummary) {
          const start = totalItems === 0 ? 0 : (page - 1) * modalPageSize + 1;
          const end = Math.min(page * modalPageSize, totalItems);
          paginationSummary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${totalItems}</span> tour`;
        }

        // Render Modal Pagination Buttons
        if (buttonsContainer) {
          const safeTotalPages = Math.max(1, totalPages);
          let btns = '';

          // Prev button
          if (page > 1) {
            btns += `
              <button type="button" class="btn-modal-prev w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-2xs font-bold text-xs" title="Trang trước">
                <span class="material-symbols-outlined text-base">chevron_left</span>
              </button>`;
          } else {
            btns += `
              <button type="button" disabled class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
                <span class="material-symbols-outlined text-base">chevron_left</span>
              </button>`;
          }

          // Page numbers
          const pageNumbers = getPaginationRange(page, safeTotalPages);
          for (const p of pageNumbers) {
            if (p === '...') {
              btns += `<span class="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-xs select-none">...</span>`;
            } else if (p === page) {
              btns += `<span class="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-900 bg-blue-900 text-white font-bold text-xs shadow-2xs select-none">${p}</span>`;
            } else {
              btns += `<button type="button" class="btn-modal-page w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-2xs font-bold text-xs" data-page="${p}">${p}</button>`;
            }
          }

          // Next button
          if (page < safeTotalPages) {
            btns += `
              <button type="button" class="btn-modal-next w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-2xs font-bold text-xs" title="Trang tiếp theo">
                <span class="material-symbols-outlined text-base">chevron_right</span>
              </button>`;
          } else {
            btns += `
              <button type="button" disabled class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
                <span class="material-symbols-outlined text-base">chevron_right</span>
              </button>`;
          }

          buttonsContainer.innerHTML = btns;

          // Wire Pagination Click Events
          buttonsContainer.querySelector('.btn-modal-prev')?.addEventListener('click', () => {
            if (currentModalPage > 1) loadCategoryTours(catId, currentModalPage - 1);
          });
          buttonsContainer.querySelector('.btn-modal-next')?.addEventListener('click', () => {
            if (currentModalPage < safeTotalPages) loadCategoryTours(catId, currentModalPage + 1);
          });
          buttonsContainer.querySelectorAll('.btn-modal-page').forEach(b => {
            b.addEventListener('click', () => {
              const p = Number(b.getAttribute('data-page'));
              if (p && p !== currentModalPage) loadCategoryTours(catId, p);
            });
          });
        }
      } catch (err) {
        console.error('Lỗi tải danh sách tour theo danh mục:', err);
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-red-500">
                <span class="material-symbols-outlined text-4xl mb-2 text-red-400">error</span>
                <p class="font-semibold">Không thể tải danh sách tour du lịch.</p>
                <p class="text-xs text-slate-400 mt-1">${err.message || 'Vui lòng thử lại sau.'}</p>
              </td>
            </tr>`;
        }
      }
    }

    // Modal backdrop click to close
    const modalCategoryTours = document.getElementById('categoryToursModal');
    if (modalCategoryTours) {
      modalCategoryTours.addEventListener('click', (e) => {
        if (e.target === modalCategoryTours) {
          modalCategoryTours.classList.add('hidden');
        }
      });
    }

    window.openCategoryToursModal = openCategoryToursModal;

    // Initial load
    fetchAndRender();
  }

  // -------------------------------------------------------------
  // MODULE 2: QUẢN LÝ TOUR (TOURS)
  // -------------------------------------------------------------
  async function renderPendingPayments(onConfirmed) {
    const container = document.getElementById('pendingPayments');
    if (!container) return;
    try {
      const api = window.BookingTourApi;
      const { data: transfers } = await api.apiRequest('/api/bookings/pending-payments');
      if (!container.isConnected) return;
      container.replaceChildren();
      if (!transfers || !transfers.length) {
        container.innerHTML = `
          <div class="flex items-center gap-2 text-slate-500 text-xs py-2">
            <span class="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
            <span>Hiện không có đơn nào đang chờ xác nhận thanh toán.</span>
          </div>`;
        return;
      }
      for (const transfer of transfers) {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 transition hover:bg-amber-50/70 shadow-sm';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex items-center gap-3 min-w-0';
        const isCash = transfer.paymentOption === 'cash';
        infoDiv.innerHTML = `
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <span class="material-symbols-outlined text-xl">payments</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-extrabold text-blue-950 text-sm">${escapeTourHtml(transfer.bookingCode)}</span>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${isCash ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                ${isCash ? 'Tiền mặt' : 'Chuyển khoản ngân hàng'}
              </span>
            </div>
            <p class="text-xs text-slate-600 mt-0.5 line-clamp-1">${escapeTourHtml(transfer.tourTitle || 'Tour du lịch')}</p>
            <p class="text-xs text-slate-400 mt-0.5">Đặt lúc: ${formatDateTime(transfer.createdAt)}</p>
          </div>
        `;

        const actionDiv = document.createElement('div');
        actionDiv.className = 'flex items-center gap-3 shrink-0';

        const amountEl = document.createElement('span');
        amountEl.className = 'text-base font-black text-blue-950 font-mono';
        amountEl.textContent = formatMoney(transfer.totalAmount);

        const btnDetail = document.createElement('button');
        btnDetail.type = 'button';
        btnDetail.className = 'px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition shadow-sm';
        btnDetail.innerHTML = '<span class="material-symbols-outlined text-sm">visibility</span> Chi tiết';
        btnDetail.onclick = () => {
          if (typeof window.BookingTourAdminPages?.showTransactionDetail === 'function') {
            window.BookingTourAdminPages.showTransactionDetail(transfer.bookingCode || transfer.id);
          } else {
            const btn = document.querySelector(`.btn-show-txn[data-id="${transfer.id}"]`);
            if (btn) btn.click();
            else alert(`Chi tiết đơn ${transfer.bookingCode} - ${transfer.tourTitle} - ${formatMoney(transfer.totalAmount)}`);
          }
        };

        const btnConfirm = document.createElement('button');
        btnConfirm.type = 'button';
        btnConfirm.className = 'px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50';
        btnConfirm.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Xác nhận đã nhận tiền';
        btnConfirm.onclick = async () => {
          if (!confirm(`Đã đối chiếu và xác nhận nhận đủ ${formatMoney(transfer.totalAmount)} cho đơn đặt tour ${transfer.bookingCode}?`)) return;
          btnConfirm.disabled = true;
          try {
            await api.apiRequest('/api/bookings/' + transfer.id + '/confirm-payment', { method: 'POST' });
            alert('Đã xác nhận thanh toán thành công!');
            await renderPendingPayments(onConfirmed);
            if (typeof onConfirmed === 'function') await onConfirmed();
          } catch (error) {
            alert(error.message || 'Lỗi khi xác nhận thanh toán.');
            btnConfirm.disabled = false;
          }
        };

        actionDiv.append(amountEl, btnDetail, btnConfirm);
        row.append(infoDiv, actionDiv);
        container.append(row);
      }
    } catch (error) {
      if (container && container.isConnected) {
        container.innerHTML = `<p class="text-rose-500 text-xs">${escapeTourHtml(error.message || 'Lỗi khi tải danh sách chờ thanh toán.')}</p>`;
      }
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
    const pageSize = 5;
    let currentTotalPages = 1;
    const previous = document.querySelector('[data-tour-prev]');
    const next = document.querySelector('[data-tour-next]');
    // Người dùng có thể chuyển module trong lúc API danh sách tour đang tải.
    if (!previous || !next) return;
    const numbersContainer = document.querySelector('[data-tour-page-numbers]');
    const pageBadge = document.querySelector('[data-tour-page-badge]');
    const pageLabelSpan = document.querySelector('[data-tour-page]');
    let keyword = urlParams.get('keyword') || '';
    let catId = urlParams.get('category_id') || '';
    let provId = urlParams.get('province_id') || '';

    if (pageBadge) {
      pageBadge.textContent = '';
      pageBadge.classList.add('hidden');
    }
    if (pageLabelSpan) {
      pageLabelSpan.textContent = '';
      pageLabelSpan.classList.add('hidden');
    }

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
        (!q || [t.title, t.pickup_point, t.province_name, t.destination, t.category_name].some(value => value?.toLocaleLowerCase('vi').includes(q)))
      );

      const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      currentTotalPages = pages;
      if (page > pages) page = pages;
      if (page < 1) page = 1;
      const offset = (page - 1) * pageSize;
      const visible = filtered.slice(offset, offset + pageSize);

      if (previous) previous.disabled = page <= 1;
      if (next) next.disabled = page >= pages;

      if (numbersContainer) {
        if (filtered.length === 0) {
          numbersContainer.innerHTML = '';
        } else {
          const pageNumbers = getPaginationRange(page, pages);
          numbersContainer.innerHTML = pageNumbers.map(p => {
            if (p === '...') {
              return `<span class="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm select-none">...</span>`;
            }
            if (p === page) {
              return `<span class="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-900 bg-blue-900 text-white font-bold text-sm shadow-xs select-none">${p}</span>`;
            }
            return `<button type="button" class="btn-tour-page-num w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" data-page="${p}">${p}</button>`;
          }).join('');

          numbersContainer.querySelectorAll('.btn-tour-page-num').forEach(btn => {
            btn.addEventListener('click', () => {
              const p = Number(btn.getAttribute('data-page'));
              if (p && p !== page) {
                page = p;
                renderTours();
              }
            });
          });
        }
      }

      if (pageBadge) {
        pageBadge.textContent = '';
        pageBadge.classList.add('hidden');
      }
      if (pageLabelSpan) {
        pageLabelSpan.textContent = '';
        pageLabelSpan.classList.add('hidden');
      }

      const headingCountEl = document.querySelector('[data-tour-list-title]');
      if (headingCountEl) headingCountEl.textContent = `Danh sách Tour (${filtered.length})`;

      const tbody = document.querySelector('table tbody');
      if (tbody) {
        if (filtered.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="px-8 py-16 text-center text-slate-400">
                <div class="max-w-sm mx-auto flex flex-col items-center">
                  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <span class="material-symbols-outlined text-3xl">tour</span>
                  </div>
                  <p class="font-semibold text-slate-700 text-base">Không tìm thấy tour du lịch nào</p>
                  <p class="text-xs text-slate-500 mt-1">Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc danh mục, tỉnh thành.</p>
                </div>
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
        if (filtered.length === 0) {
          paginationInfoEl.innerHTML = 'Hiển thị <span class="font-bold text-slate-800">0</span> trên tổng số <span class="font-bold text-slate-800">0</span> tour';
        } else {
          const start = offset + 1;
          const end = offset + visible.length;
          paginationInfoEl.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${filtered.length}</span> tour`;
        }
      }
    }

    const filterForm = catSelect?.form || document.querySelector('form');
    if (filterForm) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        page = 1;
        keyword = (keywordInput?.value || '').trim();
        catId = catSelect?.value || '';
        provId = provSelect?.value || '';
        renderTours();
      });
    }

    if (keywordInput) {
      keywordInput.addEventListener('input', () => {
        page = 1;
        keyword = (keywordInput.value || '').trim();
        renderTours();
      });
    }

    if (catSelect) {
      catSelect.addEventListener('change', () => {
        page = 1;
        catId = catSelect.value || '';
        renderTours();
      });
    }

    if (provSelect) {
      provSelect.addEventListener('change', () => {
        page = 1;
        provId = provSelect.value || '';
        renderTours();
      });
    }

    const resetBtn = filterForm?.querySelector('a[href="index.html"]') || filterForm?.querySelector('a[title*="bộ lọc"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (keywordInput) keywordInput.value = '';
        if (catSelect) catSelect.value = '';
        if (provSelect) provSelect.value = '';
        keyword = '';
        catId = '';
        provId = '';
        page = 1;
        renderTours();
      });
    }

    if (previous) {
      previous.onclick = () => {
        if (page > 1) {
          page--;
          renderTours();
        }
      };
    }
    if (next) {
      next.onclick = () => {
        if (page < currentTotalPages) {
          page++;
          renderTours();
        }
      };
    }
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
    const cancel = form.querySelector('a');
    if (cancel) cancel.href = id ? '/admin/tours/show.html?id=' + id : '/admin/tours/index.html';
    const viewDetail = document.querySelector('a[data-tour-view-detail]');
    if (viewDetail && id) viewDetail.href = '/admin/tours/show.html?id=' + id;
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
    const tourEditLink = root.querySelector('[data-tour-edit]');
    if (tourEditLink) tourEditLink.href = '/admin/tours/edit.html?id=' + id;
    const tourListLink = root.querySelector('[data-tour-list]');
    if (tourListLink) tourListLink.href = '/admin/tours/index.html';
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


  function handleToursCreate() {
    return handleTourForm(false).catch(showTourError);
  }

  function handleToursEdit() {
    return handleTourForm(true).catch(showTourError);
  }

  // -------------------------------------------------------------
  // MODULE 3: QUẢN LÝ CHUYẾN ĐI (DEPARTURES)
  // -------------------------------------------------------------
  function handleDeparturesIndex() {
    let currentPage = 1;
    const pageSize = 5;
    let currentStatus = 'all';
    let searchKeyword = '';
    let filterDate = '';
    let isLoading = false;
    let cachedTours = null;
    let cachedGuides = null;

    const alertSuccess = document.getElementById('departureAlertSuccess');
    const alertSuccessText = document.getElementById('departureAlertSuccessText');
    const alertError = document.getElementById('departureAlertError');
    const alertErrorText = document.getElementById('departureAlertErrorText');

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

    // 1. Fetch & Update Stats
    async function fetchStats() {
      try {
        if (!window.BookingTourApi?.apiRequest) return;
        const res = await window.BookingTourApi.apiRequest('/api/departures/stats');
        const stats = res?.data || res || {};

        const openEl = document.getElementById('statDeparturesOpen');
        const noGuideEl = document.getElementById('statDeparturesNoGuide');
        const todayEl = document.getElementById('statDeparturesToday');
        const totalEl = document.getElementById('statDeparturesTotal');

        if (openEl) openEl.textContent = stats.open_count ?? 0;
        if (noGuideEl) noGuideEl.textContent = stats.unassigned_count ?? 0;
        if (todayEl) todayEl.textContent = stats.today_count ?? 0;
        if (totalEl) totalEl.textContent = stats.total_count ?? 0;

        // Update counts on filter tabs if present
        const tabBtns = document.querySelectorAll('#departureStatusTabs button');
        if (tabBtns.length >= 4) {
          tabBtns[0].textContent = `Tất cả (${stats.total_count ?? 0})`;
          tabBtns[1].textContent = `Đang bán (${stats.open_count ?? 0})`;
          tabBtns[2].textContent = `Đã đầy (${stats.full_count ?? 0})`;
          tabBtns[3].textContent = `Đã hủy (${stats.cancelled_count ?? 0})`;
        }
      } catch (err) {
        console.warn('Lỗi tải thống kê chuyến khởi hành:', err);
      }
    }

    // 2. Fetch & Render Departure List
    async function fetchAndRender() {
      if (isLoading) return;
      isLoading = true;

      const grid = document.getElementById('departuresGridContainer');
      if (grid) {
        grid.innerHTML = `
          <div class="col-span-1 lg:col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            <span class="material-symbols-outlined text-4xl mb-2 text-blue-900 animate-spin">sync</span>
            <p class="font-semibold text-slate-700">Đang tải danh sách chuyến khởi hành...</p>
          </div>`;
      }

      let items = [];
      let totalItems = 0;
      let totalPages = 1;

      // Try Backend API
      if (window.BookingTourApi?.apiRequest) {
        try {
          const params = new URLSearchParams();
          params.set('page', currentPage);
          params.set('pageSize', pageSize);
          if (currentStatus && currentStatus !== 'all') {
            params.set('status', currentStatus);
          }
          if (searchKeyword) {
            params.set('search', searchKeyword);
          }
          if (filterDate) {
            params.set('date', filterDate);
          }

          const res = await window.BookingTourApi.apiRequest(`/api/departures?${params.toString()}`);
          items = res?.data || res?.items || [];
          totalItems = Number(res?.total ?? res?.totalItems ?? items.length);
          totalPages = Number(res?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize)));
        } catch (apiErr) {
          console.error('Backend Departures API error:', apiErr);
          items = null;
        }
      }

      isLoading = false;

      if (items === null) {
        if (grid) {
          grid.innerHTML = `
            <div class="col-span-1 lg:col-span-2 py-12 text-center text-rose-500 bg-white rounded-2xl border border-rose-100 font-bold">
              <span class="material-symbols-outlined text-4xl mb-2 text-rose-400">error</span>
              <p>Không thể kết nối đến máy chủ MongoDB để tải danh sách chuyến khởi hành.</p>
            </div>`;
        }
        return;
      }

      // Render Cards
      if (grid) {
        if (!items || items.length === 0) {
          grid.innerHTML = `
            <div class="col-span-1 lg:col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">flight_takeoff</span>
              <p class="font-medium text-slate-600">Không tìm thấy chuyến khởi hành nào phù hợp.</p>
              ${searchKeyword || filterDate || currentStatus !== 'all' ? '<p class="text-xs text-slate-400 mt-1">Thử tìm kiếm với từ khóa khác hoặc nhấn nút Đặt lại bộ lọc.</p>' : ''}
            </div>`;
        } else {
          grid.innerHTML = items.map(d => {
            const tourTitle = d.tour_title || d.tour?.title || 'Tour du lịch khám phá';
            const provName = d.tour?.province_name || d.tour?.province?.name || 'Việt Nam';
            const price = formatMoney(d.adult_price);
            const childPrice = formatMoney(d.child_price || d.adult_price * 0.7);
            const maxSeats = Number(d.max_seats ?? d.total_seats ?? 20);
            const availSeats = Number(d.available_seats ?? 0);
            const booked = Math.max(0, maxSeats - availSeats);
            const pct = maxSeats > 0 ? Math.min(100, Math.round((booked / maxSeats) * 100)) : 0;
            const guideName = d.guide_name || d.guide?.full_name || 'Chưa phân công';
            const hasGuide = Boolean(d.guide_id && guideName !== 'Chưa phân công');
            const isFull = d.status === 'full' || d.status === 'sold_out' || availSeats <= 0;
            const isCancelled = d.status === 'cancelled';

            let statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">Đang bán</span>';
            if (isFull) statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm">Đã đầy</span>';
            if (isCancelled) statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">Đã hủy</span>';

            const startDate = d.departure_date || d.start_date;
            const endDate = d.return_date || d.end_date;

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
                          <span>${formatDate(startDate)}</span>
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-slate-500 font-semibold mb-1">Trở về</p>
                        <p class="font-bold text-blue-950 flex items-center gap-1 text-xs sm:text-sm">
                          <span class="material-symbols-outlined text-sm text-slate-400">event</span>
                          <span>${formatDate(endDate)}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <div class="flex items-center justify-between mb-2 text-xs">
                        <p class="font-bold text-slate-600 uppercase">Tình trạng giữ chỗ</p>
                        <p class="font-bold text-blue-900">
                          <span class="font-black">${booked}</span> / ${maxSeats} khách đã đặt (${availSeats} chỗ trống)
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
                      ${!hasGuide ? `<a href="assign_guide.html?departure_id=${d.id}" class="text-orange-600 font-bold hover:underline flex items-center gap-0.5"><span class="material-symbols-outlined text-sm">person_add</span>Phân công</a>` : ''}
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
                  <button type="button" class="btn-delete-departure p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" data-id="${d.id}" data-name="${encodeURIComponent(tourTitle)}" title="Xóa chuyến">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            `;
          }).join('');

          // Wire Delete Action
          grid.querySelectorAll('.btn-delete-departure').forEach(btn => {
            btn.addEventListener('click', async () => {
              const id = btn.getAttribute('data-id');
              const name = decodeURIComponent(btn.getAttribute('data-name') || '');
              if (!confirm(`Xác nhận xóa chuyến khởi hành #DEP-${id} (${name})?`)) return;

              try {
                if (window.BookingTourApi?.apiRequest) {
                  await window.BookingTourApi.apiRequest(`/api/departures/${id}`, { method: 'DELETE' });
                } else if (window.BookingTourDB) {
                  window.BookingTourDB.deleteDeparture(id);
                }

                showSuccess(`Đã xóa chuyến khởi hành #DEP-${id} thành công!`);

                if (items.length === 1 && currentPage > 1) {
                  currentPage--;
                }
                fetchAndRender();
                fetchStats();
              } catch (delErr) {
                console.error('Lỗi xóa chuyến khởi hành:', delErr);
                showError(delErr.message || 'Không thể xóa chuyến khởi hành này.');
              }
            });
          });
        }
      }

      // Render Pagination
      renderPagination(totalItems, totalPages);
    }

    // 3. Render Pagination
    function renderPagination(totalItems, totalPages) {
      const summary = document.getElementById('departurePaginationSummary');
      const safeTotalPages = Math.max(1, Number(totalPages) || 1);
      const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

      if (summary) {
        const start = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
        const end = Math.min(safeCurrentPage * pageSize, totalItems);
        summary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${totalItems}</span> chuyến khởi hành`;
      }

      const buttonsContainer = document.getElementById('departurePaginationButtons');
      if (!buttonsContainer) return;

      let btns = '';

      // Previous button <
      if (safeCurrentPage > 1) {
        btns += `
          <button type="button" class="btn-page-prev w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm font-bold text-sm" title="Trang trước">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      }

      // Page numbers with ellipsis
      const pageNumbers = getPaginationRange(safeCurrentPage, safeTotalPages);
      for (const p of pageNumbers) {
        if (p === '...') {
          btns += `<span class="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm select-none">...</span>`;
        } else if (p === safeCurrentPage) {
          btns += `<span class="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-900 bg-blue-900 text-white font-bold text-sm shadow-sm select-none">${p}</span>`;
        } else {
          btns += `<button type="button" class="btn-page-num w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-sm font-bold text-sm" data-page="${p}">${p}</button>`;
        }
      }

      // Next button >
      if (safeCurrentPage < safeTotalPages) {
        btns += `
          <button type="button" class="btn-page-next w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-sm font-bold text-sm" title="Trang tiếp theo">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      }

      buttonsContainer.innerHTML = btns;

      buttonsContainer.querySelector('.btn-page-prev')?.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          fetchAndRender();
        }
      });

      buttonsContainer.querySelector('.btn-page-next')?.addEventListener('click', () => {
        if (currentPage < safeTotalPages) {
          currentPage++;
          fetchAndRender();
        }
      });

      buttonsContainer.querySelectorAll('.btn-page-num').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = Number(btn.getAttribute('data-page'));
          if (p && p !== currentPage) {
            currentPage = p;
            fetchAndRender();
          }
        });
      });
    }

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

    // 4. Status Filter Tabs
    const tabBtns = document.querySelectorAll('#departureStatusTabs button');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const status = btn.getAttribute('data-status') || 'all';
        currentStatus = status;

        tabBtns.forEach(t => {
          t.className = 'px-4 py-2 rounded-xl font-bold text-xs transition bg-slate-100 text-slate-600 hover:bg-slate-200';
        });
        btn.className = 'px-4 py-2 rounded-xl font-bold text-xs transition bg-blue-900 text-white shadow-sm';

        currentPage = 1;
        fetchAndRender();
      });
    });

    // 5. Search & Filter Form
    const searchForm = document.getElementById('departureSearchForm');
    const keywordInput = document.getElementById('departureKeywordInput');
    const dateInput = document.getElementById('departureDateInput');
    const resetFilterBtn = document.getElementById('btnResetDepartureFilter');

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchKeyword = (keywordInput?.value || '').trim();
        filterDate = (dateInput?.value || '').trim();
        currentPage = 1;
        fetchAndRender();
      });
    }

    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        if (keywordInput) keywordInput.value = '';
        if (dateInput) dateInput.value = '';
        searchKeyword = '';
        filterDate = '';
        currentPage = 1;
        fetchAndRender();
      });
    }

    // 6. Create Departure Modal Integration
    const modal = document.getElementById('createDepartureModal');
    const btnOpenModal = document.getElementById('btnOpenCreateDepartureModal');
    const btnCloseModal = document.getElementById('btnCloseCreateDepartureModal');
    const btnCancelModal = document.getElementById('btnCancelCreateDeparture');
    const createForm = document.getElementById('createDepartureForm');
    const tourSelect = document.getElementById('createDepTourSelect');
    const guideSelect = document.getElementById('createDepGuideSelect');
    const startDateInput = document.getElementById('createDepStartDate');
    const endDateInput = document.getElementById('createDepEndDate');
    const maxSeatsInput = document.getElementById('createDepMaxSeats');
    const adultPriceInput = document.getElementById('createDepAdultPrice');
    const childPriceInput = document.getElementById('createDepChildPrice');
    const statusSelect = document.getElementById('createDepStatus');
    const modalError = document.getElementById('createDepartureModalError');
    const modalErrorText = document.getElementById('createDepartureModalErrorText');
    const submitBtn = document.getElementById('btnSubmitCreateDeparture');

    function showModalError(msg) {
      if (modalError && modalErrorText) {
        modalErrorText.textContent = msg;
        modalError.classList.remove('hidden');
      } else {
        alert(msg);
      }
    }

    function hideModalError() {
      if (modalError) modalError.classList.add('hidden');
    }

    async function loadTourAndGuideOptions() {
      // Load Tours
      if (!cachedTours && tourSelect) {
        try {
          if (window.BookingTourApi?.apiRequest) {
            const res = await window.BookingTourApi.apiRequest('/api/tours?pageSize=100');
            cachedTours = res?.data || res?.items || [];
          } else if (window.BookingTourDB) {
            cachedTours = window.BookingTourDB.getTours() || [];
          }
          if (cachedTours && cachedTours.length > 0) {
            tourSelect.innerHTML = '<option value="">-- Chọn Tour du lịch --</option>' +
              cachedTours.map(t => {
                const prov = t.province_name || t.province?.name || '';
                return `<option value="${t.id}">${t.title}${prov ? ` (${prov})` : ''}</option>`;
              }).join('');
          } else {
            tourSelect.innerHTML = '<option value="">-- Chưa có tour nào --</option>';
          }
        } catch (err) {
          console.error('Lỗi tải danh sách tour:', err);
          tourSelect.innerHTML = '<option value="">-- Không thể tải danh sách tour --</option>';
        }
      }

      // Load Guides
      if (!cachedGuides && guideSelect) {
        try {
          if (window.BookingTourApi?.apiRequest) {
            const res = await window.BookingTourApi.apiRequest('/api/employees?pageSize=100').catch(() => null);
            cachedGuides = res?.data || res?.items || [];
          } else if (window.BookingTourDB) {
            cachedGuides = window.BookingTourDB.getEmployees() || [];
          }
          if (cachedGuides && cachedGuides.length > 0) {
            const guides = cachedGuides.filter(g => !g.role || g.role.toLowerCase() === 'guide');
            const list = guides.length > 0 ? guides : cachedGuides;
            guideSelect.innerHTML = '<option value="">-- Chưa phân công HDV --</option>' +
              list.map(g => `<option value="${g.id}">${g.full_name || g.name} (${g.phone || 'N/A'})</option>`).join('');
          }
        } catch (err) {
          console.warn('Lỗi tải danh sách HDV:', err);
        }
      }
    }

    if (tourSelect) {
      tourSelect.addEventListener('change', () => {
        const selectedId = Number(tourSelect.value);
        if (!selectedId || !cachedTours) return;
        const tour = cachedTours.find(t => t.id === selectedId);
        if (tour) {
          const price = Number(tour.min_price || tour.adult_price || 0);
          if (adultPriceInput && price > 0) {
            adultPriceInput.value = price;
          }
          if (childPriceInput && price > 0) {
            childPriceInput.value = Math.round(price * 0.7);
          }
        }
      });
    }

    if (btnOpenModal && modal) {
      btnOpenModal.addEventListener('click', () => {
        hideModalError();
        modal.classList.remove('hidden');

        // Set default dates: departure tomorrow, return 3 days later (Vietnam timezone)
        if (startDateInput && !startDateInput.value) {
          const tmr = new Date(Date.now() + 86400000);
          startDateInput.value = toVietnamDateInput(tmr);
        }
        if (endDateInput && !endDateInput.value) {
          const ret = new Date(Date.now() + 86400000 * 4);
          endDateInput.value = toVietnamDateInput(ret);
        }

        loadTourAndGuideOptions();
      });
    }

    function closeModal() {
      if (modal) modal.classList.add('hidden');
      hideModalError();
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Handle Form Submit
    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideModalError();

        const tourId = Number(tourSelect?.value);
        const depDate = startDateInput?.value;
        const retDate = endDateInput?.value;
        const maxSeats = Number(maxSeatsInput?.value) || 20;
        const adultPrice = Number(adultPriceInput?.value) || 0;
        const childPrice = childPriceInput?.value ? Number(childPriceInput.value) : Math.round(adultPrice * 0.7);
        const guideId = guideSelect?.value ? Number(guideSelect.value) : null;
        const status = statusSelect?.value || 'open';

        if (!tourId) {
          showModalError('Vui lòng chọn tour du lịch.');
          return;
        }
        if (!depDate || !retDate) {
          showModalError('Vui lòng chọn ngày khởi hành và ngày trở về.');
          return;
        }
        if (new Date(retDate) < new Date(depDate)) {
          showModalError('Ngày trở về phải lớn hơn hoặc bằng ngày khởi hành.');
          return;
        }
        if (maxSeats <= 0) {
          showModalError('Số chỗ tối đa phải lớn hơn 0.');
          return;
        }
        if (adultPrice < 0 || childPrice < 0) {
          showModalError('Giá tour không được là số âm.');
          return;
        }

        // Disable submit button during request
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span><span>Đang tạo...</span>';
        }

        try {
          const payload = {
            tour_id: tourId,
            departure_date: depDate,
            return_date: retDate,
            max_seats: maxSeats,
            adult_price: adultPrice,
            child_price: childPrice,
            guide_id: guideId,
            status: status
          };

          if (window.BookingTourApi?.apiRequest) {
            await window.BookingTourApi.apiRequest('/api/departures', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.createDeparture({
              ...payload,
              start_date: depDate,
              end_date: retDate,
              total_seats: maxSeats,
              available_seats: maxSeats
            });
          }

          closeModal();
          createForm.reset();
          showSuccess('Đã tạo chuyến khởi hành mới thành công!');

          // Reload data
          currentPage = 1;
          fetchAndRender();
          fetchStats();
        } catch (submitErr) {
          console.error('Lỗi tạo chuyến khởi hành:', submitErr);
          showModalError(submitErr.message || 'Không thể tạo chuyến khởi hành. Vui lòng thử lại.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-base">add</span><span>Tạo chuyến</span>';
          }
        }
      });
    }

    // Initial Load
    fetchStats();
    fetchAndRender();
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

  async function handleDeparturesEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const depIdStr = urlParams.get('id');

    const alertSuccess = document.getElementById('departureEditAlertSuccess');
    const alertSuccessText = document.getElementById('departureEditAlertSuccessText');
    const alertError = document.getElementById('departureEditAlertError');
    const alertErrorText = document.getElementById('departureEditAlertErrorText');
    const headingEl = document.getElementById('editDepartureHeading') || document.querySelector('h1');
    const form = document.getElementById('editDepartureForm') || document.querySelector('main form');
    const tourSelect = document.getElementById('editDepTourSelect') || document.querySelector('select[name="tourId"]') || document.querySelector('select[name="tour_id"]');
    const depDateInput = document.getElementById('departureDate') || document.querySelector('input[name="departureDate"]') || document.querySelector('input[name="start_date"]');
    const retDateInput = document.getElementById('returnDate') || document.querySelector('input[name="returnDate"]') || document.querySelector('input[name="end_date"]');
    const maxSeatsInput = document.getElementById('editDepMaxSeats') || document.querySelector('input[name="maxSeats"]') || document.querySelector('input[name="total_seats"]');
    const adultPriceInput = document.getElementById('editDepAdultPrice') || document.querySelector('input[name="adultPrice"]') || document.querySelector('input[name="adult_price"]');
    const childPriceInput = document.getElementById('editDepChildPrice') || document.querySelector('input[name="childPrice"]') || document.querySelector('input[name="child_price"]');
    const guideSelect = document.getElementById('editDepGuideSelect') || document.querySelector('select[name="guideId"]') || document.querySelector('select[name="guide_id"]');
    const statusSelect = document.getElementById('statusSelect') || document.querySelector('select[name="status"]');
    const seatsInfoEl = document.getElementById('editDepSeatsInfo');
    const submitBtn = document.getElementById('btnSubmitEditDeparture') || form?.querySelector('button[type="submit"]');

    function showError(msg) {
      if (alertError && alertErrorText) {
        alertErrorText.textContent = msg;
        alertError.classList.remove('hidden');
        if (alertSuccess) alertSuccess.classList.add('hidden');
      } else {
        alert(msg);
      }
    }

    function showSuccess(msg) {
      if (alertSuccess && alertSuccessText) {
        alertSuccessText.textContent = msg;
        alertSuccess.classList.remove('hidden');
        if (alertError) alertError.classList.add('hidden');
      } else {
        alert(msg);
      }
    }

    if (!depIdStr) {
      showError('Không tìm thấy mã chuyến khởi hành trong địa chỉ URL.');
      if (form) Array.from(form.elements).forEach(el => el.disabled = true);
      return;
    }

    const depId = Number(depIdStr);
    if (isNaN(depId)) {
      showError(`Mã chuyến khởi hành "${depIdStr}" không hợp lệ.`);
      if (form) Array.from(form.elements).forEach(el => el.disabled = true);
      return;
    }

    if (headingEl) {
      headingEl.textContent = `Sửa thông tin Chuyến đi #DEP-${depId}`;
    }

    // Load data from Backend API
    let departure = null;
    let tours = [];
    let guides = [];

    if (window.BookingTourApi?.apiRequest) {
      try {
        const [depRes, toursRes, guidesRes] = await Promise.all([
          window.BookingTourApi.apiRequest(`/api/departures/${depId}`).catch(err => {
            console.warn('API get departure error:', err);
            return null;
          }),
          window.BookingTourApi.apiRequest('/api/tours?pageSize=100').catch(() => null),
          window.BookingTourApi.apiRequest('/api/employees?pageSize=100').catch(() => null)
        ]);

        departure = depRes?.data || depRes;
        tours = toursRes?.data || toursRes?.items || [];
        guides = guidesRes?.data || guidesRes?.items || [];
      } catch (apiErr) {
        console.error('Lỗi tải dữ liệu từ Backend:', apiErr);
      }
    }

    // Fallback to local DB if backend not available or returned null
    if (!departure && window.BookingTourDB) {
      const db = window.BookingTourDB;
      departure = db.getDepartureById(depId) || db.getDepartureById(`dep_${depId}`);
      if (!tours.length) tours = db.getTours() || [];
      if (!guides.length) guides = db.getEmployees() || [];
    }

    if (!departure) {
      showError(`Không tìm thấy chuyến khởi hành #DEP-${depId}!`);
      if (form) {
        Array.from(form.elements).forEach(el => el.disabled = true);
      }
      return;
    }

    // Populate Tours dropdown
    if (tourSelect) {
      if (tours.length > 0) {
        tourSelect.innerHTML = '<option value="">-- Chọn Tour du lịch --</option>' +
          tours.map(t => {
            const prov = t.province_name || t.province?.name || '';
            const isSelected = (t.id === departure.tour_id || t.id === departure.tour?.id);
            return `<option value="${t.id}" ${isSelected ? 'selected' : ''}>${t.title}${prov ? ` (${prov})` : ''}</option>`;
          }).join('');
      } else if (departure.tour_title) {
        tourSelect.innerHTML = `<option value="${departure.tour_id}" selected>${departure.tour_title}</option>`;
      }
    }

    // Populate Guides dropdown
    if (guideSelect) {
      const guideList = guides.filter(g => !g.role || g.role.toLowerCase() === 'guide');
      const list = guideList.length > 0 ? guideList : guides;
      guideSelect.innerHTML = '<option value="">-- Chưa gán HDV --</option>' +
        list.map(g => {
          const isSelected = (g.id === departure.guide_id);
          return `<option value="${g.id}" ${isSelected ? 'selected' : ''}>${g.full_name || g.name} (${g.phone || 'N/A'})</option>`;
        }).join('');
    }

    // Populate Dates (YYYY-MM-DD) using Vietnam calendar dates
    const startDate = departure.departure_date || departure.start_date;
    const endDate = departure.return_date || departure.end_date;

    const initialDepDateStr = toVietnamDateInput(startDate);
    const initialRetDateStr = toVietnamDateInput(endDate);

    if (depDateInput && initialDepDateStr) {
      depDateInput.value = initialDepDateStr;
    }
    if (retDateInput && initialRetDateStr) {
      retDateInput.value = initialRetDateStr;
      retDateInput.min = initialDepDateStr;
    }

    // Maintain tour duration when departure date is adjusted
    let tourDurationDays = 0;
    if (initialDepDateStr && initialRetDateStr) {
      const d1 = new Date(initialDepDateStr);
      const d2 = new Date(initialRetDateStr);
      tourDurationDays = Math.round((d2 - d1) / 86400000);
    }
    if (tourDurationDays <= 0 && departure.tour?.duration_days) {
      tourDurationDays = Math.max(0, departure.tour.duration_days - 1);
    }

    if (depDateInput && retDateInput) {
      depDateInput.addEventListener('change', () => {
        if (!depDateInput.value) return;
        retDateInput.min = depDateInput.value;
        if (tourDurationDays >= 0) {
          const newDep = new Date(depDateInput.value);
          const newRet = new Date(newDep.getTime() + tourDurationDays * 86400000);
          retDateInput.value = toVietnamDateInput(newRet);
        }
      });
    }

    // Populate Seats & Prices
    const maxSeats = Number(departure.max_seats ?? departure.total_seats ?? 20);
    const availSeats = Number(departure.available_seats ?? 0);
    const bookedSeats = Math.max(0, maxSeats - availSeats);

    if (maxSeatsInput) maxSeatsInput.value = maxSeats;
    if (adultPriceInput) adultPriceInput.value = departure.adult_price ?? 0;
    if (childPriceInput) childPriceInput.value = departure.child_price ?? Math.round((departure.adult_price ?? 0) * 0.7);
    if (statusSelect) {
      statusSelect.value = (departure.status || 'open').toLowerCase();
    }

    if (seatsInfoEl) {
      seatsInfoEl.innerHTML = `Chỗ còn trống: <strong>${availSeats}</strong> (Đã đặt: <strong>${bookedSeats}</strong> / ${maxSeats} khách)`;
    }

    // Handle Form Submit
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (alertError) alertError.classList.add('hidden');

        const selectedTourId = Number(tourSelect?.value);
        const depDateVal = depDateInput?.value;
        const retDateVal = retDateInput?.value;
        const maxSeatsVal = Number(maxSeatsInput?.value) || 20;
        const adultPriceVal = Number(adultPriceInput?.value) || 0;
        const childPriceVal = Number(childPriceInput?.value) || 0;
        const guideIdVal = guideSelect?.value ? Number(guideSelect.value) : null;
        const statusVal = statusSelect?.value || 'open';

        if (!selectedTourId) {
          showError('Vui lòng chọn tour du lịch.');
          return;
        }
        if (!depDateVal || !retDateVal) {
          showError('Vui lòng chọn ngày khởi hành và ngày trở về.');
          return;
        }
        if (new Date(retDateVal) < new Date(depDateVal)) {
          showError('Ngày trở về phải lớn hơn hoặc bằng ngày khởi hành.');
          return;
        }
        if (maxSeatsVal <= 0) {
          showError('Số lượng chỗ tối đa phải lớn hơn 0.');
          return;
        }
        if (adultPriceVal < 0 || childPriceVal < 0) {
          showError('Giá vé không được là số âm.');
          return;
        }

        // Calculate available seats according to booked seats
        const updatedAvailSeats = Math.max(0, maxSeatsVal - bookedSeats);

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Đang lưu...';
        }

        try {
          // If admin did not edit the dates, preserve original date strings to prevent accidental shift
          const finalDepDate = (depDateVal === initialDepDateStr) ? startDate : depDateVal;
          const finalRetDate = (retDateVal === initialRetDateStr) ? endDate : retDateVal;

          const updatePayload = {
            tour_id: selectedTourId,
            departure_date: finalDepDate,
            return_date: finalRetDate,
            max_seats: maxSeatsVal,
            available_seats: updatedAvailSeats,
            adult_price: adultPriceVal,
            child_price: childPriceVal,
            guide_id: guideIdVal,
            status: statusVal
          };

          if (window.BookingTourApi?.apiRequest) {
            await window.BookingTourApi.apiRequest(`/api/departures/${depId}`, {
              method: 'PUT',
              body: JSON.stringify(updatePayload)
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.updateDeparture(depId, {
              tour_id: selectedTourId,
              start_date: depDateVal,
              end_date: retDateVal,
              total_seats: maxSeatsVal,
              available_seats: updatedAvailSeats,
              adult_price: adultPriceVal,
              child_price: childPriceVal,
              guide_id: guideIdVal || '',
              status: statusVal
            });
          }

          showSuccess('Cập nhật chuyến khởi hành thành công! Đang chuyển hướng...');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1200);
        } catch (err) {
          console.error('Lỗi cập nhật chuyến đi:', err);
          showError(err.message || 'Không thể cập nhật chuyến khởi hành.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">save_as</span> Cập nhật thay đổi';
          }
        }
      });
    }
  }

  async function handleDeparturesAssignGuide() {
    const urlParams = new URLSearchParams(window.location.search);
    const depIdStr = urlParams.get('departure_id') || urlParams.get('id');

    const alertSuccess = document.getElementById('assignGuideAlertSuccess');
    const alertSuccessText = document.getElementById('assignGuideAlertSuccessText');
    const alertError = document.getElementById('assignGuideAlertError');
    const alertErrorText = document.getElementById('assignGuideAlertErrorText');
    const tourTitleEl = document.getElementById('assignTourTitle');
    const statusBadgeEl = document.getElementById('assignDepartureStatus');
    const depIdEl = document.getElementById('assignDepartureId');
    const depDateEl = document.getElementById('assignDepDate');
    const retDateEl = document.getElementById('assignRetDate');
    const seatsInfoEl = document.getElementById('assignSeatsInfo');
    const currentGuideEl = document.getElementById('assignCurrentGuide');
    const guideSelect = document.getElementById('assignGuideSelect') || document.querySelector('select[name="guideId"]') || document.querySelector('select[name="guide_id"]');
    const form = document.getElementById('assignGuideForm') || document.querySelector('main form');
    const submitBtn = document.getElementById('btnSubmitAssignGuide') || form?.querySelector('button[type="submit"]');

    function showError(msg) {
      if (alertError && alertErrorText) {
        alertErrorText.textContent = msg;
        alertError.classList.remove('hidden');
        if (alertSuccess) alertSuccess.classList.add('hidden');
      } else {
        alert(msg);
      }
    }

    function showSuccess(msg) {
      if (alertSuccess && alertSuccessText) {
        alertSuccessText.textContent = msg;
        alertSuccess.classList.remove('hidden');
        if (alertError) alertError.classList.add('hidden');
      } else {
        alert(msg);
      }
    }

    if (!depIdStr) {
      showError('Không tìm thấy mã chuyến khởi hành trong địa chỉ URL.');
      if (form) Array.from(form.elements).forEach(el => el.disabled = true);
      return;
    }

    const depId = Number(depIdStr);
    if (isNaN(depId)) {
      showError(`Mã chuyến khởi hành "${depIdStr}" không hợp lệ.`);
      if (form) Array.from(form.elements).forEach(el => el.disabled = true);
      return;
    }

    let dep = null;
    let guides = [];

    // 1. Fetch Departure and Guides from Backend API
    if (window.BookingTourApi?.apiRequest) {
      try {
        const [depRes, guidesRes] = await Promise.all([
          window.BookingTourApi.apiRequest(`/api/departures/${depId}`).catch(err => {
            console.warn('API lấy chi tiết chuyến lỗi:', err);
            return null;
          }),
          window.BookingTourApi.apiRequest('/api/employees?pageSize=100').catch(() => null)
        ]);

        dep = depRes?.data || depRes;
        guides = guidesRes?.data || guidesRes?.items || [];
      } catch (e) {
        console.warn('Lỗi tải dữ liệu phân công HDV:', e);
      }
    }

    // Fallback to local DB if backend unavailable
    if (!dep && window.BookingTourDB) {
      dep = window.BookingTourDB.getDepartureById(depId) || window.BookingTourDB.getDepartureById(`dep_${depId}`);
      guides = window.BookingTourDB.getEmployees({ role: 'Guide' }) || window.BookingTourDB.getEmployees() || [];
    }

    if (!dep) {
      showError(`Không tìm thấy chuyến khởi hành #DEP-${depId}!`);
      if (tourTitleEl) tourTitleEl.textContent = 'Không tìm thấy chuyến đi';
      if (depIdEl) depIdEl.textContent = `#DEP-${depId}`;
      if (form) Array.from(form.elements).forEach(el => el.disabled = true);
      return;
    }

    // 2. Render Departure Information Card
    const tourTitle = dep.tour_title || dep.tour?.title || 'Chuyến du lịch';
    const startDate = dep.departure_date || dep.start_date;
    const endDate = dep.return_date || dep.end_date;
    const maxSeats = Number(dep.max_seats ?? dep.total_seats ?? 20);
    const availSeats = Number(dep.available_seats ?? 0);
    const bookedSeats = Math.max(0, maxSeats - availSeats);
    const guideName = dep.guide_name || dep.guide?.full_name;
    const guidePhone = dep.guide?.phone;
    const isFull = dep.status === 'full' || dep.status === 'sold_out' || availSeats <= 0;
    const isCancelled = dep.status === 'cancelled';

    if (tourTitleEl) tourTitleEl.textContent = tourTitle;
    if (depIdEl) depIdEl.textContent = `#DEP-${dep.id || depId}`;
    if (depDateEl) depDateEl.textContent = formatDate(startDate);
    if (retDateEl) retDateEl.textContent = formatDate(endDate);
    if (seatsInfoEl) {
      seatsInfoEl.innerHTML = `<strong>${bookedSeats}</strong> / ${maxSeats} pax <span class="text-slate-400 font-normal">(${availSeats} trống)</span>`;
    }

    if (statusBadgeEl) {
      if (isCancelled) {
        statusBadgeEl.className = 'shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm';
        statusBadgeEl.textContent = 'Đã hủy';
      } else if (isFull) {
        statusBadgeEl.className = 'shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm';
        statusBadgeEl.textContent = 'Đã đầy chỗ';
      } else {
        statusBadgeEl.className = 'shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm';
        statusBadgeEl.textContent = 'Đang mở bán';
      }
    }

    function updateGuideDisplay(name, phone) {
      if (currentGuideEl) {
        if (name && name !== 'Chưa phân công') {
          currentGuideEl.innerHTML = `
            <span class="material-symbols-outlined text-base text-blue-900">badge</span>
            <span class="text-blue-950 font-black">${name}</span>
            ${phone ? `<span class="text-slate-500 font-normal">(${phone})</span>` : ''}
          `;
        } else {
          currentGuideEl.innerHTML = `
            <span class="material-symbols-outlined text-base text-amber-500">warning</span>
            <span class="text-amber-600 font-semibold italic">Chưa phân công</span>
          `;
        }
      }
    }
    updateGuideDisplay(guideName, guidePhone);

    // ---------------------------------------------------------
    // 3. LOAD & RENDER DANH SÁCH KHÁCH HÀNG ĐÃ ĐẶT CHUYẾN
    // ---------------------------------------------------------
    const bookingsLoading = document.getElementById('assignBookingsLoading');
    const bookingsEmpty = document.getElementById('assignBookingsEmpty');
    const bookingsError = document.getElementById('assignBookingsError');
    const bookingsTableWrapper = document.getElementById('assignBookingsTableWrapper');
    const bookingsTableBody = document.getElementById('assignBookingsTableBody');
    const bookingsSummaryBadge = document.getElementById('assignBookingsSummaryBadge');
    const bookingsSubtitle = document.getElementById('assignBookingsSubtitle');
    const bookingsPagination = document.getElementById('assignBookingsPagination');
    const bookingsPaginationSummary = document.getElementById('assignBookingsPaginationSummary');
    const bookingsPaginationButtons = document.getElementById('assignBookingsPaginationButtons');
    const btnRetryBookings = document.getElementById('btnRetryBookings');

    let currentBookingPage = 1;
    const bookingPageSize = 5;

    function getBookingPaginationRange(current, total) {
      if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      if (current <= 3) {
        return [1, 2, 3, 4, '...', total];
      }
      if (current >= total - 2) {
        return [1, '...', total - 3, total - 2, total - 1, total];
      }
      return [1, '...', current - 1, current, current + 1, '...', total];
    }

    async function loadDepartureBookings(page = 1) {
      currentBookingPage = page;

      if (bookingsLoading) bookingsLoading.classList.remove('hidden');
      if (bookingsEmpty) bookingsEmpty.classList.add('hidden');
      if (bookingsError) bookingsError.classList.add('hidden');
      if (bookingsTableWrapper) bookingsTableWrapper.classList.add('hidden');
      if (bookingsPagination) bookingsPagination.classList.add('hidden');

      try {
        let bookingsData = null;

        if (window.BookingTourApi?.apiRequest) {
          try {
            const res = await window.BookingTourApi.apiRequest(`/api/departures/${depId}/bookings?page=${page}&pageSize=${bookingPageSize}`);
            bookingsData = res?.data || res;
          } catch (apiErr) {
            console.warn('Lỗi gọi API bookings:', apiErr);
          }
        }

        // Fallback to local DB if backend returned nothing
        if (!bookingsData && window.BookingTourDB) {
          const db = window.BookingTourDB;
          const allDepBookings = (db.getBookings() || []).filter(b => b.departure_id === depId || b.departure_id === `dep_${depId}`);
          const totalBookings = allDepBookings.length;
          const totalPassengers = allDepBookings.reduce((sum, b) => sum + (Number(b.passengers_count || b.total_passengers || 1)), 0);
          const totalPages = Math.max(1, Math.ceil(totalBookings / bookingPageSize));
          const pagedItems = allDepBookings.slice((page - 1) * bookingPageSize, page * bookingPageSize).map(b => {
            const cust = db.getCustomerById?.(b.customer_id) || {};
            return {
              id: b.id,
              booking_code: b.booking_code || b.code || `BK${b.id}`,
              customer_id: b.customer_id,
              customer_name: b.customer_name || cust.full_name || 'Khách hàng',
              customer_phone: b.customer_phone || cust.phone || '—',
              customer_email: b.customer_email || cust.email || '—',
              total_adults: b.adults || b.total_adults || 1,
              total_children: b.children || b.total_children || 0,
              total_passengers: (b.adults || b.total_adults || 1) + (b.children || b.total_children || 0),
              created_at: b.created_at || b.booking_date || new Date().toISOString(),
              status: b.status || 'confirmed'
            };
          });

          bookingsData = {
            departure_id: depId,
            total_bookings: totalBookings,
            total_passengers: totalPassengers,
            page: page,
            page_size: bookingPageSize,
            total_pages: totalPages,
            items: pagedItems
          };
        }

        if (!bookingsData) {
          throw new Error('Không thể tải dữ liệu danh sách khách hàng đặt chuyến.');
        }

        renderBookingsList(bookingsData);
      } catch (err) {
        console.error('Lỗi tải danh sách khách đặt:', err);
        if (bookingsLoading) bookingsLoading.classList.add('hidden');
        if (bookingsError) {
          bookingsError.classList.remove('hidden');
          const errText = document.getElementById('assignBookingsErrorText');
          if (errText) errText.textContent = err.message || 'Không thể tải danh sách khách đặt chỗ.';
        }
      }
    }

    function renderBookingsList(data) {
      if (bookingsLoading) bookingsLoading.classList.add('hidden');

      const totalBookings = Number(data.total_bookings) || 0;
      const totalPassengers = Number(data.total_passengers) || 0;
      const items = data.items || [];
      const totalPages = Math.max(1, Number(data.total_pages) || 1);
      const safePage = Math.min(Math.max(1, Number(data.page) || currentBookingPage), totalPages);

      // Cập nhật badge tóm tắt số lượng khách và đơn đặt
      if (bookingsSummaryBadge) {
        bookingsSummaryBadge.textContent = `${totalPassengers} khách / ${totalBookings} đơn`;
      }
      if (bookingsSubtitle) {
        bookingsSubtitle.textContent = totalBookings > 0
          ? `Có tổng cộng ${totalBookings} đơn đặt chỗ với ${totalPassengers} lượt khách tham gia`
          : 'Chưa có đơn đặt chỗ nào cho chuyến đi này';
      }

      // Cập nhật số khách trên Departure Info Card nếu có dữ liệu chính xác
      if (seatsInfoEl && totalBookings > 0) {
        const remaining = Math.max(0, maxSeats - totalPassengers);
        seatsInfoEl.innerHTML = `<strong>${totalPassengers}</strong> / ${maxSeats} pax <span class="text-slate-400 font-normal">(${remaining} trống)</span>`;
      }

      if (totalBookings === 0 || items.length === 0) {
        if (bookingsEmpty) bookingsEmpty.classList.remove('hidden');
        if (bookingsTableWrapper) bookingsTableWrapper.classList.add('hidden');
        if (bookingsPagination) bookingsPagination.classList.add('hidden');
        return;
      }

      // Render danh sách khách vào bảng
      if (bookingsTableBody) {
        bookingsTableBody.innerHTML = items.map((b, idx) => {
          const stt = (safePage - 1) * bookingPageSize + idx + 1;
          const bCode = b.booking_code || `#BK-${b.id}`;
          const custName = b.customer_name || 'Khách hàng';
          const custPhone = b.customer_phone || '—';
          const custEmail = b.customer_email || '—';
          const adults = Number(b.total_adults) || 0;
          const children = Number(b.total_children) || 0;
          const totalPax = b.total_passengers || (adults + children) || 1;
          const dateStr = formatDate(b.created_at);

          // Trạng thái đơn đặt chỗ
          const statusLower = (b.status || 'confirmed').toLowerCase();
          let statusBadgeHtml = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Đã xác nhận</span>';
          if (statusLower === 'pending') {
            statusBadgeHtml = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Chờ duyệt</span>';
          } else if (statusLower === 'cancelled') {
            statusBadgeHtml = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Đã hủy</span>';
          } else if (statusLower === 'completed') {
            statusBadgeHtml = '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Hoàn thành</span>';
          }

          return `
            <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
              <td class="py-3 px-4 text-center text-slate-400 font-bold">${stt}</td>
              <td class="py-3 px-4 font-mono font-bold text-blue-900">${bCode}</td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800 block">${custName}</span>
              </td>
              <td class="py-3 px-4 text-slate-600 font-medium">${custPhone}</td>
              <td class="py-3 px-4 text-slate-500">${custEmail}</td>
              <td class="py-3 px-4 text-center">
                <span class="font-bold text-blue-950 text-sm">${totalPax}</span>
                <span class="text-[10px] text-slate-400 font-normal block">(${adults} NL${children > 0 ? `, ${children} TE` : ''})</span>
              </td>
              <td class="py-3 px-4 text-slate-500">${dateStr}</td>
              <td class="py-3 px-4 text-center">${statusBadgeHtml}</td>
            </tr>
          `;
        }).join('');
      }

      if (bookingsTableWrapper) bookingsTableWrapper.classList.remove('hidden');

      // Render Phân Trang
      renderBookingsPagination(totalBookings, totalPages, safePage);
    }

    function renderBookingsPagination(totalItems, totalPages, safeCurrentPage) {
      if (!bookingsPagination) return;
      bookingsPagination.classList.remove('hidden');

      if (bookingsPaginationSummary) {
        const start = (safeCurrentPage - 1) * bookingPageSize + 1;
        const end = Math.min(safeCurrentPage * bookingPageSize, totalItems);
        bookingsPaginationSummary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${totalItems}</span> đơn đặt chỗ`;
      }

      if (!bookingsPaginationButtons) return;

      let btns = '';

      // Previous button <
      if (safeCurrentPage > 1) {
        btns += `
          <button type="button" class="btn-booking-prev w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-xs" title="Trang trước">
            <span class="material-symbols-outlined text-base">chevron_left</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-base">chevron_left</span>
          </button>`;
      }

      // Page numbers with ellipsis
      const pageNumbers = getBookingPaginationRange(safeCurrentPage, totalPages);
      for (const p of pageNumbers) {
        if (p === '...') {
          btns += `<span class="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-xs select-none">...</span>`;
        } else if (p === safeCurrentPage) {
          btns += `<span class="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-900 bg-blue-900 text-white font-bold text-xs shadow-xs select-none">${p}</span>`;
        } else {
          btns += `<button type="button" class="btn-booking-page w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-xs" data-page="${p}">${p}</button>`;
        }
      }

      // Next button >
      if (safeCurrentPage < totalPages) {
        btns += `
          <button type="button" class="btn-booking-next w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-xs" title="Trang sau">
            <span class="material-symbols-outlined text-base">chevron_right</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-base">chevron_right</span>
          </button>`;
      }

      bookingsPaginationButtons.innerHTML = btns;

      bookingsPaginationButtons.querySelector('.btn-booking-prev')?.addEventListener('click', () => {
        if (currentBookingPage > 1) {
          loadDepartureBookings(currentBookingPage - 1);
        }
      });

      bookingsPaginationButtons.querySelector('.btn-booking-next')?.addEventListener('click', () => {
        if (currentBookingPage < totalPages) {
          loadDepartureBookings(currentBookingPage + 1);
        }
      });

      bookingsPaginationButtons.querySelectorAll('.btn-booking-page').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = Number(btn.getAttribute('data-page'));
          if (p && p !== currentBookingPage) {
            loadDepartureBookings(p);
          }
        });
      });
    }

    if (btnRetryBookings) {
      btnRetryBookings.addEventListener('click', () => {
        loadDepartureBookings(currentBookingPage);
      });
    }

    // Nạp danh sách khách hàng đặt chỗ
    loadDepartureBookings(1);

    // 4. Populate Guides Dropdown
    if (guideSelect) {
      const guideList = guides.filter(g => !g.role || g.role.toLowerCase() === 'guide');
      const list = guideList.length > 0 ? guideList : guides;

      if (list.length === 0) {
        guideSelect.innerHTML = '<option value="">-- Không có hướng dẫn viên khả dụng --</option>';
      } else {
        guideSelect.innerHTML = '<option value="">-- Vui lòng chọn Hướng dẫn viên --</option>' +
          list.map(g => {
            const isSelected = (g.id === dep.guide_id);
            const phoneStr = g.phone ? ` (${g.phone})` : '';
            const emailStr = g.email ? ` - ${g.email}` : '';
            return `<option value="${g.id}" ${isSelected ? 'selected' : ''}>${g.full_name || g.name}${phoneStr}${emailStr}</option>`;
          }).join('');
      }
    }

    // 4. Handle Form Submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (alertError) alertError.classList.add('hidden');

        const selectedGuideId = guideSelect ? Number(guideSelect.value) : 0;
        if (!selectedGuideId) {
          showError('Vui lòng chọn hướng dẫn viên phụ trách từ danh sách.');
          return;
        }

        const selectedOption = guideSelect?.options[guideSelect.selectedIndex];
        const selectedGuideText = selectedOption ? selectedOption.text.split('(')[0].trim() : 'Hướng dẫn viên';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Đang phân công...</span>';
        }

        try {
          if (window.BookingTourApi?.apiRequest) {
            await window.BookingTourApi.apiRequest(`/api/departures/${depId}/assign-guide`, {
              method: 'POST',
              body: JSON.stringify({ guide_id: selectedGuideId })
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.assignGuide(depId, selectedGuideId);
          }

          showSuccess(`Đã phân công hướng dẫn viên "${selectedGuideText}" cho chuyến #DEP-${depId} thành công!`);

          // Update current guide display immediately
          const assignedGuideObj = guides.find(g => g.id === selectedGuideId);
          updateGuideDisplay(assignedGuideObj?.full_name || selectedGuideText, assignedGuideObj?.phone);
        } catch (err) {
          console.error('Lỗi phân công HDV:', err);
          showError(err.message || 'Không thể phân công hướng dẫn viên cho chuyến này.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">how_to_reg</span><span>Xác nhận phân công</span>';
          }
        }
      });
    }
  }

  // -------------------------------------------------------------
  // MODULE 4: QUẢN LÝ ĐỊA ĐIỂM (LOCATIONS & PROVINCES)
  // -------------------------------------------------------------
  function handleLocationsIndex() {
    let currentPage = 1;
    const pageSize = 5;
    let currentKeyword = '';
    let currentRegion = '';

    // Alerts
    const alertSuccess = document.getElementById('locationAlertSuccess');
    const alertSuccessText = document.getElementById('locationAlertSuccessText');
    const alertError = document.getElementById('locationAlertError');
    const alertErrorText = document.getElementById('locationAlertErrorText');

    function showSuccessToast(msg) {
      if (alertSuccess && alertSuccessText) {
        alertSuccessText.textContent = msg;
        alertSuccess.classList.remove('hidden');
        if (alertError) alertError.classList.add('hidden');
        setTimeout(() => alertSuccess.classList.add('hidden'), 4000);
      } else {
        alert(msg);
      }
    }

    function showErrorToast(msg) {
      if (alertError && alertErrorText) {
        alertErrorText.textContent = msg;
        alertError.classList.remove('hidden');
        if (alertSuccess) alertSuccess.classList.add('hidden');
      } else {
        alert(msg);
      }
    }

    // Stats Elements
    const statTotalProvincesEl = document.getElementById('statTotalProvinces');
    const statRegionBreakdownEl = document.getElementById('statRegionBreakdown');
    const statTotalToursEl = document.getElementById('statTotalTours');
    const statActiveProvincesEl = document.getElementById('statActiveProvinces');
    const statPickupPointsEl = document.getElementById('statPickupPoints');

    async function fetchStats() {
      try {
        if (window.BookingTourApi?.apiRequest) {
          const res = await window.BookingTourApi.apiRequest('/api/provinces/stats').catch(() => null);
          const stats = res?.data || res;
          if (stats) {
            if (statTotalProvincesEl) statTotalProvincesEl.textContent = stats.total_provinces ?? 0;
            if (statRegionBreakdownEl) {
              statRegionBreakdownEl.textContent = `Bắc: ${stats.north_count ?? 0} • Trung: ${stats.central_count ?? 0} • Nam: ${stats.south_count ?? 0}`;
            }
            if (statTotalToursEl) statTotalToursEl.textContent = stats.total_tours ?? 0;
            if (statActiveProvincesEl) statActiveProvincesEl.textContent = stats.active_provinces_count ?? 0;
            if (statPickupPointsEl) statPickupPointsEl.textContent = stats.pickup_points_count ?? 8;
            return;
          }
        }
      } catch (err) {
        console.warn('Lỗi lấy thống kê tỉnh thành từ Backend:', err);
      }

      // Fallback local DB
      const db = getDB();
      if (db) {
        const provs = db.getProvinces() || [];
        const tours = db.getTours() || [];
        const northCount = provs.filter(p => (p.region || '').includes('Bắc')).length;
        const centralCount = provs.filter(p => (p.region || '').includes('Trung')).length;
        const southCount = provs.filter(p => (p.region || '').includes('Nam')).length;
        const activeCount = provs.filter(p => (p.tour_count || 0) > 0).length;

        if (statTotalProvincesEl) statTotalProvincesEl.textContent = provs.length;
        if (statRegionBreakdownEl) statRegionBreakdownEl.textContent = `Bắc: ${northCount} • Trung: ${centralCount} • Nam: ${southCount}`;
        if (statTotalToursEl) statTotalToursEl.textContent = tours.length;
        if (statActiveProvincesEl) statActiveProvincesEl.textContent = activeCount;
        if (statPickupPointsEl) statPickupPointsEl.textContent = 8;
      }
    }

    // Grid, Loading, Empty, Error Elements
    const summaryCountEl = document.getElementById('provinceSummaryCount');
    const loadingEl = document.getElementById('provinceLoading');
    const emptyEl = document.getElementById('provinceEmpty');
    const errorEl = document.getElementById('provinceError');
    const errorTextEl = document.getElementById('provinceErrorText');
    const gridEl = document.getElementById('provinceGrid');
    const paginationEl = document.getElementById('provincePagination');
    const paginationSummaryEl = document.getElementById('provincePaginationSummary');
    const paginationButtonsEl = document.getElementById('provincePaginationButtons');
    const btnRetry = document.getElementById('btnRetryProvinceList');

    function getProvincePaginationRange(current, total) {
      if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      if (current <= 3) {
        return [1, 2, 3, 4, '...', total];
      }
      if (current >= total - 2) {
        return [1, '...', total - 3, total - 2, total - 1, total];
      }
      return [1, '...', current - 1, current, current + 1, '...', total];
    }

    async function fetchAndRender() {
      if (loadingEl) loadingEl.classList.remove('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (errorEl) errorEl.classList.add('hidden');
      if (gridEl) gridEl.classList.add('hidden');
      if (paginationEl) paginationEl.classList.add('hidden');

      let provs = [];
      let totalItems = 0;
      let totalPages = 1;

      try {
        if (window.BookingTourApi?.apiRequest) {
          const queryParams = new URLSearchParams({
            page: currentPage,
            pageSize: pageSize
          });
          if (currentKeyword) queryParams.set('keyword', currentKeyword);
          if (currentRegion) queryParams.set('region', currentRegion);

          const res = await window.BookingTourApi.apiRequest(`/api/provinces?${queryParams.toString()}`);
          provs = res?.data || res?.items || [];
          totalItems = res?.total_items ?? res?.total ?? provs.length;
          totalPages = res?.total_pages ?? Math.max(1, Math.ceil(totalItems / pageSize));
        }
      } catch (apiErr) {
        console.error('Lỗi API lấy danh sách tỉnh thành:', apiErr);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
        return;
      }

      if (loadingEl) loadingEl.classList.add('hidden');

      if (summaryCountEl) {
        summaryCountEl.textContent = `Hiển thị ${provs.length} / ${totalItems} tỉnh thành`;
      }

      if (totalItems === 0 || provs.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        renderPagination(0, 1, 1);
        return;
      }

      // Render Grid Cards
      if (gridEl) {
        gridEl.innerHTML = provs.map(p => {
          const provId = p.id;
          const provName = p.province_name || p.name || 'Tỉnh thành';
          const region = p.region || 'Miền Bắc';
          const desc = p.description || 'Điểm đến du lịch hấp dẫn với nhiều cảnh quan đẹp.';
          const imgUrl = p.image_url || p.image || '';
          const tourCount = Number(p.tours_count ?? p.tour_count ?? 0);

          let regionClass = 'bg-blue-100 text-blue-800';
          if (region.includes('Trung')) regionClass = 'bg-emerald-100 text-emerald-800';
          else if (region.includes('Nam')) regionClass = 'bg-purple-100 text-purple-800';

          return `
            <div class="bg-slate-50 rounded-2xl p-5 hover:bg-blue-50/50 hover:border-blue-200 transition-all border border-slate-100 flex flex-col justify-between shadow-xs">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2.5 min-w-0">
                    ${imgUrl ? `<img src="${imgUrl}" alt="${provName}" class="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"/>` : `<div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 font-bold text-xs"><span class="material-symbols-outlined text-base">location_on</span></div>`}
                    <h4 class="font-black text-blue-950 text-base truncate" title="${provName}">${provName}</h4>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button type="button" class="btn-edit-prov p-1.5 text-slate-400 hover:text-blue-900 transition rounded-lg hover:bg-white"
                            data-id="${provId}" data-name="${encodeURIComponent(provName)}" data-region="${encodeURIComponent(region)}"
                            data-desc="${encodeURIComponent(desc)}" data-img="${encodeURIComponent(imgUrl)}" title="Chỉnh sửa">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button type="button" class="btn-delete-prov p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-white"
                            data-id="${provId}" data-name="${encodeURIComponent(provName)}" title="Xóa tỉnh thành">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2 mt-1 mb-2" title="${desc}">${desc}</p>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${regionClass}">
                  ${region}
                </span>
                <span class="font-bold text-blue-900 flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">tour</span>
                  ${tourCount} tour
                </span>
              </div>
            </div>
          `;
        }).join('');

        // Attach Edit Click Handlers
        gridEl.querySelectorAll('.btn-edit-prov').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = Number(btn.getAttribute('data-id'));
            const name = decodeURIComponent(btn.getAttribute('data-name') || '');
            const region = decodeURIComponent(btn.getAttribute('data-region') || '');
            const desc = decodeURIComponent(btn.getAttribute('data-desc') || '');
            const img = decodeURIComponent(btn.getAttribute('data-img') || '');
            openEditModal(id, name, region, desc, img);
          });
        });

        // Attach Delete Click Handlers
        gridEl.querySelectorAll('.btn-delete-prov').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = Number(btn.getAttribute('data-id'));
            const name = decodeURIComponent(btn.getAttribute('data-name') || '');
            if (!confirm(`Bạn có chắc chắn muốn xóa tỉnh/thành "${name}"?`)) return;

            try {
              if (window.BookingTourApi?.apiRequest) {
                await window.BookingTourApi.apiRequest(`/api/provinces/${id}`, {
                  method: 'DELETE'
                });
              } else if (window.BookingTourDB) {
                window.BookingTourDB.deleteProvince(id);
              }

              showSuccessToast(`Đã xóa tỉnh/thành "${name}" thành công!`);
              // Reload
              if (provs.length === 1 && currentPage > 1) {
                currentPage--;
              }
              fetchAndRender();
              fetchStats();
            } catch (err) {
              console.error('Lỗi xóa tỉnh thành:', err);
              showErrorToast(err.message || 'Không thể xóa tỉnh/thành này.');
            }
          });
        });

        gridEl.classList.remove('hidden');
      }

      // Render Pagination Bar
      renderPagination(totalItems, totalPages, currentPage);
    }

    function renderPagination(totalItems, totalPages, safeCurrentPage) {
      if (!paginationEl) return;
      paginationEl.classList.remove('hidden');

      const safeTotalPages = Math.max(1, Number(totalPages) || 1);
      const safePage = Math.min(Math.max(1, safeCurrentPage), safeTotalPages);

      if (paginationSummaryEl) {
        const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
        const end = Math.min(safePage * pageSize, totalItems);
        paginationSummaryEl.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${totalItems}</span> tỉnh thành`;
      }

      if (!paginationButtonsEl) return;

      let btns = '';

      // Prev Button <
      if (safePage > 1) {
        btns += `
          <button type="button" class="btn-prov-prev w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" title="Trang trước">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      }

      // Page numbers with ellipsis
      const pageNumbers = getProvincePaginationRange(safePage, safeTotalPages);
      for (const p of pageNumbers) {
        if (p === '...') {
          btns += `<span class="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm select-none">...</span>`;
        } else if (p === safePage) {
          btns += `<span class="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-900 bg-blue-900 text-white font-bold text-sm shadow-xs select-none">${p}</span>`;
        } else {
          btns += `<button type="button" class="btn-prov-page w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" data-page="${p}">${p}</button>`;
        }
      }

      // Next Button >
      if (safePage < safeTotalPages) {
        btns += `
          <button type="button" class="btn-prov-next w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" title="Trang tiếp">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      }

      paginationButtonsEl.innerHTML = btns;

      paginationButtonsEl.querySelector('.btn-prov-prev')?.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          fetchAndRender();
        }
      });

      paginationButtonsEl.querySelector('.btn-prov-next')?.addEventListener('click', () => {
        if (currentPage < safeTotalPages) {
          currentPage++;
          fetchAndRender();
        }
      });

      paginationButtonsEl.querySelectorAll('.btn-prov-page').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = Number(btn.getAttribute('data-page'));
          if (p && p !== currentPage) {
            currentPage = p;
            fetchAndRender();
          }
        });
      });
    }

    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        fetchAndRender();
      });
    }

    // Filter Form
    const filterForm = document.getElementById('locationFilterForm');
    const filterKeywordInput = document.getElementById('filterKeyword');
    const filterRegionSelect = document.getElementById('filterRegion');
    const btnResetFilter = document.getElementById('btnResetFilter');

    if (filterForm) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentKeyword = filterKeywordInput?.value.trim() || '';
        currentRegion = filterRegionSelect?.value || '';
        currentPage = 1;
        fetchAndRender();
        loadToursTable(1);
      });
    }

    if (btnResetFilter) {
      btnResetFilter.addEventListener('click', () => {
        if (filterKeywordInput) filterKeywordInput.value = '';
        if (filterRegionSelect) filterRegionSelect.value = '';
        currentKeyword = '';
        currentRegion = '';
        currentPage = 1;
        fetchAndRender();
        loadToursTable(1);
      });
    }

    // -------------------------------------------------------------
    // MODAL THÊM TỈNH THÀNH MỚI
    // -------------------------------------------------------------
    const createModal = document.getElementById('createProvinceModal');
    const btnOpenCreateModal = document.getElementById('btnOpenCreateProvinceModal');
    const btnCloseCreateModal = document.getElementById('btnCloseCreateProvince');
    const btnCancelCreateModal = document.getElementById('btnCancelCreateProvince');
    const createForm = document.getElementById('createProvinceForm');
    const createError = document.getElementById('createProvinceError');
    const createErrorText = document.getElementById('createProvinceErrorText');
    const btnSubmitCreate = document.getElementById('btnSubmitCreateProvince');
    const createNameInput = document.getElementById('create_province_name');
    const createRegionSelect = document.getElementById('create_region');
    const createDescInput = document.getElementById('create_description');
    const createImgInput = document.getElementById('create_image_url');

    function openCreateModal() {
      if (!createModal) return;
      if (createForm) createForm.reset();
      if (createError) createError.classList.add('hidden');
      if (btnSubmitCreate) {
        btnSubmitCreate.disabled = false;
        btnSubmitCreate.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu tỉnh thành</span>';
      }
      createModal.classList.remove('hidden');
      setTimeout(() => createNameInput?.focus(), 100);
    }

    function closeCreateModal() {
      if (createModal) createModal.classList.add('hidden');
      if (createError) createError.classList.add('hidden');
    }

    if (btnOpenCreateModal) {
      btnOpenCreateModal.addEventListener('click', openCreateModal);
    }
    if (btnCloseCreateModal) {
      btnCloseCreateModal.addEventListener('click', closeCreateModal);
    }
    if (btnCancelCreateModal) {
      btnCancelCreateModal.addEventListener('click', closeCreateModal);
    }
    if (createModal) {
      createModal.addEventListener('click', (e) => {
        if (e.target === createModal) closeCreateModal();
      });
    }

    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (createError) createError.classList.add('hidden');

        const name = createNameInput?.value.trim() || '';
        const region = createRegionSelect?.value || '';
        const desc = createDescInput?.value.trim() || '';
        const img = createImgInput?.value.trim() || '';

        if (!name) {
          if (createError && createErrorText) {
            createErrorText.textContent = 'Vui lòng nhập tên tỉnh/thành phố.';
            createError.classList.remove('hidden');
          }
          createNameInput?.focus();
          return;
        }

        if (!region) {
          if (createError && createErrorText) {
            createErrorText.textContent = 'Vui lòng chọn phân vùng miền.';
            createError.classList.remove('hidden');
          }
          createRegionSelect?.focus();
          return;
        }

        if (btnSubmitCreate) {
          btnSubmitCreate.disabled = true;
          btnSubmitCreate.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Đang lưu...</span>';
        }

        try {
          const payload = {
            province_name: name,
            region: region,
            description: desc || null,
            image_url: img || null
          };

          if (window.BookingTourApi?.apiRequest) {
            await window.BookingTourApi.apiRequest('/api/provinces', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.createProvince({
              name,
              region,
              description: desc,
              image: img
            });
          }

          closeCreateModal();
          showSuccessToast(`Đã thêm tỉnh/thành "${name}" thành công!`);

          // Reload list & stats
          currentPage = 1;
          fetchAndRender();
          fetchStats();
        } catch (err) {
          console.error('Lỗi thêm tỉnh thành:', err);
          if (createError && createErrorText) {
            createErrorText.textContent = err.message || 'Không thể tạo tỉnh thành mới.';
            createError.classList.remove('hidden');
          }
          if (btnSubmitCreate) {
            btnSubmitCreate.disabled = false;
            btnSubmitCreate.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu tỉnh thành</span>';
          }
        }
      });
    }

    // -------------------------------------------------------------
    // MODAL CẬP NHẬT TỈNH THÀNH
    // -------------------------------------------------------------
    const editModal = document.getElementById('editProvinceModal');
    const btnCloseEditModal = document.getElementById('btnCloseEditProvince');
    const btnCancelEditModal = document.getElementById('btnCancelEditProvince');
    const editForm = document.getElementById('editProvinceForm');
    const editError = document.getElementById('editProvinceError');
    const editErrorText = document.getElementById('editProvinceErrorText');
    const btnSubmitEdit = document.getElementById('btnSubmitEditProvince');
    const editIdInput = document.getElementById('edit_province_id');
    const editNameInput = document.getElementById('edit_province_name');
    const editRegionSelect = document.getElementById('edit_region');
    const editDescInput = document.getElementById('edit_description');
    const editImgInput = document.getElementById('edit_image_url');

    function openEditModal(id, name, region, desc, img) {
      if (!editModal) return;
      if (editError) editError.classList.add('hidden');
      if (editIdInput) editIdInput.value = id;
      if (editNameInput) editNameInput.value = name;
      if (editRegionSelect) editRegionSelect.value = region;
      if (editDescInput) editDescInput.value = desc;
      if (editImgInput) editImgInput.value = img;
      if (btnSubmitEdit) {
        btnSubmitEdit.disabled = false;
        btnSubmitEdit.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu thay đổi</span>';
      }
      editModal.classList.remove('hidden');
      setTimeout(() => editNameInput?.focus(), 100);
    }

    function closeEditModal() {
      if (editModal) editModal.classList.add('hidden');
      if (editError) editError.classList.add('hidden');
    }

    if (btnCloseEditModal) btnCloseEditModal.addEventListener('click', closeEditModal);
    if (btnCancelEditModal) btnCancelEditModal.addEventListener('click', closeEditModal);
    if (editModal) {
      editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (editError) editError.classList.add('hidden');

        const id = Number(editIdInput?.value);
        const name = editNameInput?.value.trim() || '';
        const region = editRegionSelect?.value || '';
        const desc = editDescInput?.value.trim() || '';
        const img = editImgInput?.value.trim() || '';

        if (!id) {
          if (editError && editErrorText) {
            editErrorText.textContent = 'Mã tỉnh thành không hợp lệ.';
            editError.classList.remove('hidden');
          }
          return;
        }

        if (!name) {
          if (editError && editErrorText) {
            editErrorText.textContent = 'Vui lòng nhập tên tỉnh/thành phố.';
            editError.classList.remove('hidden');
          }
          editNameInput?.focus();
          return;
        }

        if (!region) {
          if (editError && editErrorText) {
            editErrorText.textContent = 'Vui lòng chọn phân vùng miền.';
            editError.classList.remove('hidden');
          }
          editRegionSelect?.focus();
          return;
        }

        if (btnSubmitEdit) {
          btnSubmitEdit.disabled = true;
          btnSubmitEdit.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Đang cập nhật...</span>';
        }

        try {
          const payload = {
            province_name: name,
            region: region,
            description: desc || null,
            image_url: img || null
          };

          if (window.BookingTourApi?.apiRequest) {
            await window.BookingTourApi.apiRequest(`/api/provinces/${id}`, {
              method: 'PUT',
              body: JSON.stringify(payload)
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.updateProvince(id, {
              name,
              region,
              description: desc,
              image: img
            });
          }

          closeEditModal();
          showSuccessToast(`Cập nhật tỉnh/thành "${name}" thành công!`);

          fetchAndRender();
          fetchStats();
        } catch (err) {
          console.error('Lỗi cập nhật tỉnh thành:', err);
          if (editError && editErrorText) {
            editErrorText.textContent = err.message || 'Không thể cập nhật tỉnh thành.';
            editError.classList.remove('hidden');
          }
          if (btnSubmitEdit) {
            btnSubmitEdit.disabled = false;
            btnSubmitEdit.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu thay đổi</span>';
          }
        }
      });
    }

    // -------------------------------------------------------------
    // ATTRACTIONS / ROUTE TOURS TABLE & PAGINATION
    // -------------------------------------------------------------
    const toursTableBody = document.getElementById('locationToursTableBody') || document.querySelector('table tbody');
    const toursCountBadge = document.getElementById('locationToursCountBadge');
    const toursLoading = document.getElementById('locationToursLoading');
    const toursError = document.getElementById('locationToursError');
    const toursErrorText = document.getElementById('locationToursErrorText');
    const btnRetryTours = document.getElementById('btnRetryLocationTours');
    const toursTableWrapper = document.getElementById('locationToursTableWrapper');
    const toursPagination = document.getElementById('locationToursPagination');
    const toursPaginationSummary = document.getElementById('locationToursPaginationSummary');
    const toursPaginationButtons = document.getElementById('locationToursPaginationButtons');

    let currentTourPage = 1;
    const tourPageSize = 5;

    function getTourPaginationRange(current, total) {
      if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      if (current <= 3) {
        return [1, 2, 3, 4, '...', total];
      }
      if (current >= total - 2) {
        return [1, '...', total - 3, total - 2, total - 1, total];
      }
      return [1, '...', current - 1, current, current + 1, '...', total];
    }

    async function loadToursTable(page = 1) {
      currentTourPage = Math.max(1, Number(page) || 1);

      if (toursLoading) toursLoading.classList.remove('hidden');
      if (toursError) toursError.classList.add('hidden');
      if (toursTableWrapper) toursTableWrapper.classList.add('opacity-50');

      let tours = [];
      let totalItems = 0;
      let totalPages = 1;

      try {
        if (window.BookingTourApi?.apiRequest) {
          const queryParams = new URLSearchParams({
            page: currentTourPage,
            pageSize: tourPageSize
          });
          if (currentKeyword) queryParams.set('keyword', currentKeyword);
          if (currentRegion) queryParams.set('region', currentRegion);

          const res = await window.BookingTourApi.apiRequest(`/api/locations/tours?${queryParams.toString()}`);
          tours = res?.data || res?.items || [];
          totalItems = res?.total ?? res?.totalItems ?? tours.length;
          totalPages = Math.max(1, Number(res?.totalPages ?? res?.total_pages) || Math.ceil(totalItems / tourPageSize) || 1);
          currentTourPage = Math.min(Math.max(1, Number(res?.page ?? res?.currentPage) || currentTourPage), totalPages);
        } else if (window.BookingTourDB) {
          let allTours = window.BookingTourDB.getTours() || [];
          if (currentKeyword) {
            const kw = currentKeyword.toLowerCase();
            allTours = allTours.filter(t => (t.title || '').toLowerCase().includes(kw) || (t.province_name || '').toLowerCase().includes(kw));
          }
          totalItems = allTours.length;
          totalPages = Math.max(1, Math.ceil(totalItems / tourPageSize));
          tours = allTours.slice((currentTourPage - 1) * tourPageSize, currentTourPage * tourPageSize);
        }

        if (toursLoading) toursLoading.classList.add('hidden');
        if (toursTableWrapper) toursTableWrapper.classList.remove('opacity-50');

        if (toursCountBadge) {
          toursCountBadge.textContent = `${totalItems} tuyến điểm`;
        }

        if (toursTableBody) {
          if (tours.length === 0) {
            toursTableBody.innerHTML = `
              <tr>
                <td colspan="5" class="py-10 text-center text-slate-400">
                  <span class="material-symbols-outlined text-3xl text-slate-300 block mb-1">tour</span>
                  <p class="font-medium text-slate-600 text-xs">Không tìm thấy tuyến điểm hoặc tour nào phù hợp.</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">Thử thay đổi từ khóa hoặc bộ lọc để tìm lại.</p>
                </td>
              </tr>
            `;
          } else {
            toursTableBody.innerHTML = tours.map(t => {
              const provName = t.province_name || t.province?.name || 'Việt Nam';
              const catName = t.category_name || t.category?.name || 'Khám phá';
              const img = (t.thumbnail_url || (t.images && t.images[0]?.img_url) || (t.images && t.images[0])) || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';
              const days = t.duration_days || 3;
              const nights = t.duration_nights || 2;
              const pickup = t.pickup_point || 'Hà Nội / TP.HCM';
              const depCount = t.departures_count || 0;
              const bookedPassengers = t.total_booked_passengers || (depCount > 0 ? depCount * 14 : 0);
              const statusText = t.status_text || (depCount > 0 ? 'Đang mở bán' : 'Chờ lịch');
              const statusClass = depCount > 0
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700';

              return `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                  <td class="py-3.5 px-4 font-bold text-blue-950">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img src="${img}" alt="${t.title}" class="w-full h-full object-cover" onerror="this.src='https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg'"/>
                      </div>
                      <div>
                        <span class="hover:text-blue-700 line-clamp-1">${t.title}</span>
                        <p class="text-[11px] font-normal text-slate-400">
                          ${days}N${nights}Đ • Đón: ${pickup}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 text-slate-700 font-medium">${provName}</td>
                  <td class="py-3.5 px-4">
                    <span class="bg-blue-50 text-blue-900 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">${catName}</span>
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusClass} whitespace-nowrap inline-flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full ${depCount > 0 ? 'bg-emerald-600' : 'bg-amber-500'}"></span>
                      ${statusText}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right font-bold text-slate-800">
                    <div>${bookedPassengers} lượt khách</div>
                    <span class="text-[11px] text-slate-400 font-normal">(${depCount} chuyến khởi hành)</span>
                  </td>
                </tr>
              `;
            }).join('');
          }
        }

        // Render Pagination Bar
        renderTourPagination(totalItems, totalPages, currentTourPage);

      } catch (err) {
        console.error('Lỗi lấy danh sách tuyến điểm & tour:', err);
        if (toursLoading) toursLoading.classList.add('hidden');
        if (toursTableWrapper) toursTableWrapper.classList.remove('opacity-50');
        if (toursError) {
          toursError.classList.remove('hidden');
          if (toursErrorText) toursErrorText.textContent = err.message || 'Không thể tải danh sách tuyến điểm.';
        }
      }
    }

    function renderTourPagination(totalItems, totalPages, safeCurrentPage) {
      if (!toursPagination) return;
      toursPagination.classList.remove('hidden');

      const safeTotalPages = Math.max(1, Number(totalPages) || 1);
      const safePage = Math.min(Math.max(1, safeCurrentPage), safeTotalPages);

      if (toursPaginationSummary) {
        const start = totalItems === 0 ? 0 : (safePage - 1) * tourPageSize + 1;
        const end = Math.min(safePage * tourPageSize, totalItems);
        toursPaginationSummary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${start}–${end}</span> trên tổng số <span class="font-bold text-blue-900">${totalItems}</span> tuyến điểm`;
      }

      if (!toursPaginationButtons) return;

      let btns = '';

      // Prev Button <
      if (safePage > 1) {
        btns += `
          <button type="button" class="btn-tour-prev w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" title="Trang trước">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>`;
      }

      // Page numbers with ellipsis
      const pageNumbers = getTourPaginationRange(safePage, safeTotalPages);
      for (const p of pageNumbers) {
        if (p === '...') {
          btns += `<span class="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm select-none">...</span>`;
        } else if (p === safePage) {
          btns += `<span class="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-900 bg-blue-900 text-white font-bold text-sm shadow-xs select-none">${p}</span>`;
        } else {
          btns += `<button type="button" class="btn-tour-page w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" data-page="${p}">${p}</button>`;
        }
      }

      // Next Button >
      if (safePage < safeTotalPages) {
        btns += `
          <button type="button" class="btn-tour-next w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs font-bold text-sm" title="Trang tiếp">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      } else {
        btns += `
          <button type="button" disabled class="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-300 opacity-50 cursor-not-allowed">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>`;
      }

      toursPaginationButtons.innerHTML = btns;

      toursPaginationButtons.querySelector('.btn-tour-prev')?.addEventListener('click', () => {
        if (currentTourPage > 1) {
          loadToursTable(currentTourPage - 1);
        }
      });

      toursPaginationButtons.querySelector('.btn-tour-next')?.addEventListener('click', () => {
        if (currentTourPage < safeTotalPages) {
          loadToursTable(currentTourPage + 1);
        }
      });

      toursPaginationButtons.querySelectorAll('.btn-tour-page').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = Number(btn.getAttribute('data-page'));
          if (p && p !== currentTourPage) {
            loadToursTable(p);
          }
        });
      });
    }

    if (btnRetryTours) {
      btnRetryTours.addEventListener('click', () => {
        loadToursTable(currentTourPage);
      });
    }

    // Initialize page
    fetchStats();
    fetchAndRender();
    loadToursTable(1);
  }

  function handleLocationsCreate() {
    const form = document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const name = (fd.get('name') || fd.get('province_name') || '').trim();
        const region = (fd.get('region') || 'Miền Bắc').trim();
        const description = (fd.get('description') || '').trim();
        const imageUrl = (fd.get('image') || fd.get('imageUrl') || '').trim();

        if (!name) {
          alert('Vui lòng nhập tên tỉnh thành!');
          return;
        }

        try {
          if (window.BookingTourApi?.apiRequest) {
            await window.BookingTourApi.apiRequest('/api/provinces', {
              method: 'POST',
              body: JSON.stringify({ province_name: name, region, description, image_url: imageUrl })
            });
          } else if (window.BookingTourDB) {
            window.BookingTourDB.createProvince({ name, region, description, image: imageUrl });
          }
          alert(`Đã thêm tỉnh thành "${name}" thành công!`);
          window.location.href = 'index.html';
        } catch (err) {
          alert(err.message || 'Lỗi thêm tỉnh thành.');
        }
      });
    }
  }

  // -------------------------------------------------------------
  // MODULE 5: QUẢN LÝ KHÁCH HÀNG (CUSTOMERS)
  // -------------------------------------------------------------
  function handleCustomersIndex() {
    let currentPage = 1;
    const pageSize = 5;
    let searchKeyword = '';
    let isLoading = false;

    const alertSuccess = document.getElementById('customerAlertSuccess');
    const alertSuccessText = document.getElementById('customerAlertSuccessText');
    const alertError = document.getElementById('customerAlertError');
    const alertErrorText = document.getElementById('customerAlertErrorText');

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

    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // =========================================================
    // MODAL: XEM CHI TIẾT KHÁCH HÀNG
    // =========================================================
    const detailModal = document.getElementById('custDetailModal');
    const detailLoading = document.getElementById('custDetailLoading');
    const detailError = document.getElementById('custDetailError');
    const detailErrorText = document.getElementById('custDetailErrorText');
    const detailContent = document.getElementById('custDetailContent');
    const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
    const btnDetailClose = document.getElementById('btnDetailClose');
    const btnDetailOpenFullPage = document.getElementById('btnDetailOpenFullPage');
    const btnDetailEditDirect = document.getElementById('btnDetailEditDirect');

    function closeDetailModal() {
      if (detailModal) detailModal.classList.add('hidden');
    }

    if (btnCloseDetailModal) btnCloseDetailModal.addEventListener('click', closeDetailModal);
    if (btnDetailClose) btnDetailClose.addEventListener('click', closeDetailModal);

    async function openDetailModal(id) {
      if (!detailModal) return;
      detailModal.classList.remove('hidden');
      if (detailLoading) detailLoading.classList.remove('hidden');
      if (detailError) detailError.classList.add('hidden');
      if (detailContent) detailContent.classList.add('hidden');

      try {
        const res = await window.BookingTourApi.apiRequest(`/api/customers/${id}`);
        const c = res?.data || res || {};

        const fullName = c.full_name || c.fullName || 'Khách hàng';
        const initial = (fullName.charAt(0) || 'K').toUpperCase();
        const avatarEl = document.getElementById('custDetailAvatar');
        if (avatarEl) avatarEl.textContent = initial;

        const nameEl = document.getElementById('custDetailFullName');
        if (nameEl) nameEl.textContent = fullName;

        const idBadge = document.getElementById('custDetailIdBadge');
        if (idBadge) idBadge.textContent = `#${c.id || id}`;

        const createdAtEl = document.getElementById('custDetailCreatedAt');
        if (createdAtEl) createdAtEl.textContent = formatDate(c.created_at || c.createdAt);

        const bookingCount = c.booking_count ?? c.bookingCount ?? 0;
        const totalBookingsEl = document.getElementById('custDetailTotalBookings');
        if (totalBookingsEl) totalBookingsEl.textContent = bookingCount;

        const bookingBadge = document.getElementById('custDetailBookingBadge');
        if (bookingBadge) bookingBadge.textContent = `${bookingCount} đơn đặt`;

        const phoneEl = document.getElementById('custDetailPhone');
        if (phoneEl) {
          phoneEl.innerHTML = `<span class="material-symbols-outlined text-sm text-slate-400">call</span><span>${escapeHtml(c.phone || 'Chưa cập nhật')}</span>`;
        }

        const emailEl = document.getElementById('custDetailEmail');
        if (emailEl) {
          emailEl.innerHTML = `<span class="material-symbols-outlined text-sm text-slate-400">mail</span><span>${escapeHtml(c.email || 'Chưa cập nhật')}</span>`;
        }

        const bday = c.birthday || c.Birthday || c.date_of_birth || c.birth_date || c.dob;
        const birthdayEl = document.getElementById('custDetailBirthday');
        if (birthdayEl) {
          const formattedBday = formatDate(bday);
          birthdayEl.innerHTML = `<span class="material-symbols-outlined text-sm text-slate-400">cake</span><span>${escapeHtml(formattedBday)}</span>`;
        }

        const addressEl = document.getElementById('custDetailAddress');
        if (addressEl) {
          addressEl.innerHTML = `<span class="material-symbols-outlined text-sm text-slate-400">location_on</span><span>${escapeHtml(c.address || 'Chưa cập nhật')}</span>`;
        }

        if (btnDetailOpenFullPage) {
          btnDetailOpenFullPage.href = `show.html?id=${c.id || id}`;
        }

        if (btnDetailEditDirect) {
          btnDetailEditDirect.onclick = () => {
            closeDetailModal();
            openEditModal(c.id || id);
          };
        }

        // Render bookings
        const bookingsBody = document.getElementById('custDetailBookingsBody');
        if (bookingsBody) {
          const bookings = Array.isArray(c.bookings) ? c.bookings : [];
          if (bookings.length === 0) {
            bookingsBody.innerHTML = `
              <tr>
                <td colspan="5" class="py-8 text-center text-slate-400">
                  <span class="material-symbols-outlined text-3xl text-slate-300 block mb-1">luggage</span>
                  <p class="font-medium text-slate-500 text-xs">Khách hàng chưa có lịch sử đặt tour nào.</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">Dữ liệu đơn hàng sẽ tự động cập nhật khi khách đặt tour.</p>
                </td>
              </tr>
            `;
          } else {
            bookingsBody.innerHTML = bookings.map(b => {
              const code = b.booking_code || `#BK-${b.id}`;
              const tourTitle = b.tour_title || 'Tour khám phá du lịch';
              const depDate = formatDate(b.departure_date || b.created_at);
              const amount = formatMoney(b.total_amount);
              const status = (b.status || 'confirmed').toLowerCase();
              let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Đã xác nhận</span>';
              if (status === 'pending') {
                statusBadge = '<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Chờ xác nhận</span>';
              } else if (status === 'paid') {
                statusBadge = '<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">Đã thanh toán</span>';
              } else if (status === 'completed') {
                statusBadge = '<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Hoàn thành</span>';
              } else if (status === 'cancelled' || status === 'canceled') {
                statusBadge = '<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Đã hủy</span>';
              }

              return `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                  <td class="px-4 py-2.5 font-bold font-mono text-blue-900">${escapeHtml(code)}</td>
                  <td class="px-4 py-2.5 font-semibold text-slate-800 max-w-xs truncate" title="${escapeHtml(tourTitle)}">${escapeHtml(tourTitle)}</td>
                  <td class="px-4 py-2.5 text-center text-slate-600 font-medium whitespace-nowrap">${depDate}</td>
                  <td class="px-4 py-2.5 text-right font-extrabold text-blue-950 whitespace-nowrap">${amount}</td>
                  <td class="px-4 py-2.5 text-center whitespace-nowrap">${statusBadge}</td>
                </tr>
              `;
            }).join('');
          }
        }

        if (detailLoading) detailLoading.classList.add('hidden');
        if (detailContent) detailContent.classList.remove('hidden');

      } catch (err) {
        console.error('Lỗi lấy chi tiết khách hàng:', err);
        if (detailLoading) detailLoading.classList.add('hidden');
        if (detailError) {
          detailError.classList.remove('hidden');
          if (detailErrorText) detailErrorText.textContent = err.message || 'Không thể tải thông tin khách hàng từ MongoDB.';
        }
      }
    }

    // =========================================================
    // MODAL: CHỈNH SỬA KHÁCH HÀNG
    // =========================================================
    const editModal = document.getElementById('custEditModal');
    const editForm = document.getElementById('modalEditCustomerForm');
    const editError = document.getElementById('modalEditError');
    const editErrorText = document.getElementById('modalEditErrorText');
    const btnCloseEditModal = document.getElementById('btnCloseEditModal');
    const btnCancelEditModal = document.getElementById('btnCancelEditModal');
    const btnSubmitEditModal = document.getElementById('btnSubmitEditModal');
    let editingCustomerId = null;

    function closeEditModal() {
      if (editModal) editModal.classList.add('hidden');
      editingCustomerId = null;
    }

    if (btnCloseEditModal) btnCloseEditModal.addEventListener('click', closeEditModal);
    if (btnCancelEditModal) btnCancelEditModal.addEventListener('click', closeEditModal);

    async function openEditModal(id) {
      if (!editModal) return;
      editingCustomerId = id;
      if (editError) editError.classList.add('hidden');
      const inputId = document.getElementById('modalEdit_id');
      const inputName = document.getElementById('modalEdit_fullName');
      const inputEmail = document.getElementById('modalEdit_email');
      const inputPhone = document.getElementById('modalEdit_phone');
      const inputBirthday = document.getElementById('modalEdit_birthday');
      const inputAddress = document.getElementById('modalEdit_address');

      if (inputId) inputId.value = `#${id}`;
      if (btnSubmitEditModal) {
        btnSubmitEditModal.disabled = true;
        btnSubmitEditModal.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Đang tải...</span>';
      }

      editModal.classList.remove('hidden');

      try {
        const res = await window.BookingTourApi.apiRequest(`/api/customers/${id}`);
        const c = res?.data || res || {};

        if (inputName) inputName.value = c.full_name || c.fullName || '';
        if (inputEmail) inputEmail.value = c.email || '';
        if (inputPhone) inputPhone.value = c.phone || '';
        if (inputAddress) inputAddress.value = c.address || '';
        const bday = c.birthday || c.Birthday || c.date_of_birth || c.birth_date || c.dob;
        if (inputBirthday) {
          inputBirthday.value = toVietnamDateInput(bday);
          inputBirthday.max = new Date().toISOString().split('T')[0];
        }

        if (btnSubmitEditModal) {
          btnSubmitEditModal.disabled = false;
          btnSubmitEditModal.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu thay đổi</span>';
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin khách hàng để sửa:', err);
        if (editError && editErrorText) {
          editErrorText.textContent = err.message || 'Không thể tải thông tin khách hàng.';
          editError.classList.remove('hidden');
        }
        if (btnSubmitEditModal) {
          btnSubmitEditModal.disabled = false;
          btnSubmitEditModal.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu thay đổi</span>';
        }
      }
    }

    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!editingCustomerId) return;
        if (editError) editError.classList.add('hidden');

        const fullName = (document.getElementById('modalEdit_fullName')?.value || '').trim();
        const email = (document.getElementById('modalEdit_email')?.value || '').trim();
        const phone = (document.getElementById('modalEdit_phone')?.value || '').trim();
        const address = (document.getElementById('modalEdit_address')?.value || '').trim();
        const birthdayVal = document.getElementById('modalEdit_birthday')?.value || null;
        if (birthdayVal) {
          const bDate = new Date(birthdayVal);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (bDate > today) {
            if (editError && editErrorText) {
              editErrorText.textContent = 'Ngày sinh không thể là ngày trong tương lai!';
              editError.classList.remove('hidden');
            }
            if (btnSubmitEditModal) {
              btnSubmitEditModal.disabled = false;
              btnSubmitEditModal.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu thay đổi</span>';
            }
            return;
          }
        }

        if (!fullName) {
          if (editError && editErrorText) {
            editErrorText.textContent = 'Vui lòng nhập họ và tên khách hàng!';
            editError.classList.remove('hidden');
          }
          return;
        }

        if (!email) {
          if (editError && editErrorText) {
            editErrorText.textContent = 'Vui lòng nhập địa chỉ email khách hàng!';
            editError.classList.remove('hidden');
          }
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          if (editError && editErrorText) {
            editErrorText.textContent = 'Định dạng email không hợp lệ!';
            editError.classList.remove('hidden');
          }
          return;
        }

        if (btnSubmitEditModal) {
          btnSubmitEditModal.disabled = true;
          btnSubmitEditModal.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Đang lưu...</span>';
        }

        try {
          const bodyPayload = {
            full_name: fullName,
            fullName: fullName,
            email: email,
            phone: phone || null,
            address: address || null,
            birthday: birthdayVal ? birthdayVal + 'T00:00:00Z' : null
          };

          await window.BookingTourApi.apiRequest(`/api/customers/${editingCustomerId}`, {
            method: 'PUT',
            body: JSON.stringify(bodyPayload)
          });

          closeEditModal();
          showSuccess(`Cập nhật thông tin khách hàng "${fullName}" thành công!`);
          fetchStats();
          fetchAndRender();
        } catch (err) {
          console.error('Lỗi cập nhật khách hàng:', err);
          if (editError && editErrorText) {
            editErrorText.textContent = err.message || 'Cập nhật thông tin khách hàng thất bại.';
            editError.classList.remove('hidden');
          }
          if (btnSubmitEditModal) {
            btnSubmitEditModal.disabled = false;
            btnSubmitEditModal.innerHTML = '<span class="material-symbols-outlined text-sm">save</span><span>Lưu thay đổi</span>';
          }
        }
      });
    }

    // =========================================================
    // MODAL: XÁC NHẬN XÓA KHÁCH HÀNG (CONSTRAINT CHECK)
    // =========================================================
    const deleteModal = document.getElementById('custDeleteModal');
    const deleteCustNameEl = document.getElementById('modalDelete_custName');
    const deleteCustIdEl = document.getElementById('modalDelete_custId');
    const btnCancelDeleteModal = document.getElementById('btnCancelDeleteModal');
    const btnConfirmDeleteModal = document.getElementById('btnConfirmDeleteModal');
    let deletingCustomerId = null;
    let deletingCustomerName = '';

    function closeDeleteModal() {
      if (deleteModal) deleteModal.classList.add('hidden');
      deletingCustomerId = null;
      deletingCustomerName = '';
    }

    if (btnCancelDeleteModal) btnCancelDeleteModal.addEventListener('click', closeDeleteModal);

    function openDeleteModal(id, name) {
      if (!deleteModal) return;
      deletingCustomerId = id;
      deletingCustomerName = name;
      if (deleteCustNameEl) deleteCustNameEl.textContent = name;
      if (deleteCustIdEl) deleteCustIdEl.textContent = id;
      deleteModal.classList.remove('hidden');
    }

    if (btnConfirmDeleteModal) {
      btnConfirmDeleteModal.addEventListener('click', async () => {
        if (!deletingCustomerId) return;
        const targetId = deletingCustomerId;
        const targetName = deletingCustomerName;

        btnConfirmDeleteModal.disabled = true;
        btnConfirmDeleteModal.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Đang xử lý...</span>';

        try {
          await window.BookingTourApi.apiRequest(`/api/customers/${targetId}`, {
            method: 'DELETE'
          });

          closeDeleteModal();
          showSuccess(`Đã xóa khách hàng "${targetName}" (#${targetId}) thành công!`);
          const currentRows = document.querySelectorAll('#customerTableBody tr');
          if (currentRows.length <= 1 && currentPage > 1) {
            currentPage--;
          }
          fetchAndRender();
          fetchStats();
        } catch (delErr) {
          console.error('Lỗi xóa khách hàng:', delErr);
          closeDeleteModal();
          showError(delErr.message || `Không thể xóa khách hàng "${targetName}". Khách hàng đã có lịch sử đặt tour hoặc giao dịch.`);
        } finally {
          if (btnConfirmDeleteModal) {
            btnConfirmDeleteModal.disabled = false;
            btnConfirmDeleteModal.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span><span>Xác nhận xóa</span>';
          }
        }
      });
    }

    // =========================================================
    // MODAL: THÊM KHÁCH HÀNG MỚI (CREATE MODAL)
    // =========================================================
    const createModal = document.getElementById('custCreateModal');
    const createForm = document.getElementById('modalCreateCustomerForm');
    const createError = document.getElementById('modalCreateError');
    const createErrorText = document.getElementById('modalCreateErrorText');
    const btnOpenCreateModal = document.getElementById('btnOpenCreateCustomerModal');
    const btnCloseCreateModal = document.getElementById('btnCloseCreateModal');
    const btnCancelCreateModal = document.getElementById('btnCancelCreateModal');
    const btnSubmitCreateModal = document.getElementById('btnSubmitCreateModal');

    function openCreateModal() {
      if (!createModal) return;
      if (createForm) createForm.reset();
      if (createError) createError.classList.add('hidden');
      const bdayInput = document.getElementById('modalCreate_birthday');
      if (bdayInput) bdayInput.max = new Date().toISOString().split('T')[0];
      createModal.classList.remove('hidden');
      setTimeout(() => document.getElementById('modalCreate_fullName')?.focus(), 50);
    }

    function closeCreateModal() {
      if (createModal) createModal.classList.add('hidden');
      if (createError) createError.classList.add('hidden');
    }

    if (btnOpenCreateModal) btnOpenCreateModal.addEventListener('click', openCreateModal);
    if (btnCloseCreateModal) btnCloseCreateModal.addEventListener('click', closeCreateModal);
    if (btnCancelCreateModal) btnCancelCreateModal.addEventListener('click', closeCreateModal);

    if (createForm) {
      createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (createError) createError.classList.add('hidden');

        const fullName = (document.getElementById('modalCreate_fullName')?.value || '').trim();
        const email = (document.getElementById('modalCreate_email')?.value || '').trim();
        const phone = (document.getElementById('modalCreate_phone')?.value || '').trim();
        const birthdayVal = document.getElementById('modalCreate_birthday')?.value || null;
        if (birthdayVal) {
          const bDate = new Date(birthdayVal);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (bDate > today) {
            if (createError && createErrorText) {
              createErrorText.textContent = 'Ngày sinh không thể là ngày trong tương lai!';
              createError.classList.remove('hidden');
            }
            if (btnSubmitCreateModal) {
              btnSubmitCreateModal.disabled = false;
              btnSubmitCreateModal.innerHTML = '<span class="material-symbols-outlined text-sm">person_add</span><span>Thêm khách hàng</span>';
            }
            return;
          }
        }
        const password = (document.getElementById('modalCreate_password')?.value || '').trim();
        const address = (document.getElementById('modalCreate_address')?.value || '').trim();

        if (!fullName) {
          if (createError && createErrorText) {
            createErrorText.textContent = 'Vui lòng nhập họ và tên khách hàng!';
            createError.classList.remove('hidden');
          }
          return;
        }

        if (!email) {
          if (createError && createErrorText) {
            createErrorText.textContent = 'Vui lòng nhập địa chỉ email!';
            createError.classList.remove('hidden');
          }
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          if (createError && createErrorText) {
            createErrorText.textContent = 'Định dạng email không hợp lệ!';
            createError.classList.remove('hidden');
          }
          return;
        }

        if (password && password.length < 6) {
          if (createError && createErrorText) {
            createErrorText.textContent = 'Mật khẩu phải có tối thiểu 6 ký tự!';
            createError.classList.remove('hidden');
          }
          return;
        }

        if (btnSubmitCreateModal) {
          btnSubmitCreateModal.disabled = true;
          btnSubmitCreateModal.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Đang thêm...</span>';
        }

        try {
          const payload = {
            full_name: fullName,
            fullName: fullName,
            email: email,
            phone: phone || null,
            address: address || null,
            birthday: birthdayVal ? birthdayVal + 'T00:00:00Z' : null,
            password: password || undefined
          };

          await window.BookingTourApi.apiRequest('/api/customers', {
            method: 'POST',
            body: JSON.stringify(payload)
          });

          closeCreateModal();
          showSuccess(`Thêm khách hàng "${fullName}" thành công!`);
          fetchStats();
          fetchAndRender();
        } catch (err) {
          console.error('Lỗi khi thêm khách hàng:', err);
          if (createError && createErrorText) {
            createErrorText.textContent = err.message || 'Không thể tạo khách hàng. Vui lòng thử lại.';
            createError.classList.remove('hidden');
          }
        } finally {
          if (btnSubmitCreateModal) {
            btnSubmitCreateModal.disabled = false;
            btnSubmitCreateModal.innerHTML = '<span class="material-symbols-outlined text-sm">person_add</span><span>Thêm khách hàng</span>';
          }
        }
      });
    }

    // Close modals on backdrop click
    [detailModal, editModal, deleteModal, createModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.add('hidden');
          }
        });
      }
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDetailModal();
        closeEditModal();
        closeDeleteModal();
        closeCreateModal();
      }
    });

    async function fetchStats() {
      const statTotal = document.getElementById('statTotalCustomers');
      const statNewMonth = document.getElementById('statNewThisMonth');
      const statToday = document.getElementById('statRegisteredToday');

      if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
        try {
          const res = await window.BookingTourApi.apiRequest('/api/customers/stats');
          const data = res?.data || res || {};
          if (statTotal) statTotal.textContent = data.total_customers ?? data.totalCustomers ?? '0';
          if (statNewMonth) statNewMonth.textContent = data.new_this_month ?? data.newThisMonth ?? '0';
          if (statToday) statToday.textContent = data.registered_today ?? data.registeredToday ?? '0';
        } catch (err) {
          console.warn('Failed to load customer stats:', err);
        }
      }
    }

    async function fetchAndRender() {
      if (isLoading) return;
      isLoading = true;

      const loadingEl = document.getElementById('customerLoading');
      const errorEl = document.getElementById('customerError');
      const errorTextEl = document.getElementById('customerErrorText');
      const tbody = document.getElementById('customerTableBody');
      const totalBadge = document.getElementById('customerTotalCountBadge');
      const paginationEl = document.getElementById('customerPagination');
      const paginationSummary = document.getElementById('customerPaginationSummary');
      const paginationButtons = document.getElementById('customerPaginationButtons');

      if (loadingEl) loadingEl.classList.remove('hidden');
      if (errorEl) errorEl.classList.add('hidden');

      let items = [];
      let totalItems = 0;
      let totalPages = 1;

      try {
        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          const params = new URLSearchParams();
          params.set('page', currentPage);
          params.set('pageSize', pageSize);
          if (searchKeyword) params.set('search', searchKeyword);

          const res = await window.BookingTourApi.apiRequest(`/api/customers?${params.toString()}`);
          const payload = res?.data || res?.items || [];
          items = Array.isArray(payload) ? payload : [];
          totalItems = Number(res?.total ?? res?.totalItems ?? items.length);
          totalPages = Number(res?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize)));
        } else {
          throw new Error('API client không khả dụng');
        }
      } catch (err) {
        console.error('Lỗi tải danh sách khách hàng:', err);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) {
          errorEl.classList.remove('hidden');
          if (errorTextEl) errorTextEl.textContent = err.message || 'Không thể tải danh sách khách hàng từ máy chủ.';
        }
        isLoading = false;
        return;
      }

      if (loadingEl) loadingEl.classList.add('hidden');
      isLoading = false;

      // Update total badge
      if (totalBadge) totalBadge.textContent = totalItems;

      // Ensure currentPage is valid
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }

      // Render Table Rows
      if (tbody) {
        if (items.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">person_off</span>
                <p class="font-medium text-slate-500">Không tìm thấy khách hàng nào.</p>
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = items.map(c => {
            const id = c.id ?? c.Id;
            const fullName = c.full_name || c.fullName || 'Khách hàng';
            const initial = (fullName.charAt(0) || 'K').toUpperCase();
            const phone = c.phone || '—';
            const email = c.email || '—';
            const address = c.address || 'Chưa cập nhật';
            const bookingCount = c.booking_count ?? c.bookingCount ?? 0;
            const createdAt = formatDate(c.created_at || c.createdAt);

            return `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="btn-view-cust w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer shadow-xs hover:bg-blue-800 transition" data-id="${id}" title="Xem chi tiết">
                      ${escapeHtml(initial)}
                    </div>
                    <div>
                      <button type="button" class="btn-view-cust font-bold text-blue-900 hover:text-blue-700 text-left cursor-pointer" data-id="${id}" title="Xem chi tiết">${escapeHtml(fullName)}</button>
                      <p class="text-xs text-slate-500 font-mono mt-0.5">#${id}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-slate-400">call</span>
                    ${escapeHtml(phone)}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-slate-400">mail</span>
                    ${escapeHtml(email)}
                  </p>
                </td>
                <td class="px-6 py-4 text-slate-600 text-sm max-w-xs truncate" title="${escapeHtml(address)}">${escapeHtml(address)}</td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center justify-center min-w-10 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-900 border border-blue-100">
                    ${bookingCount} tour
                  </span>
                </td>
                <td class="px-6 py-4 text-center text-slate-500 text-sm whitespace-nowrap">${createdAt}</td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1.5">
                    <button type="button" class="btn-view-cust p-2 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-blue-50 transition" data-id="${id}" title="Xem chi tiết">
                      <span class="material-symbols-outlined text-base">visibility</span>
                    </button>
                    <button type="button" class="btn-edit-cust p-2 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition" data-id="${id}" title="Chỉnh sửa">
                      <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button type="button" class="btn-delete-cust p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition" data-id="${id}" data-name="${escapeHtml(fullName)}" title="Xóa">
                      <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');

          // Wire view detail modal
          tbody.querySelectorAll('.btn-view-cust').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (id) openDetailModal(id);
            });
          });

          // Wire edit modal
          tbody.querySelectorAll('.btn-edit-cust').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (id) openEditModal(id);
            });
          });

          // Wire delete confirmation modal
          tbody.querySelectorAll('.btn-delete-cust').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              const name = btn.getAttribute('data-name') || id;
              if (id) openDeleteModal(id, name);
            });
          });
        }
      }

      // Render Pagination
      if (paginationEl) {
        paginationEl.classList.remove('hidden');

        if (paginationSummary) {
          if (totalItems === 0) {
            paginationSummary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">0</span> trên tổng số <span class="font-bold text-blue-900">0</span> khách hàng`;
          } else {
            const startItem = (currentPage - 1) * pageSize + 1;
            const endItem = Math.min(currentPage * pageSize, totalItems);
            paginationSummary.innerHTML = `Hiển thị <span class="font-bold text-blue-900">${startItem}–${endItem}</span> trên tổng số <span class="font-bold text-blue-900">${totalItems}</span> khách hàng`;
          }
        }

        if (paginationButtons) {
          let btnsHtml = '';

          // Prev button
          const isPrevDisabled = currentPage <= 1;
          btnsHtml += `
            <button type="button" class="btn-page-cust px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center justify-center ${isPrevDisabled
              ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-200'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
            }" data-page="${currentPage - 1}" ${isPrevDisabled ? 'disabled' : ''} title="Trang trước">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
          `;

          // Page numbers
          for (let p = 1; p <= totalPages; p++) {
            const isActive = p === currentPage;
            btnsHtml += `
              <button type="button" class="btn-page-cust px-3.5 py-1.5 rounded-lg text-sm transition font-bold ${isActive
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }" data-page="${p}">
                ${p}
              </button>
            `;
          }

          // Next button
          const isNextDisabled = currentPage >= totalPages;
          btnsHtml += `
            <button type="button" class="btn-page-cust px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center justify-center ${isNextDisabled
              ? 'text-slate-300 bg-slate-50 cursor-not-allowed border border-slate-200'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm'
            }" data-page="${currentPage + 1}" ${isNextDisabled ? 'disabled' : ''} title="Trang sau">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          `;

          paginationButtons.innerHTML = btnsHtml;

          // Wire page clicks
          paginationButtons.querySelectorAll('.btn-page-cust:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetPage = Number(btn.getAttribute('data-page'));
              if (targetPage && targetPage !== currentPage && targetPage >= 1 && targetPage <= totalPages) {
                currentPage = targetPage;
                fetchAndRender();
              }
            });
          });
        }
      }
    }

    // Search and Reset Form with Debounce
    let searchDebounceTimer = null;
    const keywordInput = document.getElementById('customerKeyword');
    if (keywordInput) {
      keywordInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          searchKeyword = (keywordInput.value || '').trim();
          currentPage = 1;
          fetchAndRender();
        }, 350);
      });
    }

    const searchForm = document.getElementById('customerFilterForm') || document.querySelector('form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(searchDebounceTimer);
        searchKeyword = (document.getElementById('customerKeyword')?.value || '').trim();
        currentPage = 1;
        fetchAndRender();
      });
    }

    const resetBtn = document.getElementById('btnResetCustomerFilter');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        clearTimeout(searchDebounceTimer);
        const input = document.getElementById('customerKeyword');
        if (input) input.value = '';
        searchKeyword = '';
        currentPage = 1;
        fetchAndRender();
      });
    }

    const retryBtn = document.getElementById('btnRetryCustomers');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        fetchStats();
        fetchAndRender();
      });
    }

    // Initial load: load real stats and customer list
    fetchStats();
    fetchAndRender();
  }

  function handleCustomersCreate() {
    const form = document.getElementById('createCustomerForm') || document.querySelector('main form');
    const errBox = document.getElementById('createCustomerError');
    const errText = document.getElementById('createCustomerErrorText');

    function showError(msg) {
      if (errBox && errText) {
        errText.textContent = msg;
        errBox.classList.remove('hidden');
      } else {
        alert(msg);
      }
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errBox) errBox.classList.add('hidden');

        const fullName = (document.getElementById('cust_fullName')?.value || '').trim();
        const phone = (document.getElementById('cust_phone')?.value || '').trim();
        const email = (document.getElementById('cust_email')?.value || '').trim();
        const address = (document.getElementById('cust_address')?.value || '').trim();
        const birthdayVal = (document.getElementById('cust_birthday')?.value || '').trim() || null;

        if (birthdayVal) {
          const bDate = new Date(birthdayVal);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (bDate > today) {
            showError('Ngày sinh không thể là ngày trong tương lai!');
            return;
          }
        }

        if (!fullName) {
          showError('Vui lòng nhập họ tên khách hàng!');
          return;
        }
        if (!phone) {
          showError('Vui lòng nhập số điện thoại!');
          return;
        }
        if (!email) {
          showError('Vui lòng nhập email khách hàng!');
          return;
        }

        try {
          const submitBtn = document.getElementById('btnSubmitCreateCustomer');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75');
          }

          if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
            await window.BookingTourApi.apiRequest('/api/customers', {
              method: 'POST',
              body: JSON.stringify({
                full_name: fullName,
                fullName,
                phone,
                email,
                address,
                birthday: birthdayVal ? birthdayVal + 'T00:00:00Z' : null
              })
            });
            alert(`Đã thêm khách hàng "${fullName}" thành công!`);
            window.location.href = 'index.html';
          } else {
            throw new Error('API client không khả dụng');
          }
        } catch (err) {
          showError(err.message || 'Không thể tạo khách hàng.');
          const submitBtn = document.getElementById('btnSubmitCreateCustomer');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75');
          }
        }
      });
    }
  }

  function handleCustomersEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const custId = urlParams.get('id');
    const errBox = document.getElementById('editCustomerError');
    const errText = document.getElementById('editCustomerErrorText');

    function showError(msg) {
      if (errBox && errText) {
        errText.textContent = msg;
        errBox.classList.remove('hidden');
      } else {
        alert(msg);
      }
    }

    if (!custId) {
      alert('Không tìm thấy mã khách hàng!');
      window.location.href = 'index.html';
      return;
    }

    const nameInput = document.getElementById('edit_fullName') || document.querySelector('input[name="full_name"]');
    const emailInput = document.getElementById('edit_email') || document.querySelector('input[name="email"]');
    const phoneInput = document.getElementById('edit_phone') || document.querySelector('input[name="phone"]');
    const addressInput = document.getElementById('edit_address') || document.querySelector('input[name="address"]');
    const birthdayInput = document.getElementById('edit_birthday') || document.querySelector('input[name="birthday"]');

    async function loadCustomer() {
      try {
        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          const res = await window.BookingTourApi.apiRequest(`/api/customers/${custId}`);
          const c = res?.data || res || {};
          if (nameInput) nameInput.value = c.full_name || c.fullName || '';
          if (emailInput) emailInput.value = c.email || '';
          if (phoneInput) phoneInput.value = c.phone || '';
          if (addressInput) addressInput.value = c.address || '';
          const bday = c.birthday || c.Birthday || c.date_of_birth || c.birth_date || c.dob;
          if (birthdayInput) {
            birthdayInput.value = toVietnamDateInput(bday);
            birthdayInput.max = new Date().toISOString().split('T')[0];
          }

          const titleEl = document.getElementById('editCustomerTitle');
          if (titleEl) titleEl.textContent = `Cập Nhật Hồ Sơ: ${c.full_name || c.fullName || ('#' + custId)}`;
        }
      } catch (err) {
        alert('Không tìm thấy thông tin khách hàng: ' + (err.message || ''));
        window.location.href = 'index.html';
      }
    }

    loadCustomer();

    const form = document.getElementById('editCustomerForm') || document.querySelector('main form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errBox) errBox.classList.add('hidden');

        const fullName = (nameInput?.value || '').trim();
        const phone = (phoneInput?.value || '').trim();
        const email = (emailInput?.value || '').trim();
        const address = (addressInput?.value || '').trim();
        const birthdayVal = (birthdayInput?.value || '').trim() || null;
        if (birthdayVal) {
          const bDate = new Date(birthdayVal);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          if (bDate > today) {
            showError('Ngày sinh không thể là ngày trong tương lai!');
            const submitBtn = document.getElementById('btnSubmitEditCustomer');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.classList.remove('opacity-75');
            }
            return;
          }
        }

        if (!fullName) {
          showError('Vui lòng nhập họ tên khách hàng!');
          return;
        }

        if (!email) {
          showError('Vui lòng nhập email khách hàng!');
          return;
        }

        try {
          const submitBtn = document.getElementById('btnSubmitEditCustomer');
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75');
          }

          if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
            await window.BookingTourApi.apiRequest(`/api/customers/${custId}`, {
              method: 'PUT',
              body: JSON.stringify({
                full_name: fullName,
                fullName,
                phone: phone || null,
                email,
                address: address || null,
                birthday: birthdayVal ? birthdayVal + 'T00:00:00Z' : null
              })
            });
            alert('Cập nhật thông tin khách hàng thành công!');
            window.location.href = 'index.html';
          } else {
            throw new Error('API client không khả dụng');
          }
        } catch (err) {
          showError(err.message || 'Cập nhật thông tin khách hàng thất bại.');
          const submitBtn = document.getElementById('btnSubmitEditCustomer');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75');
          }
        }
      });
    }
  }

  function handleCustomersShow() {
    const urlParams = new URLSearchParams(window.location.search);
    const custId = urlParams.get('id');
    if (!custId) {
      window.location.href = 'index.html';
      return;
    }

    async function loadCustomerDetail() {
      try {
        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          const res = await window.BookingTourApi.apiRequest(`/api/customers/${custId}`);
          const c = res?.data || res || {};

          const fullName = c.full_name || c.fullName || 'Khách hàng';
          const nameEl = document.getElementById('showCustomerName') || document.querySelector('h2');
          if (nameEl) nameEl.textContent = fullName;

          const avatarEl = document.getElementById('showCustomerAvatar');
          if (avatarEl) avatarEl.textContent = (fullName.charAt(0) || 'K').toUpperCase();

          const idBadge = document.getElementById('showCustomerIdBadge');
          if (idBadge) idBadge.textContent = `Khách hàng #${c.id || custId}`;

          const phoneEl = document.getElementById('showCustomerPhone');
          if (phoneEl) phoneEl.textContent = c.phone || 'Chưa cập nhật';

          const emailEl = document.getElementById('showCustomerEmail');
          if (emailEl) emailEl.textContent = c.email || 'Chưa cập nhật';

          const addressEl = document.getElementById('showCustomerAddress');
          if (addressEl) addressEl.textContent = c.address || 'Chưa cập nhật';

          const bday = c.birthday || c.Birthday || c.date_of_birth || c.birth_date || c.dob;
          const birthdayEl = document.getElementById('showCustomerBirthday');
          if (birthdayEl) birthdayEl.textContent = formatDate(bday);

          const createdEl = document.getElementById('showCustomerCreatedAt');
          if (createdEl) createdEl.textContent = formatDate(c.created_at || c.createdAt);

          const totalBookingsEl = document.getElementById('showCustomerTotalBookings');
          const count = c.booking_count ?? c.bookingCount ?? 0;
          if (totalBookingsEl) totalBookingsEl.textContent = count;

          const bookingsCountTag = document.getElementById('showCustomerBookingsCount');
          if (bookingsCountTag) bookingsCountTag.textContent = count;

          const editBtn = document.getElementById('btnEditCustomerShow');
          if (editBtn) editBtn.href = `edit.html?id=${c.id || custId}`;

          const bookings = Array.isArray(c.bookings) ? c.bookings : [];
          const bookingsBody = document.getElementById('showCustomerBookingsBody');
          if (bookingsBody) {
            if (bookings.length === 0) {
              bookingsBody.innerHTML = `
                <tr>
                  <td colspan="3" class="py-16 px-6 text-center">
                    <span class="material-symbols-outlined text-5xl text-slate-300">
                      luggage
                    </span>
                    <p class="font-bold text-slate-600 mt-3">Chưa có đơn đặt tour</p>
                    <p class="text-sm text-slate-400 mt-1">Lịch sử đặt tour của khách hàng sẽ hiển thị tại đây.</p>
                  </td>
                </tr>
              `;
            } else {
              bookingsBody.innerHTML = bookings.map(b => {
                const code = b.booking_code || `#BK-${b.id}`;
                const tourTitle = b.tour_title || 'Tour khám phá du lịch';
                const depDate = formatDate(b.departure_date || b.created_at);
                const amount = formatMoney(b.total_amount);
                const status = (b.status || 'confirmed').toLowerCase();
                let statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã xác nhận</span>';
                if (status === 'pending') {
                  statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Chờ xác nhận</span>';
                } else if (status === 'cancelled' || status === 'canceled') {
                  statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Đã hủy</span>';
                }

                return `
                  <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="py-4 px-6 font-mono font-bold text-blue-900">${escapeHtml(code)}</td>
                    <td class="py-4 px-6 text-slate-500 whitespace-nowrap">${depDate}</td>
                    <td class="py-4 px-6">
                      <div class="font-bold text-slate-800">${escapeHtml(tourTitle)}</div>
                      <div class="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <span class="font-bold text-blue-900">${amount}</span>
                        <span>•</span>
                        ${statusBadge}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('');
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải chi tiết khách hàng:', err);
      }
    }

    loadCustomerDetail();
  }

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // MODULE 6: QUẢN LÝ GIAO DỊCH (TRANSACTIONS)
  // -------------------------------------------------------------
  function handleTransactionsIndex() {
    let currentPage = 1;
    const pageSize = 5;
    let searchKeyword = '';
    let methodFilter = '';
    let statusFilter = '';
    let dateFilter = '';
    let sortOption = 'newest';
    let isLoading = false;

    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    async function fetchStats() {
      const statTotalAmountEl = document.getElementById('statTotalAmount');
      const statTotalTxnsEl = document.getElementById('statTotalTxns');
      const statTodayTxnsEl = document.getElementById('statTodayTxns');
      const statTodaySubtextEl = document.getElementById('statTodaySubtext');
      const statMonthAmountEl = document.getElementById('statMonthAmount');
      const statMonthSubtextEl = document.getElementById('statMonthSubtext');

      if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
        try {
          const res = await window.BookingTourApi.apiRequest('/api/transactions/stats');
          const data = res?.data || res || {};
          if (statTotalAmountEl) statTotalAmountEl.textContent = formatMoney(data.total_amount ?? 0);
          if (statTotalTxnsEl) statTotalTxnsEl.textContent = String(data.total_transactions ?? 0);
          if (statTodayTxnsEl) statTodayTxnsEl.textContent = String(data.today_transactions ?? 0);
          if (statTodaySubtextEl) {
            const today = new Date();
            statTodaySubtextEl.textContent = `Hôm nay, ngày ${formatDate(today)}`;
          }
          if (statMonthAmountEl) statMonthAmountEl.textContent = formatMoney(data.month_amount ?? 0);
          if (statMonthSubtextEl) {
            const today = new Date();
            statMonthSubtextEl.textContent = `Tháng ${today.getMonth() + 1}/${today.getFullYear()}`;
          }
        } catch (err) {
          console.warn('Lỗi khi tải thống kê giao dịch:', err);
        }
      }
    }

    async function showTransactionDetail(id) {
      window.BookingTourAdminPages.showTransactionDetail = showTransactionDetail;
      const modal = document.getElementById('txnDetailModal');
      const modalCode = document.getElementById('modalTxnCode');
      const modalContent = document.getElementById('modalTxnContent');
      if (!modal || !modalContent) return;

      modal.classList.remove('hidden');
      if (modalCode) modalCode.textContent = `Chi tiết giao dịch #${id}`;
      modalContent.innerHTML = `
        <div class="py-12 flex flex-col items-center justify-center text-slate-400">
          <span class="material-symbols-outlined text-3xl animate-spin text-blue-900 mb-2">sync</span>
          <p class="text-xs font-semibold">Đang tải chi tiết giao dịch...</p>
        </div>`;

      try {
        let t = null;
        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          const res = await window.BookingTourApi.apiRequest(`/api/transactions/${encodeURIComponent(id)}`);
          t = res?.data || res;
        }
        if (!t) throw new Error('Không tìm thấy thông tin giao dịch.');

        const txnCode = t.transaction_code || `TXN-${t.transaction_id || id}`;
        if (modalCode) modalCode.textContent = `Hóa đơn & Chi tiết giao dịch #${txnCode}`;

        let statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã thanh toán thành công</span>';
        if (t.status === 'pending') statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Chờ xác nhận thanh toán</span>';
        if (t.status === 'refunded' || t.status === 'cancelled') statusBadge = '<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Đã hoàn tiền / Đã hủy</span>';

        const totalAmountVal = Number(t.total_booking_amount || t.amount || 0);
        const isPaid = (t.status === 'confirmed' || t.status === 'success');
        const paidAmountVal = isPaid ? Number(t.paid_amount || t.amount || totalAmountVal) : Number(t.paid_amount || 0);
        const remainingAmountVal = t.remaining_amount != null ? Number(t.remaining_amount) : (totalAmountVal > paidAmountVal ? totalAmountVal - paidAmountVal : 0);
        const billStatusText = t.bill_status || (isPaid ? 'Đã phát hành' : 'Chưa phát hành');
        const billDateText = t.bill_date ? formatDateTime(t.bill_date) : (isPaid ? formatDateTime(t.created_at) : '—');
        const isEligibleForConfirm = (t.status === 'pending' || t.awaiting_payment_confirmation || (remainingAmountVal > 0 && (t.status === 'pending' || t.booking_status === 'pending')));
        const canConfirmBookingId = t.booking_id || (t.id && !isNaN(Number(t.id)) ? t.id : null);

        modalContent.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <p class="text-xs uppercase tracking-wider font-bold text-slate-400">Mã giao dịch hệ thống</p>
              <p class="text-xl font-black text-blue-950 font-mono mt-0.5">${escapeHtml(txnCode)}</p>
              <p class="text-xs text-slate-500 mt-0.5">Mã đặt tour liên kết: <strong class="text-blue-900 font-mono">${escapeHtml(t.booking_code || '—')}</strong>${t.bill_number ? ` | Hóa đơn: <strong class="text-slate-700 font-mono">${escapeHtml(t.bill_number)}</strong>` : ''}</p>
            </div>
            <div>${statusBadge}</div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-blue-900">person</span>
                Thông tin khách hàng
              </h4>
              <p class="font-bold text-slate-900 text-sm">${escapeHtml(t.customer_name || 'Khách hàng vãng lai')}</p>
              <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-400">mail</span>
                ${escapeHtml(t.customer_email || '—')}
              </p>
              <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-400">call</span>
                ${escapeHtml(t.customer_phone || '—')}
              </p>
              <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-400">home</span>
                ${escapeHtml(t.customer_address || '—')}
              </p>
            </div>

            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-blue-900">tour</span>
                Thông tin chuyến du lịch
              </h4>
              <p class="font-bold text-slate-900 text-sm line-clamp-2">${escapeHtml(t.tour_title || 'Tour du lịch')}</p>
              <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
                Khởi hành: <strong class="text-slate-800">${formatDate(t.departure_date)}</strong>
              </p>
              ${t.return_date ? `
                <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-slate-400">event_repeat</span>
                  Kết thúc: <strong class="text-slate-800">${formatDate(t.return_date)}</strong>
                </p>
              ` : ''}
              <p class="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs text-slate-400">group</span>
                Số khách: <strong>${t.total_adults || 1} người lớn${t.total_children > 0 ? `, ${t.total_children} trẻ em` : ''}</strong>
              </p>
            </div>
          </div>

          <div class="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-2 text-sm">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span>Phương thức thanh toán:</span>
                <span class="font-bold text-blue-950 px-2 py-0.5 bg-white rounded border border-blue-100 ml-1">${escapeHtml(t.payment_method || 'Thẻ quốc tế')}</span>
              </div>
              <div>
                <span>Thời gian giao dịch:</span>
                <span class="font-medium text-slate-800 ml-1">${formatDateTime(t.created_at || t.payment_date)}</span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-blue-100/60">
              <div>
                <span>Hóa đơn:</span>
                <span class="font-mono font-bold text-slate-800 ml-1">${escapeHtml(t.bill_number || 'Chưa phát hành')}</span>
              </div>
              <div>
                <span>Trạng thái hóa đơn:</span>
                <span class="font-semibold ml-1 ${billStatusText === 'Đã phát hành' ? 'text-emerald-700' : 'text-amber-700'}">${escapeHtml(billStatusText)}</span>
              </div>
            </div>
            <div class="text-xs text-slate-600">
              <span>Ngày lập hóa đơn:</span>
              <span class="font-medium text-slate-800 ml-1">${billDateText}</span>
            </div>

            <div class="pt-3 border-t border-blue-200/60 space-y-1.5">
              <div class="flex justify-between items-center text-xs text-slate-600">
                <span>Tổng giá trị booking:</span>
                <span class="font-bold text-slate-800 font-mono">${formatMoney(totalAmountVal)}</span>
              </div>
              <div class="flex justify-between items-center text-xs text-slate-600">
                <span>Số tiền đã thanh toán:</span>
                <span class="font-bold text-emerald-700 font-mono">${formatMoney(paidAmountVal)}</span>
              </div>
              <div class="flex justify-between items-center text-xs text-slate-600">
                <span>Số tiền còn lại:</span>
                <span class="font-bold ${remainingAmountVal > 0 ? 'text-rose-600' : 'text-slate-500'} font-mono">${formatMoney(remainingAmountVal)}</span>
              </div>
              <div class="pt-2 border-t border-blue-200 flex justify-between items-center">
                <span class="font-bold text-slate-800 text-sm">Tổng số tiền giao dịch:</span>
                <span class="text-xl font-black text-blue-950 font-mono">${formatMoney(t.amount || totalAmountVal)}</span>
              </div>
            </div>
          </div>

          ${isEligibleForConfirm && canConfirmBookingId ? `
            <div class="mt-4 pt-4 border-t border-slate-200 bg-amber-50 rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p class="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base text-amber-600">pending_actions</span>
                  Giao dịch đang chờ xác nhận thanh toán
                </p>
                <p class="text-xs text-amber-700 mt-0.5">Xác nhận sau khi đã đối chiếu tài khoản ngân hàng hoặc thu tiền mặt.</p>
              </div>
              <button type="button" id="btnModalConfirmPayment" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition shrink-0">
                <span class="material-symbols-outlined text-base">check_circle</span>
                Xác nhận đã thanh toán
              </button>
            </div>
          ` : ''}
        `;

        const modalConfirmBtn = modalContent.querySelector('#btnModalConfirmPayment');
        if (modalConfirmBtn && canConfirmBookingId) {
          modalConfirmBtn.onclick = async () => {
            const bookingCode = t.booking_code || ('BK' + canConfirmBookingId);
            const amountStr = formatMoney(totalAmountVal);
            if (!confirm(`Đã đối chiếu và xác nhận nhận đủ ${amountStr} cho đơn đặt tour ${bookingCode}?`)) return;
            modalConfirmBtn.disabled = true;
            try {
              await window.BookingTourApi.apiRequest(`/api/bookings/${canConfirmBookingId}/confirm-payment`, { method: 'POST' });
              alert('Đã xác nhận thanh toán thành công!');
              modal.classList.add('hidden');
              if (typeof refreshAll === 'function') refreshAll();
            } catch (err) {
              alert(err.message || 'Lỗi khi xác nhận thanh toán.');
              modalConfirmBtn.disabled = false;
            }
          };
        }
      } catch (err) {
        modalContent.innerHTML = `
          <div class="py-8 text-center text-rose-500">
            <span class="material-symbols-outlined text-3xl mb-1">error</span>
            <p class="font-bold text-sm">Không thể tải thông tin chi tiết giao dịch.</p>
            <p class="text-xs text-slate-500 mt-1">${escapeHtml(err.message || '')}</p>
          </div>`;
      }
    }

    async function fetchAndRender() {
      if (isLoading) return;
      isLoading = true;

      const loadingEl = document.getElementById('txnLoading');
      const errorEl = document.getElementById('txnError');
      const errorTextEl = document.getElementById('txnErrorText');
      const tbody = document.getElementById('txnTableBody');
      const totalBadge = document.getElementById('txnTotalBadge');
      const summaryEl = document.getElementById('txnPaginationSummary');
      const buttonsContainer = document.getElementById('txnPaginationButtons');

      if (loadingEl) loadingEl.classList.remove('hidden');
      if (errorEl) errorEl.classList.add('hidden');

      let items = [];
      let totalItems = 0;
      let totalPages = 1;

      try {
        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          const params = new URLSearchParams();
          params.set('page', currentPage);
          params.set('pageSize', pageSize);
          if (searchKeyword) params.set('search', searchKeyword);
          if (methodFilter) params.set('paymentMethod', methodFilter);
          if (statusFilter) params.set('status', statusFilter);
          if (dateFilter) params.set('transactionDate', dateFilter);
          if (sortOption) params.set('sort', sortOption);

          const res = await window.BookingTourApi.apiRequest(`/api/transactions?${params.toString()}`);
          const payload = res?.data || res?.items || [];
          items = Array.isArray(payload) ? payload : [];
          totalItems = Number(res?.total ?? res?.totalItems ?? items.length);
          totalPages = Number(res?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize)));
        } else {
          throw new Error('API client không khả dụng');
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách giao dịch:', err);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) {
          errorEl.classList.remove('hidden');
          if (errorTextEl) errorTextEl.textContent = err.message || 'Không thể tải danh sách giao dịch từ máy chủ.';
        }
        isLoading = false;
        return;
      }

      if (loadingEl) loadingEl.classList.add('hidden');
      isLoading = false;

      // Update total badge
      if (totalBadge) totalBadge.textContent = `${totalItems} giao dịch`;

      // Ensure currentPage validity
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }

      // Render Table Rows
      if (tbody) {
        if (items.length === 0) {
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
          tbody.innerHTML = items.map(t => {
            const initial = (t.customer_name?.charAt(0) || 'K').toUpperCase();
            const txnCode = t.transaction_code || `TXN-${String(t.id).padStart(4, '0')}`;
            const bookingCode = t.booking_code || `#BK-${t.booking_id}`;
            const billNumber = t.bill_number ? `Hóa đơn: <span class="font-mono font-bold text-slate-700">${escapeHtml(t.bill_number)}</span>` : '';

            let statusBadge = '<span class="inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200">Đã thanh toán</span>';
            const s = (t.booking_status || t.status || '').toLowerCase();
            if (s === 'pending') {
              statusBadge = '<span class="inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border-amber-200">Chờ thanh toán</span>';
            } else if (s === 'refunded' || s === 'cancelled') {
              statusBadge = '<span class="inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold bg-rose-50 text-rose-700 border-rose-200">Đã hoàn tiền</span>';
            }

            return `
              <tr class="transition hover:bg-slate-50">
                <td class="px-6 py-4">
                  <p class="font-extrabold text-blue-950 font-mono">${escapeHtml(txnCode)}</p>
                  <p class="mt-1 text-xs text-slate-500 font-mono">Mã GD: #${t.id}</p>
                  <p class="mt-1 text-xs text-slate-500">Đặt tour: <span class="font-mono font-bold text-blue-900">${escapeHtml(bookingCode)}</span></p>
                  ${billNumber ? `<p class="mt-0.5 text-xs text-slate-500">${billNumber}</p>` : ''}
                </td>

                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold uppercase text-blue-900">
                      ${escapeHtml(initial)}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-slate-900">${escapeHtml(t.customer_name || 'Khách hàng')}</p>
                      <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px] text-slate-400">mail</span>
                        ${escapeHtml(t.customer_email || '—')}
                      </p>
                      <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px] text-slate-400">call</span>
                        ${escapeHtml(t.customer_phone || '—')}
                      </p>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <p class="max-w-[260px] font-bold text-slate-900 line-clamp-2" title="${escapeHtml(t.tour_title || '')}">${escapeHtml(t.tour_title || 'Tour du lịch')}</p>
                  <p class="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-slate-400">calendar_today</span>
                    Khởi hành: <strong class="text-slate-700">${formatDate(t.departure_date)}</strong>
                  </p>
                  <p class="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-slate-400">group</span>
                    ${t.total_adults || 1} người lớn${t.total_children > 0 ? `, ${t.total_children} trẻ em` : ''}
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
                    ${escapeHtml(t.payment_method || 'Thẻ')}
                  </span>
                </td>

                <td class="px-6 py-4 text-center whitespace-nowrap">
                  ${statusBadge}
                  <p class="mt-1 text-[10px] text-slate-400 font-medium">
                    ${s === 'confirmed' || s === 'success' ? 'Đã hoàn tất' : (s === 'pending' ? 'Chờ xác nhận' : 'Đã hủy / Hoàn tiền')}
                  </p>
                </td>

                <td class="no-print px-6 py-4 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1">
                    <button type="button" class="btn-show-txn inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-900" data-id="${t.id}" title="Xem chi tiết giao dịch">
                      <span class="material-symbols-outlined text-xl">visibility</span>
                    </button>
                    ${s === 'pending' && t.booking_id ? `
                      <button type="button" class="btn-quick-confirm-txn inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800" data-booking-id="${t.booking_id}" data-code="${escapeHtml(bookingCode)}" data-amount="${t.amount}" title="Xác nhận đã nhận tiền">
                        <span class="material-symbols-outlined text-xl">check_circle</span>
                      </button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('');

          // Wire view details buttons
          tbody.querySelectorAll('.btn-show-txn').forEach(btn => {
            btn.addEventListener('click', () => {
              const id = btn.getAttribute('data-id');
              if (id) showTransactionDetail(id);
            });
          });

          // Wire quick confirm buttons
          tbody.querySelectorAll('.btn-quick-confirm-txn').forEach(btn => {
            btn.addEventListener('click', async () => {
              const bookingId = btn.getAttribute('data-booking-id');
              const code = btn.getAttribute('data-code');
              const amount = Number(btn.getAttribute('data-amount')) || 0;
              if (!confirm(`Xác nhận đã nhận đủ số tiền ${formatMoney(amount)} cho đơn đặt tour ${code}?`)) return;
              btn.disabled = true;
              try {
                await window.BookingTourApi.apiRequest(`/api/bookings/${bookingId}/confirm-payment`, { method: 'POST' });
                alert('Đã xác nhận thanh toán thành công!');
                refreshAll();
              } catch (err) {
                alert(err.message || 'Lỗi khi xác nhận thanh toán.');
                btn.disabled = false;
              }
            });
          });
        }
      }

      // Render Pagination
      if (summaryEl) {
        if (totalItems === 0) {
          summaryEl.innerHTML = `Hiển thị <span class="font-bold text-slate-800">0</span> trên tổng số <span class="font-bold text-slate-800">0</span> giao dịch`;
        } else {
          const start = (currentPage - 1) * pageSize + 1;
          const end = Math.min(currentPage * pageSize, totalItems);
          summaryEl.innerHTML = `Hiển thị <span class="font-bold text-slate-800">${start}–${end}</span> trên tổng số <span class="font-bold text-slate-800">${totalItems}</span> giao dịch`;
        }
      }

      if (buttonsContainer) {
        let btns = '';

        // Prev button
        const isPrevDisabled = currentPage <= 1;
        btns += `
          <button type="button" class="btn-page-prev flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold transition ${isPrevDisabled ? 'cursor-not-allowed text-slate-300 bg-slate-50' : 'text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
          }" ${isPrevDisabled ? 'disabled' : ''} title="Trang trước">
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>
        `;

        // Page numbers
        for (let p = 1; p <= totalPages; p++) {
          const isActive = p === currentPage;
          btns += `
            <button type="button" class="btn-page-num flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition ${isActive
              ? 'bg-blue-900 text-white shadow-sm'
              : 'border border-slate-200 text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-900'
            }" data-page="${p}">
              ${p}
            </button>
          `;
        }

        // Next button
        const isNextDisabled = currentPage >= totalPages;
        btns += `
          <button type="button" class="btn-page-next flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-xs font-bold transition ${isNextDisabled ? 'cursor-not-allowed text-slate-300 bg-slate-50' : 'text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
          }" ${isNextDisabled ? 'disabled' : ''} title="Trang sau">
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        `;

        buttonsContainer.innerHTML = btns;

        // Wire page buttons
        buttonsContainer.querySelectorAll('.btn-page-num').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetPage = Number(btn.getAttribute('data-page'));
            if (targetPage && targetPage !== currentPage && targetPage >= 1 && targetPage <= totalPages) {
              currentPage = targetPage;
              fetchAndRender();
            }
          });
        });

        const prevBtn = buttonsContainer.querySelector('.btn-page-prev:not([disabled])');
        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
              currentPage--;
              fetchAndRender();
            }
          });
        }

        const nextBtn = buttonsContainer.querySelector('.btn-page-next:not([disabled])');
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
              currentPage++;
              fetchAndRender();
            }
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
      fetchAndRender();
    }

    // Wire Filter Form
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
        fetchAndRender();
      });
    }

    document.getElementById('btnResetTxnFilter')?.addEventListener('click', resetFilter);

    const refreshAll = () => {
      fetchStats();
      fetchAndRender();
      renderPendingPayments(fetchAndRender);
    };

    const retryBtn = document.getElementById('btnRetryTxn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        refreshAll();
      });
    }

    document.getElementById('btnRefreshTransactions')?.addEventListener('click', (e) => {
      e.preventDefault();
      refreshAll();
    });

    // Initial load
    refreshAll();
  }

  // -------------------------------------------------------------
  // MODULE 7: QUẢN LÝ NHÂN VIÊN (EMPLOYEES)
  // -------------------------------------------------------------
  async function handleEmployeesIndex() {
    let searchKeyword = '';
    let roleFilter = '';

    const container = document.querySelector('.space-y-4');
    if (container) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
          <span class="material-symbols-outlined text-4xl mb-2 text-blue-600 animate-spin">sync</span>
          <p>Đang tải danh sách nhân viên từ MongoDB...</p>
        </div>`;
    }

    async function renderEmployees() {
      let allEmps = [];

      try {
        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          const res = await window.BookingTourApi.apiRequest('/api/employees');
          allEmps = res?.data || [];
        } else {
          throw new Error('API client không khả dụng');
        }
      } catch (err) {
        console.error('Lỗi tải nhân viên:', err);
        if (container) {
          container.innerHTML = `
            <div class="p-8 text-center text-rose-500 bg-white rounded-2xl border border-rose-100 font-bold">
              <span class="material-symbols-outlined text-4xl mb-2 text-rose-400">error</span>
              <p>Không thể kết nối đến máy chủ MongoDB để tải danh sách nhân viên.</p>
            </div>`;
        }
        return;
      }

      const adminCount = allEmps.filter(e => (e.role || '').toLowerCase() === 'admin').length;
      const saleCount = allEmps.filter(e => (e.role || '').toLowerCase() === 'sale').length;
      const guideCount = allEmps.filter(e => (e.role || '').toLowerCase() === 'guide').length;

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
          (e.full_name || e.fullName || '').toLowerCase().includes(kw) ||
          (e.email || '').toLowerCase().includes(kw) ||
          (e.phone || '').includes(kw)
        );
      }
      if (roleFilter) {
        filtered = filtered.filter(e => (e.role || '').toLowerCase() === roleFilter.toLowerCase() || String(e.role_id || e.roleId) === String(roleFilter));
      }

      if (container) {
        if (filtered.length === 0) {
          container.innerHTML = `
            <div class="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <span class="material-symbols-outlined text-4xl mb-2 text-slate-300">badge</span>
              <p>Không tìm thấy nhân viên nào phù hợp.</p>
            </div>`;
        } else {
          container.innerHTML = filtered.map(e => {
            const name = e.full_name || e.fullName || 'Nhân viên';
            const initial = (name.charAt(0) || 'N').toUpperCase();
            const role = e.role || (e.role_id === 1 ? 'Admin' : (e.role_id === 2 ? 'Sale' : 'Guide'));
            let roleBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900">Quản trị viên</span>';
            if (role === 'Sale') roleBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900">Kinh doanh / CSKH</span>';
            if (role === 'Guide') roleBadge = '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">Hướng dẫn viên</span>';

            return `
              <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-lg shrink-0">
                    ${initial}
                  </div>
                  <div class="min-w-0">
                    <h3 class="text-base font-extrabold text-blue-950">${name}</h3>
                    <p class="text-xs text-slate-500 mt-1 break-all">
                      Mã NV: <span class="font-bold text-slate-700">#${e.id}</span> · ${e.email || '—'} · ${e.phone || '—'}
                    </p>
                    <div class="mt-2 flex items-center gap-2">
                      ${roleBadge}
                      ${renderStatusBadge(e.status || 'active')}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a href="edit.html?id=${e.id}" class="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition text-sm flex items-center gap-1.5" title="Sửa thông tin">
                    <span class="material-symbols-outlined text-base">edit</span>
                    Sửa
                  </a>
                </div>
              </div>
            `;
          }).join('');
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
    setupAdminHeader();
    if (window.__BOOKINGTOUR_ROUTER_HANDLED__) return;

    const path = window.location.pathname.toLowerCase();

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

  window.BookingTourAdminPages = {
    setupAdminHeader,
    initPage,
    handleToursIndex,
    handleToursCreate,
    handleToursEdit,
    handleToursShow,
    handleCategoriesIndex,
    handleLocationsIndex,
    handleLocationsCreate,
    handleDeparturesIndex,
    handleDeparturesCreate,
    handleDeparturesEdit,
    handleDeparturesAssignGuide,
    handleCustomersIndex,
    handleCustomersCreate,
    handleCustomersEdit,
    handleCustomersShow,
    handleTransactionsIndex,
    handleEmployeesIndex,
    handleEmployeesCreate,
    handleEmployeesEdit
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();
