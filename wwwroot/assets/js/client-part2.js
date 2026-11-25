// Phần 2: mỗi trang gọi API, backend truy vấn MongoDB rồi trả JSON để render.
(() => {
  const {
    $,
    text,
    escape: esc,
    imageUrl,
    notice,
    failure,
    requireUser,
    bindForm,
    pagination,
    money,
    date,
    request,
  } = window.Part2;
  const params = new URLSearchParams(location.search);
  const path = location.pathname;
  const tourLink = (id) => `/client/tours/show.html?id=${id}`;
  const statusName = (value) =>
    ({
      confirmed: 'Đã xác nhận',
      pending: 'Chờ xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    })[value] || value;
  function tourCard(tour) {
    return `<div class="group bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all border border-slate-100">
      <div class="relative h-56 overflow-hidden"><img src="${imageUrl(tour.thumbnail_url)}" alt="${esc(tour.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
      <span class="absolute bottom-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">${money(tour.min_price)}</span></div>
      <div class="p-5 flex-1 flex flex-col justify-between"><div><p class="text-xs text-secondary font-bold">${esc(tour.province_name)}</p>
      <h3 class="text-lg font-bold text-primary my-2">${esc(tour.title)}</h3><p class="text-xs text-slate-500 mb-4">${tour.duration_days} ngày ${tour.duration_nights} đêm · ${esc(tour.pickup_point)}</p></div>
      <a class="block text-center py-3 rounded-full bg-slate-100 text-primary font-bold text-sm" href="${tourLink(tour.id)}">Xem chi tiết</a></div></div>`;
  }
  async function home() {
    const grid = $('[data-featured-tours]');
    grid.textContent = 'Đang tải tour...';
    const result = await request('/api/tours/featured?limit=4');
    grid.innerHTML = result.data.map(tourCard).join('') || 'Chưa có tour.';
    // Form GET giữ nguyên destination, startDate và pickupPoint khi chuyển trang.
  }
  async function catalog() {
    const provincePage = path.endsWith('/by_province.html');
    const grid = provincePage ? $('#provinceToursGrid') : $('#catalogTourGrid');
    grid.textContent = 'Đang tải tour...';
    const [categories, provinces] = await Promise.all([
      request('/api/categories'),
      request('/api/provinces'),
    ]);
    const form = $('#filter_tour');
    if (form) {
      const province = form.elements.province_id;
      province.innerHTML =
        '<option value="">Tất cả điểm đến</option>' +
        provinces.data
          .map((p) => `<option value="${p.id}">${esc(p.province_name)}</option>`)
          .join('');
      const checked = params.getAll('category_id[]');
      if (params.has('category_id')) checked.push(params.get('category_id'));
      $('#catalogCategoryList').innerHTML = categories.data
        .map(
          (c) =>
            `<label class="flex items-center gap-3 text-sm"><input class="rounded text-primary" type="checkbox" name="category_id[]" value="${c.id}" ${checked.includes(String(c.id)) ? 'checked' : ''}>${esc(c.category_name)} (${c.tours_count ?? 0})</label>`,
        )
        .join('');
      for (const name of [
        'q',
        'province_id',
        'gia_tu',
        'gia_den',
        'so_ngay',
        'region',
        'destination',
        'startDate',
        'pickupPoint',
      ]) {
        const field = form.elements[name];
        if (field && params.has(name)) field.value = params.get(name);
      }
      for (const [name, display, suffix] of [
        ['gia_den', '#display_price', ' đ'],
        ['so_ngay', '#display_days', ' ngày'],
      ]) {
        const field = form.elements[name];
        if (!field) continue;
        const update = () => text(display, Number(field.value).toLocaleString('vi-VN') + suffix);
        field.addEventListener('input', update);
        update();
      }
      const sort = $('select[name="sort"]');
      sort.value = params.get('sort') || 'featured';
      const reset = form.querySelector('a');
      if (reset) reset.href = 'index.html';
      sort.onchange = () => form.requestSubmit();
      bindForm(form, (data) => {
        const next = new URLSearchParams();
        for (const [key, value] of data) if (String(value).trim()) next.append(key, value);
        location.search = next.toString();
      });
    }
    const query = new URLSearchParams(params);
    query.set('pageSize', 6);
    const result = await request('/api/tours?' + query);
    grid.innerHTML =
      result.data.map(tourCard).join('') ||
      '<p class="col-span-full p-8 text-center">Không tìm thấy tour phù hợp.</p>';
    text('#catalogCount', result.total);
    if (provincePage)
      text(
        'h2',
        params.get('region') ||
          provinces.data.find((p) => String(p.id) === params.get('province_id'))?.province_name ||
          'Tour Du Lịch Theo Tỉnh Thành',
      );
    pagination($('#catalogPagination'), result, params, (next) => {
      location.search = next.toString();
    });
  }
  async function detail() {
    const id = params.get('id');
    if (!/^\d+$/.test(id || ''))
      throw new Error('Mã tour không hợp lệ. Vui lòng chọn tour từ danh sách.');
    const { data: tour } = await request('/api/tours/' + id);
    document.title = tour.title + ' | Vietnam Expeditions';
    for (const [selector, value] of Object.entries({
      '#tourDetailTitle': tour.title,
      '#tourDetailCategory': tour.category_name,
      '#tourDetailLocation': tour.province_name,
      '#tourDetailDesc': tour.description,
      '#tourDetailDuration': `${tour.duration_days} ngày ${tour.duration_nights} đêm`,
      '#itineraryDaysCount': `${tour.duration_days} ngày`,
      '#tourDetailPrice': money(tour.min_price),
      '#tourDetailTransport': tour.transport || 'Chưa cập nhật phương tiện',
      '#tourDetailHotel': tour.accommodation || 'Chưa cập nhật lưu trú',
      '#tourDetailLanguage': tour.language || 'Chưa cập nhật ngôn ngữ',
    }))
      text(selector, value);
    const reviews = tour.reviews || [];
    text(
      '#tourDetailRating',
      reviews.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 'Chưa có',
    );
    text('#tourDetailReviewCount', `(${reviews.length} đánh giá)`);
    $('#slider').innerHTML = (tour.images || [])
      .map(
        (img) =>
          `<div class="min-w-full h-full snap-start flex-shrink-0"><img class="w-full h-full object-cover" src="${imageUrl(img.img_url)}" alt="${esc(tour.title)}"></div>`,
      )
      .join('');
    // Mỗi dòng dịch vụ trong document MongoDB được hiển thị thành một mục riêng.
    const serviceItems = (value) =>
      (value || 'Chưa cập nhật dịch vụ')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<li>${esc(line)}</li>`)
        .join('');
    $('#tourDetailInclusions').innerHTML = serviceItems(tour.included_services);
    $('#tourDetailExclusions').innerHTML = serviceItems(tour.excluded_services);
    $('#itineraryContainer').innerHTML =
      (tour.schedules || [])
        .slice()
        .sort((a, b) => a.day_number - b.day_number)
        .map(
          (s) =>
            `<div class="p-5 bg-white rounded-2xl border border-slate-100"><h4 class="font-bold text-primary">Ngày ${s.day_number}: ${esc(s.title.replace(/^(?:\s*Ngày\s+\d+\s*[:：.\-–]\s*)+/iu, ''))}</h4><p class="text-sm mt-2 whitespace-pre-line">${esc(s.activities)}</p></div>`,
        )
        .join('') || 'Chưa cập nhật lịch trình.';
    $('#reviewsContainer').innerHTML =
      reviews
        .map(
          (r) =>
            `<div class="p-6 bg-white rounded-2xl border border-slate-100"><strong>${esc(r.customer_name)}</strong><span class="text-amber-500 ml-3">${'★'.repeat(r.rating)}</span><p class="text-xs text-slate-400">${date(r.created_at)}</p><p class="mt-3 whitespace-pre-line">${esc(r.comment)}</p></div>`,
        )
        .join('') || 'Chưa có đánh giá.';
    $('#btnWriteReviewLink').href = '/client/my_tours/index.html?tab=completed';
    const departures = (tour.departures || []).filter(
      (d) =>
        d.status === 'open' && d.available_seats > 0 && new Date(d.departure_date) > new Date(),
    );
    const select = $('#departureSelect');
    text('#tourDetailStatusBadge', departures.length ? 'Đang mở bán' : 'Chưa có lịch mở bán');
    select.innerHTML =
      departures
        .map(
          (d) =>
            `<option value="${d.id}">${date(d.departure_date)} – ${date(d.return_date)} (${d.available_seats} chỗ)</option>`,
        )
        .join('') || '<option value="">Chưa có lịch khởi hành mở bán</option>';
    const update = () => {
      const dep = departures.find((d) => String(d.id) === select.value);
      $('#btnBookNow').disabled = !dep;
      $('#tourDetailChildPriceWrapper').hidden = !dep;
      if (!dep) return;
      text('#tourDetailPrice', money(dep.adult_price));
      text('#tourDetailChildPrice', money(dep.child_price));
      text('#selectedSeatsBadge', `Còn ${dep.available_seats} chỗ`);
      $('#selectedSeatsBadge').classList.remove('hidden');
      text('#departureGuideName', dep.guide_name || 'Chưa phân công');
      $('#departureGuideInfo').classList.remove('hidden');
    };
    select.onchange = update;
    update();
    bindForm($('#bookingActionForm'), () => {
      location.href = `/client/booking/create.html?tour_id=${tour.id}&departure_id=${select.value}`;
    });
  }
  async function profile() {
    await requireUser('Customer');
    const { data } = await request('/api/customer/profile');
    const user = data.customer;
    const form = $('#profileForm');
    for (const [key, value] of Object.entries({
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      birthday: user.birthday?.slice(0, 10),
    }))
      form.elements[key].value = value || '';
    form.elements.birthday.max = new Date().toISOString().slice(0, 10);
    text('[data-user-fullname]', user.full_name);
    text('#statTotalSpent', money(data.totalSpent));
    text('#statBookingsCount', data.totalBookings);
    text('#statRewardPoints', data.rewardPoints);
    text(
      '#profileMemberTier',
      `${data.memberTier} • ${data.rewardPoints} điểm (${data.totalBookings} chuyến đi)`,
    );
    bindForm(form, async (fd) => {
      const body = Object.fromEntries(fd);
      body.birthday = body.birthday || null;
      await request('/api/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      // Chỉ cập nhật tên hiển thị đã xác nhận; dữ liệu hồ sơ vẫn nằm trong MongoDB.
      for (const storage of [localStorage, sessionStorage])
        if (storage.getItem('bookingtour_user'))
          storage.setItem(
            'bookingtour_user',
            JSON.stringify({
              id: user.id,
              fullName: body.fullName,
              email: body.email,
            }),
          );
      document
        .querySelectorAll('[data-nav-user-name]')
        .forEach((el) => (el.textContent = body.fullName));
      text('[data-user-fullname]', body.fullName);
      text('aside h2', `Chào ${body.fullName}`);
      notice('Cập nhật hồ sơ thành công.');
    });
    bindForm($('#passwordForm'), async (fd) => {
      const body = Object.fromEntries(fd);
      if (body.new_password !== body.new_password_confirmation)
        throw new Error('Mật khẩu xác nhận không khớp.');
      await request('/api/customer/password/update', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      $('#passwordForm').reset();
      notice('Đã đổi mật khẩu.');
    });
  }
  function bookingState(booking) {
    if (booking.status === 'cancelled') return 'cancelled';
    return booking.status === 'confirmed' &&
      booking.return_date &&
      new Date(booking.return_date) < new Date()
      ? 'completed'
      : booking.status;
  }
  async function myTours() {
    await requireUser('Customer');
    const [{ data: bookings }, { data: reviews }] = await Promise.all([
      request('/api/bookings/my-tours'),
      request('/api/reviews/mine'),
    ]);
    let tab = params.get('tab') || 'all';
    let search = params.get('q') || '';
    const counts = {
      all: bookings.length,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const b of bookings)
      counts[
        bookingState(b) === 'completed'
          ? 'completed'
          : bookingState(b) === 'cancelled'
            ? 'cancelled'
            : 'upcoming'
      ]++;
    for (const [key, suffix] of [
      ['all', 'All'],
      ['upcoming', 'Upcoming'],
      ['completed', 'Completed'],
      ['cancelled', 'Cancelled'],
    ])
      text('#tabCount' + suffix, counts[key]);
    text('#statTotalBookings', counts.all);
    text('#statUpcomingBookings', counts.upcoming);
    text('#statCompletedBookings', counts.completed);
    text('#statCancelledBookings', counts.cancelled);
    text('#myToursTotalCountBadge', `${bookings.length} chuyến đi`);
    const render = () => {
      const list = bookings.filter(
        (b) =>
          (tab === 'all' ||
            (tab === 'upcoming'
              ? !['completed', 'cancelled'].includes(bookingState(b))
              : bookingState(b) === tab)) &&
          `${b.tour_title} ${b.booking_code}`.toLowerCase().includes(search.toLowerCase()),
      );
      $('#myToursEmptyState').classList.toggle('hidden', bookings.length > 0);
      $('#myToursNoResultsState').classList.toggle('hidden', !bookings.length || list.length > 0);
      $('#myToursListContainer').classList.remove('hidden');
      $('#myToursListContainer').innerHTML = list
        .map((b) => {
          const review = reviews.find((r) => r.booking_id === b.id);
          const canCancel =
            ['confirmed', 'pending'].includes(b.status) && new Date(b.departure_date) > new Date();
          return `<article class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row mb-5">
            <img class="w-full md:w-56 h-48 object-cover" src="${imageUrl(b.tour_image)}" alt="${esc(b.tour_title)}">
            <div class="p-6 flex-1"><p class="text-xs text-slate-500">${esc(b.booking_code)} · ${esc(statusName(bookingState(b)))}</p>
            <h3 class="font-bold text-primary text-xl my-2">${esc(b.tour_title)}</h3><p>${date(b.departure_date)} – ${date(b.return_date)}</p>
            <p class="font-bold my-3">${money(b.total_amount)}</p><a class="text-primary font-bold mr-5" href="show.html?id=${b.id}">Chi tiết vé</a>
            ${b.can_review ? `<a class="text-amber-700 font-bold" href="review.html?booking_id=${b.id}${review ? '&review_id=' + review.id : ''}">${review ? 'Sửa đánh giá' : 'Đánh giá tour'}</a>` : ''}
            ${canCancel ? `<button type="button" class="text-red-600 font-bold ml-4" data-cancel-booking="${b.id}">Hủy đặt tour</button>` : ''}</div></article>`;
        })
        .join('');
      document.querySelectorAll('[data-cancel-booking]').forEach(
        (button) =>
          (button.onclick = async () => {
            if (
              !confirm('Hủy đặt tour này? Nếu đã thanh toán, vui lòng liên hệ để xử lý hoàn tiền.')
            )
              return;
            button.disabled = true;
            try {
              await request('/api/bookings/' + button.dataset.cancelBooking + '/cancel', {
                method: 'POST',
              });
              location.reload();
            } catch (error) {
              failure(error);
              button.disabled = false;
            }
          }),
      );
      document.querySelectorAll('.my-tours-tab').forEach((el) => {
        const active = el.dataset.filterTab === tab;
        for (const name of ['active', 'bg-primary', 'text-white'])
          el.classList.toggle(name, active);
        el.classList.toggle('text-slate-600', !active);
      });
      $('#myToursClearSearch')?.classList.toggle('hidden', !search);
    };
    $('#myToursSearchInput').value = search;
    $('#myToursSearchInput').oninput = (event) => {
      search = event.target.value;
      render();
    };
    document.querySelectorAll('.my-tours-tab').forEach(
      (el) =>
        (el.onclick = () => {
          tab = el.dataset.filterTab;
          render();
        }),
    );
    for (const selector of ['#myToursClearSearch', '#myToursResetFilterBtn'])
      if ($(selector))
        $(selector).onclick = () => {
          search = '';
          tab = 'all';
          $('#myToursSearchInput').value = '';
          render();
        };
    render();
    await renderMyReviews(reviews);
  }
  async function renderMyReviews(reviews) {
    const section = document.createElement('section');
    section.className = 'my-8 space-y-4';
    section.id = 'myReviewsSection';
    section.innerHTML =
      '<h2 class="text-xl font-bold text-primary">Đánh giá của tôi</h2>' +
      (reviews
        .map(
          (r) =>
            `<article class="bg-white rounded-xl p-5 border border-slate-100"><p class="text-amber-600">${'★'.repeat(r.rating)} · ${date(r.created_at)}</p><p class="my-3 whitespace-pre-line">${esc(r.comment)}</p><a class="text-primary font-bold mr-4" href="review.html?review_id=${r.id}${r.booking_id ? '&booking_id=' + r.booking_id : ''}">Sửa</a><button type="button" class="text-red-600" data-delete-review="${r.id}">Xóa</button><a class="ml-4 text-primary" href="${tourLink(r.tour_id)}">Xem tour</a></article>`,
        )
        .join('') || '<p>Bạn chưa có đánh giá.</p>');
    $('main').append(section);
    section.querySelectorAll('[data-delete-review]').forEach(
      (button) =>
        (button.onclick = async () => {
          if (!(await confirmReviewDelete())) return;
          button.disabled = true;
          try {
            await request('/api/reviews/' + button.dataset.deleteReview, {
              method: 'DELETE',
            });
            location.reload();
          } catch (error) {
            failure(error);
            button.disabled = false;
          }
        }),
    );
  }
  function confirmReviewDelete() {
    const dialog = $('#deleteReviewDialog');
    if (dialog.open) return Promise.resolve(false);
    // Reset trước mỗi lần mở: Escape luôn hủy, kể cả lần trước đã xác nhận.
    dialog.returnValue = 'cancel';
    return new Promise((resolve) => {
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'confirm'), {
        once: true,
      });
      dialog.showModal();
    });
  }
  async function voucher() {
    await requireUser('Customer');
    const { data: b } = await request('/api/bookings/' + params.get('id'));
    const { data: tour } = await request('/api/tours/' + b.tour_id);
    const values = {
      voucherBannerMsg: 'Thông tin vé đặt tour',
      voucherBreadcrumbCode: b.booking_code,
      voucherBookingCode: b.booking_code,
      voucherTourTitle: b.tour_title,
      voucherCategoryTag: tour.category_name,
      voucherStatusTag: statusName(bookingState(b)),
      voucherBookingStatus: statusName(bookingState(b)),
      voucherDepartureLocation: tour.pickup_point,
      voucherDestinationLocation: b.destination,
      voucherDateRange: `${date(b.departure_date)} – ${date(b.return_date)}`,
      voucherDurationText: `${tour.duration_days} ngày ${tour.duration_nights} đêm`,
      voucherPaxSummary: `${b.total_adults} người lớn, ${b.total_children} trẻ em`,
      voucherAdultTickets: `${b.total_adults} vé`,
      voucherChildTickets: `${b.total_children} vé`,
      voucherPaymentMethod: b.payment_method || 'Chưa có',
      voucherPaymentStatus: b.payment_method ? 'Đã ghi nhận thanh toán' : 'Chưa thanh toán',
      voucherTotalAmount: money(b.total_amount),
      voucherInvoiceCode: b.bill_number || 'Chưa có',
      voucherTotalPax: b.total_adults + b.total_children,
    };
    for (const [key, value] of Object.entries(values)) text('#' + key, value);
    $('#voucherTourImage').src = imageUrl(b.tour_image);
    const canReview =
      ['confirmed', 'completed'].includes(b.status) && new Date(b.return_date) < new Date();
    $('#voucherReviewLink').hidden = !canReview;
    $('#voucherReviewLink').href = 'review.html?booking_id=' + b.id;
    $('#voucherPassengersTable').innerHTML = (b.passengers || [])
      .map(
        (p, i) =>
          `<tr><td class="p-3">${i + 1}</td><td>${esc(p.full_name)}</td><td>${p.passenger_type === 'adult' ? 'Người lớn' : 'Trẻ em'}</td><td>${date(p.date_of_birth)}</td><td>${esc(p.id_card || '—')}</td></tr>`,
      )
      .join('');
    $('#voucherEmptyPassengers').classList.toggle('hidden', !!b.passengers?.length);
  }
  async function reviewPage() {
    await requireUser('Customer');
    const { data: reviews } = await request('/api/reviews/mine');
    const existing = reviews.find(
      (r) =>
        String(r.id) === params.get('review_id') ||
        (params.get('booking_id') && String(r.booking_id) === params.get('booking_id')),
    );
    let booking = null;
    if (params.get('booking_id'))
      booking = (await request('/api/bookings/' + params.get('booking_id'))).data;
    if (!booking && !existing)
      throw new Error('Hãy chọn đơn đã hoàn thành trong Chuyến đi của tôi để đánh giá.');
    const tour = (await request('/api/tours/' + (booking?.tour_id || existing.tour_id))).data;
    text('#reviewTourTitle', tour.title);
    text('#reviewTourCategory', tour.category_name);
    text('#reviewTourDest', tour.province_name);
    text('#reviewTourDestination', tour.province_name);
    text('#reviewBookingCode', booking?.booking_code || 'Đánh giá đã lưu');
    text('#reviewTourDeparture', date(booking?.departure_date));
    $('#reviewTourImage').src = imageUrl(tour.thumbnail_url);
    const form = $('#reviewForm');
    let rating = existing?.rating || 5;
    const stars = [...$('#star-container').children];
    const paint = () => {
      $('#rating_input').value = rating;
      text('#rating_label', rating + '/5 sao');
      stars.forEach((el, i) => {
        el.textContent = i < rating ? 'star' : 'star_border';
      });
    };
    stars.forEach((el, i) => {
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.onclick = () => {
        rating = i + 1;
        paint();
      };
      el.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          rating = i + 1;
          paint();
        }
      };
    });
    paint();
    form.elements.feedback.value = existing?.comment || '';
    text('#btnSubmitReview', existing ? 'Lưu thay đổi' : 'Gửi đánh giá');
    bindForm(form, async (fd) => {
      const endpoint = existing
        ? '/api/reviews/' + existing.id
        : '/api/bookings/' + booking.id + '/review';
      await request(endpoint, {
        method: existing ? 'PUT' : 'POST',
        body: JSON.stringify({ rating, comment: fd.get('feedback') }),
      });
      location.href = 'index.html?tab=completed';
    });
  }
  async function start() {
    const buttons = [...document.querySelectorAll('form [type="submit"]')];
    buttons.forEach((button) => (button.disabled = true));
    notice('Đang tải dữ liệu...');
    if (path.endsWith('/home.html')) await home();
    else if (path.endsWith('/tours/index.html') || path.endsWith('/tours/by_province.html'))
      await catalog();
    else if (path.endsWith('/tours/show.html')) await detail();
    else if (path.endsWith('/profile/show.html')) await profile();
    else if (path.endsWith('/my_tours/index.html')) await myTours();
    else if (path.endsWith('/my_tours/show.html')) await voucher();
    else if (path.endsWith('/my_tours/review.html')) await reviewPage();
    notice('');
    buttons.forEach((button) => (button.disabled = false));
    // Riêng đặt tour vẫn khóa nếu không có chuyến còn mở bán.
    if ($('#btnBookNow')) $('#btnBookNow').disabled = !$('#departureSelect').value;
  }
  start().catch(failure);
})();
