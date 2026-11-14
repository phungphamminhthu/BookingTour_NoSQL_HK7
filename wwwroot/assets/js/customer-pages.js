/**
 * Customer Pages Controller
 * Vietnam Expeditions Client Portal
 * Powered by centralized Relational Mock Database (BookingTourDB)
 * Delivers 100% complete interactive user experience:
 * Home, Tours Catalog, Tour Details, Booking Wizard, Payment/Invoice,
 * My Bookings, Ticket Voucher, Reviews, Profile, Points, and Transactions History.
 */
(() => {
  const db = window.BookingTourDB;
  if (!db) {
    console.error('BookingTourDB is required for customer-pages.js');
    return;
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
      handleHomePage();
    } else if (path.includes('/tours/index.html')) {
      handleToursCatalog();
    } else if (path.includes('/tours/show.html')) {
      handleTourDetail();
    } else if (path.includes('/tours/by_province.html')) {
      handleToursByProvince();
    } else if (path.includes('/departures/show.html')) {
      handleDepartureShow();
    } else if (path.includes('/booking/create.html')) {
      handleBookingCreate();
    } else if (path.includes('/booking/passengers.html')) {
      handleBookingPassengers();
    } else if (path.includes('/payments/invoice.html')) {
      handlePaymentInvoice();
    } else if (path.includes('/my_tours/index.html') || path.endsWith('/my_tours/') || path.endsWith('/my_tours')) {
      handleMyToursIndex();
    } else if (path.includes('/my_tours/show.html')) {
      handleMyTourVoucher();
    } else if (path.includes('/my_tours/review.html')) {
      handleMyTourReview();
    } else if (path.includes('/profile/show.html')) {
      handleProfileShow();
    } else if (path.includes('/reward_point.html')) {
      handleRewardPoint();
    } else if (path.includes('/payments/history.html')) {
      handlePaymentsHistory();
    }
  }

  // 1. Trang Chủ (client/home.html)
  function handleHomePage() {
    // Populate Categories Carousel / Grid
    const catContainer = document.querySelector('[data-categories-container]') || document.querySelector('.categories-grid');
    if (catContainer) {
      const cats = db.getCategories();
      catContainer.innerHTML = cats.map(c => `
        <a href="tours/index.html?category_id=${c.id}" class="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-end p-5 h-64 bg-slate-900">
          <img src="${c.image}" alt="${c.name}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-80"/>
          <div class="relative z-10 text-white">
            <span class="material-symbols-outlined text-2xl text-amber-400 mb-1">${c.icon || 'explore'}</span>
            <h3 class="font-bold text-lg leading-tight">${c.name}</h3>
            <p class="text-xs text-slate-200 mt-1 line-clamp-2">${c.description}</p>
            <span class="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">${c.tour_count} chuyến đi</span>
          </div>
        </a>
      `).join('');
    }

    // Populate Search Form Destination Dropdown
    const destSelect = document.querySelector('select[name="province_id"]') || document.querySelector('select[name="destination"]');
    if (destSelect) {
      const provs = db.getProvinces();
      destSelect.innerHTML = '<option value="">-- Tất cả điểm đến --</option>' +
        provs.map(p => `<option value="${p.id}">${p.name} (${p.region})</option>`).join('');
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
  function handleToursCatalog() {
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
      const provs = db.getProvinces();
      provSelect.innerHTML = '<option value="">-- Tất cả điểm đến --</option>' +
        provs.map(p => `<option value="${p.id}" ${p.id === provParam ? 'selected' : ''}>${p.name}</option>`).join('');
    }

    // Category checkboxes
    const catContainer = document.querySelector('.space-y-3');
    if (catContainer) {
      const cats = db.getCategories();
      catContainer.innerHTML = cats.map(c => `
        <label class="flex items-center space-x-3 cursor-pointer group">
          <input class="rounded text-primary focus:ring-primary border-outline-variant w-4 h-4 cursor-pointer"
                 type="checkbox"
                 name="category_id[]"
                 value="${c.id}"
                 ${catParam.includes(c.id) ? 'checked' : ''} />
          <span class="text-sm font-medium text-slate-700 group-hover:text-primary">
            ${c.name} (${c.tour_count})
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
    const filteredTours = db.getTours({
      search: searchVal,
      category_id: catParam.length > 0 ? catParam : undefined,
      province_id: provParam,
      region: regionParam,
      max_price: maxPriceParam ? Number(maxPriceParam) : undefined,
      max_days: maxDaysParam ? Number(maxDaysParam) : undefined,
      sort: sortParam
    });

    // Update count text
    const countEl = document.querySelector('section p strong');
    if (countEl) countEl.innerText = filteredTours.length;

    // Pagination slice
    const totalPages = Math.max(1, Math.ceil(filteredTours.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedTours = filteredTours.slice(startIndex, startIndex + pageSize);

    // Render Tour Grid
    const gridContainer = document.querySelector('.grid.grid-cols-1.lg\:grid-cols-2');
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
                <img src="${img}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${t.title}" />
                <div class="absolute bottom-4 right-4 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                  <span>${price}</span>
                </div>
                <div class="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase shadow-sm">
                  ${tag}
                </div>
              </div>
              <div class="p-6 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <div class="flex items-center text-secondary mb-2">
                    <span class="material-symbols-outlined text-sm">location_on</span>
                    <span class="text-xs font-bold uppercase ml-1 tracking-wider">${provName}</span>
                  </div>
                  <h3 class="text-xl font-bold font-headline text-primary mb-3 line-clamp-2 hover:text-blue-700 transition">
                    ${t.title}
                  </h3>
                  <div class="flex items-center space-x-3 text-slate-500 text-xs mb-4">
                    <span class="flex items-center">
                      <span class="material-symbols-outlined text-xs mr-1">schedule</span>
                      ${duration}
                    </span>
                    <span class="flex items-center">
                      <span class="material-symbols-outlined text-xs mr-1">pin_drop</span>
                      Khởi hành từ ${t.departure_location}
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
  function handleTourDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('id') || 'tour_1';
    const tour = db.getTourById(tourId) || db.getTourById('tour_1');

    if (!tour) return;

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
          <img class="w-full h-full object-cover" src="${img}" alt="${tour.title} - Ảnh ${idx + 1}" onerror="this.src='https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg'"/>
          <div class="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2">
            <span>${tour.title}</span>
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
          <span>${inc}</span>
        </li>
      `).join('');
    }

    const excList = document.getElementById('tourDetailExclusions') || document.querySelector('ul.space-y-3.exclusions');
    if (excList && Array.isArray(tour.exclusions)) {
      excList.innerHTML = tour.exclusions.map(exc => `
        <li class="flex items-start gap-3 text-sm text-slate-600">
          <span class="material-symbols-outlined text-slate-400 text-base shrink-0 mt-0.5">cancel</span>
          <span>${exc}</span>
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
                <h4 class="font-bold text-primary text-base">Ngày ${it.day}: ${it.title}</h4>
                <span class="text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">Chi tiết ngày ${it.day}</span>
              </div>
              <p class="text-on-surface-variant text-sm leading-relaxed">${it.content}</p>
            </div>
          </div>
        `).join('')}
      `;
    }

    // 8. Reviews Section
    const reviewBtn = document.getElementById('btnWriteReviewLink');
    if (reviewBtn) {
      reviewBtn.href = `../my_tours/review.html?tour_id=${tour.id}`;
    }

    const reviewsContainer = document.getElementById('reviewsContainer') || document.getElementById('reviewsList') || document.querySelector('.reviews-container');
    if (reviewsContainer) {
      if (reviews.length === 0) {
        reviewsContainer.innerHTML = `
          <div class="bg-white p-8 rounded-2xl border border-slate-100 text-center py-10 shadow-sm">
            <span class="material-symbols-outlined text-5xl text-slate-300 mb-2">rate_review</span>
            <p class="text-base font-bold text-slate-700">Chưa có đánh giá nào cho chuyến đi này.</p>
            <p class="text-xs text-slate-400 mt-1">Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận thực tế của bạn!</p>
            <a href="../my_tours/review.html?tour_id=${tour.id}" class="inline-block mt-4 px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-blue-800 transition shadow-sm">
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
                  <img src="${avatar}" alt="${r.customer_name}" class="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-sm"/>
                  <div>
                    <h4 class="font-bold text-sm text-primary">${r.customer_name}</h4>
                    <p class="text-[11px] text-slate-400">${formatDate(r.created_at)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span class="text-amber-500 text-xs tracking-wider">${stars}</span>
                  <span class="text-xs font-bold text-amber-700 ml-1">${r.rating}.0</span>
                </div>
              </div>
              <p class="text-slate-700 text-sm leading-relaxed">${r.comment}</p>
            </div>
          `;
        }).join('');
      }
    }

    // 9. Sticky Booking Widget on Sidebar
    const allDepartures = tour.departures || db.getDepartures({ tour_id: tour.id }) || [];
    // Chỉ lấy lịch hợp lệ: status open và còn chỗ trống
    const validDepartures = allDepartures.filter(d => d.status === 'open' && Number(d.available_seats) > 0);

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
          <option value="${d.id}" data-adult-price="${d.adult_price}" data-child-price="${d.child_price}" data-seats="${d.available_seats}" data-guide="${d.guide_name || ''}">
            Khởi hành: ${formatDate(d.start_date)} - Về: ${formatDate(d.end_date)} (Còn ${d.available_seats} chỗ)
          </option>
        `).join('');

        // Hàm cập nhật widget theo lịch được chọn
        const updateWidgetForSelectedDep = () => {
          const selectedDepId = depSelect.value;
          const selectedDep = validDepartures.find(d => d.id === selectedDepId) || validDepartures[0];
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

        const chosenDep = db.getDepartureById(selectedDepId);
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
  function handleBookingCreate() {
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tour_id') || 'tour_1';
    const depId = urlParams.get('departure_id') || 'dep_1';

    const tour = db.getTourById(tourId) || db.getTourById('tour_1');
    const dep = db.getDepartureById(depId) || tour.departures?.[0] || db.getDepartures()[0];

    // Summary Card Details
    const tourImg = document.querySelector('.rounded-xl.overflow-hidden img');
    if (tourImg && tour.images?.[0]) tourImg.src = tour.images[0];

    const tourTag = document.querySelector('.rounded-xl.overflow-hidden span');
    if (tourTag) tourTag.textContent = tour.category?.name || 'Tour nổi bật';

    const tourTitleEl = document.querySelector('h3.font-headline');
    if (tourTitleEl) tourTitleEl.textContent = tour.title;

    // Departure Location & Dates
    const summaryLocEl = document.querySelector('.material-symbols-outlined.text-xs.text-primary + span');
    if (summaryLocEl) summaryLocEl.innerHTML = `Khởi hành: <strong>${tour.departure_location}</strong>`;

    const summaryDateEl = document.querySelector('.material-symbols-outlined.text-xs:not(.text-primary) + span');
    if (summaryDateEl) {
      summaryDateEl.innerHTML = `Ngày đi: <strong>${formatDate(dep.start_date)} (${tour.duration_days} ngày ${tour.duration_nights} đêm)</strong>`;
    }

    // Adult & Child Pricing
    const adultPrice = Number(dep.adult_price || tour.adult_price);
    const childPrice = Number(dep.child_price || tour.child_price);

    const adultPriceLabel = document.querySelectorAll('.flex.justify-between.items-center p.text-xs.font-bold.text-primary')[0];
    if (adultPriceLabel) adultPriceLabel.textContent = `${formatMoney(adultPrice)}/vé`;

    const childPriceLabel = document.querySelectorAll('.flex.justify-between.items-center p.text-xs.font-bold.text-primary')[1];
    if (childPriceLabel) childPriceLabel.textContent = `${formatMoney(childPrice)}/vé`;

    // Quantity inputs & summary
    const adultsInput = document.getElementById('total_adults');
    const childrenInput = document.getElementById('total_children');
    if (adultsInput && !adultsInput.value) adultsInput.value = '2';
    if (childrenInput && !childrenInput.value) childrenInput.value = '0';

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
        input.value = val;
        recalculate();
      };
    });

    // Contact info pre-fill
    const user = getActiveCustomer();
    const nameInput = document.querySelector('input[name="userFullName"]');
    const phoneInput = document.querySelector('input[name="userPhone"]');
    const emailInput = document.querySelector('input[name="userEmail"]');
    if (nameInput) nameInput.value = user.full_name || 'Nguyễn Văn An';
    if (phoneInput) phoneInput.value = user.phone || '0901234001';
    if (emailInput) emailInput.value = user.email || 'an.nguyen@gmail.com';

    // Submit passes parameters to passengers.html
    const form = document.getElementById('bookingForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const aCount = adultsInput.value;
        const cCount = childrenInput.value;
        const contactName = nameInput.value;
        const contactPhone = phoneInput.value;
        const contactEmail = emailInput.value;

        const nextUrl = `passengers.html?tour_id=${tour.id}&departure_id=${dep.id}&adults=${aCount}&children=${cCount}&name=${encodeURIComponent(contactName)}&phone=${encodeURIComponent(contactPhone)}&email=${encodeURIComponent(contactEmail)}`;
        window.location.href = nextUrl;
      });
    }
  }

  // 5. Thông Tin Hành Khách (client/booking/passengers.html)
  function handleBookingPassengers() {
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tour_id') || 'tour_1';
    const depId = urlParams.get('departure_id') || 'dep_1';
    const adultsCount = parseInt(urlParams.get('adults') || '2', 10);
    const childrenCount = parseInt(urlParams.get('children') || '0', 10);
    const contactName = urlParams.get('name') || 'Nguyễn Văn An';
    const contactPhone = urlParams.get('phone') || '0901234001';
    const contactEmail = urlParams.get('email') || 'an.nguyen@gmail.com';

    const container = document.querySelector('.lg\:col-span-8.space-y-6');
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
                <input type="text" name="passenger_adult_name_${i}" value="${i === 1 ? contactName : ''}" placeholder="Nhập họ và tên như trên CCCD" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant px-1">Ngày sinh *</label>
                <input type="date" name="passenger_adult_dob_${i}" value="1992-06-15" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
              </div>
              <div class="space-y-1.5 md:col-span-2">
                <label class="text-xs font-bold text-on-surface-variant px-1">Số CMND/CCCD/Hộ chiếu *</label>
                <input type="text" name="passenger_adult_id_${i}" value="00109001234${i}" placeholder="Ví dụ: 001090012345" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
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
                <label class="text-xs font-bold text-on-surface-variant px-1">Ngày sinh (2-11 tuổi) *</label>
                <input type="date" name="passenger_child_dob_${c}" value="2018-05-10" class="w-full bg-surface-container-low border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-secondary transition-all" required/>
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
    }

    // Submit handler forward to invoice.html
    const form = document.querySelector('form');
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

        // Save passengers draft in sessionStorage
        sessionStorage.setItem('booking_passengers_draft', JSON.stringify(passList));

        const nextUrl = `../payments/invoice.html?tour_id=${tourId}&departure_id=${depId}&adults=${adultsCount}&children=${childrenCount}&name=${encodeURIComponent(contactName)}&phone=${encodeURIComponent(contactPhone)}&email=${encodeURIComponent(contactEmail)}`;
        window.location.href = nextUrl;
      });
    }
  }

  // 6. Thanh Toán & Hóa Đơn (client/payments/invoice.html)
  function handlePaymentInvoice() {
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tour_id') || 'tour_1';
    const depId = urlParams.get('departure_id') || 'dep_1';
    const adultsCount = parseInt(urlParams.get('adults') || '2', 10);
    const childrenCount = parseInt(urlParams.get('children') || '0', 10);
    const contactName = urlParams.get('name') || 'Nguyễn Văn An';
    const contactPhone = urlParams.get('phone') || '0901234001';
    const contactEmail = urlParams.get('email') || 'an.nguyen@gmail.com';

    const tour = db.getTourById(tourId) || db.getTourById('tour_1');
    const dep = db.getDepartureById(depId) || tour.departures?.[0] || db.getDepartures()[0];

    const adultPrice = Number(dep.adult_price || tour.adult_price);
    const childPrice = Number(dep.child_price || tour.child_price);
    const grandTotal = (adultsCount * adultPrice) + (childrenCount * childPrice);

    // Update order summary card
    const tourTitleEl = document.querySelector('aside h3.font-headline') || document.querySelector('aside h3');
    if (tourTitleEl) tourTitleEl.textContent = tour.title;

    const asideSpans = document.querySelectorAll('aside .text-xs span.font-semibold');
    if (asideSpans.length >= 2) {
      asideSpans[0].textContent = formatDate(dep.start_date);
      asideSpans[1].textContent = formatDate(dep.end_date);
    }

    const paxSummaryEl = document.querySelector('aside p.text-xs.text-slate-500');
    if (paxSummaryEl) paxSummaryEl.textContent = `${adultsCount} người lớn${childrenCount > 0 ? `, ${childrenCount} trẻ em` : ''}`;

    const totalEl = document.querySelector('aside .text-2xl.font-black.text-secondary');
    if (totalEl) totalEl.textContent = formatMoney(grandTotal);

    // Payment Form Handler
    const form = document.getElementById('checkoutForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Đang ghi nhận giao dịch...';
        }

        // Retrieve passengers from draft or generate
        let passengers = [];
        try {
          const raw = sessionStorage.getItem('booking_passengers_draft');
          if (raw) passengers = JSON.parse(raw);
        } catch (_) {}

        if (passengers.length === 0) {
          passengers.push({
            name: contactName,
            type: 'adult',
            id_card: '001090012345'
          });
        }

        const user = getActiveCustomer();

        // Call BookingTourDB.createBooking
        const newBooking = db.createBooking({
          customer_id: user.id || 'cust_1',
          customer_name: contactName,
          customer_email: contactEmail,
          customer_phone: contactPhone,
          tour_id: tour.id,
          tour_title: tour.title,
          tour_image: tour.images?.[0],
          departure_id: dep.id,
          departure_date: dep.start_date,
          return_date: dep.end_date,
          adults_count: adultsCount,
          children_count: childrenCount,
          total_amount: grandTotal,
          payment_method: 'VNPAY',
          passengers
        });

        sessionStorage.removeItem('booking_passengers_draft');

        alert(`Đặt tour thành công! Mã đặt vé của bạn là: ${newBooking.booking_code}`);
        window.location.href = `../my_tours/show.html?id=${newBooking.id}`;
      });
    }
  }

  // 7. Chuyến Đi Của Tôi (client/my_tours/index.html)
  function handleMyToursIndex() {
    // Check authentication protection
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bookingtour_logged_out') === 'true') {
      window.location.replace('/client/auth/login.html');
      return;
    }

    const user = getActiveCustomer();
    if (!user) {
      window.location.replace('/client/auth/login.html');
      return;
    }

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
      // 1. Fetch live bookings strictly for this customer
      const allBookings = user.id ? db.getBookings({ customer_id: user.id }) : [];

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
            // Relate with Tour database
            const tour = db.getTourById(b.tour_id);
            const tourTitle = b.tour_title || tour?.title || 'Tour Du Lịch Trải Nghiệm Tuyển Chọn';
            const tourImage = b.tour_image || tour?.images?.[0] || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';

            const statusBadge = renderStatusBadge(b.booking_status);
            const paymentBadge = renderPaymentBadge(b.payment_status);
            const paxText = `${b.adults_count || 1} người lớn${b.children_count > 0 ? `, ${b.children_count} trẻ em` : ''}`;
            const isCancelled = b.booking_status === 'cancelled' || b.booking_status === 'canceled';
            const isCompleted = b.booking_status === 'completed';
            const isUpcoming = b.booking_status === 'confirmed' || b.booking_status === 'pending';

            return `
              <article class="my-tour-card bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between group">
                <!-- Left: Tour Image & Information -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto flex-1 min-w-0">
                  <div class="relative w-full sm:w-44 h-44 sm:h-32 rounded-2xl overflow-hidden shrink-0 shadow-xs border border-slate-100 bg-slate-100">
                    <img src="${tourImage}" alt="${tourTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.src='https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg'"/>
                    <span class="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold rounded-md">#${b.booking_code}</span>
                  </div>

                  <div class="space-y-2 flex-1 min-w-0 w-full">
                    <div class="flex flex-wrap items-center gap-2">
                      ${statusBadge}
                      ${paymentBadge}
                      ${isUpcoming ? '<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-subtle"></span>Sắp khởi hành</span>' : ''}
                    </div>

                    <h3 class="font-bold text-base md:text-lg text-primary line-clamp-1 group-hover:text-secondary transition font-headline">
                      <a href="../my_tours/show.html?id=${b.id}">${tourTitle}</a>
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
                    ${!isCancelled && !isCompleted ? `
                      <button type="button" class="btn-cancel-booking px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-full font-bold text-xs transition border border-rose-200 active:scale-95" data-id="${b.id}" data-code="${b.booking_code}">
                        Hủy tour
                      </button>
                    ` : ''}
                  </div>
                </div>
              </article>
            `;
          }).join('');

          // Wire cancel booking actions
          listContainer.querySelectorAll('.btn-cancel-booking').forEach(btn => {
            btn.onclick = () => {
              const bId = btn.getAttribute('data-id');
              const bCode = btn.getAttribute('data-code') || bId;
              if (confirm(`Bạn có chắc chắn muốn hủy đơn đặt tour #${bCode}?\nGhế sẽ được hoàn trả vào hệ thống.`)) {
                db.cancelBooking(bId, 'Khách hàng tự hủy trên giao diện');
                alert(`Đã hủy đặt tour #${bCode} thành công!`);
                refresh();
              }
            };
          });
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
  function handleMyTourVoucher() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id') || 'bk_1';
    const booking = db.getBookingById(bookingId) || db.getBookings()[0];

    if (!booking) return;

    const codeEls = document.querySelectorAll('[data-booking-code]');
    codeEls.forEach(el => el.textContent = booking.booking_code);

    const titleEl = document.querySelector('[data-booking-tour]');
    if (titleEl) titleEl.textContent = booking.tour_title;

    const dateEl = document.querySelector('[data-booking-date]');
    if (dateEl) dateEl.textContent = `${formatDate(booking.departure_date)} – ${formatDate(booking.return_date)}`;

    const totalEl = document.querySelector('[data-booking-total]');
    if (totalEl) totalEl.textContent = formatMoney(booking.total_amount);

    const statusEl = document.querySelector('[data-booking-status]');
    if (statusEl) statusEl.innerHTML = renderStatusBadge(booking.booking_status);
  }

  // 9. Đánh Giá Chuyến Đi (client/my_tours/review.html)
  function handleMyTourReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tour_id') || 'tour_1';
    const tour = db.getTourById(tourId);

    const titleEl = document.querySelector('h2.font-headline') || document.querySelector('[data-tour-title]');
    if (titleEl && tour) titleEl.textContent = `Đánh giá: ${tour.title}`;

    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = form.querySelector('input[name="rating"]:checked')?.value || 5;
        const comment = form.querySelector('textarea')?.value || 'Chuyến đi rất tuyệt vời!';
        const user = getActiveCustomer();

        db.addReview({
          tour_id: tourId,
          customer_name: user.full_name || 'Khách hàng',
          rating: Number(rating),
          comment
        });

        alert('Cảm ơn quý khách đã gửi đánh giá trải nghiệm!');
        window.location.href = `../tours/show.html?id=${tourId}`;
      });
    }
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
  function handlePaymentsHistory() {
    const user = getActiveCustomer();
    const txns = user?.id ? db.getTransactions({ customer_id: user.id }) : [];

    const tbody = document.querySelector('table tbody');
    if (tbody) {
      if (txns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-slate-400">Quý khách chưa có giao dịch thanh toán nào.</td></tr>';
      } else {
        tbody.innerHTML = txns.map(t => `
          <tr class="hover:bg-slate-50 transition">
            <td class="px-6 py-4 font-mono font-bold text-blue-900">${t.transaction_code}</td>
            <td class="px-4 py-4 font-mono text-slate-600 text-xs">${t.booking_code}</td>
            <td class="px-4 py-4 font-bold text-green-700 whitespace-nowrap">${formatMoney(t.amount)}</td>
            <td class="px-4 py-4"><span class="px-2.5 py-1 bg-slate-100 rounded-full font-bold text-xs">${t.payment_method}</span></td>
            <td class="px-4 py-4 text-slate-500 text-sm whitespace-nowrap">${formatDate(t.created_at)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${renderStatusBadge(t.status)}</td>
          </tr>
        `).join('');
      }
    }
  }

  
  // 13. Tour Theo Tỉnh Thành (client/tours/by_province.html)
  function handleToursByProvince() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedProvId = urlParams.get('province_id') || 'prov_1';

    const provs = db.getProvinces();
    const currentProv = provs.find(p => p.id === selectedProvId) || provs[0];

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
          ${p.name} (${p.tour_count || 1})
        </a>
      `).join('');
      const grid = document.querySelector('.grid.grid-cols-1');
      if (grid) mainContainer.insertBefore(tabsDiv, grid);
    }

    // Render Tours Grid
    const tours = db.getTours({ province_id: currentProv.id });
    const gridContainer = document.querySelector('.grid.grid-cols-1');
    if (gridContainer) {
      const displayTours = tours.length > 0 ? tours : db.getTours().slice(0, 6);
      gridContainer.innerHTML = displayTours.map(t => {
        const img = (t.images && t.images[0]) || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg';
        return `
          <div class="p-5 rounded-2xl shadow-sm bg-white hover:shadow-xl transition duration-300 border border-slate-100 flex flex-col justify-between">
            <div>
              <div class="mb-4 overflow-hidden rounded-xl h-48">
                <img src="${img}" class="w-full h-full object-cover hover:scale-105 transition duration-500" alt="${t.title}"/>
              </div>
              <h3 class="font-bold text-lg text-blue-900 mb-2 line-clamp-2">${t.title}</h3>
              <p class="text-xs text-slate-500 mb-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">schedule</span>
                ${t.duration_days} ngày ${t.duration_nights} đêm • Khởi hành từ ${t.departure_location}
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
  function handleDepartureShow() {
    const urlParams = new URLSearchParams(window.location.search);
    const depId = urlParams.get('id') || 'dep_1';
    const dep = db.getDepartureById(depId) || db.getDepartures()[0];
    if (!dep) return;

    const tour = dep.tour || db.getTourById(dep.tour_id) || db.getTours()[0];

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
    if (seatsSpan) seatsSpan.textContent = dep.total_seats - dep.available_seats;

    const totalSeatsSpan = seatsSpan?.parentElement?.querySelector('span:last-child');
    if (totalSeatsSpan) totalSeatsSpan.textContent = dep.total_seats;

    const guideP = document.querySelectorAll('p.text-lg.font-semibold.text-slate-900')[1];
    if (guideP) guideP.textContent = dep.guide_name || 'Nguyễn Hoàng Nam (HDV)';
  }

  document.addEventListener('DOMContentLoaded', initPage);
})();
