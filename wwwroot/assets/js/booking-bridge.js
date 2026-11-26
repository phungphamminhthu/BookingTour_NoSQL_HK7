// Cầu nối cần thiết: chi tiết tour Phần 2 chuyển ID thật sang các bước đặt tour sẵn có.
// sessionStorage chỉ giữ bản nháp chưa gửi; booking cuối cùng do API lưu vào MongoDB.
(() => {
  const {
    $,
    text,
    escape: esc,
    imageUrl,
    money,
    date,
    requireUser,
    request,
    bindForm,
    notice,
    failure,
  } = window.Part2;
  const params = new URLSearchParams(location.search);
  const draftKey = 'bookingtour_api_booking_draft';
  const inputClass = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm';

  // Đọc mã chuyến từ URL, kiểm tra tài khoản và nạp tour/chuyến cho bước đặt tương ứng.
  async function start() {
    const user = await requireUser('Customer');
    if (!user) return;
    const id = params.get('departure_id');
    if (!/^\d+$/.test(id || '')) throw new Error('Vui lòng chọn lịch khởi hành từ trang chi tiết tour.');
    const { data: dep } = await request('/api/departures/' + id);
    const { data: tour } = await request('/api/tours/' + dep.tour_id);
    if (dep.status !== 'open' || new Date(dep.departure_date) <= new Date())
      throw new Error('Chuyến đi đã khởi hành hoặc không mở bán.');

    // Cập nhật sẵn liên kết quay lại nếu có trên giao diện
    const backBtnPassengers = $('#checkoutBackLink') || $('#btnBackToPassengers') || $('[data-back-to-passengers]');
    if (backBtnPassengers) {
      backBtnPassengers.href = `/client/booking/passengers.html?departure_id=${dep.id}`;
    }

    if (location.pathname.endsWith('/create.html')) create(user, tour, dep);
    else {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (!draft || draft.departure_id !== Number(id)) {
        if (location.pathname.endsWith('/invoice.html')) {
          const backBtn = $('#checkoutBackLink') || $('#btnBackToPassengers') || $('[data-back-to-passengers]');
          if (backBtn) {
            backBtn.href = `/client/booking/create.html?departure_id=${dep.id}`;
            backBtn.innerHTML = '<span class="material-symbols-outlined text-sm">arrow_back</span> Bắt đầu lại: Chọn chuyến đi';
          }
          const submitBtn = $('#submit-btn');
          if (submitBtn) submitBtn.disabled = true;
          notice('Không tìm thấy thông tin đặt tour hoặc phiên làm việc đã kết thúc. Vui lòng bắt đầu lại từ bước chọn chuyến đi.', true);
          return;
        }
        if (location.pathname.endsWith('/passengers.html')) {
          notice('Không tìm thấy thông tin đặt tour. Đang chuyển về bước chọn chuyến đi...', true);
          setTimeout(() => {
            location.href = `/client/booking/create.html?departure_id=${dep.id}`;
          }, 1500);
          return;
        }
        throw new Error('Không tìm thấy bản nháp. Vui lòng nhập lại thông tin đặt tour.');
      }
      if (location.pathname.endsWith('/passengers.html')) passengers(tour, dep, draft);
      else invoice(tour, dep, draft);
    }
  }

  // Nhập số vé/liên hệ, tính giá hiển thị và nhờ API kiểm tra bản nháp.
  function create(user, tour, dep) {
    const form = $('#bookingForm');
    const existingDraft = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
    const draftForDep = existingDraft && existingDraft.departure_id === dep.id ? existingDraft : null;

    text('#summaryTourTitle', tour.title);
    text('#summaryTourTag', tour.category_name);
    text('#summaryDepartureLoc', tour.pickup_point);
    text('#summaryDepartureDate', date(dep.departure_date));
    const summaryImg = $('.rounded-xl.overflow-hidden img');
    if (summaryImg) summaryImg.src = imageUrl(tour.thumbnail_url);

    form.elements.userFullName.value = draftForDep?.userFullName || user.fullName;
    form.elements.userPhone.value = draftForDep?.userPhone ?? user.phone ?? '';
    form.elements.userEmail.value = draftForDep?.userEmail || user.email;

    if (draftForDep) {
      if (form.elements.total_adults) form.elements.total_adults.value = draftForDep.total_adults ?? 2;
      if (form.elements.total_children) form.elements.total_children.value = draftForDep.total_children ?? 0;
    }

    text('#display_adult_price', money(dep.adult_price) + '/vé');
    text('#display_child_price', money(dep.child_price) + '/vé');
    const update = () => {
      const adults = Number(form.elements.total_adults.value),
        children = Number(form.elements.total_children.value);
      text('#display_adults', adults);
      text('#display_children', children);
      text('#summary_adults', adults);
      text('#summary_children', children);
      text('#summary_adult_amount', money(adults * dep.adult_price));
      text('#summary_child_amount', money(children * dep.child_price));
      // Giá giao diện = người lớn × đơn giá lớn + trẻ em × đơn giá trẻ; backend vẫn tính lại khi lưu đơn.
      text('#summary_total', money(adults * dep.adult_price + children * dep.child_price));
    };
    document.querySelectorAll('.quantity-btn').forEach(
      (button) =>
        (button.onclick = () => {
          const input = $('#' + button.dataset.target);
          input.value = Math.max(
            input.id === 'total_adults' ? 1 : 0,
            Math.min(20, Number(input.value) + Number(button.dataset.change)),
          );
          update();
        }),
    );
    form.elements.total_adults.oninput = update;
    form.elements.total_children.oninput = update;
    update();
    bindForm(form, async (fd) => {
      const draft = {
        departure_id: dep.id,
        total_adults: Number(fd.get('total_adults')),
        total_children: Number(fd.get('total_children')),
        userFullName: fd.get('userFullName'),
        userPhone: fd.get('userPhone'),
        userEmail: fd.get('userEmail'),
      };
      if (
        draftForDep &&
        draftForDep.passengers &&
        draftForDep.total_adults === draft.total_adults &&
        draftForDep.total_children === draft.total_children
      ) {
        draft.passengers = draftForDep.passengers;
      }
      await request('/api/bookings/validate-draft', { method: 'POST', body: JSON.stringify(draft) });
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
      location.href = 'passengers.html?departure_id=' + dep.id;
    });
  }

  // Tạo các ô hành khách đúng số vé và giữ bản nháp cho bước thanh toán.
  function passengers(tour, dep, draft) {
    const form = $('form');
    const container = $('.lg\\:col-span-8.space-y-6');
    const types = [...Array(draft.total_adults).fill('adult'), ...Array(draft.total_children).fill('child')];
    const prevPassengers = Array.isArray(draft.passengers) ? draft.passengers : [];

    container.innerHTML =
      '<h2 class="font-headline font-extrabold text-2xl text-primary mb-2">Chi tiết hành khách</h2>' +
      types
        .map((type, i) => {
          const p = prevPassengers[i] || {};
          const nameVal = esc(p.full_name || (i === 0 ? draft.userFullName : ''));
          const dobVal = esc(p.date_of_birth || '');
          const idVal = esc(p.id_card || '');
          return `<div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container space-y-3">
            <div class="flex items-center gap-2 mb-2 text-secondary">
              <span class="material-symbols-outlined font-bold">${type === 'adult' ? 'person' : 'child_care'}</span>
              <h3 class="font-headline font-bold text-base">Hành khách ${i + 1} · ${type === 'adult' ? 'Người lớn' : 'Trẻ em'}</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant px-1">Họ và tên *</label>
                <input class="${inputClass}" name="name_${i}" required value="${nameVal}" placeholder="Nhập họ và tên">
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-on-surface-variant px-1">Ngày sinh *</label>
                <input class="${inputClass}" name="dob_${i}" type="date" max="${new Date().toISOString().slice(0, 10)}" required value="${dobVal}">
              </div>
              <div class="space-y-1.5 md:col-span-2">
                <label class="text-xs font-bold text-on-surface-variant px-1">Số CMND/CCCD/Hộ chiếu</label>
                <input class="${inputClass}" name="id_${i}" value="${idVal}" placeholder="Nhập số CCCD/Hộ chiếu (nếu có)">
              </div>
            </div>
          </div>`;
        })
        .join('') +
      `<div class="flex justify-between items-center pt-2">
         <a href="/client/booking/create.html?departure_id=${dep.id}"
            id="btnBackToCreate"
            class="flex items-center gap-1 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
           <span class="material-symbols-outlined text-sm">arrow_back</span>
           Quay lại
         </a>
         <button class="px-8 py-3.5 bg-primary text-white rounded-full font-bold shadow-md hover:scale-[1.02] transition-transform flex items-center gap-2 text-sm" type="submit">
           Tiếp tục thanh toán
           <span class="material-symbols-outlined text-sm">arrow_forward</span>
         </button>
       </div>`;

    // Cập nhật thông tin chi tiết vào sidebar
    text('#passengersTourCategory', tour.category_name || 'Tour du lịch');
    text('#passengersTourTitle', tour.title);
    text('#passengersDepartureDate', `${date(dep.departure_date)} (${tour.duration_days}N${tour.duration_nights}Đ)`);
    text('#passengersCount', `${draft.total_adults} người lớn${draft.total_children > 0 ? `, ${draft.total_children} trẻ em` : ''}`);
    text('#passengersDepartureLocation', tour.pickup_point || tour.departure_location || '—');
    text('#passengersAdultLabel', `Người lớn (${draft.total_adults} × ${money(dep.adult_price)})`);
    text('#passengersAdultAmount', money(draft.total_adults * dep.adult_price));
    const childRow = $('#passengersChildRow');
    if (childRow) childRow.classList.toggle('hidden', draft.total_children === 0);
    text('#passengersChildLabel', `Trẻ em (${draft.total_children} × ${money(dep.child_price)})`);
    text('#passengersChildAmount', money(draft.total_children * dep.child_price));
    text('#passengersTotal', money(draft.total_adults * dep.adult_price + draft.total_children * dep.child_price));
    const tourImg = $('#passengersTourImage');
    if (tourImg) {
      tourImg.src = imageUrl(tour.thumbnail_url);
      tourImg.alt = esc(tour.title);
    }

    bindForm(form, (fd) => {
      draft.passengers = types.map((type, i) => ({
        full_name: fd.get('name_' + i),
        date_of_birth: fd.get('dob_' + i),
        id_card: fd.get('id_' + i),
        passenger_type: type,
      }));
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
      location.href = '../payments/invoice.html?departure_id=' + dep.id;
    });
  }

  // Hiển thị giá/phương thức thanh toán, gửi checkout để backend lưu đơn thật.
  function invoice(tour, dep, draft) {
    if (!draft.passengers) throw new Error('Vui lòng nhập danh sách hành khách trước khi thanh toán.');
    const form = $('#checkoutForm');

    // Nút quay lại thông tin hành khách (hỗ trợ cả checkoutBackLink và btnBackToPassengers)
    const backBtn = $('#checkoutBackLink') || $('#btnBackToPassengers') || $('[data-back-to-passengers]');
    if (backBtn) {
      const backUrl = `/client/booking/passengers.html?departure_id=${dep.id}`;
      backBtn.href = backUrl;
      backBtn.onclick = (e) => {
        e.preventDefault();
        location.href = backUrl;
      };
    }

    // Điền dữ liệu tóm tắt vào sidebar theo đúng các ID chuẩn
    text('#checkoutTourTitle', tour.title);
    text('#checkoutDates', `${date(dep.departure_date)} – ${date(dep.return_date)} (${tour.duration_days}N${tour.duration_nights}Đ)`);
    text('#checkoutParty', `${esc(draft.userFullName)} · ${draft.total_adults + draft.total_children} khách`);
    text('#checkoutAdultsLabel', `Người lớn (${draft.total_adults} × ${money(dep.adult_price)})`);
    text('#checkoutAdultsAmount', money(draft.total_adults * dep.adult_price));
    text('#checkoutChildrenLabel', `Trẻ em (${draft.total_children} × ${money(dep.child_price)})`);
    text('#checkoutChildrenAmount', money(draft.total_children * dep.child_price));
    text('#checkoutTotal', money(draft.total_adults * dep.adult_price + draft.total_children * dep.child_price));

    const tourCover = $('#checkoutTourCover');
    const tourImg = $('#checkoutTourImage');
    if (tourImg) {
      tourImg.src = imageUrl(tour.thumbnail_url);
      tourImg.alt = esc(tour.title);
      tourImg.hidden = false;
    }
    if (tourCover) tourCover.classList.remove('hidden');

    // Quản lý chuyển đổi phương thức thanh toán
    const methodSelect = $('#checkout-payment-method');
    const transferNote = $('#checkout-transfer-note');
    const cashNote = $('#checkout-cash-note');
    const cardDetails = $('#card-details');
    const submitBtn = $('#submit-btn');
    const submitIcon = $('#submit-icon');
    const submitText = $('#submit-text');

    const updatePaymentMethod = () => {
      const val = methodSelect ? methodSelect.value : 'bank_transfer';
      const isCard = val === 'card';
      const isTransfer = val === 'bank_transfer';
      const isCash = val === 'cash';

      if (transferNote) transferNote.classList.toggle('hidden', !isTransfer);
      if (cashNote) cashNote.classList.toggle('hidden', !isCash);
      if (cardDetails) cardDetails.classList.toggle('hidden', !isCard);

      // Bật/tắt required cho các ô nhập thẻ
      const cardInputs = cardDetails ? cardDetails.querySelectorAll('input') : [];
      cardInputs.forEach((inp) => {
        inp.required = isCard;
      });

      if (submitText) {
        if (isTransfer) submitText.textContent = 'Giữ chỗ và xem thông tin chuyển khoản';
        else if (isCash) submitText.textContent = 'Giữ chỗ và trả tại quầy';
        else submitText.textContent = 'Xác nhận thanh toán qua thẻ';
      }
      if (submitIcon) {
        if (isTransfer) submitIcon.textContent = 'qr_code_2';
        else if (isCash) submitIcon.textContent = 'payments';
        else submitIcon.textContent = 'lock';
      }
    };

    if (methodSelect) {
      methodSelect.onchange = updatePaymentMethod;
      updatePaymentMethod();
    }

    if (submitBtn) submitBtn.disabled = false;
    notice('Thanh toán mô phỏng cho đồ án. Bạn có thể chọn chuyển khoản, tiền mặt hoặc nhập thẻ kiểm thử.');

    bindForm(form, async (fd) => {
      const selectedMethod = methodSelect ? methodSelect.value : (fd.get('payment_method') || 'bank_transfer');
      const body = {
        ...draft,
        ...Object.fromEntries(fd),
        payment_method: selectedMethod,
      };
      const { data: booking } = await request('/api/bookings/checkout', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      sessionStorage.removeItem(draftKey);
      location.href = '../my_tours/show.html?id=' + booking.id;
    });
  }

  start().catch(failure);
})();
