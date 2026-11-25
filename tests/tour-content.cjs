// Chỉ đọc API/database; kiểm tra nội dung thật và cách render chi tiết cả 15 tour.
// NODE_PATH trỏ tới nơi cài Playwright; PART2_TEST_URL mặc định là server kiểm thử.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.PART2_TEST_URL || 'http://localhost:5282';
const generic =
  /Liên hệ để xác nhận|Xem dịch vụ bao gồm|Khám phá điểm đến nổi bật|Hoạt động tham quan, trải nghiệm văn hóa|Chưa cập nhật/i;

(async () => {
  const response = await fetch(base + '/api/tours?pageSize=100');
  assert(response.ok);
  const list = await response.json();
  assert.equal(list.total, 15);
  const tours = [];
  const scheduleIds = new Set();
  const programs = new Set();
  for (const item of list.data) {
    const res = await fetch(base + '/api/tours/' + item.id);
    assert(res.ok);
    const { data: tour } = await res.json();
    for (const field of [
      'description',
      'language',
      'transport',
      'accommodation',
      'included_services',
      'excluded_services',
    ]) {
      assert(tour[field]?.trim(), `Tour ${tour.id} thiếu ${field}`);
      assert(!generic.test(tour[field]), `Tour ${tour.id}: ${field} còn nội dung chung chung`);
    }
    assert.equal(tour.language, 'Tiếng Việt');
    assert(tour.included_services.split('\n').length >= 3);
    assert(tour.excluded_services.split('\n').length >= 2);
    if (tour.duration_nights === 0) assert.match(tour.accommodation, /Không lưu trú qua đêm/);
    else assert(tour.accommodation.startsWith(tour.duration_nights + ' đêm'));
    assert.equal(tour.schedules.length, tour.duration_days);
    const days = [...tour.schedules].sort((a, b) => a.day_number - b.day_number);
    assert.deepEqual(
      days.map((s) => s.day_number),
      Array.from({ length: tour.duration_days }, (_, i) => i + 1),
    );
    for (const schedule of days) {
      assert(!scheduleIds.has(schedule.id), 'ID lịch trình bị trùng giữa các tour');
      scheduleIds.add(schedule.id);
      assert(!/^Ngày\s+\d+\s*:/i.test(schedule.title));
      assert(!generic.test(schedule.activities));
      assert(schedule.activities.split('\n').length >= 4, 'Thiếu hoạt động theo từng buổi');
      assert((schedule.activities.match(/\d{2}:\d{2}/g) || []).length >= 4);
    }
    const program = days.map((s) => s.activities).join('\n');
    assert(!programs.has(program), 'Các tour đang dùng chung lịch trình');
    programs.add(program);
    tours.push(tour);
  }
  console.log(
    `PASS API: ${tours.length} tour, ${scheduleIds.size} ngày có nội dung riêng và đầy đủ dịch vụ.`,
  );

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const tour of tours) {
        await page.goto(`${base}/client/tours/show.html?id=${tour.id}`, {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForFunction(() => document.querySelector('#part2Message')?.hidden);
        assert.equal(await page.locator('#tourDetailTransport').textContent(), tour.transport);
        assert.equal(await page.locator('#tourDetailHotel').textContent(), tour.accommodation);
        assert.equal(await page.locator('#tourDetailLanguage').textContent(), tour.language);
        assert.equal(
          await page.locator('#tourDetailInclusions li').count(),
          tour.included_services.split('\n').length,
        );
        assert.equal(
          await page.locator('#tourDetailExclusions li').count(),
          tour.excluded_services.split('\n').length,
        );
        const headings = await page.locator('#itineraryContainer h4').allTextContents();
        assert.equal(headings.length, tour.duration_days);
        headings.forEach((title, i) => {
          assert(title.startsWith(`Ngày ${i + 1}: `));
          assert.equal((title.match(/Ngày\s+\d+\s*:/gi) || []).length, 1);
        });
        assert(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `Tour ${tour.id} tràn ngang ở ${width}px`,
        );
      }
      console.log(`PASS UI: toàn bộ 15 trang ở ${width}px, không lặp ngày, không tràn ngang.`);
    }

    // Tương thích lịch trình cũ có tiền tố Ngày và thứ tự mảng chưa được sắp xếp.
    const tour = structuredClone(tours.find((t) => t.id === 15));
    tour.schedules.forEach(
      (s) => (s.title = `Ngày ${s.day_number}: Ngày ${s.day_number}: ${s.title}`),
    );
    tour.schedules.reverse();
    await page.route('**/api/tours/15', (route) =>
      route.fulfill({ json: { success: true, data: tour } }),
    );
    await page.goto(base + '/client/tours/show.html?id=15', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction(() => document.querySelector('#part2Message')?.hidden);
    const headings = await page.locator('#itineraryContainer h4').allTextContents();
    headings.forEach((title, i) => {
      assert(title.startsWith(`Ngày ${i + 1}: `));
      assert.equal((title.match(/Ngày\s+\d+\s*:/gi) || []).length, 1);
    });
    assert.deepEqual(errors, []);
    console.log('PASS tương thích dữ liệu lịch trình cũ và không có lỗi JavaScript.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
