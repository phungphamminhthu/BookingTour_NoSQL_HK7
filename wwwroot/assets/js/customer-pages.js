/**
 * Customer Pages Controller
 * Vietnam Expeditions Client Portal
 * Customer portal for:
 * Home, Tours Catalog, Tour Details, Booking Wizard, Payment/Invoice,
 * My Bookings, Ticket Voucher, Reviews, Profile, Points, and Transactions History.
 */
(() => {
  const db = window.BookingTourDB;
  if (!db) {
    console.error('BookingTourDB is required for customer-pages.js');
    return;
  }
  const api = window.BookingTourApi;
  const get = async (path, data) => (await api.apiRequest(path, data ? {
    method: 'POST', body: JSON.stringify(data)
  } : {})).data;
  const id = value => /^[1-9][0-9]*$/.test(value || '') && Number(value) <= 2147483647;
  const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const departureView = d => ({ ...d, start_date: d.departure_date, end_date: d.return_date });
  const day = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
  const openDeparture = d => d.status === 'open' && d.available_seats > 0 &&
    day(d.departure_date) >= day(Date.now());
  const tourView = t => ({
    ...t,
    category: { name: t.category_name },
    province: { name: t.province_name },
    departure_location: t.pickup_point || '—',
    adult_price: t.min_price,
    images: [t.thumbnail_url, ...(t.images || []).map(i => i.img_url)].filter(Boolean),
    itinerary: (t.schedules || []).map(d => ({ day: d.day_number, title: d.title, content: d.activities })),
    departures: (t.departures || []).map(departureView)
  });

  async function liveTour(value) {
    if (!id(value)) throw new Error('Vui lòng chọn tour từ danh sách tour.');
    return tourView(await get('/api/tours/' + value));
  }

  async function bookingDeparture(params) {
    const value = params.get('departure_id');
    if (!id(value)) throw new Error('Vui lòng chọn lịch khởi hành từ chi tiết tour.');
    const dep = departureView(await get('/api/departures/' + value));
    if (params.get('tour_id') !== String(dep.tour_id) || !openDeparture(dep)) {
      throw new Error('Lịch khởi hành không còn mở bán hoặc không thuộc tour đã chọn.');
    }
    return { dep, tour: dep.tour ? tourView(dep.tour) : await liveTour(dep.tour_id) };
  }

  function requireCustomer() {
    const token = api.getAuthToken();
    if (token && !token.startsWith('demo-jwt-')) return true;
    window.location.href = '/client/auth/login.html?returnTo=' + encodeURIComponent(location.pathname + location.search);
    return false;
  }

  function readDraft(departureId) {
    const draft = JSON.parse(sessionStorage.getItem('booking_draft') || 'null');
    if (draft?.request?.departure_id !== departureId) {
      throw new Error('Thông tin đặt tour đã hết hiệu lực. Vui lòng quay lại bước chọn số khách.');
    }
    return draft;
  }

  function showError(error) {
    const main = document.querySelector('main');
    if (!main) return alert(error.message);
    const message = document.createElement('p');
    message.className = 'p-6 text-red-700';
    message.setAttribute('role', 'alert');
    message.textContent = error.message;
    main.prepend(message);
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
        year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh'
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
      return d.toLocaleString('vi-VN', {
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

  function renderStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'confirmed' || s === 'success') {
      return '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Đã xác nhận</span>';
    } else if (s === 'completed') {
      return '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase bg-blue-50 text-blue-700 border border-blue-200"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Hoàn thành</span>';
    } else if (s === 'pending' || s === 'processing') {
      return '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-200"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Chờ xử lý</span>';
    } else if (s === 'cancelled' || s === 'canceled') {
      return '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase bg-rose-50 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Đã hủy</span>';
    }
    return `<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full uppercase bg-slate-100 text-slate-700">${status || 'Chưa rõ'}</span>`;
  }

  function renderPaymentBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'paid' || s === 'success' || s === 'completed') {
      return '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="material-symbols-outlined text-xs text-emerald-600">check_circle</span>Đã thanh toán</span>';
    } else if (s === 'pending' || s === 'unpaid') {
      return '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200"><span class="material-symbols-outlined text-xs text-amber-600">schedule</span>Chưa thanh toán</span>';
    } else if (s === 'refunded') {
      return '<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200"><span class="material-symbols-outlined text-xs text-purple-600">restart_alt</span>Hoàn tiền</span>';
    }
    return `<span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">${status || 'Chưa rõ'}</span>`;
  }

  // Active Customer Helper
  function getActiveCustomer() {
    const isLoggedOut = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bookingtour_logged_out') === 'true') ||
                        (typeof localStorage !== 'undefined' && localStorage.getItem('bookingtour_logged_out') === 'true');
    if (isLoggedOut) {
      return null;
    }
    let user = null;
    try {
      const urlCustomer = new URLSearchParams(window.location.search).get('customer_id');
      if (urlCustomer) {
        if (urlCustomer === 'empty') return { id: 'cust_empty', full_name: 'Khách Hàng Mới', email: 'khachmoi@gmail.com' };
        const match = db.getCustomers().find(c => c.id === urlCustomer);
        if (match) return match;
      }
      user = db.getCurrentUser();
    } catch (_) {}

    // If user object has no id, try to resolve id by email from db.customers
    if (user && !user.id && user.email) {
      const match = db.getCustomers().find(c => c.email && c.email.toLowerCase() === user.email.toLowerCase());
      if (match) {
        user = { ...match, ...user, id: match.id };
      }
    }
    // If user has numeric id (e.g. 1 from MongoDB / Auth API), map to matching mock customer
    if (user && (typeof user.id === 'number' || /^\d+$/.test(String(user.id)))) {
      const match = db.getCustomers().find(c => c.id === `cust_${user.id}` || (c.email && user.email && c.email.toLowerCase() === user.email.toLowerCase()));
      if (match) {
        user = { ...match, ...user, id: match.id };
      }
    }

    return user;
  }

  // Route & Page Initializer
  function initPage() {
    const path = window.location.pathname.toLowerCase();

    if (path.endsWith('/client/home.html') || path.endsWith('/client/')) {
      handleHomePage().catch(showError);
    } else if (path.includes('/tours/index.html')) {
      handleToursCatalog().catch(showError);
    } else if (path.includes('/tours/show.html')) {
      handleTourDetail().catch(showError);
    } else if (path.includes('/tours/by_province.html')) {
      handleToursByProvince().catch(showError);
    } else if (path.includes('/departures/show.html')) {
      handleDepartureShow().catch(showError);
    } else if (path.includes('/booking/create.html')) {
      handleBookingCreate().catch(showError);
    } else if (path.includes('/booking/passengers.html')) {
      handleBookingPassengers().catch(showError);
    } else if (path.includes('/payments/invoice.html')) {
      handlePaymentInvoice().catch(showError);
    } else if (path.includes('/my_tours/index.html') || path.endsWith('/my_tours/') || path.endsWith('/my_tours')) {
      handleMyToursIndex().catch(showError);
    } else if (path.includes('/my_tours/show.html')) {
      handleMyTourVoucher().catch(showError);
    } else if (path.includes('/my_tours/review.html')) {
      handleMyTourReview().catch(showError);
    } else if (path.includes('/profile/show.html')) {
      handleProfileShow();
    } else if (path.includes('/reward_point.html')) {
      handleRewardPoint();
    } else if (path.includes('/payments/history.html')) {
      handlePaymentsHistory().catch(showError);
    }
  }

  async function listTours(path = '/api/tours') {
    const tours = [];
    for (let page = 1; ; page++) {
      const result = await api.apiRequest(path + '?pageSize=100&page=' + page);
      tours.push(...result.data.map(tourView));
      if (!result.data.length || tours.length >= (result.total ?? tours.length)) return tours;
    }
  }

  const loadProvinces = async () => (await get('/api/provinces')).map(p => ({
    ...p, name: p.province_name, tour_count: p.tours_count
  }));

  // 1. Trang Chủ (client/home.html)
  async function handleHomePage() {
    const featured = (await get('/api/tours/featured?limit=4')).map(tourView);
    const cards = Array.from(document.querySelectorAll('a[href^="tours/show.html?id="]'));
    cards.forEach((link, index) => {
      const card = link.closest('.group');
      const tour = featured[index];
      if (!tour) {
        card?.remove();
        return;
      }
      link.href = 'tours/show.html?id=' + tour.id;
      const title = card?.querySelector('h3');
      if (title) title.textContent = tour.title;
      const image = card?.querySelector('img');
      if (image && tour.images[0]) {
        image.src = tour.images[0];
        image.alt = tour.title;
      }
      const price = card?.querySelector('.absolute.bottom-3.right-3');
      if (price) price.textContent = formatMoney(tour.min_price);
      const destination = card?.querySelector('.tracking-wider');
      if (destination) destination.textContent = tour.province?.name || 'Việt Nam';
      const duration = card?.querySelector('.text-slate-500 .flex.items-center');
      if (duration?.lastChild?.nodeType === Node.TEXT_NODE) {
        duration.lastChild.textContent = ' ' + tour.duration_days + ' ngày ' + tour.duration_nights + ' đêm';
      }
    });
    // Populate Categories Carousel / Grid
    const catContainer = document.querySelector('[data-categories-container]') || document.querySelector('.categories-grid');
    if (catContainer) {
      const cats = (await get("/api/categories")).map(c => ({ ...c, name: c.category_name, image: c.image_url || db.getCategories().find(mock => mock.name === c.category_name)?.image || featured[0]?.images[0], tour_count: c.tours_count ?? 0 }));
      catContainer.innerHTML = cats.map(c => `
        <a href="tours/index.html?category_id=${c.id}" class="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-end p-5 h-64 bg-slate-900">
          <img src="${html(c.image)}" alt="${html(c.name)}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-80"/>
          <div class="relative z-10 text-white">
            <span class="material-symbols-outlined text-2xl text-amber-400 mb-1">${html(c.icon || 'explore')}</span>
            <h3 class="font-bold text-lg leading-tight">${html(c.name)}</h3>
            <p class="text-xs text-slate-200 mt-1 line-clamp-2">${html(c.description)}</p>
            <span class="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">${c.tour_count} chuyến đi</span>
          </div>
        </a>
      `).join('');
    }

    // Populate Search Form Destination Dropdown
    const destSelect = document.querySelector('select[name="province_id"]') || document.querySelector('select[name="destination"]');
    if (destSelect) {
      const provs = await loadProvinces();
      destSelect.innerHTML = '<option value="">-- Tất cả điểm đến --</option>' +
        provs.map(p => `<option value="${p.id}">${html(p.name)} (${html(p.region)})</option>`).join('');
    }

    // Wire Search Form Submit
    const searchForm = document.querySelector('form[action*="tours"]') || document.querySelector('#homeSearchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(searchForm);
        const q = fd.get('q') || fd.get('keyword') || '';
        const provId = fd.get('province_id') || fd.get('destination') || '';
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (provId) params.set('province_id', provId);
        window.location.href = `tours/index.html?${params.toString()}`;
      });
    }
  }

  // 2. Danh Sách Tour (client/tours/index.html)
  async function handleToursCatalog() {
    const [tours, provinces, categories] = await Promise.all([
      listTours(), loadProvinces(), get('/api/categories')
    ]);
    const urlParams = new URLSearchParams(window.location.search);
    const searchVal = urlParams.get('q') || '';
    const catParam = urlParams.getAll('category_id[]').length > 0 ? urlParams.getAll('category_id[]') : (urlParams.get('category_id') ? [urlParams.get('category_id')] : []);
    const provParam = urlParams.get('province_id') || '';
    const regionParam = urlParams.get('region') || '';
    const maxPriceParam = urlParams.get('gia_den') || urlParams.get('max_price') || '';
    const maxDaysParam = urlParams.get('so_ngay') || urlParams.get('max_days') || '';
    const sortParam = urlParams.get('sort') || 'featured';

    let currentPage = parseInt(urlParams.get('page') || '1', 10);
    const pageSize = 6;

    // Search input
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) searchInput.value = searchVal;

    // Province dropdown
    const provSelect = document.querySelector('select[name="province_id"]');
    if (provSelect) {
      const provs = provinces;
      provSelect.innerHTML = '<option value="">-- Tất cả điểm đến --</option>' +
        provs.map(p => `<option value="${p.id}" ${String(p.id) === provParam ? 'selected' : ''}>${html(p.name)}</option>`).join('');
    }

    // Category checkboxes
    const catContainer = document.querySelector('input[name="category_id[]"]')?.closest('.space-y-3') || document.querySelector('.space-y-3');
    if (catContainer) {
      const cats = categories.map(c => ({ ...c, name: c.category_name, tour_count: tours.filter(t => t.category_id === c.id).length }));
      catContainer.innerHTML = cats.map(c => `
        <label class="flex items-center space-x-3 cursor-pointer group">
          <input class="rounded text-primary focus:ring-primary border-outline-variant w-4 h-4 cursor-pointer"
                 type="checkbox"
                 name="category_id[]"
                 value="${c.id}"
                 ${catParam.includes(String(c.id)) ? 'checked' : ''} />
          <span class="text-sm font-medium text-slate-700 group-hover:text-primary">
            ${html(c.name)} (${c.tour_count})
          </span>
        </label>
      `).join('');
    }

    // Range display price & days
    const priceRangeInput = document.querySelector('input[name="gia_den"]');
    const priceDisplay = document.getElementById('display_price');
    if (priceRangeInput) {
      if (maxPriceParam) priceRangeInput.value = maxPriceParam;
      if (priceDisplay) priceDisplay.innerText = Number(priceRangeInput.value).toLocaleString('vi-VN') + ' VNĐ';
    }

    const daysRangeInput = document.querySelector('input[name="so_ngay"]');
    const daysDisplay = document.getElementById('display_days');
    if (daysRangeInput) {
      if (maxDaysParam) daysRangeInput.value = maxDaysParam;
      if (daysDisplay) daysDisplay.innerText = daysRangeInput.value + ' ngày';
    }

    // Sort select
    const sortSelect = document.querySelector('select[name="sort"]');
    if (sortSelect) sortSelect.value = sortParam;

    // Filter Tours
    const filteredTours = tours.filter(t =>
      (!searchVal || [t.title, t.province?.name, t.description].some(value => value?.toLowerCase().includes(searchVal.toLowerCase()))) &&
      (!catParam.length || catParam.includes(String(t.category_id))) &&
      (!provParam || String(t.province_id) === provParam) &&
      (!regionParam || provinces.some(p => p.id === t.province_id && p.region === regionParam)) &&
      (!maxPriceParam || t.min_price <= Number(maxPriceParam)) &&
      (!maxDaysParam || t.duration_days <= Number(maxDaysParam))
    );
    if (sortParam === 'asc' || sortParam === 'desc') {
      filteredTours.sort((a, b) => (a.min_price - b.min_price) * (sortParam === 'asc' ? 1 : -1));
    }

    // Update count text
    const countEl = document.querySelector('section p strong');
    if (countEl) countEl.innerText = filteredTours.length;

    // Pagination slice
    const totalPages = Math.max(1, Math.ceil(filteredTours.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedTours = filteredTours.slice(startIndex, startIndex + pageSize);

    // Render Tour Grid
    const gridContainer = document.querySelector('.grid.grid-cols-1[class~="lg:grid-cols-2"]');
    if (gridContainer) {
      if (paginatedTours.length === 0) {
        gridContainer.innerHTML = `
          <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span class="material-symbols-outlined text-5xl text-slate-300 mb-3">travel_explore</span>
            <p class="text-base font-bold text-slate-700">Không tìm thấy tour phù hợp với tiêu chí lọc.</p>
            <p class="text-xs text-slate-400 mt-1">Vui lòng thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.</p>
            <a href="index.html" class="inline-block mt-4 px-6 py-2 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-container transition shadow-sm">
              Xem tất cả tour
            </a>
          </div>
        `;
      } else {
        gridContainer.innerHTML = paginatedTours.map(t => {
          const img = (t.images && t.images[0]) || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';
          const tag = t.featured ? 'Bán chạy nhất' : (t.category?.name || 'Tuyển chọn');
          const price = formatMoney(t.adult_price);
          const duration = `${t.duration_days} ngày ${t.duration_nights} đêm`;
          const provName = t.province?.name || 'Việt Nam';

          return `
            <div class="group bg-surface-container-low rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div class="relative h-64 overflow-hidden">
                <img src="${html(img)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${html(t.title)}" />
                <div class="absolute bottom-4 right-4 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                  <span>${price}</span>
                </div>
                <div class="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase shadow-sm">
                  ${html(tag)}
                </div>
              </div>
              <div class="p-6 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <div class="flex items-center text-secondary mb-2">
                    <span class="material-symbols-outlined text-sm">location_on</span>
                    <span class="text-xs font-bold uppercase ml-1 tracking-wider">${html(provName)}</span>
                  </div>
                  <h3 class="text-xl font-bold font-headline text-primary mb-3 line-clamp-2 hover:text-blue-700 transition">
                    ${html(t.title)}
                  </h3>
                  <div class="flex items-center space-x-3 text-slate-500 text-xs mb-4">
                    <span class="flex items-center">
                      <span class="material-symbols-outlined text-xs mr-1">schedule</span>
                      ${duration}
                    </span>
                    <span class="flex items-center">
                      <span class="material-symbols-outlined text-xs mr-1">pin_drop</span>
                      Khởi hành từ ${html(t.departure_location)}
                    </span>
                  </div>
                </div>
                <a href="show.html?id=${t.id}" class="block text-center w-full py-3 bg-surface-container-highest text-primary rounded-full font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-sm">
                  Xem chi tiết
                </a>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Pagination Controls
    const paginationContainer = document.querySelector('.mt-16.flex.justify-center.items-center');
    if (paginationContainer) {
      if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
      } else {
        let pagesHtml = '';
        // Prev
        if (currentPage > 1) {
          pagesHtml += `<button type="button" class="page-btn w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all font-bold" data-page="${currentPage - 1}"><span class="material-symbols-outlined">chevron_left</span></button>`;
        } else {
          pagesHtml += `<span class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed"><span class="material-symbols-outlined">chevron_left</span></span>`;
        }

        // Numbers
        for (let p = 1; p <= totalPages; p++) {
          if (p === currentPage) {
            pagesHtml += `<span class="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shadow-sm">${p}</span>`;
          } else {
            pagesHtml += `<button type="button" class="page-btn w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all font-bold" data-page="${p}">${p}</button>`;
          }
        }

        // Next
        if (currentPage < totalPages) {
          pagesHtml += `<button type="button" class="page-btn w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all font-bold" data-page="${currentPage + 1}"><span class="material-symbols-outlined">chevron_right</span></button>`;
        } else {
          pagesHtml += `<span class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed"><span class="material-symbols-outlined">chevron_right</span></span>`;
        }

        paginationContainer.innerHTML = pagesHtml;

        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const pageNum = btn.getAttribute('data-page');
            urlParams.set('page', pageNum);
            window.location.search = urlParams.toString();
          });
        });
      }
    }
  }

  // 3. Chi Tiết Tour (client/tours/show.html)
  async function handleTourDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const tour = await liveTour(urlParams.get('id'));

    // 1. Page Title & Tour Headline
    document.title = `${tour.title} | Vietnam Expeditions`;
    const titleEl = document.getElementById('tourDetailTitle') || document.querySelector('h1.font-headline');
    if (titleEl) titleEl.textContent = tour.title;

    // 2. Category & Status Badges
    const catBadge = document.getElementById('tourDetailCategory') || document.querySelector('header span.bg-secondary\\/10');
    if (catBadge) catBadge.textContent = tour.category?.name || 'Du lịch tuyển chọn';

    const statusBadge = document.getElementById('tourDetailStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = tour.featured ? 'Bán chạy nhất' : 'Khởi hành định kỳ';
    }

    // 3. Rating, Review Count & Location
    const reviews = tour.reviews || db.getReviews(tour.id) || [];
    const ratingValue = tour.rating || (reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '5.0');
    const reviewCountValue = tour.review_count !== undefined ? tour.review_count : reviews.length;

    const ratingEl = document.getElementById('tourDetailRating') || document.querySelector('header .text-on-surface');
    if (ratingEl) ratingEl.textContent = ratingValue;

    const reviewCountEl = document.getElementById('tourDetailReviewCount') || document.querySelector('header .text-slate-500 span:last-child');
    if (reviewCountEl) reviewCountEl.textContent = `(${reviewCountValue} đánh giá)`;

    const locEl = document.getElementById('tourDetailLocation') || document.querySelector('header .text-primary span.font-semibold');
    if (locEl) locEl.textContent = tour.province?.name || tour.departure_location || 'Việt Nam';

    // 4. Image Gallery Slider
    const slider = document.getElementById('slider');
    if (slider && Array.isArray(tour.images) && tour.images.length > 0) {
      slider.innerHTML = tour.images.map((img, idx) => `
        <div class="min-w-full h-full relative snap-start flex-shrink-0">
          <img class="w-full h-full object-cover" src="${html(img)}" alt="${html(tour.title)} - Ảnh ${idx + 1}" onerror="this.src='https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg'"/>
          <div class="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2">
            <span>${html(tour.title)}</span>
            ${idx === 0 ? '<span class="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Ảnh bìa</span>' : `<span class="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded font-bold">Ảnh ${idx + 1}/${tour.images.length}</span>`}
          </div>
        </div>
      `).join('');
    }

    // 5. Description Content & Feature Stats
    const descP = document.getElementById('tourDetailDesc') || document.querySelector('section > p.text-on-surface-variant');
    if (descP) descP.textContent = tour.description;

    const durationEl = document.getElementById('tourDetailDuration');
    if (durationEl) durationEl.textContent = `${tour.duration_days} ngày ${tour.duration_nights} đêm`;

    const transportEl = document.getElementById('tourDetailTransport');
    if (transportEl) {
      const tName = (tour.category?.name || '').toLowerCase();
      if (tName.includes('du thuyền') || tour.title.toLowerCase().includes('du thuyền')) {
        transportEl.textContent = 'Du thuyền 5 sao chuẩn quốc tế';
      } else if (tName.includes('mạo hiểm') || tName.includes('núi')) {
        transportEl.textContent = 'Xe giường nằm VIP / Trekking';
      } else {
        transportEl.textContent = 'Xe du lịch đời mới máy lạnh';
      }
    }

    const hotelEl = document.getElementById('tourDetailHotel');
    if (hotelEl) {
      const tName = (tour.category?.name || '').toLowerCase();
      if (tName.includes('nghỉ dưỡng') || tour.adult_price >= 5000000) {
        hotelEl.textContent = 'Resort 5 sao sát biển';
      } else {
        hotelEl.textContent = 'Khách sạn tiêu chuẩn 4 sao';
      }
    }

    // 6. Inclusions & Exclusions
    const incList = document.getElementById('tourDetailInclusions') || document.querySelector('ul.space-y-3:not(.exclusions)');
    if (incList && Array.isArray(tour.inclusions)) {
      incList.innerHTML = tour.inclusions.map(inc => `
        <li class="flex items-start gap-3 text-sm text-slate-700">
          <span class="material-symbols-outlined text-green-600 text-base shrink-0 mt-0.5">check_circle</span>
          <span>${html(inc)}</span>
        </li>
      `).join('');
    }

    const excList = document.getElementById('tourDetailExclusions') || document.querySelector('ul.space-y-3.exclusions');
    if (excList && Array.isArray(tour.exclusions)) {
      excList.innerHTML = tour.exclusions.map(exc => `
        <li class="flex items-start gap-3 text-sm text-slate-600">
          <span class="material-symbols-outlined text-slate-400 text-base shrink-0 mt-0.5">cancel</span>
          <span>${html(exc)}</span>
        </li>
      `).join('');
    }

    // 7. Itinerary Timeline
    const daysBadge = document.getElementById('itineraryDaysCount');
    if (daysBadge) daysBadge.textContent = `${tour.duration_days} ngày ${tour.duration_nights} đêm`;

    const itinContainer = document.getElementById('itineraryContainer') || document.querySelector('.space-y-8.relative');
    if (itinContainer && Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
      itinContainer.innerHTML = `
        <div class="absolute left-[11px] top-4 bottom-4 w-0.5 bg-outline-variant/50"></div>
        ${tour.itinerary.map(it => `
          <div class="relative pl-10">
            <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary border-4 border-surface-container-low flex items-center justify-center text-[10px] text-white font-bold"></div>
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 class="font-bold text-primary text-base">Ngày ${it.day}: ${html(it.title)}</h4>
                <span class="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">Chi tiết ngày ${it.day}</span>
              </div>
              <p class="text-on-surface-variant text-sm leading-relaxed">${html(it.content)}</p>
            </div>
          </div>
        `).join('')}
      `;
    }

    // 8. Reviews Section
    const reviewBtn = document.getElementById('btnWriteReviewLink');
    if (reviewBtn) {
      reviewBtn.href = '../my_tours/index.html?tab=completed';
    }

    const reviewsContainer = document.getElementById('reviewsContainer') || document.getElementById('reviewsList') || document.querySelector('.reviews-container');
    if (reviewsContainer) {
      if (reviews.length === 0) {
        reviewsContainer.innerHTML = `
          <div class="bg-white p-8 rounded-2xl border border-slate-100 text-center py-10 shadow-sm">
            <span class="material-symbols-outlined text-5xl text-slate-300 mb-2">rate_review</span>
            <p class="text-base font-bold text-slate-700">Chưa có đánh giá nào cho chuyến đi này.</p>
            <p class="text-xs text-slate-400 mt-1">Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận thực tế của bạn!</p>
            <a href="../my_tours/index.html?tab=completed" class="inline-block mt-4 px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-blue-800 transition shadow-sm">
              Viết đánh giá ngay
            </a>
          </div>
        `;
      } else {
        reviewsContainer.innerHTML = reviews.map(r => {
          const stars = '★'.repeat(Math.min(5, Math.max(1, r.rating))) + '☆'.repeat(Math.max(0, 5 - r.rating));
          const avatar = r.avatar || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_kh_003f87.png';
          return `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <img src="${html(avatar)}" alt="${html(r.customer_name)}" class="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-sm"/>
                  <div>
                    <h4 class="font-bold text-sm text-primary">${html(r.customer_name)}</h4>
                    <p class="text-[11px] text-slate-400">${formatDate(r.created_at)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span class="text-amber-500 text-xs tracking-wider">${stars}</span>
                  <span class="text-xs font-bold text-amber-700 ml-1">${r.rating}.0</span>
                </div>
              </div>
              <p class="text-slate-700 text-sm leading-relaxed">${html(r.comment)}</p>
            </div>
          `;
        }).join('');
      }
    }

    // 9. Sticky Booking Widget on Sidebar
    const validDepartures = tour.departures.filter(openDeparture);

    const depSelect = document.getElementById('departureSelect') || document.querySelector('select[name="departure_id"]') || document.querySelector('select[name="departureId"]');
    const priceDisplay = document.getElementById('tourDetailPrice') || document.querySelector('[data-booking-price-display]') || document.querySelector('.text-3xl.font-black.text-primary');
    const childPriceDisplay = document.getElementById('tourDetailChildPrice');
    const seatsBadge = document.getElementById('selectedSeatsBadge');
    const guideWrapper = document.getElementById('departureGuideInfo');
    const guideNameEl = document.getElementById('departureGuideName');
    const bookingForm = document.getElementById('bookingActionForm') || document.querySelector('form[action*="booking/create.html"]');

    if (depSelect) {
      if (validDepartures.length === 0) {
        depSelect.innerHTML = '<option value="">-- Hiện chưa có lịch khởi hành mở bán --</option>';
        if (priceDisplay) {
          priceDisplay.innerHTML = `${formatMoney(tour.adult_price)} <span class="text-sm font-bold text-slate-500">VNĐ/khách</span>`;
        }
        if (childPriceDisplay) {
          childPriceDisplay.textContent = `${formatMoney(tour.child_price)}/vé`;
        }
        if (seatsBadge) {
          seatsBadge.textContent = 'Hết chỗ';
          seatsBadge.className = 'text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200';
          seatsBadge.classList.remove('hidden');
        }
      } else {
        depSelect.innerHTML = validDepartures.map(d => `
          <option value="${d.id}" data-adult-price="${d.adult_price}" data-child-price="${d.child_price}" data-seats="${d.available_seats}" data-guide="${html(d.guide_name || '')}">
            Khởi hành: ${formatDate(d.start_date)} - Về: ${formatDate(d.end_date)} (Còn ${d.available_seats} chỗ)
          </option>
        `).join('');

        // Hàm cập nhật widget theo lịch được chọn
        const updateWidgetForSelectedDep = () => {
          const selectedDepId = depSelect.value;
          const selectedDep = validDepartures.find(d => String(d.id) === selectedDepId) || validDepartures[0];
          if (!selectedDep) return;

          if (priceDisplay) {
            priceDisplay.innerHTML = `${formatMoney(selectedDep.adult_price)} <span class="text-sm font-bold text-slate-500">VNĐ/khách</span>`;
          }
          if (childPriceDisplay) {
            childPriceDisplay.textContent = `${formatMoney(selectedDep.child_price)}/vé`;
          }
          if (seatsBadge) {
            seatsBadge.textContent = `Còn ${selectedDep.available_seats} chỗ trống`;
            seatsBadge.className = 'text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200';
            seatsBadge.classList.remove('hidden');
          }
          if (guideWrapper && guideNameEl) {
            if (selectedDep.guide_name) {
              guideNameEl.textContent = selectedDep.guide_name;
              guideWrapper.classList.remove('hidden');
            } else {
              guideWrapper.classList.add('hidden');
            }
          }
        };

        depSelect.addEventListener('change', updateWidgetForSelectedDep);
        // Đồng bộ dữ liệu ban đầu
        updateWidgetForSelectedDep();
      }
    }

    // 10. Xử lý nút và form Đặt tour
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedDepId = depSelect ? depSelect.value : '';

        if (!selectedDepId) {
          alert('Chuyến đi này hiện chưa có lịch khởi hành mở bán. Quý khách vui lòng liên hệ hotline để được hỗ trợ sắp lịch riêng!');
          return;
        }

        const chosenDep = validDepartures.find(d => String(d.id) === selectedDepId);
        if (!chosenDep || Number(chosenDep.available_seats) <= 0) {
          alert('Lịch khởi hành này hiện đã hết chỗ trống! Quý khách vui lòng chọn ngày khác.');
          return;
        }

        // Chuyển sang bước 1 đặt tour
        window.location.href = `../booking/create.html?tour_id=${tour.id}&departure_id=${selectedDepId}`;
      });
    }
  }

  // 4. Đặt Tour - Bước 1 (client/booking/create.html)
  async function handleBookingCreate() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!requireCustomer()) return;
    const { tour, dep } = await bookingDeparture(urlParams);

    // Summary Card Details
    const tourImg = document.querySelector('.rounded-xl.overflow-hidden img');
    if (tourImg && tour.images?.[0]) tourImg.src = tour.images[0];

    const tourTag = document.querySelector('.rounded-xl.overflow-hidden span');
    if (tourTag) tourTag.textContent = tour.category?.name || 'Tour nổi bật';

    const tourTitleEl = document.querySelector('h3.font-headline');
    if (tourTitleEl) tourTitleEl.textContent = tour.title;

    // Departure Location & Dates
    const summaryLocEl = document.querySelector('.material-symbols-outlined.text-xs.text-primary + span');
    if (summaryLocEl) summaryLocEl.innerHTML = `Khởi hành: <strong>${html(tour.departure_location)}</strong>`;

    const summaryDateEl = document.querySelector('.material-symbols-outlined.text-xs:not(.text-primary) + span');
    if (summaryDateEl) {
      summaryDateEl.innerHTML = `Ngày đi: <strong>${formatDate(dep.start_date)} (${tour.duration_days} ngày ${tour.duration_nights} đêm)</strong>`;
    }

    // Adult & Child Pricing
    const adultPrice = Number(dep.adult_price);
    const childPrice = Number(dep.child_price);

    const adultPriceLabel = document.querySelectorAll('.flex.justify-between.items-center p.text-xs.font-bold.text-primary')[0];
    if (adultPriceLabel) adultPriceLabel.textContent = `${formatMoney(adultPrice)}/vé`;

    const childPriceLabel = document.querySelectorAll('.flex.justify-between.items-center p.text-xs.font-bold.text-primary')[1];
    if (childPriceLabel) childPriceLabel.textContent = `${formatMoney(childPrice)}/vé`;

    // Quantity inputs & summary
    const saved = JSON.parse(sessionStorage.getItem('booking_draft') || 'null')?.request;
    const initial = saved?.departure_id === dep.id ? saved : null;
    const adultsInput = document.getElementById('total_adults');
    const childrenInput = document.getElementById('total_children');
    adultsInput.value = Math.min(dep.available_seats, initial?.total_adults ?? (Number(adultsInput.value) || 1));
    childrenInput.value = Math.min(dep.available_seats - Number(adultsInput.value), initial?.total_children ?? 0);

    function recalculate() {
      const aCount = Math.max(1, Number(adultsInput.value) || 1);
      const cCount = Math.max(0, Number(childrenInput.value) || 0);

      document.getElementById('display_adults').textContent = aCount;
      document.getElementById('display_children').textContent = cCount;

      document.getElementById('summary_adults').textContent = aCount;
      document.getElementById('summary_children').textContent = cCount;

      const aTotal = aCount * adultPrice;
      const cTotal = cCount * childPrice;
      const grandTotal = aTotal + cTotal;

      document.getElementById('summary_adult_amount').textContent = formatMoney(aTotal);
      document.getElementById('summary_child_amount').textContent = formatMoney(cTotal);
      document.getElementById('summary_total').textContent = formatMoney(grandTotal);
    }

    recalculate();

    // Wire Quantity +/- buttons
    document.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const change = Number(btn.dataset.change);
        let val = Number(input.value) + change;
        if (targetId === 'total_adults' && val < 1) val = 1;
        if (targetId === 'total_children' && val < 0) val = 0;
        const other = input === adultsInput ? childrenInput : adultsInput;
        input.value = Math.min(val, 20, dep.available_seats - Number(other.value));
        recalculate();
      };
    });

    // Contact info pre-fill
    const user = getActiveCustomer();
    const nameInput = document.querySelector('input[name="userFullName"]');
    const phoneInput = document.querySelector('input[name="userPhone"]');
    const emailInput = document.querySelector('input[name="userEmail"]');
    if (nameInput) nameInput.value = initial?.userFullName ?? user?.full_name ?? user?.fullName ?? '';
    if (phoneInput) phoneInput.value = initial?.userPhone ?? user?.phone ?? '';
    if (emailInput) emailInput.value = initial?.userEmail ?? user?.email ?? '';

    // Submit passes parameters to passengers.html
    const form = document.getElementById('bookingForm');
    if (form) {
      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = false;
      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (button) button.disabled = true;
        const request = {
          departure_id: dep.id, total_adults: Number(adultsInput.value),
          total_children: Number(childrenInput.value), userFullName: nameInput.value.trim(),
          userPhone: phoneInput.value.trim(), userEmail: emailInput.value.trim()
        };
        try {
          await get('/api/bookings/validate-draft', request);
          sessionStorage.setItem('booking_draft', JSON.stringify({ request }));
          window.location.href = 'passengers.html?' + new URLSearchParams({ tour_id: tour.id, departure_id: dep.id });
        } catch (error) {
          alert(error.message);
          if (button) button.disabled = false;
        }
      });
    }
  }

  // 5. Thông Tin Hành Khách (client/booking/passengers.html)
  async function handleBookingPassengers() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!requireCustomer()) return;
    const { tour, dep } = await bookingDeparture(urlParams);
    const { request, passengers: previousPassengers } = readDraft(dep.id);
    const quote = await get('/api/bookings/validate-draft', request);
    const tourId = tour.id;
    const depId = dep.id;
    const { totalAdults: adultsCount, totalChildren: childrenCount, adultPrice, childPrice, contactName } = quote;

    const adultTotal = adultsCount * adultPrice;
    const childTotal = childrenCount * childPrice;
    const grandTotal = adultTotal + childTotal;

    // Hàm cập nhật nội dung theo ID
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // Cập nhật hình ảnh tour
    const tourImage = document.getElementById('passengersTourImage');
    if (tourImage) {
        tourImage.src = tour.images?.[0] || '';
        tourImage.alt = tour.title;
    }

    // Cập nhật thông tin tour
    setText('passengersTourCategory', tour.category?.name || 'Tour du lịch');
    setText('passengersTourTitle', tour.title);
    setText(
        'passengersDepartureDate',
        `${formatDate(dep.start_date)} (${tour.duration_days} ngày ${tour.duration_nights} đêm)`
    );
    setText(
        'passengersCount',
        `${adultsCount} người lớn${childrenCount > 0 ? `, ${childrenCount} trẻ em` : ''}`
    );
    setText('passengersDepartureLocation', tour.departure_location);

    // Cập nhật chi phí
    setText(
        'passengersAdultLabel',
        `Người lớn (${adultsCount} x ${formatMoney(adultPrice)})`
    );
    setText('passengersAdultAmount', formatMoney(adultTotal));

    const childRow = document.getElementById('passengersChildRow');
    if (childRow) {
        childRow.classList.toggle('hidden', childrenCount === 0);
    }

    setText(
        'passengersChildLabel',
        `Trẻ em (${childrenCount} x ${formatMoney(childPrice)})`
    );
    setText('passengersChildAmount', formatMoney(childTotal));
    setText('passengersTotal', formatMoney(grandTotal));

    const htmlEscapeContact = html(contactName);
    const container = document.querySelector('[class~="lg:col-span-8"].space-y-6');
    if (container) {
      let html = '<h2 class="font-headline font-extrabold text-2xl text-primary mb-2">Chi tiết hành khách</h2>';

      // Render Adult Inputs
      for (let i = 1; i <= adultsCount; i++) {
        html += `
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container">
            <div class="flex items-center gap-2 mb-4 text-secondary">
              <span class="material-symbols-outlined font-bold">person</span>
              <h3 class="font-headline font-bold text-base">Hành khách ${i} - Người lớn ${i}</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant px-1">Họ và tên *</label>
                <input type="text" name="passenger_adult_name_${i}" value="${i === 1 ? htmlEscapeContact : ''}" placeholder="Nhập họ và tên như trên CCCD" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant px-1">Ngày sinh *</label>
                <input type="date" name="passenger_adult_dob_${i}" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
              </div>
              <div class="space-y-1.5 md:col-span-2">
                <label class="text-xs font-bold text-on-surface-variant px-1">Số CMND/CCCD/Hộ chiếu *</label>
                <input type="text" name="passenger_adult_id_${i}" placeholder="Ví dụ: 001090012345" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
              </div>
            </div>
          </div>
        `;
      }

      // Render Children Inputs
      for (let c = 1; c <= childrenCount; c++) {
        html += `
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container">
            <div class="flex items-center gap-2 mb-4 text-secondary">
              <span class="material-symbols-outlined font-bold">child_care</span>
              <h3 class="font-headline font-bold text-base">Hành khách ${adultsCount + c} - Trẻ em ${c}</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant px-1">Họ và tên trẻ em *</label>
                <input type="text" name="passenger_child_name_${c}" placeholder="Nhập họ và tên bé" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant px-1">Ngày sinh (dưới 12 tuổi) *</label>
                <input type="date" name="passenger_child_dob_${c}" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
              </div>
            </div>
          </div>
        `;
      }

      html += `
        <div class="flex justify-between items-center pt-4">
          <a href="../booking/create.html?tour_id=${tourId}&departure_id=${depId}" class="px-6 py-3 border border-slate-200 rounded-full font-bold text-sm text-slate-600 hover:bg-slate-50 transition">
            Quay lại
          </a>
          <button type="submit" class="px-8 py-3.5 bg-secondary text-white rounded-full font-bold shadow-lg hover:shadow-secondary/30 transition-all flex items-center gap-2 text-sm">
            Tiếp tục thanh toán
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      `;

      container.innerHTML = html;
      const counters = { adult: 0, child: 0 };
      for (const passenger of previousPassengers || []) {
        const type = passenger.passenger_type;
        const index = ++counters[type];
        for (const [field, value] of Object.entries({
          name: passenger.full_name, dob: passenger.date_of_birth, id: passenger.id_card
        })) {
          const input = container.querySelector('[name="passenger_' + type + '_' + field + '_' + index + '"]');
          if (input) input.value = value || '';
        }
      }
    }

    // Submit handler forward to invoice.html
    const form = document.getElementById('passengersForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const passList = [];
        for (let i = 1; i <= adultsCount; i++) {
          passList.push({
            name: fd.get(`passenger_adult_name_${i}`),
            dob: fd.get(`passenger_adult_dob_${i}`),
            id_card: fd.get(`passenger_adult_id_${i}`),
            type: 'adult'
          });
        }
        for (let c = 1; c <= childrenCount; c++) {
          passList.push({
            name: fd.get(`passenger_child_name_${c}`),
            dob: fd.get(`passenger_child_dob_${c}`),
            id_card: '',
            type: 'child'
          });
        }

        sessionStorage.setItem('booking_draft', JSON.stringify({
          request, passengers: passList.map(p => ({
            full_name: p.name.trim(), passenger_type: p.type,
            id_card: p.id_card.trim() || null, date_of_birth: p.dob
          }))
        }));
        window.location.href = '../payments/invoice.html?' + new URLSearchParams({ tour_id: tourId, departure_id: depId });
      });
    }
  }

  // 6. Thanh Toán & Hóa Đơn (client/payments/invoice.html)
  async function handlePaymentInvoice() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!requireCustomer()) return;
    const { tour, dep } = await bookingDeparture(urlParams);
    const { request, passengers } = readDraft(dep.id);
    const { totalAdults: adultsCount, totalChildren: childrenCount, totalAmount: grandTotal, adultPrice, childPrice } =
      await get('/api/bookings/validate-draft', request);
    if (!Array.isArray(passengers) || passengers.length !== adultsCount + childrenCount ||
        passengers.filter(p => p.passenger_type === 'adult').length !== adultsCount ||
        passengers.filter(p => p.passenger_type === 'child').length !== childrenCount) {
      throw new Error('Vui lòng nhập đầy đủ danh sách hành khách trước khi thanh toán.');
    }

    const cover = document.getElementById('checkoutTourCover');
    const image = document.getElementById('checkoutTourImage');
    const imageUrl = tour.images[0] || dep.thumbnail_url;
    if (imageUrl) {
      image.addEventListener('error', () => cover.classList.add('hidden'), { once: true });
      image.alt = tour.title;
      image.src = imageUrl;
      image.hidden = false;
      cover.classList.remove('hidden');
    }
    const summary = {
      checkoutTourTitle: tour.title,
      checkoutDates: formatDate(dep.start_date) + ' – ' + formatDate(dep.end_date),
      checkoutParty: request.userFullName + ' · ' + (adultsCount + childrenCount) + ' khách',
      checkoutAdultsLabel: 'Người lớn (' + adultsCount + ' × ' + formatMoney(adultPrice) + ')',
      checkoutAdultsAmount: formatMoney(adultsCount * adultPrice),
      checkoutChildrenLabel: 'Trẻ em (' + childrenCount + ' × ' + formatMoney(childPrice) + ')',
      checkoutChildrenAmount: formatMoney(childrenCount * childPrice),
      checkoutTotal: formatMoney(grandTotal)
    };
    for (const [elementId, value] of Object.entries(summary)) {
      document.getElementById(elementId).textContent = value;
    }
    document.getElementById('checkoutBackLink').href = '../booking/passengers.html?' + urlParams;

    // Payment Form Handler
    const form = document.getElementById('checkoutForm');
    if (form) {
      const submitBtn = document.getElementById('submit-btn');
      const submitText = document.getElementById('submit-text');
      const method = form.elements.payment_method;
      const updatePaymentMethod = () => {
        const isTransfer = method.value === 'bank_transfer';
        document.getElementById('checkout-transfer-note').classList.toggle('hidden', !isTransfer);
        document.getElementById('checkout-cash-note').classList.toggle('hidden', isTransfer);
        if (submitText) submitText.textContent = isTransfer ? 'Giữ chỗ và xem thông tin chuyển khoản' : 'Giữ chỗ và trả tại quầy';
      };
      method.addEventListener('change', updatePaymentMethod);
      updatePaymentMethod();
      if (submitBtn) submitBtn.disabled = false;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (submitBtn) {
          submitBtn.disabled = true;
        }

        if (submitText) {
          submitText.textContent = 'Đang ghi nhận giao dịch...';
        }

        try {
          const fields = new FormData(form);
          const booking = await get('/api/bookings/checkout', {
            ...request, passengers, expected_total_amount: grandTotal,
            payment_method: fields.get('payment_method')
          });
          sessionStorage.removeItem('booking_draft');
          window.location.href = '../my_tours/show.html?id=' + booking.id;
        } catch (error) {
          console.error('Checkout failed:', error);
          alert('Đặt tour thất bại: ' + error.message);
        } finally {
         if (submitBtn) {
            submitBtn.disabled = false;
          }

          updatePaymentMethod();
        }

      });
    }
  }

  // 7. Chuyến Đi Của Tôi (client/my_tours/index.html)
  async function handleMyToursIndex() {
    if (!requireCustomer()) return;
    const user = db.getCurrentUser() || {};
    const allBookings = (await get('/api/bookings/my-tours')).map(b => ({
      ...b, booking_status: b.status, adults_count: b.total_adults,
      children_count: b.total_children, payment_status: b.payment_method ? 'paid' : 'unpaid'
    }));

    // Sync aside customer info if present
    const asideEmail = document.querySelector('aside p.truncate');
    if (asideEmail && user.email) asideEmail.textContent = user.email;
    const asideName = document.querySelector('aside h2.font-headline');
    if (asideName && (user.full_name || user.fullName)) asideName.textContent = `Chào ${user.full_name || user.fullName}`;

    // Get DOM elements
    const emptyState = document.getElementById('myToursEmptyState');
    const noResultsState = document.getElementById('myToursNoResultsState');
    const listContainer = document.getElementById('myToursListContainer');
    const statsSection = document.getElementById('myToursStatsSection');
    const filterSection = document.getElementById('myToursFilterSection');
    const totalBadge = document.getElementById('myToursTotalBadge');
    const totalCountBadge = document.getElementById('myToursTotalCountBadge');

    // Stat card counters
    const statTotal = document.getElementById('statTotalBookings');
    const statUpcoming = document.getElementById('statUpcomingBookings');
    const statCompleted = document.getElementById('statCompletedBookings');
    const statCancelled = document.getElementById('statCancelledBookings');

    // Tab counters
    const tabCountAll = document.getElementById('tabCountAll');
    const tabCountUpcoming = document.getElementById('tabCountUpcoming');
    const tabCountCompleted = document.getElementById('tabCountCompleted');
    const tabCountCancelled = document.getElementById('tabCountCancelled');

    // Search and filter inputs
    const searchInput = document.getElementById('myToursSearchInput');
    const clearSearchBtn = document.getElementById('myToursClearSearch');
    const resetFilterBtn = document.getElementById('myToursResetFilterBtn');
    const tabs = document.querySelectorAll('.my-tours-tab');

    // Component filter state
    const urlParams = new URLSearchParams(window.location.search);
    let activeTab = urlParams.get('tab') || 'all';
    let searchQuery = (urlParams.get('q') || '').toLowerCase().trim();

    // Sync initial search UI
    if (searchQuery && searchInput) {
      searchInput.value = urlParams.get('q');
      if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
    }

    // Sync initial tab UI if tab parameter is specified
    if (activeTab !== 'all') {
      tabs.forEach(t => {
        const isMatch = (t.getAttribute('data-filter-tab') || 'all') === activeTab;
        t.classList.toggle('active', isMatch);
        t.classList.toggle('bg-primary', isMatch);
        t.classList.toggle('text-white', isMatch);
        t.classList.toggle('shadow-xs', isMatch);
        t.classList.toggle('text-slate-600', !isMatch);
        const b = t.querySelector('span:last-child');
        if (b) {
          b.classList.toggle('bg-white/20', isMatch);
          b.classList.toggle('bg-slate-100', !isMatch);
          b.classList.toggle('text-slate-700', !isMatch);
        }
      });
    }

    function refresh() {
      // Calculate stats
      const total = allBookings.length;
      const upcoming = allBookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'pending');
      const completed = allBookings.filter(b => b.booking_status === 'completed');
      const cancelled = allBookings.filter(b => b.booking_status === 'cancelled' || b.booking_status === 'canceled');

      // Update counters in stats & tabs
      if (totalCountBadge) totalCountBadge.textContent = `${total} chuyến đi`;
      if (statTotal) statTotal.textContent = total;
      if (statUpcoming) statUpcoming.textContent = upcoming.length;
      if (statCompleted) statCompleted.textContent = completed.length;
      if (statCancelled) statCancelled.textContent = cancelled.length;

      if (tabCountAll) tabCountAll.textContent = total;
      if (tabCountUpcoming) tabCountUpcoming.textContent = upcoming.length;
      if (tabCountCompleted) tabCountCompleted.textContent = completed.length;
      if (tabCountCancelled) tabCountCancelled.textContent = cancelled.length;

      // Handle overall Empty State (Customer has 0 bookings in the entire system)
      if (total === 0) {
        if (totalBadge) totalBadge.classList.add('hidden');
        if (statsSection) statsSection.classList.add('hidden');
        if (filterSection) filterSection.classList.add('hidden');
        if (noResultsState) noResultsState.classList.add('hidden');
        if (listContainer) {
          listContainer.classList.add('hidden');
          listContainer.innerHTML = '';
        }
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      // Customer has bookings -> Show stats & filter sections
      if (totalBadge) totalBadge.classList.remove('hidden');
      if (statsSection) statsSection.classList.remove('hidden');
      if (filterSection) filterSection.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      // 2. Apply Tab Filter
      let filtered = [...allBookings];
      if (activeTab === 'upcoming') {
        filtered = upcoming;
      } else if (activeTab === 'completed') {
        filtered = completed;
      } else if (activeTab === 'cancelled') {
        filtered = cancelled;
      }

      // 3. Apply Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(b => {
          const titleMatch = (b.tour_title || '').toLowerCase().includes(q);
          const codeMatch = (b.booking_code || '').toLowerCase().includes(q);
          return titleMatch || codeMatch;
        });
      }

      // 4. Render or display "No Results" state
      if (filtered.length === 0) {
        if (listContainer) {
          listContainer.classList.add('hidden');
          listContainer.innerHTML = '';
        }
        if (noResultsState) noResultsState.classList.remove('hidden');
      } else {
        if (noResultsState) noResultsState.classList.add('hidden');
        if (listContainer) {
          listContainer.classList.remove('hidden');
          listContainer.innerHTML = filtered.map(b => {
            const tourTitle = b.tour_title || 'Tour Du Lịch Trải Nghiệm Tuyển Chọn';
            const tourImage = b.tour_image || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';

            const statusBadge = renderStatusBadge(b.booking_status);
            const paymentBadge = renderPaymentBadge(b.payment_status);
            const paxText = `${b.adults_count || 1} người lớn${b.children_count > 0 ? `, ${b.children_count} trẻ em` : ''}`;
            const isCompleted = b.booking_status === 'completed';
            const isUpcoming = b.booking_status === 'confirmed' || b.booking_status === 'pending';

            return `
              <article class="my-tour-card bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between group">
                <!-- Left: Tour Image & Information -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto flex-1 min-w-0">
                  <div class="relative w-full sm:w-44 h-44 sm:h-32 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-slate-100 bg-slate-100">
                    <img src="${html(tourImage)}" alt="${html(tourTitle)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.src='https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg'"/>
                    <span class="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold rounded-md">#${html(b.booking_code)}</span>
                  </div>

                  <div class="space-y-2 flex-1 min-w-0 w-full">
                    <div class="flex flex-wrap items-center gap-2">
                      ${statusBadge}
                      ${paymentBadge}
                      ${isUpcoming ? '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-subtle"></span>Sắp khởi hành</span>' : ''}
                    </div>

                    <h3 class="font-bold text-base md:text-lg text-primary line-clamp-1 group-hover:text-secondary transition font-headline">
                      <a href="../my_tours/show.html?id=${b.id}">${html(tourTitle)}</a>
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                      <div class="flex items-center gap-1.5 truncate">
                        <span class="material-symbols-outlined text-sm text-secondary shrink-0">calendar_month</span>
                        <span>Khởi hành: <strong class="text-slate-700">${formatDate(b.departure_date)}</strong>${b.return_date ? ` – ${formatDate(b.return_date)}` : ''}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm text-secondary shrink-0">group</span>
                        <span>Số khách: <strong class="text-slate-700">${paxText}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Pricing & Actions -->
                <div class="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 gap-3 shrink-0">
                  <div class="text-left lg:text-right">
                    <span class="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tổng thanh toán</span>
                    <span class="text-xl md:text-2xl font-black text-secondary font-headline">${formatMoney(b.total_amount)}</span>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <a href="../my_tours/show.html?id=${b.id}" class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full font-bold text-xs hover:bg-blue-800 active:scale-95 transition shadow-xs">
                      <span>Xem chi tiết</span>
                      <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </a>
                    ${isCompleted ? `
                      <a href="../my_tours/review.html?tour_id=${b.tour_id}&booking_id=${b.id}" class="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-xs hover:bg-amber-100 transition active:scale-95">
                        <span class="material-symbols-outlined text-xs text-amber-500">star</span>
                        <span>Đánh giá tour</span>
                      </a>
                    ` : ''}

                  </div>
                </div>
              </article>
            `;
          }).join('');


        }
      }
    }

    // Set up Tab Event Listeners
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => {
          t.classList.remove('active', 'bg-primary', 'text-white', 'shadow-xs');
          t.classList.add('text-slate-600');
          const countBadge = t.querySelector('span:last-child');
          if (countBadge) {
            countBadge.classList.remove('bg-white/20');
            countBadge.classList.add('bg-slate-100', 'text-slate-700');
          }
        });
        tab.classList.add('active', 'bg-primary', 'text-white', 'shadow-xs');
        tab.classList.remove('text-slate-600');
        const activeBadge = tab.querySelector('span:last-child');
        if (activeBadge) {
          activeBadge.classList.remove('bg-slate-100', 'text-slate-700');
          activeBadge.classList.add('bg-white/20');
        }

        activeTab = tab.getAttribute('data-filter-tab') || 'all';
        refresh();
      };
    });

    // Set up Search Input Event Listeners
    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        if (clearSearchBtn) {
          if (searchQuery.length > 0) {
            clearSearchBtn.classList.remove('hidden');
          } else {
            clearSearchBtn.classList.add('hidden');
          }
        }
        refresh();
      };
    }

    if (clearSearchBtn) {
      clearSearchBtn.onclick = () => {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        refresh();
      };
    }

    if (resetFilterBtn) {
      resetFilterBtn.onclick = () => {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
        // Activate "all" tab
        const allTab = document.querySelector('.my-tours-tab[data-filter-tab="all"]');
        if (allTab) allTab.click();
        else {
          activeTab = 'all';
          refresh();
        }
      };
    }

    // Initial render
    refresh();
  }

  // 8. Vé Điện Tử Voucher (client/my_tours/show.html)
  async function handleMyTourVoucher() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!requireCustomer()) return;
    const bookingId = urlParams.get('id');
    if (!id(bookingId)) throw new Error('Mã đặt tour không hợp lệ.');
    const b = await get('/api/bookings/' + bookingId);
    const pendingTransfer = b.payment_option === 'bank_transfer' && b.status === 'pending';
    const pendingCash = b.payment_option === 'cash' && b.status === 'pending';
    const pendingPayment = pendingTransfer || pendingCash;
    const status = { confirmed: 'Đã xác nhận', pending: pendingPayment ? 'Chờ thanh toán' : 'Chờ xử lý', completed: 'Hoàn thành',
      cancelled: 'Đã hủy', canceled: 'Đã hủy' }[b.status] || 'Chưa rõ';
    const values = {
      voucherBannerMsg: 'Chi tiết đặt tour #' + b.booking_code,
      voucherBreadcrumbCode: b.booking_code, voucherBookingCode: b.booking_code,
      voucherTourTitle: b.tour_title, voucherDateRange: formatDate(b.departure_date) + ' – ' + formatDate(b.return_date),
      voucherDestinationLocation: b.destination, voucherDurationText: '', voucherDepartureLocation: '',
      voucherCategoryTag: '', voucherStatusTag: status, voucherBookingStatus: status,
      voucherPaxSummary: b.total_adults + ' người lớn, ' + b.total_children + ' trẻ em',
      voucherAdultTickets: b.total_adults + ' vé', voucherChildTickets: b.total_children + ' vé',
      voucherTotalPax: (b.total_adults + b.total_children) + ' khách', voucherInvoiceCode: b.bill_number,
      voucherPaymentMethod: b.payment_method || ({ bank_transfer: 'Chuyển khoản', cash: 'Tiền mặt' }[b.payment_option]),
      voucherPaymentStatus: b.payment_method ? 'Đã ghi nhận' : 'Chờ thanh toán',
      voucherTotalAmount: formatMoney(b.total_amount)
    };
    for (const [elementId, value] of Object.entries(values)) {
      document.getElementById(elementId).textContent = value ?? '—';
    }
    document.getElementById('voucherCategoryTag').classList.toggle('hidden', !values.voucherCategoryTag);
    const statusTag = document.getElementById('voucherStatusTag');
    statusTag.classList.toggle('bg-emerald-600', !pendingPayment);
    statusTag.classList.toggle('bg-amber-700', pendingPayment);
    const image = document.getElementById('voucherTourImage');
    image.hidden = !b.tour_image;
    if (b.tour_image) image.src = b.tour_image;
    image.alt = b.tour_title || '';
    const review = document.getElementById('voucherReviewLink');
    review.classList.toggle('hidden', b.status !== 'completed');
    review.href = 'review.html?' + new URLSearchParams({ tour_id: b.tour_id, booking_id: b.id });
    document.getElementById('voucherContent')?.classList.remove('hidden');
    if (pendingCash) {
      document.getElementById('voucherCashInstructions').classList.remove('hidden');
      document.getElementById('voucherCashAmount').textContent = formatMoney(b.total_amount);
      document.getElementById('voucherCashReference').textContent = b.booking_code;
    }
    if (pendingTransfer) {
      const panel = document.getElementById('voucherTransferInstructions');
      panel.classList.remove('hidden');
      document.getElementById('voucherTransferAmount').textContent = formatMoney(b.total_amount);
      document.getElementById('voucherTransferReference').textContent = b.booking_code;
      const account = document.getElementById('voucherTransferAccount');
      try {
        const details = await get('/api/bookings/bank-transfer-instructions');
        account.textContent = details
          ? [details.bankName, details.accountNumber, details.accountHolder].join(' · ')
          : 'Vui lòng liên hệ nhân viên để nhận thông tin tài khoản chuyển khoản.';
      } catch {
        account.textContent = 'Không tải được thông tin tài khoản. Vui lòng liên hệ nhân viên.';
      }
    }
    const passengers = b.passengers || [];
    document.getElementById('voucherPassengersTable').innerHTML = passengers.map((p, index) =>
      '<tr>' + [index + 1, p.full_name, p.passenger_type === 'adult' ? 'Người lớn' : 'Trẻ em',
        formatDate(p.date_of_birth), p.id_card || '—'].map(value =>
        '<td class="px-4 py-3">' + html(value) + '</td>').join('') + '</tr>'
    ).join('');
    document.getElementById('voucherEmptyPassengers').classList.toggle('hidden', passengers.length > 0);
  }

  // 9. Đánh Giá Chuyến Đi (client/my_tours/review.html)
  async function handleMyTourReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('booking_id');
    if (!requireCustomer()) return;
    if (!id(bookingId)) throw new Error('Vui lòng chọn chuyến đi đã đặt để gửi đánh giá.');
    const booking = await get('/api/bookings/' + bookingId);
    const values = {
      reviewTourTitle: booking.tour_title, reviewTourDest: booking.destination,
      reviewTourDeparture: formatDate(booking.departure_date), reviewTourDestination: booking.destination,
      reviewBookingCode: booking.booking_code, reviewTourCategory: ''
    };
    for (const [elementId, value] of Object.entries(values)) {
      document.getElementById(elementId).textContent = value ?? '—';
    }
    if (booking.tour_image) document.getElementById('reviewTourImage').src = booking.tour_image;
    const form = document.getElementById('reviewForm');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fields = new FormData(form);
      try {
        await get('/api/bookings/' + bookingId + '/review', {
          rating: Number(fields.get('rating')), comment: form.querySelector('textarea').value.trim()
        });
        window.location.href = 'show.html?id=' + bookingId;
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // 10. Hồ Sơ Khách Hàng (client/profile/show.html)
  function handleProfileShow() {
    const user = getActiveCustomer();
    if (!user) return;

    const nameEl = document.querySelector('[data-user-fullname]') || document.querySelector('h1.font-headline');
    if (nameEl) nameEl.textContent = user.full_name || 'Nguyễn Văn An';

    const emailEl = document.querySelector('[data-user-email]');
    if (emailEl) emailEl.textContent = user.email || 'an.nguyen@gmail.com';

    const phoneEl = document.querySelector('[data-user-phone]');
    if (phoneEl) phoneEl.textContent = user.phone || '0901234001';

    const addressEl = document.querySelector('[data-user-address]');
    if (addressEl) addressEl.textContent = user.address || 'TP. Hồ Chí Minh';

    // Account Stats
    const totalSpentEl = document.getElementById('statTotalSpent');
    if (totalSpentEl) totalSpentEl.textContent = formatMoney(user.total_spent || 14250000);

    const bookingsCountEl = document.getElementById('statBookingsCount');
    if (bookingsCountEl) bookingsCountEl.textContent = (user.booking_count || 3) + ' chuyến đi';

    const pointsEl = document.getElementById('statRewardPoints');
    if (pointsEl) pointsEl.textContent = (user.reward_points || 450) + ' điểm';

    // Edit Profile Form
    const nameInput = document.querySelector('input[name="full_name"]') || document.querySelector('input[name="name"]');
    if (nameInput) nameInput.value = user.full_name || '';

    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) phoneInput.value = user.phone || '';

    const addressInput = document.querySelector('input[name="address"]') || document.querySelector('textarea[name="address"]');
    if (addressInput) addressInput.value = user.address || '';

    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = db.updateCustomer(user.id, {
          full_name: nameInput?.value || user.full_name,
          phone: phoneInput?.value || user.phone,
          address: addressInput?.value || user.address
        });
        db.setCurrentUser(updated);
        alert('Cập nhật hồ sơ cá nhân thành công!');
        window.location.reload();
      });
    }
  }

  // 11. Điểm Thưởng (client/reward_point.html)
  function handleRewardPoint() {
    const user = getActiveCustomer();
    const points = user?.reward_points || 0;

    const pointsEl = document.querySelector('[data-reward-points]') || document.querySelector('.text-5xl.font-black');
    if (pointsEl) pointsEl.textContent = points;

    // Point redeem buttons
    document.querySelectorAll('.btn-redeem').forEach(btn => {
      btn.addEventListener('click', () => {
        const cost = Number(btn.getAttribute('data-cost') || 100);
        if (points < cost) {
          alert(`Bạn cần tối thiểu ${cost} điểm để đổi mã này!`);
        } else {
          user.reward_points -= cost;
          db.updateCustomer(user.id, user);
          alert(`Đổi thành công mã giảm giá! Bạn được trừ ${cost} điểm thưởng.`);
          handleRewardPoint();
        }
      });
    });
  }

  // 12. Lịch Sử Thanh Toán (client/payments/history.html)
  let currentActiveInvoice = null;

  function renderInvoiceContent(inv) {
    const container = document.getElementById('invoicePrintContainer');
    if (!container) return;

    const modalTitle = document.getElementById('modalInvoiceTitle');
    if (modalTitle) modalTitle.textContent = `Hóa đơn thanh toán #${inv.bill_number}`;

    const passengers = Array.isArray(inv.passengers) ? inv.passengers : [];
    const passengersHtml = passengers.length > 0 ? `
      <div class="mt-3 pt-3 border-t border-slate-200 page-break-inside-avoid">
        <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-blue-900">groups</span>
          Danh sách hành khách tham gia chuyến đi (${passengers.length} khách)
        </h5>
        <div class="overflow-x-auto rounded-xl border border-slate-200 text-xs">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th class="py-1.5 px-3">STT</th>
                <th class="py-1.5 px-3">Họ và tên</th>
                <th class="py-1.5 px-3">Loại khách</th>
                <th class="py-1.5 px-3">Ngày sinh</th>
                <th class="py-1.5 px-3">CCCD/Định danh</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${passengers.map((p, idx) => `
                <tr>
                  <td class="py-1.5 px-3 font-semibold text-slate-600">${idx + 1}</td>
                  <td class="py-1.5 px-3 font-bold text-slate-900">${html(p.full_name)}</td>
                  <td class="py-1.5 px-3 text-slate-700">${p.passenger_type === 'adult' ? 'Người lớn' : 'Trẻ em'}</td>
                  <td class="py-1.5 px-3 text-slate-600">${p.date_of_birth ? formatDate(p.date_of_birth) : '—'}</td>
                  <td class="py-1.5 px-3 font-mono text-slate-600">${html(p.id_card || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : '';

    container.innerHTML = `
      <!-- Header công ty & Tiêu đề hóa đơn -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3 border-b-2 border-blue-900">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-black text-blue-900 italic font-headline tracking-tight">Vietnam Expeditions</span>
          </div>
          <p class="text-xs font-bold text-slate-800 mt-0.5">CÔNG TY CỔ PHẦN DU LỊCH VIETNAM EXPEDITIONS</p>
          <p class="text-[11px] text-slate-500 mt-0.5">Địa chỉ: 123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh</p>
          <p class="text-[11px] text-slate-500">Hotline: 1900 6868 | Email: hotro@vietnamexpeditions.vn</p>
          <p class="text-[11px] text-slate-500">Mã số thuế: 0314567890</p>
        </div>
        <div class="sm:text-right shrink-0">
          <span class="inline-block bg-blue-900 text-white font-headline text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full mb-1">
            Hóa đơn điện tử
          </span>
          <p class="text-xs text-slate-500">Ký hiệu: <strong class="text-slate-800 font-mono">VE/26E</strong></p>
          <p class="text-xs text-slate-500">Số HĐ: <strong class="text-blue-900 font-mono font-black text-base">${html(inv.bill_number)}</strong></p>
          <p class="text-[11px] text-slate-500">Ngày lập: ${formatDateTime(inv.bill_date || inv.payment_date)}</p>
        </div>
      </div>

      <!-- Tiêu đề chính -->
      <div class="text-center my-3">
        <h2 class="text-lg md:text-xl font-black text-blue-950 font-headline uppercase tracking-tight">HÓA ĐƠN THANH TOÁN DỊCH VỤ</h2>
        <p class="text-[11px] text-slate-500 mt-0.5 italic">Bản thể hiện điện tử phục vụ lưu trữ và đối soát giao dịch</p>
      </div>

      <!-- 2 Cột thông tin: Khách hàng & Giao dịch -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 text-xs">
        <div class="space-y-1">
          <p class="font-bold text-blue-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">Thông tin khách hàng</p>
          <p class="text-slate-700">Họ và tên: <strong class="text-slate-900 text-sm">${html(inv.customer_name || 'Khách hàng')}</strong></p>
          <p class="text-slate-700">Điện thoại: <strong class="text-slate-900 font-mono">${html(inv.customer_phone || '—')}</strong></p>
          <p class="text-slate-700">Email nhận vé: <strong class="text-slate-900 font-mono">${html(inv.customer_email || '—')}</strong></p>
          <p class="text-slate-700">Địa chỉ: <span class="text-slate-800">${html(inv.customer_address || '—')}</span></p>
        </div>
        <div class="space-y-1">
          <p class="font-bold text-blue-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">Thông tin giao dịch</p>
          <p class="text-slate-700">Mã đặt tour: <strong class="text-blue-900 font-mono text-sm">${html(inv.booking_code || ('BK' + inv.booking_id))}</strong></p>
          <p class="text-slate-700">Mã giao dịch: <strong class="text-slate-900 font-mono">${html(inv.payment_code || ('TXN-' + inv.payment_id))}</strong></p>
          <p class="text-slate-700">Phương thức: <span class="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">${html(inv.payment_method || 'Thẻ quốc tế')}</span></p>
          <p class="text-slate-700">Trạng thái: <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Đã thanh toán thành công</span></p>
        </div>
      </div>

      <!-- Chi tiết dịch vụ du lịch -->
      <div class="overflow-x-auto rounded-xl border border-slate-200 text-xs my-3 page-break-inside-avoid">
        <table class="w-full text-left border-collapse">
          <thead class="bg-blue-900 text-white font-bold">
            <tr>
              <th class="py-2 px-3 text-center w-12">STT</th>
              <th class="py-2 px-4">Tên dịch vụ / Tour du lịch</th>
              <th class="py-2 px-3">Thời gian khởi hành</th>
              <th class="py-2 px-3 text-center">Số lượng</th>
              <th class="py-2 px-4 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr>
              <td class="py-2 px-3 text-center font-bold text-slate-500">1</td>
              <td class="py-2 px-4">
                <p class="font-bold text-slate-900 text-sm">${html(inv.tour_title || 'Tour du lịch trọn gói')}</p>
                <p class="text-[11px] text-slate-500 mt-0.5">Điểm đón: ${html(inv.pickup_point || 'Theo lịch trình tour')}</p>
              </td>
              <td class="py-2 px-3 text-slate-700">
                <p>Khởi hành: <strong>${formatDate(inv.departure_date)}</strong></p>
                ${inv.return_date ? `<p class="text-[11px] text-slate-500">Kết thúc: ${formatDate(inv.return_date)}</p>` : ''}
              </td>
              <td class="py-2 px-3 text-center font-medium">
                ${inv.total_adults || 1} người lớn${inv.total_children > 0 ? `<br><span class="text-slate-500">${inv.total_children} trẻ em</span>` : ''}
              </td>
              <td class="py-2 px-4 text-right font-black font-mono text-sm text-blue-950">
                ${formatMoney(inv.final_amount || inv.total_amount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      ${passengersHtml}

      <!-- Bảng tổng kết tiền thanh toán -->
      <div class="mt-3 pt-3 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs page-break-inside-avoid">
        <div class="text-slate-500 max-w-sm">
          <p class="font-bold text-slate-700 mb-0.5">Ghi chú & Chính sách:</p>
          <p class="text-[11px] leading-relaxed">Hóa đơn điện tử có giá trị pháp lý theo quy định của pháp luật. Khách hàng sử dụng hóa đơn này kết hợp mã đặt tour khi làm thủ tục khởi hành.</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 w-full sm:w-72 space-y-1.5">
          <div class="flex justify-between text-slate-600">
            <span>Tổng giá trị đơn:</span>
            <span class="font-bold text-slate-800 font-mono">${formatMoney(inv.total_amount || inv.final_amount)}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>Đã thanh toán:</span>
            <span class="font-bold text-emerald-700 font-mono">${formatMoney(inv.final_amount || inv.total_amount)}</span>
          </div>
          <div class="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
            <span>Còn lại:</span>
            <span class="font-bold text-slate-500 font-mono">0 đ</span>
          </div>
          <div class="pt-1.5 border-t-2 border-blue-900 flex justify-between items-center text-sm font-black text-blue-950">
            <span>TỔNG CỘNG:</span>
            <span class="text-base text-secondary font-mono">${formatMoney(inv.final_amount || inv.total_amount)}</span>
          </div>
        </div>
      </div>

      <!-- Chữ ký số & Dấu xác nhận -->
      <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-slate-300 text-center text-xs page-break-inside-avoid">
        <div>
          <p class="font-bold uppercase text-slate-700">Khách hàng / Người đặt vé</p>
          <p class="text-[11px] text-slate-400 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
          <div class="h-10 flex items-center justify-center mt-1">
            <span class="font-bold text-slate-800 text-sm font-headline italic">${html(inv.customer_name || '')}</span>
          </div>
          <p class="text-[11px] text-slate-500">Đã xác nhận trực tuyến</p>
        </div>
        <div>
          <p class="font-bold uppercase text-slate-700">Đại diện bên bán / Vietnam Expeditions</p>
          <p class="text-[11px] text-slate-400 italic mt-0.5">(Ký điện tử bởi tổ chức)</p>
          <div class="h-10 flex items-center justify-center mt-1">
            <div class="border-2 border-emerald-600 text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg text-[10px] font-bold text-left inline-block leading-tight">
              <span class="material-symbols-outlined text-xs align-middle text-emerald-600">verified</span>
              ĐÃ KÝ ĐIỆN TỬ BỞI:<br>
              <strong class="text-[10px] font-headline">VIETNAM EXPEDITIONS CORP</strong><br>
              <span class="text-[8px] text-slate-500">Ngày: ${formatDateTime(inv.bill_date || inv.payment_date)}</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-500">Hệ thống chứng thực số</p>
        </div>
      </div>
    `;
  }

  function triggerPrintInvoice(invoice) {
    const originalTitle = document.title;
    document.title = `HoaDon_${invoice.bill_number}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }

  function initInvoiceDownloadHandlers() {
    const modal = document.getElementById('customerInvoiceModal');
    const closeBtn1 = document.getElementById('closeInvoiceModalBtn');
    const closeBtn2 = document.getElementById('modalCloseInvoiceBtn');
    const printBtn = document.getElementById('modalPrintInvoiceBtn');

    const closeModal = () => {
      if (modal) modal.classList.add('hidden');
      currentActiveInvoice = null;
    };

    if (closeBtn1) closeBtn1.onclick = closeModal;
    if (closeBtn2) closeBtn2.onclick = closeModal;
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };
    }

    if (printBtn) {
      printBtn.onclick = () => {
        if (currentActiveInvoice) {
          triggerPrintInvoice(currentActiveInvoice);
        }
      };
    }

    document.querySelectorAll('.btn-download-invoice').forEach(btn => {
      btn.onclick = async () => {
        const bookingId = btn.getAttribute('data-booking-id');
        if (!bookingId) {
          alert('Không tìm thấy thông tin đơn đặt tour.');
          return;
        }

        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Đang tải...</span>';

        try {
          const invoice = await get('/api/customer/invoices/' + bookingId);
          if (!invoice || !invoice.bill_number) {
            throw new Error('Hóa đơn chưa tồn tại hoặc dữ liệu chưa đủ để xuất hóa đơn.');
          }

          currentActiveInvoice = invoice;
          renderInvoiceContent(invoice);

          if (modal) modal.classList.remove('hidden');

          // Tự động kích hoạt hộp thoại in / tải PDF
          setTimeout(() => {
            if (currentActiveInvoice === invoice) {
              triggerPrintInvoice(invoice);
            }
          }, 350);
        } catch (err) {
          alert(err.message || 'Không thể lấy thông tin hóa đơn. Vui lòng thử lại sau.');
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      };
    });
  }

  async function handlePaymentsHistory() {
    if (!requireCustomer()) return;
    const txns = await get('/api/customer/payment-history');

    document.getElementById('totalSpentDisplay').textContent =
      formatMoney(txns.reduce((sum, payment) => sum + Number(payment.amount), 0));
    document.getElementById('txnEmptySection').classList.toggle('hidden', txns.length !== 0);
    document.getElementById('txnTableSection').classList.toggle('hidden', txns.length === 0);

    const tbody = document.getElementById('paymentHistoryBody');
    tbody.innerHTML = txns.map(t => {
      const hasValidInvoice = Boolean(t.bill_number && t.bill_number.trim() && (t.booking_status === 'confirmed' || t.booking_status === 'completed' || Number(t.amount) > 0));
      const billCode = t.bill_number ? html(t.bill_number) : '';

      const actionHtml = hasValidInvoice ? `
        <div class="flex items-center justify-end gap-2.5">
          <a href="../my_tours/show.html?id=${t.booking_id}"
             class="inline-flex items-center font-mono text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
             title="Xem vé chuyến đi (${html(t.booking_code || '')})">
            ${billCode}
          </a>
          <button type="button"
                  class="btn-download-invoice inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white transition-all text-xs font-bold shadow-sm active:scale-95 cursor-pointer"
                  data-booking-id="${t.booking_id}"
                  data-bill-number="${billCode}"
                  title="Tải hóa đơn điện tử (PDF)">
            <span class="material-symbols-outlined text-sm">download</span>
            <span>Tải hóa đơn</span>
          </button>
        </div>
      ` : `
        <div class="flex items-center justify-end gap-2.5">
          <span class="text-xs text-slate-400 italic font-mono">${billCode || 'Chưa có hóa đơn'}</span>
          <button type="button"
                  disabled
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-medium cursor-not-allowed opacity-60"
                  title="Giao dịch chưa thanh toán hoặc chưa có hóa đơn">
            <span class="material-symbols-outlined text-sm">download</span>
            <span>Tải hóa đơn</span>
          </button>
        </div>
      `;

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="px-6 py-4 font-mono font-bold text-blue-900">${html(t.payment_id)}</td>
          <td class="px-6 py-4 font-medium text-slate-900">${html(t.tour_title || t.booking_code || '—')}</td>
          <td class="px-6 py-4 whitespace-nowrap text-slate-600">${formatDate(t.payment_date)}</td>
          <td class="px-6 py-4 font-bold text-green-700 whitespace-nowrap">${formatMoney(t.amount)}</td>
          <td class="px-6 py-4 text-slate-700">${html(t.payment_method || '—')}</td>
          <td class="px-6 py-4">${renderPaymentBadge(t.booking_status === 'cancelled' ? 'cancelled' : 'paid')}</td>
          <td class="px-6 py-4 text-right">${actionHtml}</td>
        </tr>
      `;
    }).join('');

    initInvoiceDownloadHandlers();
  }

  
  // 13. Tour Theo Tỉnh Thành (client/tours/by_province.html)
  async function handleToursByProvince() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedProvId = urlParams.get('province_id');

    const region = urlParams.get('region');
    const provs = (await loadProvinces()).filter(p => !region || p.region === region);
    const currentProv = provs.find(p => String(p.id) === selectedProvId) || provs[0];

    if (!currentProv) return;

    // Header info
    const headerTitle = document.querySelector('h2.text-3xl');
    if (headerTitle && currentProv) {
      headerTitle.textContent = `Tour Du Lịch ${currentProv.name}`;
    }

    // Add Province Filter Tabs before grid
    const mainContainer = document.querySelector('.max-w-6xl.mx-auto');
    const existingTabs = document.getElementById('provinceFilterTabs');
    if (mainContainer && !existingTabs) {
      const tabsDiv = document.createElement('div');
      tabsDiv.id = 'provinceFilterTabs';
      tabsDiv.className = 'flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar';
      tabsDiv.innerHTML = provs.map(p => `
        <a href="by_province.html?province_id=${p.id}" class="px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${p.id === currentProv.id ? 'bg-blue-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
          ${html(p.name)} (${p.tour_count || 1})
        </a>
      `).join('');
      const grid = document.querySelector('.grid.grid-cols-1');
      if (grid) mainContainer.insertBefore(tabsDiv, grid);
    }

    // Render Tours Grid
    const tours = await listTours("/api/tours/province/" + currentProv.id);
    const gridContainer = document.querySelector('.grid.grid-cols-1');
    if (gridContainer) {
      const displayTours = tours;
      gridContainer.innerHTML = displayTours.map(t => {
        const img = (t.images && t.images[0]) || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';
        return `
          <div class="p-5 rounded-2xl shadow-sm bg-white hover:shadow-xl transition duration-300 border border-slate-100 flex flex-col justify-between">
            <div>
              <div class="mb-4 overflow-hidden rounded-xl h-48">
                <img src="${html(img)}" class="w-full h-full object-cover hover:scale-105 transition duration-500" alt="${html(t.title)}"/>
              </div>
              <h3 class="font-bold text-lg text-blue-900 mb-2 line-clamp-2">${html(t.title)}</h3>
              <p class="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">schedule</span>
                ${t.duration_days} ngày ${t.duration_nights} đêm • Khởi hành từ ${html(t.departure_location)}
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span class="font-black text-primary text-lg">${formatMoney(t.adult_price)}</span>
              <a href="show.html?id=${t.id}" class="px-5 py-2.5 bg-blue-50 text-blue-900 rounded-full font-bold text-xs hover:bg-blue-900 hover:text-white transition">
                Chi tiết
              </a>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 14. Chi Tiết Chuyến Đi (client/departures/show.html)
  async function handleDepartureShow() {
    const urlParams = new URLSearchParams(window.location.search);
    const depId = urlParams.get('id');
    if (!id(depId)) throw new Error('Mã lịch khởi hành không hợp lệ.');
    const dep = departureView(await get('/api/departures/' + depId));
    const tour = dep.tour || await liveTour(dep.tour_id);

    // Title & Tour Name
    const titleP = document.querySelector('p.text-slate-500.text-lg.font-semibold');
    if (titleP) titleP.textContent = tour.title;

    // Dates & ID
    const idEl = document.querySelector('p.font-mono') || document.querySelector('.font-mono');
    if (idEl) idEl.textContent = `#${dep.id}`;

    const dateEls = document.querySelectorAll('p.text-lg.font-semibold.text-blue-900');
    if (dateEls.length >= 2) {
      dateEls[0].textContent = formatDate(dep.start_date);
      dateEls[1].textContent = formatDate(dep.end_date);
    }

    // Pricing
    const priceEls = document.querySelectorAll('p.text-lg.font-semibold.text-green-600');
    if (priceEls.length >= 2) {
      priceEls[0].textContent = formatMoney(dep.adult_price);
      priceEls[1].textContent = formatMoney(dep.child_price);
    }

    // Seats & Guide
    const seatsSpan = document.querySelector('.text-blue-600.font-bold');
    if (seatsSpan) seatsSpan.textContent = dep.max_seats - dep.available_seats;

    const totalSeatsSpan = seatsSpan?.parentElement?.querySelector('span:last-child');
    if (totalSeatsSpan) totalSeatsSpan.textContent = dep.max_seats;

    const guideP = document.querySelectorAll('p.text-lg.font-semibold.text-slate-900')[1];
    if (guideP) guideP.textContent = dep.guide_name || '—';
  }

  document.addEventListener('DOMContentLoaded', initPage);
})();
