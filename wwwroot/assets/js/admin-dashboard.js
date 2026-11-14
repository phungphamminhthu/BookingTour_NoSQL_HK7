/**
 * Admin Dashboard Controller
 * Powered by centralized Relational Mock Database (BookingTourDB)
 * Instant loading with zero API dependency, real-time KPI metrics,
 * date-range filtering, and live transaction synchronization.
 */
(() => {
  function getUser() {
    try {
      const raw = localStorage.getItem('bookingtour_user') || sessionStorage.getItem('bookingtour_user');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      fullName: 'Trần Quản Trị',
      email: 'admin@bookingtour.vn',
      role: 'Admin'
    };
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
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return dateStr;
    }
  }

  function initAdminHeader() {
    const user = getUser();
    const nameEl = document.getElementById('adminUserDisplayName');
    const roleEl = document.getElementById('adminUserRole');
    const avatarEl = document.getElementById('adminUserAvatar');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    const displayName = user?.fullName || user?.full_name || user?.name || user?.username || 'Trần Quản Trị';
    const roleName = user?.roleName || user?.role_name || user?.role || 'Admin';

    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = roleName === 'Sale' ? 'Nhân viên Sale' : (roleName === 'Guide' ? 'Hướng dẫn viên' : 'Quản trị viên');
    if (avatarEl) {
      avatarEl.src = 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_admin_1e3a8a_80x80.png';
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.setItem('bookingtour_logged_out', 'true');
        localStorage.removeItem('bookingtour_token');
        localStorage.removeItem('bookingtour_user');
        localStorage.removeItem('bookingtour_role');
        sessionStorage.removeItem('bookingtour_token');
        sessionStorage.removeItem('bookingtour_user');
        sessionStorage.removeItem('bookingtour_role');
        if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
          window.BookingTourApi.apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
        }
        window.location.href = '../client/auth/login.html';
      });
    }
  }

  function renderStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'confirmed' || s === 'completed' || s === 'success' || s === 'paid') {
      return '<span class="px-3 py-1 text-[11px] font-bold rounded-full uppercase bg-green-50 text-green-700 border border-green-200">Đã xác nhận</span>';
    } else if (s === 'pending' || s === 'processing') {
      return '<span class="px-3 py-1 text-[11px] font-bold rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-200">Chờ xử lý</span>';
    } else if (s === 'cancelled' || s === 'canceled' || s === 'refunded') {
      return '<span class="px-3 py-1 text-[11px] font-bold rounded-full uppercase bg-red-50 text-red-700 border border-red-200">Đã hủy</span>';
    } else {
      return `<span class="px-3 py-1 text-[11px] font-bold rounded-full uppercase bg-slate-100 text-slate-700">${status || 'Chưa rõ'}</span>`;
    }
  }

  function setLoading(loading) {
    const indicator = document.getElementById('dashboardLoadingIndicator');
    if (indicator) {
      indicator.classList.toggle('hidden', !loading);
      indicator.classList.toggle('flex', loading);
    }
  }

  function loadDashboardData(startDate = '', endDate = '') {
    setLoading(true);

    const db = window.BookingTourDB;
    if (!db) {
      console.warn('BookingTourDB not found yet, retrying...');
      setTimeout(() => loadDashboardData(startDate, endDate), 100);
      return;
    }

    try {
      const stats = db.getStats();
      let bookings = db.getBookings();

      if (startDate) {
        const start = new Date(startDate).getTime();
        bookings = bookings.filter(b => new Date(b.created_at).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate + ' 23:59:59').getTime();
        bookings = bookings.filter(b => new Date(b.created_at).getTime() <= end);
      }

      const totalBookings = bookings.length;
      const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled').length;
      const totalRevenue = bookings
        .filter(b => b.booking_status !== 'cancelled')
        .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
      const cancelRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0;
      const newCustomers = db.getCustomers().length;

      // 1. Update KPI stats cards
      const revenueEl = document.getElementById('statTotalRevenue');
      const bookingsEl = document.getElementById('statTotalBookings');
      const customersEl = document.getElementById('statNewCustomers');
      const cancellationEl = document.getElementById('statCancellationRate');
      const cancelDetailEl = document.getElementById('statCancellationDetail');

      if (revenueEl) revenueEl.textContent = formatMoney(totalRevenue);
      if (bookingsEl) bookingsEl.textContent = totalBookings + ' đơn';
      if (customersEl) customersEl.textContent = newCustomers + ' khách';
      if (cancellationEl) cancellationEl.textContent = cancelRate + '%';
      if (cancelDetailEl) {
        cancelDetailEl.textContent = `${cancelledBookings} / ${totalBookings} đơn đã hủy`;
      }

      // 2. Render recent transactions table (top 5 newest)
      const tbody = document.getElementById('recentTransactionsBody');
      if (tbody) {
        const recentBookings = bookings.slice(0, 5);
        if (recentBookings.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="px-6 py-10 text-center text-slate-500 font-medium">
                <span class="material-symbols-outlined text-4xl text-slate-300 block mb-2">receipt_long</span>
                Không có giao dịch nào trong khoảng thời gian đã chọn.
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = recentBookings.map(b => {
            const code = b.booking_code || ('#' + b.id);
            const customer = b.customer_name || 'Khách hàng';
            const tour = b.tour_title || 'Tour du lịch';
            const date = formatDate(b.created_at);
            const amount = formatMoney(b.total_amount);
            const statusBadge = renderStatusBadge(b.booking_status);

            return `
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-8 py-4 font-bold text-blue-900 font-mono text-sm">${code}</td>
                <td class="px-4 py-4 font-medium text-slate-800 text-sm">${customer}</td>
                <td class="px-4 py-4 text-slate-600 text-sm max-w-xs truncate" title="${tour}">${tour}</td>
                <td class="px-4 py-4 text-slate-500 text-sm whitespace-nowrap">${date}</td>
                <td class="px-4 py-4 font-bold text-green-600 text-right whitespace-nowrap text-sm">${amount}</td>
                <td class="px-8 py-4 whitespace-nowrap">${statusBadge}</td>
              </tr>
            `;
          }).join('');
        }
      }

    } catch (err) {
      console.error('Error rendering dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  function initDateFilter() {
    const form = document.getElementById('dashboardFilterForm');
    const resetBtn = document.getElementById('dashboardResetFilterBtn');
    const startDateInput = document.getElementById('filterStartDate');
    const endDateInput = document.getElementById('filterEndDate');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        loadDashboardData(startDateInput?.value || '', endDateInput?.value || '');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
        loadDashboardData();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAdminHeader();
    initDateFilter();
    loadDashboardData();
  });

  window.BookingTourDashboard = { loadDashboardData };
})();
