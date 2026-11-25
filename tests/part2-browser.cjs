// Cần Playwright; chạy với test database như hướng dẫn bàn giao.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PART2_TEST_URL || 'http://localhost:5282';
let browser, currentPage;
(async () => {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  currentPage = page;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const requests = [];
  page.on('request', (r) => {
    if (!r.frame().url().includes('/admin/dashboard.html')) requests.push(r.url());
  });
  page.on('dialog', (dialog) => dialog.accept());
  async function ready() {
    await page.waitForFunction(
      () => {
        const e = document.querySelector('#part2Message');
        return e && e.hidden;
      },
      {},
      { timeout: 15000 },
    );
  }
  async function open(path) {
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    await ready();
  }
  await open('/client/home.html');
  assert.equal(await page.locator('[data-featured-tours] a').count(), 4);
  await page.fill('[name="destination"]', 'Đà Nẵng');
  await page.click('form button[type="submit"]');
  await page.waitForURL('**/tours/index.html?**');
  await page.waitForSelector('#catalogTourGrid a');
  assert(new URL(page.url()).searchParams.get('destination') === 'Đà Nẵng');
  await open('/client/tours/index.html');
  assert.equal(await page.locator('#catalogTourGrid > div').count(), 6);
  await page.selectOption('[name="province_id"]', '6');
  await page.click('#filter_tour button[type="submit"]');
  await page.waitForURL('**province_id=6**');
  await page.waitForSelector('#catalogTourGrid a');
  assert((await page.locator('#catalogTourGrid').innerText()).includes('Đà Nẵng'));
  await open('/client/tours/by_province.html?region=' + encodeURIComponent('Miền Bắc'));
  assert((await page.locator('#provinceToursGrid a').count()) > 0);
  await open('/client/tours/show.html?id=1');
  assert((await page.locator('#slider img').count()) > 0);
  assert(!(await page.locator('#tourDetailTitle').innerText()).includes('Chi tiết chuyến'));
  await page.waitForFunction(() => document.querySelector('#slider img')?.naturalWidth > 0);
  if (process.env.PART2_SCREENSHOT_DIR) {
    fs.mkdirSync(process.env.PART2_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: process.env.PART2_SCREENSHOT_DIR + '/tour-detail.png', fullPage: true });
  }
  async function login(name) {
    await page.goto(base + '/client/auth/login.html', { waitUntil: 'domcontentloaded' });
    await page.fill('[name="usernameOrEmail"]', name);
    await page.fill('[name="password"]', '123456');
    await page.click('#loginForm button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.endsWith('/login.html'));
  }
  await login('khach1@gmail.com');
  await open('/client/profile/show.html');
  // Tạo lịch tương lai trong DB test để kiểm tra nút đặt tour với ID thật.
  const adminLogin = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin_thanh', password: '123456' }),
  }).then((r) => r.json());
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
  const returnDay = new Date(Date.now() + 9 * 86400000).toISOString();
  const fixture = await fetch(base + '/api/departures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + adminLogin.data.token },
    body: JSON.stringify({
      tour_id: 1,
      departure_date: nextWeek,
      return_date: returnDay,
      max_seats: 20,
      adult_price: 2300000,
      child_price: 1200000,
      guide_id: 4,
      status: 'open',
    }),
  }).then((r) => r.json());
  assert(fixture.success);
  await open('/client/tours/show.html?id=1');
  await page.selectOption('#departureSelect', String(fixture.data.id));
  await page.click('#btnBookNow');
  await page.waitForURL('**/booking/create.html?**', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    document.querySelector('#summaryTourTitle')?.textContent.includes('Hạ Long'),
  );
  await page.click('.quantity-btn[data-target="total_adults"][data-change="-1"]');
  await page.click('#bookingForm [type="submit"]');
  await page.waitForURL('**/booking/passengers.html?**', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[name="dob_0"]');
  const names = page.locator('input[name^="name_"]');
  for (let i = 0; i < (await names.count()); i++) {
    await names.nth(i).fill('Hành khách kiểm thử ' + i);
    await page.fill('[name="dob_' + i + '"]', '1995-01-01');
  }
  await page.click('form [type="submit"]');
  await page.waitForURL('**/payments/invoice.html?**', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    document.querySelector('#part2Message')?.textContent.includes('Thanh toán mô phỏng'),
  );
  for (const [key, value] of Object.entries({
    card_number: '4111111111111111',
    card_holder: 'TEST CUSTOMER',
    card_expiry: '12/30',
    card_cvv: '123',
  }))
    await page.fill('[name="' + key + '"]', value);
  await page.click('#submit-btn');
  await page.waitForURL('**/my_tours/show.html?id=*', { waitUntil: 'domcontentloaded' });
  await ready();
  assert((await page.locator('#voucherTourTitle').innerText()).includes('Hạ Long'));
  const newBookingId = new URL(page.url()).searchParams.get('id');
  await open('/client/my_tours/index.html');
  await Promise.all([page.waitForEvent('load'), page.click('[data-cancel-booking="' + newBookingId + '"]')]);
  await ready();
  assert.equal(await page.locator('[data-cancel-booking="' + newBookingId + '"]').count(), 0);
  await open('/client/profile/show.html');
  await page.fill('#profileForm [name="address"]', 'Địa chỉ từ trình duyệt');
  await page.click('#profileForm [type="submit"]');
  await page.waitForFunction(() =>
    document.querySelector('#part2Message')?.textContent.includes('Cập nhật hồ sơ thành công'),
  );
  await open('/client/profile/show.html');
  assert.equal(await page.inputValue('#profileForm [name="address"]'), 'Địa chỉ từ trình duyệt');
  await open('/client/my_tours/index.html');
  assert((await page.locator('#myToursListContainer article').count()) > 0);
  await page.locator('#myToursListContainer a').filter({ hasText: 'Đánh giá tour' }).first().click();
  await page.waitForURL('**/my_tours/review.html?**', { waitUntil: 'domcontentloaded' });
  await ready();
  await page.fill('#reviewForm textarea', 'Đánh giá CRUD từ trình duyệt');
  await page.click('#btnSubmitReview');
  await page.waitForURL('**/my_tours/index.html?tab=completed');
  await page.waitForSelector('#myReviewsSection');
  const review = page
    .locator('#myReviewsSection article')
    .filter({ hasText: 'Đánh giá CRUD từ trình duyệt' });
  await review.locator('a').filter({ hasText: 'Sửa' }).click();
  await page.waitForURL('**/my_tours/review.html?**', { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(await page.inputValue('#reviewForm textarea'), 'Đánh giá CRUD từ trình duyệt');
  await page.fill('#reviewForm textarea', 'Đánh giá đã sửa từ trình duyệt');
  await page.click('#btnSubmitReview');
  await page.waitForURL('**/my_tours/index.html?tab=completed');
  await page.waitForSelector('#myReviewsSection');
  await Promise.all([
    page.waitForEvent('load'),
    page
      .locator('#myReviewsSection article')
      .filter({ hasText: 'Đánh giá đã sửa từ trình duyệt' })
      .locator('button')
      .click(),
  ]);
  await open('/client/my_tours/show.html?id=1');
  assert(!(await page.locator('#voucherBookingCode').innerText()).includes('BK-2026'));
  await login('admin_thanh');
  await open('/admin/employees/index.html');
  assert((await page.locator('#employeeList article').count()) > 0);
  const unique = 'browser_' + Date.now();
  await open('/admin/employees/create.html');
  for (const [key, value] of Object.entries({
    full_name: 'Nhân viên trình duyệt',
    username: unique,
    email: unique + '@example.com',
    phone: '0900000000',
    password: '12345678',
    password_confirmation: '12345678',
  }))
    await page.fill('main [name="' + key + '"]', value);
  await page.selectOption('[name="role_id"]', '2');
  await page.click('main [type="submit"]');
  await page.waitForURL('**/employees/index.html');
  await open('/admin/employees/index.html?search=' + unique);
  const employee = page.locator('#employeeList article');
  assert.equal(await employee.count(), 1);
  await employee.locator('a').click();
  await page.waitForURL('**/employees/edit.html?**', { waitUntil: 'domcontentloaded' });
  await ready();
  await page.fill('main [name="full_name"]', 'Tên nhân viên đã sửa');
  await page.click('main [type="submit"]');
  await page.waitForURL('**/employees/index.html');
  await open('/admin/employees/index.html?search=' + unique);
  assert((await page.locator('#employeeList').innerText()).includes('Tên nhân viên đã sửa'));
  await Promise.all([page.waitForEvent('load'), page.locator('#employeeList button[data-delete]').click()]);
  await page.waitForFunction(() =>
    document.querySelector('#employeeList')?.textContent.includes('Không tìm thấy'),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await open('/client/tours/index.html');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert(!requests.some((url) => url.includes('mock-data.js')), 'Part 2 loaded mock data');
  assert.deepEqual(errors, []);
  console.log(
    'PASS browser: home/search, catalog, detail, profile, booking detail, review CRUD, employee CRUD, mobile layout, no mock/page errors',
  );
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  if (currentPage) {
    console.error('Page:', currentPage.url());
    console.error(
      'Message:',
      await currentPage
        .locator('#part2Message')
        .textContent()
        .catch(() => ''),
    );
    console.error(
      'Invalid fields:',
      await currentPage.locator('input:invalid').evaluateAll((fields) => fields.map((field) => field.name)),
    );
  }
  await browser?.close();
  process.exitCode = 1;
});
