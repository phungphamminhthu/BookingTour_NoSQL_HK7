// Chạy trên BookingTour_Part2_Test tại cổng 5282, không dùng database chính.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.PART2_TEST_URL || 'http://localhost:5282';
const normalize = (key) =>
  key
    .split('.')
    .pop()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
(async () => {
  const login = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail: 'admin_thanh', password: '123456' }),
  }).then((r) => r.json());
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.data.token };
  async function api(method, path, body) {
    const response = await fetch(base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  }
  const baseline = (await api('GET', '/api/employees')).body.total;
  const stamp = Date.now();
  const valid = {
    full_name: 'Nguyễn Thị Quỳnh',
    email: `Validate_${stamp}@example.com`,
    phone: '+84 912 345 678',
    username: 'validate_' + stamp,
    password: 'Demo@2026',
    password_confirmation: 'Demo@2026',
    role_id: 2,
  };
  const invalid = [
    ['full_name', ''],
    ['full_name', ' A '],
    ['full_name', 'Nguyễn 123'],
    ['full_name', 'A'.repeat(101)],
    ['email', 'abc'],
    ['email', 'a@localhost'],
    ['email', 'abc def@example.com'],
    ['phone', ''],
    ['phone', '12345'],
    ['phone', '0123456789'],
    ['username', 'abc'],
    ['username', '1admin'],
    ['username', 'admin@gmail.com'],
    ['username', 'admin name'],
    ['password', 'short'],
    ['password', ' '.repeat(8)],
    ['password', 'a'.repeat(65)],
    ['password', 'ắ'.repeat(25)],
    ['password_confirmation', ''],
    ['password_confirmation', 'Different'],
    ['role_id', 0],
    ['role_id', 999],
  ];
  for (const [field, value] of invalid) {
    const candidate = { ...valid, [field]: value };
    if (field === 'password') candidate.password_confirmation = value;
    const result = await api('POST', '/api/employees', candidate);
    assert.equal(result.status, 400, field);
    assert(
      Object.keys(result.body.errors || {}).some((key) => normalize(key) === field),
      `${field} missing inline error`,
    );
  }
  assert.equal((await api('GET', '/api/employees')).body.total, baseline);
  const created = await api('POST', '/api/employees', valid);
  assert.equal(created.status, 201);
  const employee = created.body.data;
  assert.equal(employee.phone, '0912345678');
  assert.equal(employee.email, valid.email.toLowerCase());
  try {
    let duplicate = await api('POST', '/api/employees', { ...valid, username: valid.username.toUpperCase() });
    assert.equal(duplicate.status, 400);
    assert(duplicate.body.errors.username);
    duplicate = await api('POST', '/api/employees', { ...valid, username: valid.username + '_2' });
    assert.equal(duplicate.status, 400);
    assert(duplicate.body.errors.email);
    const update = await api('PUT', '/api/employees/' + employee.id, {
      full_name: valid.full_name,
      email: valid.email,
      phone: '0912 345 678',
      role_id: 3,
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.data.phone, '0912345678');
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await context.addInitScript((data) => {
        sessionStorage.setItem('bookingtour_token', data.token);
        sessionStorage.setItem('bookingtour_user', JSON.stringify(data.user));
        sessionStorage.setItem('bookingtour_role', 'Admin');
      }, login.data);
      const page = await context.newPage();
      let posts = 0;
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (r) => {
        if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/employees') posts++;
      });
      await page.goto(base + '/admin/employees/create.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('#part2Message')?.hidden);
      assert.equal(await page.inputValue('[name="role_id"]'), '');
      await page.click('main [type="submit"]');
      assert.equal(await page.locator('main [aria-invalid="true"]').count(), 7);
      assert.equal(posts, 0);
      for (const [key, value] of Object.entries(valid)) {
        if (key === 'role_id') await page.selectOption('[name="role_id"]', String(value));
        else await page.fill('[name="' + key + '"]', value);
      }
      await page.click('main [type="submit"]');
      await page.waitForFunction(() => !document.querySelector('#employee_username_error').hidden);
      assert.equal(await page.locator('[name="username"]').getAttribute('aria-invalid'), 'true');
      await page.fill('[name="username"]', valid.username + '_browser');
      await page.click('main [type="submit"]');
      await page.waitForFunction(() => !document.querySelector('#employee_email_error').hidden);
      assert.equal(await page.locator('[name="email"]').getAttribute('aria-invalid'), 'true');
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.fill('[name="email"]', 'wrong');
        await page.fill('[name="phone"]', '123');
        await page.fill('[name="password_confirmation"]', 'Mismatch');
        await page.click('main [type="submit"]');
        assert.equal(await page.locator('#employee_phone_error').isVisible(), true);
        assert.equal(await page.locator('#employee_password_confirmation_error').isVisible(), true);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        if (process.env.PART2_SCREENSHOT_DIR)
          await page.screenshot({
            path: `${process.env.PART2_SCREENSHOT_DIR}/employee-validation-${width}.png`,
            fullPage: true,
          });
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  } finally {
    await api('DELETE', '/api/employees/' + employee.id);
  }
  assert.equal((await api('GET', '/api/employees')).body.total, baseline);
  console.log(
    'PASS employee validation: 22 invalid API inputs, normalized data, duplicate fields, optional password on edit, inline errors and mobile layout',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
