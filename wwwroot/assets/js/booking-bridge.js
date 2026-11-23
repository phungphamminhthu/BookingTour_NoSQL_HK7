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
  async function start() {
    const user = await requireUser('Customer');
    if (!user) return;
    const id = params.get('departure_id');
    if (!/^\d+$/.test(id || '')) throw new Error('Vui lòng chọn lịch khởi hành từ trang chi tiết tour.');
    const { data: dep } = await request('/api/departures/' + id);
    const { data: tour } = await request('/api/tours/' + dep.tour_id);
    if (dep.status !== 'open' || new Date(dep.departure_date) <= new Date())
      throw new Error('Chuyến đi đã khởi hành hoặc không mở bán.');
    if (location.pathname.endsWith('/create.html')) create(user, tour, dep);
    else {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (!draft || draft.departure_id !== Number(id))
        throw new Error('Không tìm thấy bản nháp. Vui lòng nhập lại thông tin đặt tour.');
      if (location.pathname.endsWith('/passengers.html')) passengers(tour, dep, draft);
      else invoice(tour, dep, draft);
    }
  }
  function create(user, tour, dep) {
    const form = $('#bookingForm');
    text('#summaryTourTitle', tour.title);
    text('#summaryTourTag', tour.category_name);
    text('#summaryDepartureLoc', tour.pickup_point);
    text('#summaryDepartureDate', date(dep.departure_date));
    $('.rounded-xl.overflow-hidden img').src = imageUrl(tour.thumbnail_url);
    form.elements.userFullName.value = user.fullName;
    form.elements.userPhone.value = user.phone || '';
    form.elements.userEmail.value = user.email;
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
      await request('/api/bookings/validate-draft', { method: 'POST', body: JSON.stringify(draft) });
      sessionStorage.setItem(draftKey, JSON.stringify(draft));
      location.href = 'passengers.html?departure_id=' + dep.id;
    });
  }
  function summary(tour, dep, draft) {
    return `<img class="w-full h-40 object-cover rounded-xl" src="${imageUrl(tour.thumbnail_url)}" alt="${esc(tour.title)}"><h3 class="font-bold text-primary my-4">${esc(tour.title)}</h3><p class="text-sm">${date(dep.departure_date)} – ${date(dep.return_date)}</p><p class="text-sm my-3">${esc(draft.userFullName)} · ${draft.total_adults} người lớn, ${draft.total_children} trẻ em</p><strong class="text-secondary">${money(draft.total_adults * dep.adult_price + draft.total_children * dep.child_price)}</strong>`;
  }
  function passengers(tour, dep, draft) {
    const form = $('form');
    const container = $('.lg\\:col-span-8.space-y-6');
    const types = [...Array(draft.total_adults).fill('adult'), ...Array(draft.total_children).fill('child')];
    container.innerHTML =
      '<h2 class="font-bold text-2xl text-primary">Chi tiết hành khách</h2>' +
      types
        .map(
          (type, i) =>
            `<div class="bg-white rounded-2xl p-6 shadow-sm space-y-3"><h3 class="font-bold">Hành khách ${i + 1} · ${type === 'adult' ? 'Người lớn' : 'Trẻ em'}</h3><label class="block text-sm">Họ tên<input class="${inputClass}" name="name_${i}" required value="${i === 0 ? esc(draft.userFullName) : ''}"></label><label class="block text-sm">Ngày sinh<input class="${inputClass}" name="dob_${i}" type="date" max="${new Date().toISOString().slice(0, 10)}" required></label><label class="block text-sm">CCCD / Hộ chiếu<input class="${inputClass}" name="id_${i}"></label></div>`,
        )
        .join('') +
      '<button class="px-6 py-3 bg-primary text-white rounded-full font-bold" type="submit">Tiếp tục thanh toán</button>';
    $('.lg\\:col-span-4 > div').innerHTML = summary(tour, dep, draft);
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
  function invoice(tour, dep, draft) {
    if (!draft.passengers) throw new Error('Vui lòng nhập danh sách hành khách trước khi thanh toán.');
    const form = $('#checkoutForm');
    const aside = $('aside');
    // Giữ nút xác nhận và form cũ, chỉ điền phần tóm tắt bằng dữ liệu API.
    const submit = $('#submit-btn');
    const panel = aside.firstElementChild;
    panel.innerHTML = summary(tour, dep, draft);
    panel.append(submit); // Giữ nguyên nút submit trong form, không xóa cùng dữ liệu mẫu.
    notice('Thanh toán mô phỏng cho đồ án. Chỉ dùng thông tin thẻ kiểm thử, không nhập thẻ thật.');
    bindForm(form, async (fd) => {
      const body = { ...draft, ...Object.fromEntries(fd) };
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
