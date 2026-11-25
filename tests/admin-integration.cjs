// Kiểm tra admin router sau tích hợp; chỉ đọc API và gửi form rỗng để kiểm tra validate.
const { chromium } = require('playwright'),
  assert = require('node:assert/strict');
const base = process.env.PART2_TEST_URL || 'http://localhost:5282';
(async () => {
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin_thanh', password: '123456' }),
  }).then((r) => r.json());
  assert(login.success);
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.addInitScript((data) => {
      sessionStorage.setItem('bookingtour_token', data.token);
      sessionStorage.setItem('bookingtour_user', JSON.stringify(data.user));
      sessionStorage.setItem('bookingtour_role', 'Admin');
    }, login.data);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.error(e.stack);
    });
    await page.goto(base + '/admin/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.BookingTourAdminRouter);
    await page.evaluate(() => {
      window.savedAside = document.querySelector('aside');
    });
    await page.locator('aside a[href="/admin/employees/index.html"]').click();
    await page.waitForURL('**/employees/index.html');
    await page.waitForFunction(
      () =>
        document.querySelector('#employeeList article') &&
        document.querySelector('#part2Message')?.hidden,
    );
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector('.employee-row')).display === 'grid',
    );
    assert(
      await page.evaluate(() => window.savedAside === document.querySelector('aside')),
      'Header/sidebar was replaced',
    );
    let labels = await page.locator('.employee-role').allTextContents();
    assert(
      labels.every((v) => ['Quản trị viên', 'Nhân viên kinh doanh', 'Hướng dẫn viên'].includes(v)),
    );
    const x = await page
      .locator('.employee-role')
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().x));
    assert(Math.max(...x) - Math.min(...x) < 1);
    await page.locator('main a[href="/admin/employees/create.html"]').click();
    await page.waitForURL('**/employees/create.html');
    await page.waitForFunction(
      () =>
        document.querySelector('form[data-employee-validation-ready="true"]') &&
        document.querySelector('#part2Message')?.hidden,
    );
    await page.fill('[name=full_name]', 'Tên đang nhập');
    await page.evaluate(() => window.Part2EmployeePages.start());
    assert.equal(await page.inputValue('[name=full_name]'), 'Tên đang nhập');
    await page.fill('[name=full_name]', '');
    assert.equal(await page.locator('form [aria-live="polite"]').count(), 7);
    await page.locator('main form button[type="submit"]').click();
    assert.equal(
      await page.locator('input[aria-invalid="true"],select[aria-invalid="true"]').count(),
      7,
    );
    await page.getByText('Quay lại danh sách', { exact: false }).click();
    await page.waitForURL('**/employees/index.html');
    await page.waitForSelector('#employeeList article');
    assert(await page.evaluate(() => window.savedAside === document.querySelector('aside')));
    for (const path of [
      '/admin/categories/index.html',
      '/admin/locations/index.html',
      '/admin/departures/index.html',
      '/admin/tours/index.html',
      '/admin/employees/index.html',
    ]) {
      await page.evaluate((path) => window.BookingTourAdminRouter.navigateTo(path), path);
      assert.equal(new URL(page.url()).pathname, path);
      assert(await page.evaluate(() => window.savedAside === document.querySelector('aside')));
    }
    await page.waitForFunction(
      () =>
        document.querySelector('#employeeList article') &&
        document.querySelector('#part2Message')?.hidden,
    );
    assert(
      await page.evaluate(
        () => getComputedStyle(document.querySelector('.employee-row')).display === 'grid',
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS persistent admin: preserved shell, 5 modules, employee CSS/role alignment, Vietnamese labels, unique inline validation, working back link.',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
