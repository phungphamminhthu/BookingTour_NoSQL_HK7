// Chạy với database kiểm thử riêng, xem PART2_HANDOFF.md. Không dùng trên dữ liệu thật.
const assert = require('node:assert/strict');
const base = process.env.PART2_TEST_URL || 'http://localhost:5282';
async function call(path, method = 'GET', body, token, expected = 200) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response.json().catch(() => null);
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(value)}`);
  return value;
}
const login = async (usernameOrEmail) =>
  (
    await call('/api/auth/login', 'POST', {
      usernameOrEmail,
      password: '123456',
    })
  ).data.token;
let checks = 0;
const pass = (name) => {
  checks++;
  console.log('PASS ' + name);
};
(async () => {
  assert.equal((await call('/swagger/v1/swagger.json')).openapi, '3.0.1');
  pass('Swagger schema');
  const all = await call('/api/tours?pageSize=100');
  assert.equal(all.total, 15);
  assert.equal((await call('/api/tours?q=__NO_MATCH_93847__')).total, 0);
  assert.equal((await call('/api/tours?q=%5B')).total, 0);
  pass('Keyword binding and literal regex');
  const filtered = await call('/api/tours?province_id=6&gia_tu=1000000&gia_den=9000000');
  assert(
    filtered.data.every(
      (t) => t.province_id === 6 && t.min_price >= 1000000 && t.min_price <= 9000000,
    ),
  );
  assert(filtered.total > 0);
  const multi = await call('/api/tours?category_id%5B%5D=1&category_id%5B%5D=2&pageSize=100');
  assert(multi.data.every((t) => [1, 2].includes(t.category_id)));
  pass('Combined filters and multiple categories');
  assert((await call('/api/tours?region=' + encodeURIComponent('Miền Bắc'))).total > 0);
  assert.equal(
    (await call('/api/tours?q=__NO_MATCH_93847__&destination=' + encodeURIComponent('Đà Nẵng')))
      .total,
    0,
  );
  const sorted = await call('/api/tours?sort=asc&pageSize=100');
  assert(sorted.data.every((t, i, a) => i === 0 || a[i - 1].min_price <= t.min_price));
  const page1 = await call('/api/tours?page=1&pageSize=6');
  const page2 = await call('/api/tours?page=2&pageSize=6');
  assert.equal(page1.data.length, 6);
  assert(!page1.data.some((t) => page2.data.some((u) => u.id === t.id)));
  pass('Price sort and MongoDB pagination');
  await call('/api/tours?page=0', 'GET', undefined, undefined, 400);
  await call('/api/tours?gia_tu=900&gia_den=100', 'GET', undefined, undefined, 400);
  pass('Invalid filter validation');
  const detail = (await call('/api/tours/1')).data;
  assert(detail.images.length && detail.schedules.length);
  assert((detail.reviews || []).every((r) => !r.customer));
  assert((detail.departures || []).every((d) => !d.guide));
  await call('/api/tours/999999', 'GET', undefined, undefined, 404);
  pass('Embedded tour detail and public data privacy');
  const admin = await login('admin_thanh'),
    customer = await login('khach1@gmail.com'),
    other = await login('khach2@gmail.com');
  await call('/api/employees', 'GET', undefined, customer, 403);
  await call('/api/customer/profile', 'GET', undefined, admin, 403);
  await call('/api/customer/profile', 'GET', undefined, undefined, 401);
  pass('Role separation and authentication');
  const tourBody = {
    title: 'Tour kiểm thử thông tin chi tiết',
    categoryId: 1,
    provinceId: 4,
    durationDays: 2,
    durationNights: 1,
    minPrice: 2000000,
    language: 'Tiếng Việt',
    transport: 'Xe du lịch và tàu tham quan',
    accommodation: '1 đêm khách sạn 3 sao',
    includedServices: 'Xe, phòng nghỉ và 3 bữa chính',
    excludedServices: 'Đồ uống và chi phí cá nhân',
  };
  const createdTour = (await call('/api/tours', 'POST', tourBody, admin, 201)).data;
  try {
    let saved = (await call('/api/tours/' + createdTour.id)).data;
    assert.equal(saved.language, tourBody.language);
    assert.equal(saved.transport, tourBody.transport);
    assert.equal(saved.accommodation, tourBody.accommodation);
    assert.equal(saved.excluded_services, tourBody.excludedServices);
    // Form cũ không gửi trường mới thì không được xóa nội dung đã lưu.
    const { language, transport, accommodation, excludedServices, ...oldForm } = tourBody;
    await call('/api/tours/' + createdTour.id, 'PUT', oldForm, admin);
    saved = (await call('/api/tours/' + createdTour.id)).data;
    assert.equal(saved.transport, transport);
    assert.equal(saved.accommodation, accommodation);
    assert.equal(saved.language, language);
    assert.equal(saved.excluded_services, excludedServices);
    await call(
      '/api/tours/' + createdTour.id,
      'PUT',
      { ...tourBody, excludedServices: 'Đồ uống; phòng đơn' },
      admin,
    );
    assert.equal(
      (await call('/api/tours/' + createdTour.id)).data.excluded_services,
      'Đồ uống; phòng đơn',
    );
  } finally {
    await call('/api/tours/' + createdTour.id, 'DELETE', undefined, admin);
  }
  pass('Tour metadata persistence and compatibility with existing admin forms');
  const profile = (await call('/api/customer/profile', 'GET', undefined, customer)).data.customer;
  const profileBody = {
    fullName: 'Khách kiểm thử Phần 2',
    email: profile.email,
    phone: '0912345678',
    address: 'Địa chỉ kiểm thử',
    birthday: '2000-01-01',
  };
  await call('/api/customer/profile', 'PUT', profileBody, customer);
  assert.equal(
    (await call('/api/customer/profile', 'GET', undefined, customer)).data.customer.full_name,
    profileBody.fullName,
  );
  await call(
    '/api/customer/profile',
    'PUT',
    { ...profileBody, birthday: '2999-01-01' },
    customer,
    400,
  );
  await call(
    '/api/customer/password/update',
    'POST',
    {
      current_password: 'wrong',
      new_password: 'NewPassword123',
      new_password_confirmation: 'NewPassword123',
    },
    customer,
    400,
  );
  await call(
    '/api/customer/password/update',
    'POST',
    {
      current_password: '123456',
      new_password: 'NewPassword123',
      new_password_confirmation: 'NewPassword123',
    },
    customer,
  );
  await call('/api/auth/login', 'POST', {
    usernameOrEmail: profile.email,
    password: 'NewPassword123',
  });
  await call(
    '/api/customer/password/update',
    'POST',
    {
      current_password: 'NewPassword123',
      new_password: '123456',
      new_password_confirmation: '123456',
    },
    customer,
  );
  await call(
    '/api/customer/profile',
    'PUT',
    {
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      birthday: profile.birthday || null,
    },
    customer,
  );
  pass('Profile persistence and BCrypt password change');
  const bookings = (await call('/api/bookings/my-tours', 'GET', undefined, customer)).data;
  assert(bookings.length > 0);
  await call('/api/bookings/' + bookings[0].id, 'GET', undefined, other, 404);
  const booking = bookings.find((b) => b.can_review);
  assert(booking);
  const created = (
    await call(
      '/api/bookings/' + booking.id + '/review',
      'POST',
      { rating: 4, comment: 'Đánh giá kiểm thử MongoDB' },
      customer,
      201,
    )
  ).data;
  await call(
    '/api/bookings/' + booking.id + '/review',
    'POST',
    { rating: 4, comment: 'Trùng' },
    customer,
    400,
  );
  await call(
    '/api/reviews/' + created.id,
    'PUT',
    { rating: 5, comment: 'Không được sửa' },
    other,
    404,
  );
  await call('/api/reviews/' + created.id, 'DELETE', undefined, other, 404);
  await call(
    '/api/reviews/' + created.id,
    'PUT',
    { rating: 5, comment: 'Đã cập nhật đánh giá' },
    customer,
  );
  assert(
    (await call('/api/reviews/mine', 'GET', undefined, customer)).data.some(
      (r) => r.id === created.id && r.rating === 5,
    ),
  );
  await call('/api/reviews/' + created.id, 'DELETE', undefined, customer);
  pass('Booking ownership; review CRUD and duplicate prevention');
  const unique = Date.now();
  const employee = {
    username: 'part2_' + unique,
    password: '12345678',
    password_confirmation: '12345678',
    full_name: 'Nhân viên kiểm thử',
    email: `part2_${unique}@example.com`,
    phone: '0900000000',
    role_id: 2,
  };
  const emp = (await call('/api/employees', 'POST', employee, admin, 201)).data;
  const oldEmployeeToken = (
    await call('/api/auth/login', 'POST', {
      usernameOrEmail: employee.username,
      password: employee.password,
    })
  ).data.token;
  assert.equal(
    (await call('/api/employees?search=' + employee.username, 'GET', undefined, admin)).total,
    1,
  );
  await call(
    '/api/employees/' + emp.id,
    'PUT',
    { ...employee, full_name: 'Nhân viên đã cập nhật', role_id: 3 },
    admin,
  );
  assert.equal((await call('/api/employees/' + emp.id, 'GET', undefined, admin)).data.role_id, 3);
  await call('/api/auth/me', 'GET', undefined, oldEmployeeToken, 401);
  const changedEmployeeToken = (
    await call('/api/auth/login', 'POST', {
      usernameOrEmail: employee.username,
      password: employee.password,
    })
  ).data.token;
  await call(
    '/api/employees',
    'POST',
    {
      ...employee,
      username: employee.username + '_bad',
      email: 'bad' + employee.email,
      role_id: 999,
    },
    admin,
    400,
  );
  await call('/api/employees/1', 'DELETE', undefined, admin, 400);
  await call('/api/employees/4', 'DELETE', undefined, admin, 400);
  await call('/api/employees/' + emp.id, 'DELETE', undefined, admin);
  await call('/api/employees/' + emp.id, 'GET', undefined, admin, 404);
  pass('Employee CRUD, roles, search and deletion constraints');
  await call('/api/auth/me', 'GET', undefined, changedEmployeeToken, 401);
  pass('Old JWT rejected after role change or account deletion');
  const future = new Date(Date.now() + 7 * 86400000).toISOString();
  const departure = (
    await call(
      '/api/departures',
      'POST',
      {
        tour_id: 1,
        departure_date: future,
        return_date: new Date(Date.now() + 9 * 86400000).toISOString(),
        max_seats: 4,
        adult_price: 2300000,
        child_price: 1200000,
        guide_id: 4,
        status: 'open',
      },
      admin,
      201,
    )
  ).data;
  const checkout = {
    departure_id: departure.id,
    total_adults: 1,
    total_children: 0,
    userFullName: 'Khách kiểm thử',
    userPhone: '0912345678',
    userEmail: 'khach1@gmail.com',
    passengers: [
      {
        full_name: 'Khách kiểm thử',
        passenger_type: 'adult',
        date_of_birth: '1995-01-01',
      },
    ],
    card_number: '4111111111111111',
    card_holder: 'TEST CUSTOMER',
    card_expiry: '12/30',
    card_cvv: '123',
  };
  await call('/api/bookings/checkout', 'POST', { ...checkout, passengers: [] }, customer, 400);
  const newBooking = (await call('/api/bookings/checkout', 'POST', checkout, customer, 201)).data;
  assert.equal((await call('/api/departures/' + departure.id)).data.available_seats, 3);
  await call(
    '/api/bookings/' + newBooking.id + '/review',
    'POST',
    { rating: 5, comment: 'Chưa khởi hành' },
    customer,
    400,
  );
  await call('/api/bookings/' + newBooking.id + '/cancel', 'POST', undefined, other, 404);
  await call('/api/bookings/' + newBooking.id + '/cancel', 'POST', undefined, customer);
  await call('/api/bookings/' + newBooking.id + '/cancel', 'POST', undefined, customer, 400);
  assert.equal((await call('/api/departures/' + departure.id)).data.available_seats, 4);
  pass(
    'Real booking handoff, passenger validation, review eligibility, cancellation and seat restoration',
  );
  console.log(`Completed ${checks} groups of API checks.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
