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

  function initAdminHeader() {
    const user = getUser();
    const header = document.querySelector('header');
    let nameEl = document.getElementById('adminUserDisplayName') || header?.querySelector('p.text-blue-900') || header?.querySelector('p');
    let roleEl = document.getElementById('adminUserRole') || header?.querySelector('span.text-slate-400') || header?.querySelector('span.text-xs');
    let avatarEl = document.getElementById('adminUserAvatar') || header?.querySelector('img');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    if (!roleEl && nameEl && nameEl.parentElement) {
      roleEl = document.createElement('span');
      roleEl.id = 'adminUserRole';
      roleEl.className = 'text-xs text-slate-400 font-medium block';
      nameEl.parentElement.appendChild(roleEl);
    }

    const displayName = user?.fullName || user?.full_name || user?.name || user?.username || 'Nguyễn Văn Thanh';
    let roleName = user?.roleName || user?.role_name || user?.role || 'Admin';
    const rLower = String(roleName).toLowerCase();
    if (rLower === 'admin' || rLower.includes('quản trị')) roleName = 'Quản trị viên';
    else if (rLower === 'sale' || rLower.includes('kinh doanh') || rLower.includes('sale')) roleName = 'Nhân viên Sale';
    else if (rLower === 'guide' || rLower.includes('hướng dẫn')) roleName = 'Hướng dẫn viên';

    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = roleName;
    if (avatarEl) {
      avatarEl.src = user?.avatarUrl || user?.avatar || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_admin_1e3a8a_80x80.png';
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

  function showAlert(message) {
    const box = document.getElementById('dashboardAlertBox');
    const text = document.getElementById('dashboardAlertText');
    if (box && text) {
      text.textContent = message;
      box.classList.remove('hidden');
    }
  }

  function hideAlert() {
    const box = document.getElementById('dashboardAlertBox');
    if (box) {
      box.classList.add('hidden');
    }
  }

  async function loadDashboardData(startDate = '', endDate = '') {
    setLoading(true);
    hideAlert();

    try {
      let stats = null;
      let recentBookings = [];

      // 1. Fetch real Backend MongoDB Dashboard API
      if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
        try {
          const params = new URLSearchParams();
          if (startDate) params.set('startDate', startDate);
          if (endDate) params.set('endDate', endDate);
          const qs = params.toString() ? `?${params.toString()}` : '';

          const res = await window.BookingTourApi.apiRequest(`/api/admin/dashboard${qs}`);
          const payload = res?.data || res;
          if (payload && (payload.totalBookings !== undefined || payload.total_bookings !== undefined)) {
            stats = payload;
            recentBookings = payload.recentBookings || payload.recent_bookings || [];
          }
        } catch (apiErr) {
          console.error('Backend Dashboard API call failed:', apiErr);
          showAlert('Không thể kết nối đến máy chủ MongoDB để tải số liệu: ' + (apiErr.message || 'Lỗi hệ thống'));
          setLoading(false);
          return;
        }
      }

      if (!stats) {
        showAlert('Không thể tải số liệu thống kê từ hệ thống MongoDB.');
        setLoading(false);
        return;
      }

      // 3. Update KPI stats cards
      const totalRevenue = stats.totalRevenue ?? stats.total_revenue ?? 0;
      const totalBookings = stats.totalBookings ?? stats.total_bookings ?? 0;
      const cancelledBookings = stats.cancelledBookings ?? stats.cancelled_bookings ?? 0;
      const cancelRate = stats.cancellationRate ?? stats.cancellation_rate ?? 0;
      const newCustomers = stats.newCustomers ?? stats.new_customers ?? 0;

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

      // 4. Render recent transactions table (top 5 newest)
      const tbody = document.getElementById('recentTransactionsBody');
      if (tbody) {
        if (!recentBookings || recentBookings.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="px-6 py-10 text-center text-slate-500 font-medium">
                <span class="material-symbols-outlined text-4xl text-slate-300 block mb-2">receipt_long</span>
                Không có giao dịch nào trong khoảng thời gian đã chọn.
              </td>
            </tr>`;
        } else {
          tbody.innerHTML = recentBookings.slice(0, 5).map(b => {
            const code = b.booking_code || ('#' + b.id);
            const customer = b.customer_name || 'Khách hàng';
            const tour = b.tour_title || 'Tour du lịch';
            const date = formatDateTime(b.created_at);
            const amount = formatMoney(b.total_amount);
            const statusBadge = renderStatusBadge(b.booking_status || b.status);

            return `
              <tr class="hover:bg-blue-50/70 cursor-pointer transition-colors group"
                  data-booking-id="${b.id}"
                  data-booking-code="${b.booking_code || ''}"
                  data-payment-id="${b.payment_id || ''}"
                  title="Nhấn để xem chi tiết giao dịch">
                <td class="px-8 py-4 font-bold text-blue-900 font-mono text-sm group-hover:text-blue-700">
                  <div class="flex items-center gap-1.5">
                    <span>${code}</span>
                    <span class="material-symbols-outlined text-[15px] opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity">open_in_new</span>
                  </div>
                </td>
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
      showAlert(err.message || 'Lỗi khi tải dữ liệu tổng quan.');
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // TRANSACTION DETAIL MODAL LOGIC
  // ==========================================
  let activeDetailRequestId = 0;

  function showDetailModal() {
    const modal = document.getElementById('transactionDetailModal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }
  }

  function closeDetailModal() {
    const modal = document.getElementById('transactionDetailModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  }

  function renderTransactionDetailContent(d) {
    const contentEl = document.getElementById('modalTxnContent');
    if (!contentEl) return;

    const statusBadge = renderStatusBadge(d.status);
    const totalVal = Number(d.total_booking_amount ?? d.amount ?? 0);
    const paidVal = Number(d.paid_amount ?? (d.status === 'confirmed' ? (d.amount ?? totalVal) : 0));
    const remainingVal = (d.remaining_amount !== undefined && d.remaining_amount !== null)
      ? Number(d.remaining_amount)
      : Math.max(0, totalVal - paidVal);

    const formattedTotal = formatMoney(totalVal);
    const formattedPaid = formatMoney(paidVal);
    const formattedRemaining = formatMoney(remainingVal);

    const departureStr = d.departure_date ? formatDate(d.departure_date) : 'Chưa xếp ngày';
    const returnStr = d.return_date ? formatDate(d.return_date) : '—';
    const paymentDateStr = d.payment_date ? formatDateTime(d.payment_date) : (d.status === 'confirmed' && d.created_at ? formatDateTime(d.created_at) : 'Chưa thanh toán');
    const guestDetail = `${d.total_adults || 0} người lớn${(d.total_children || 0) > 0 ? `, ${d.total_children} trẻ em` : ''} (Tổng: ${d.total_guests || d.total_adults || 1} khách)`;

    contentEl.innerHTML = `
      <!-- 1. Header Summary Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div>
          <p class="text-xs uppercase tracking-wider font-bold text-slate-400">Mã giao dịch hệ thống</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xl font-black text-blue-950 font-mono">${d.transaction_code || ('TXN-#' + (d.transaction_id || d.payment_id || d.booking_id))}</span>
            ${d.payment_id ? `<span class="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100/70 text-blue-800">Thanh toán #${d.payment_id}</span>` : ''}
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Mã đặt tour liên kết: <strong class="text-blue-900 font-mono">${d.booking_code || ('BK#' + d.booking_id)}</strong>
            <span class="mx-1.5 text-slate-300">•</span>
            Ghi nhận: <span class="text-slate-700">${formatDateTime(d.created_at)}</span>
          </p>
        </div>
        <div class="sm:text-right shrink-0">
          <p class="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Trạng thái giao dịch</p>
          <div>${statusBadge}</div>
        </div>
      </div>

      <!-- 2. Customer & Tour Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Customer Info Card -->
        <div class="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px] text-blue-900">person</span>
              Thông tin khách hàng
            </h4>
            <p class="font-bold text-slate-900 text-sm">${d.customer_name || 'Khách hàng vãng lai'}</p>
            ${d.customer_id ? `<p class="text-xs text-slate-400 font-mono mt-0.5">Mã KH: #${d.customer_id}</p>` : ''}
            
            <div class="mt-3 space-y-1.5 text-xs text-slate-600">
              <p class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[15px] text-slate-400">mail</span>
                <span class="select-all font-mono">${d.customer_email || 'Chưa cung cấp'}</span>
              </p>
              <p class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[15px] text-slate-400">call</span>
                <span class="font-medium">${d.customer_phone || 'Chưa cung cấp'}</span>
              </p>
              <p class="flex items-start gap-2">
                <span class="material-symbols-outlined text-[15px] text-slate-400 shrink-0 mt-0.5">home</span>
                <span class="text-slate-500">${d.customer_address || 'Việt Nam'}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Tour & Booking Info Card -->
        <div class="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[18px] text-blue-900">tour</span>
              Thông tin chuyến du lịch
            </h4>
            <p class="font-bold text-slate-900 text-sm line-clamp-2" title="${d.tour_title || ''}">${d.tour_title || 'Tour du lịch'}</p>
            ${d.tour_id ? `<p class="text-xs text-slate-400 font-mono mt-0.5">Mã tour: #${d.tour_id}</p>` : ''}

            <div class="mt-3 space-y-1.5 text-xs text-slate-600">
              <p class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[15px] text-slate-400">calendar_today</span>
                <span>Khởi hành: <strong class="text-slate-800">${departureStr}</strong></span>
              </p>
              ${d.return_date ? `
              <p class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[15px] text-slate-400">event_repeat</span>
                <span>Kết thúc: <strong class="text-slate-800">${returnStr}</strong></span>
              </p>` : ''}
              <p class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[15px] text-slate-400">groups</span>
                <span>Hành khách: <strong>${guestDetail}</strong></span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Financial & Payment Details Card -->
      <div class="bg-blue-50/60 rounded-2xl p-5 border border-blue-100 space-y-3">
        <h4 class="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1.5 mb-2">
          <span class="material-symbols-outlined text-[18px] text-blue-900">account_balance_wallet</span>
          Chi tiết thanh toán & Tài chính
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div class="flex justify-between items-center bg-white p-2.5 rounded-xl border border-blue-100/80">
            <span>Phương thức:</span>
            <span class="font-bold text-blue-950">${d.payment_method || 'Chưa thanh toán'}</span>
          </div>
          <div class="flex justify-between items-center bg-white p-2.5 rounded-xl border border-blue-100/80">
            <span>Ngày thanh toán:</span>
            <span class="font-medium text-slate-800">${paymentDateStr}</span>
          </div>
        </div>

        ${d.description ? `
        <div class="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-blue-100/80">
          <span class="font-semibold text-slate-700">Nội dung thanh toán:</span> ${d.description}
        </div>` : ''}

        <div class="pt-3 border-t border-blue-200/60 space-y-1.5 text-xs">
          <div class="flex justify-between items-center text-slate-600">
            <span>Tổng giá trị booking:</span>
            <span class="font-bold text-slate-900 text-sm">${formattedTotal}</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span>Số tiền đã thanh toán:</span>
            <span class="font-bold ${paidVal > 0 ? 'text-green-700' : 'text-slate-500'} text-base">${formattedPaid}</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span>Số tiền còn lại:</span>
            <span class="font-bold text-sm ${remainingVal > 0 ? 'text-amber-600' : 'text-slate-500'}">${formattedRemaining}</span>
          </div>
        </div>
      </div>

      <!-- 4. Invoice / Bill Information Card -->
      ${d.bill_number ? `
      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">description</span>
          </div>
          <div>
            <p class="font-bold text-slate-900">Hóa đơn: <span class="font-mono text-blue-900">${d.bill_number}</span></p>
            <p class="text-slate-500 mt-0.5">Ngày lập: ${d.bill_date ? formatDate(d.bill_date) : (d.bill_status === 'Chưa phát hành' ? 'Chưa phát hành' : '—')}</p>
          </div>
        </div>
        <div class="sm:text-right">
          <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${d.bill_status === 'Đã phát hành' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}">
            ${d.bill_status || 'Đã phát hành'}
          </span>
          <p class="font-bold text-slate-900 mt-1">${formatMoney(d.bill_amount || d.total_booking_amount)}</p>
        </div>
      </div>` : ''}
    `;
  }

  function getFallbackTransactionDetail(identifier) {
    const db = window.BookingTourDB;
    if (!db) return null;

    const idStr = String(identifier).trim();
    let booking = null;
    let payment = null;

    const bookings = db.getBookings() || [];
    const transactions = db.getTransactions ? db.getTransactions() : [];

    // Search by payment ID or transaction code
    if (!isNaN(idStr)) {
      const numId = Number(idStr);
      payment = transactions.find(t => t.id === numId || t.booking_id === numId);
      booking = bookings.find(b => b.id === numId);
    }

    if (!booking && !payment) {
      booking = bookings.find(b => b.booking_code === idStr);
      payment = transactions.find(t => t.transaction_code === idStr || t.booking_code === idStr);
    }

    if (booking && !payment) {
      payment = transactions.find(t => t.booking_id === booking.id || t.booking_code === booking.booking_code);
    }

    if (!booking && payment) {
      booking = bookings.find(b => b.id === payment.booking_id || b.booking_code === payment.booking_code);
    }

    if (!booking && !payment) return null;

    const customer = booking ? db.getCustomerById(booking.customer_id) : null;
    const tour = booking ? db.getTourById(booking.tour_id) : null;

    const totalAmount = Number(booking?.total_amount || payment?.amount || 0);
    const isConfirmed = (booking?.booking_status || booking?.status) === 'confirmed';
    const paidAmount = payment ? Number(payment.amount ?? (isConfirmed ? totalAmount : 0)) : (isConfirmed ? totalAmount : 0);
    const status = booking?.booking_status || booking?.status || (payment ? 'confirmed' : 'pending');

    return {
      transaction_id: payment?.id || booking?.id || 1,
      transaction_code: payment?.transaction_code || `TXN-${booking?.booking_code || '0001'}`,
      payment_id: payment?.id,
      payment_method: payment?.payment_method || (status === 'confirmed' ? 'Thanh toán trực tuyến' : 'Chờ cổng thanh toán'),
      payment_date: isConfirmed ? (payment?.created_at || booking?.created_at) : null,
      created_at: payment?.created_at || booking?.created_at || new Date().toISOString(),
      amount: paidAmount > 0 ? paidAmount : totalAmount,
      status: status,
      description: `Thanh toán đơn đặt tour ${booking?.booking_code || ''}`,

      customer_id: customer?.id || booking?.customer_id || 1,
      customer_name: customer?.full_name || booking?.customer_name || 'Khách hàng',
      customer_email: customer?.email || 'khachhang@example.com',
      customer_phone: customer?.phone || '0901234567',
      customer_address: customer?.address || 'Việt Nam',

      booking_id: booking?.id || payment?.booking_id,
      booking_code: booking?.booking_code || payment?.booking_code || 'BK001',
      tour_id: tour?.id || booking?.tour_id,
      tour_title: tour?.title || booking?.tour_title || 'Tour du lịch',
      departure_date: booking?.departure_date || booking?.created_at,
      return_date: booking?.return_date,
      total_adults: booking?.adults || booking?.total_adults || 2,
      total_children: booking?.children || booking?.total_children || 0,
      total_guests: (booking?.adults || 2) + (booking?.children || 0),
      total_booking_amount: totalAmount,
      paid_amount: paidAmount,
      remaining_amount: totalAmount > paidAmount ? totalAmount - paidAmount : 0,

      bill_id: isConfirmed ? (booking?.id || 1) : null,
      bill_number: `INV-${booking?.id || 1}`,
      bill_amount: totalAmount,
      bill_status: status === 'confirmed' ? 'Đã phát hành' : 'Chưa phát hành',
      bill_date: isConfirmed ? (payment?.created_at || booking?.created_at) : null
    };
  }

  async function openTransactionDetail(identifier) {
    if (!identifier) return;
    const requestId = ++activeDetailRequestId;

    const subtitleEl = document.getElementById('modalTxnSubtitle');
    const loadingEl = document.getElementById('modalTxnLoading');
    const errorEl = document.getElementById('modalTxnError');
    const contentEl = document.getElementById('modalTxnContent');

    if (subtitleEl) subtitleEl.textContent = `Mã truy vấn: #${identifier}`;
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (contentEl) {
      contentEl.classList.add('hidden');
      contentEl.innerHTML = '';
    }

    showDetailModal();

    try {
      let detail = null;

      // 1. Fetch real Backend MongoDB API
      if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
        try {
          const res = await window.BookingTourApi.apiRequest(`/api/transactions/${encodeURIComponent(identifier)}`);
          detail = res?.data || res;
        } catch (apiErr) {
          console.warn('Backend Transaction Detail API call failed, attempting fallback to local database:', apiErr.message || apiErr);
        }
      }

      // 2. Fallback to BookingTourDB if API is unreachable
      if (!detail && window.BookingTourDB) {
        detail = getFallbackTransactionDetail(identifier);
      }

      // Guard against race conditions when clicking fast
      if (requestId !== activeDetailRequestId) return;

      if (!detail) {
        throw new Error(`Không tìm thấy dữ liệu giao dịch mã "${identifier}".`);
      }

      renderTransactionDetailContent(detail);
      if (contentEl) contentEl.classList.remove('hidden');
      if (subtitleEl) subtitleEl.textContent = `${detail.transaction_code || ('TXN-#' + identifier)} • ${detail.booking_code || ''}`;
    } catch (err) {
      if (requestId !== activeDetailRequestId) return;
      const errorMsgEl = document.getElementById('modalTxnErrorMsg');
      if (errorMsgEl) errorMsgEl.textContent = err.message || 'Không thể tải chi tiết giao dịch.';
      if (errorEl) errorEl.classList.remove('hidden');
    } finally {
      if (requestId === activeDetailRequestId) {
        if (loadingEl) loadingEl.classList.add('hidden');
      }
    }
  }

  let isEscapeKeyBound = false;
  function handleModalEscape(e) {
    if (e.key === 'Escape') closeDetailModal();
  }

  function initModalEvents() {
    const modal = document.getElementById('transactionDetailModal');
    const closeBtn = document.getElementById('closeTxnModalBtn');
    const closeBtnBottom = document.getElementById('closeTxnModalBtnBottom');
    const tbody = document.getElementById('recentTransactionsBody');

    if (closeBtn) closeBtn.addEventListener('click', closeDetailModal);
    if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeDetailModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeDetailModal();
      });
    }

    if (!isEscapeKeyBound) {
      document.addEventListener('keydown', handleModalEscape);
      isEscapeKeyBound = true;
    }

    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const row = e.target.closest('tr[data-booking-id], tr[data-payment-id], tr[data-booking-code]');
        if (!row) return;
        const paymentId = row.getAttribute('data-payment-id');
        const bookingId = row.getAttribute('data-booking-id');
        const bookingCode = row.getAttribute('data-booking-code');
        const targetId = paymentId || bookingId || bookingCode;
        if (targetId) {
          openTransactionDetail(targetId);
        }
      });
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

  function initDashboard() {
    initAdminHeader();
    initDateFilter();
    initModalEvents();
    loadDashboardData();
  }

  document.addEventListener('DOMContentLoaded', () => {
    // If handled by persistent router, skip initial run
    if (window.__BOOKINGTOUR_ROUTER_HANDLED__) return;
    initDashboard();
  });

  window.BookingTourDashboard = {
    loadDashboardData,
    openTransactionDetail,
    closeDetailModal,
    initDashboard,
    initAdminHeader,
    initDateFilter,
    initModalEvents
  };
})();
