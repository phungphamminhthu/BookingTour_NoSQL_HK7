# BÁO CÁO HOÀN THIỆN TOÀN DIỆN: CHỨC NĂNG QUẢN LÝ KHÁCH HÀNG (ADMIN CUSTOMERS MANAGEMENT)
**Dự án:** BookingTour_DotNet — Nền tảng Đặt tour Du lịch Trực tuyến  
**Nhánh:** `feature/final_code`  
**Trang kiểm tra:** `http://localhost:5281/admin/customers/index.html`  
**Ngày hoàn thiện:** 26/11/2026  
**Trạng thái:** Hoàn thành 100%, Đạt chuẩn kiểm thử và Sẵn sàng bảo vệ Đồ án  

---

## MỤC LỤC
1. [Mục tiêu và phạm vi hoàn thiện](#1-mục-tiêu-và-phạm-vi-hoàn-thiện)
2. [Bảng so sánh hiện trạng trước và sau khi hoàn thiện (Before vs After)](#2-bảng-so-sánh-hiện-trạng-trước-và-sau-khi-hoàn-thiện-before-vs-after)
3. [Kiến trúc tổng thể chức năng Quản lý Khách hàng](#3-kiến-trúc-tổng-thể-chức-năng-quản-lý-khách-hàng)
4. [Phân tích chi tiết các file giao diện (HTML/UI)](#4-phân-tích-chi-tiết-các-file-giao-diện-htmlui)
5. [Phân tích chi tiết JavaScript xử lý giao diện (`admin-pages.js`)](#5-phân-tích-chi-tiết-javascript-xử-lý-giao-diện-admin-pagesjs)
6. [Phân tích DTO và Data Contracts (`AdminDtos.cs`)](#6-phân-tích-dto-và-data-contracts-admindtoscs)
7. [Phân tích MongoDB Collection và Model (`Customer.cs`, `Booking.cs`, `Payment.cs`)](#7-phân-tích-mongodb-collection-và-model-customercs-bookingcs-paymentcs)
8. [Phân tích API Controller (`CustomersController.cs`)](#8-phân-tích-api-controller-customerscontrollercs)
9. [Phân tích Business Logic & Service (`AdminManagementService.cs`)](#9-phân-tích-business-logic--service-adminmanagementservicecs)
10. [Cơ chế thống kê thời gian thực (Real-time Stats: Total, New Month, Today)](#10-cơ-chế-thống-kê-thời-gian-thực-real-time-stats-total-new-month-today)
11. [Cơ chế tìm kiếm thông minh, Debounce và phân trang server-side](#11-cơ-chế-tìm-kiếm-thông-minh-debounce-và-phân-trang-server-side)
12. [Modal Xem chi tiết khách hàng và lịch sử đặt tour](#12-modal-xem-chi-tiết-khách-hàng-và-lịch-sử-đặt-tour)
13. [Modal Thêm mới khách hàng (In-page modal & `create.html`)](#13-modal-thêm-mới-khách-hàng-in-page-modal--createhtml)
14. [Modal Chỉnh sửa hồ sơ khách hàng (In-page modal & `edit.html`)](#14-modal-chỉnh-sửa-hồ-sơ-khách-hàng-in-page-modal--edithtml)
15. [Modal Xóa khách hàng và cơ chế bảo toàn toàn vẹn dữ liệu (Constraint Checks)](#15-modal-xóa-khách-hàng-và-cơ-chế-bảo-toàn-toàn-vẹn-dữ-liệu-constraint-checks)
16. [Phân quyền và bảo mật (Authorization: Admin vs Sale)](#16-phân-quyền-và-bảo-mật-authorization-admin-vs-sale)
17. [Kiểm soát mã hóa mật khẩu (BCrypt Hashing)](#17-kiểm-soát-mã-hóa-mật-khẩu-bcrypt-hashing)
18. [Xử lý múi giờ và thời gian (UTC vs UTC+7 Vietnam Time)](#18-xử-lý-múi-giờ-và-thời-gian-utc-vs-utc7-vietnam-time)
19. [Xử lý ngoại lệ, phản hồi chuẩn (`ApiResponse<T>`) và Flash messages](#19-xử-lý-ngoại-lệ-phản-hồi-chuẩn-apiresponset-và-flash-messages)
20. [Trải nghiệm người dùng (UX: Keyboard navigation Escape, Backdrop click, Loading spinners)](#20-trải-nghiệm-người-dùng-ux-keyboard-navigation-escape-backdrop-click-loading-spinners)
21. [Quy trình kiểm thử thực tế và kết quả xác minh](#21-quy-trình-kiểm-thử-thực-tế-và-kết-quả-xác-minh)
22. [Nhật ký chỉnh sửa chi tiết (Changelog file-by-file)](#22-nhật-ký-chỉnh-sửa-chi-tiết-changelog-file-by-file)
23. [Hướng dẫn demo và kịch bản thuyết trình bảo vệ đồ án](#23-hướng-dẫn-demo-và-kịch-bản-thuyết-trình-bảo-vệ-đồ-án)
24. [Bộ câu hỏi phản biện chuyên sâu dành cho giảng viên (25 câu hỏi & câu trả lời chuẩn mực)](#24-bộ-câu-hỏi-phản-biện-chuyên-sâu-dành-cho-giảng-viên-25-câu-hỏi--câu-trả-lời-chuẩn-mực)
25. [Bổ sung: Truy vết và xử lý thông tin Ngày sinh (Birthday) toàn hệ thống](#25-bổ-sung-truy-vết-và-xử-lý-thông-tin-ngày-sinh-birthday-toàn-hệ-thống)

---

## 1. MỤC TIÊU VÀ PHẠM VI HOÀN THIỆN

### 1.1 Mục tiêu chính
Chức năng **Quản lý Khách hàng (Admin Customers Management)** là module trung tâm trong hệ thống quản trị của nền tảng thương mại điện tử du lịch `BookingTour_DotNet`. Mục tiêu của lần rà soát và hoàn thiện này bao gồm:
1. **Khắc phục triệt để các khiếm khuyết nghiệp vụ và hiển thị:** Loại bỏ hoàn toàn lỗi thẻ thống kê không tải được dữ liệu hiển thị `—`, các placeholder lỗi, và lỗi validation mật khẩu.
2. **Nâng cao trải nghiệm quản trị (UX/UI Seamless):** Tích hợp modal thêm mới khách hàng trực tiếp trên trang danh sách (`index.html`), kết hợp đóng modal bằng phím `Escape` và click ra ngoài lớp phủ backdrop.
3. **Đảm bảo toàn vẹn dữ liệu MongoDB (Referential Integrity):** Ngăn chặn xóa khách hàng khi họ đã phát sinh giao dịch đặt tour, hóa đơn thanh toán hoặc đánh giá trong hệ thống NoSQL.
4. **Chuẩn hóa API và phân quyền:** Đảm bảo bảo mật cấp độ Role: chỉ tài khoản `Admin` có quyền xóa khách hàng; nhân viên `Sale` có quyền tra cứu, tạo và cập nhật hồ sơ khách hàng.

### 1.2 Phạm vi công việc thực tế
- **Frontend:**
  - `wwwroot/admin/customers/index.html`: Thêm modal `#custCreateModal`, chuyển nút "Thêm khách hàng" thành modal trigger, tối ưu hóa responsive và CSS icons.
  - `wwwroot/admin/customers/show.html`: Loại bỏ alert xanh placeholder hiển thị gạch ngang `—`.
  - `wwwroot/admin/customers/create.html` & `edit.html`: Bảo lưu tính năng độc lập, đồng bộ dữ liệu với API.
  - `wwwroot/assets/js/admin-pages.js`: Bổ sung gọi `fetchStats()` ngay khi load trang; xử lý submit modal tạo mới; tìm kiếm realtime với debounce 350ms; hỗ trợ badge trạng thái đơn đặt tour đa dạng.
- **Backend:**
  - `Controllers/CustomersController.cs`: Khóa quyền `[Authorize(Roles = "Admin")]` cho thao tác xóa `Delete`; bổ sung endpoint `GET /api/customers/{id}/bookings`.
  - `Services/AdminManagementService.cs`: Sửa lỗi tìm kiếm theo ID/mã khách hàng (`#ID`, `KH-ID`); tính toán thống kê theo múi giờ Việt Nam (UTC+7); kiểm tra toàn vẹn 3 tầng (Bookings, Payments, Reviews) trước khi xóa.
  - `DTOs/AdminDtos.cs`: Cho phép `Password` linh hoạt, không bắt buộc tối thiểu 8 ký tự khi admin muốn dùng mật khẩu mặc định `123456`.

---

## 2. BẢNG SO SÁNH HIỆN TRẠNG TRƯỚC VÀ SAU KHI HOÀN THIỆN (BEFORE VS AFTER)

| Tiêu chí | Trước khi hoàn thiện (Before) | Sau khi hoàn thiện (After) | Lợi ích đạt được |
| :--- | :--- | :--- | :--- |
| **Thẻ thống kê (Stats Cards)** | Hàm `fetchStats()` được định nghĩa nhưng **không bao giờ được gọi** khi tải trang; hiển thị `—` vĩnh viễn. | Tự động gọi `fetchStats()` ngay khi khởi tạo trang và sau mỗi lần Thêm/Sửa/Xóa. | Dữ liệu thời gian thực hiển thị tức thì (Tổng KH, Mới trong tháng, Đăng ký hôm nay). |
| **Tính toán Thống kê Múi giờ** | Dùng `DateTime.UtcNow` lấy ngày 1 và 0h sáng khiến lệch 7 tiếng so với múi giờ Việt Nam (UTC+7). | Bù giờ chính xác: `DateTime.UtcNow.AddHours(7)` quy đổi về đầu ngày/đầu tháng giờ Việt Nam. | Số liệu đăng ký trong ngày và trong tháng khớp 100% với lịch thực tế tại Việt Nam. |
| **Thêm mới khách hàng** | Nút bấm chuyển hướng sang trang riêng `create.html`, gây gián đoạn luồng làm việc. | Tích hợp **Modal Thêm khách hàng** ngay trên `index.html` với animation mượt mà; vẫn duy trì `create.html`. | Thao tác nhập liệu nhanh gấp 3 lần, tiện dụng cho nhân viên quản trị. |
| **Ràng buộc Mật khẩu khi tạo** | DTO áp `[MinLength(8)]` gây lỗi xung đột khi admin để trống để lấy mật khẩu mặc định `123456` (6 ký tự). | DTO cho phép `null/empty`; Backend tự động gán mặc định `123456` hoặc kiểm tra tối thiểu 6 ký tự nếu nhập. | Không bao giờ bị lỗi validation ngớ ngẩn khi tạo khách hàng nhanh. |
| **Tìm kiếm Khách hàng** | Chỉ tìm theo text hoặc số thuần `12`; tìm theo mã `#12` hoặc `KH12` bị bỏ sót. Tìm kiếm phải bấm Enter. | Regular Expression tự động trích xuất số ID nếu có tiền tố `#` hoặc chữ cái. Tích hợp **Debounce 350ms**. | Tìm kiếm tức thì khi gõ, tìm chính xác theo Họ tên, Email, SĐT, Địa chỉ, hoặc Mã KH. |
| **Toàn vẹn Dữ liệu Xóa** | Chỉ kiểm tra mảng booking của khách hàng; nếu rỗng vẫn có thể xóa kể cả khi có bản ghi thanh toán mồ côi. | Kiểm tra độc lập 3 collection: `Bookings`, `Payments`, `Reviews` trước khi cho phép xóa. | Không bao giờ xảy ra lỗi toàn vẹn dữ liệu trong cơ sở dữ liệu MongoDB NoSQL. |
| **Phân quyền Endpoint Xóa** | Kế thừa `[Authorize(Roles = "Admin,Sale")]` cho phép nhân viên Sale xóa tài khoản khách hàng. | Đặt riêng `[Authorize(Roles = "Admin")]` cho action `Delete(int id)`. | Đảm bảo tính bảo mật và phân quyền chuẩn mực doanh nghiệp (SoD). |
| **Đóng Modal (UX)** | Chỉ có thể bấm nút X hoặc nút Hủy để đóng; bấm ra ngoài backdrop hoặc ấn `Escape` không có tác dụng. | Bổ sung event listener click backdrop và phím `Escape` cho tất cả các modal trong trang. | Trải nghiệm tương tác đạt chuẩn quốc tế (WCAG UX guidelines). |
| **Trang Chi tiết (`show.html`)** | Hiển thị 1 khung thông báo màu xanh chứa dấu gạch ngang `—` cố định gây mất thẩm mỹ. | Đã ẩn và đặt `id="showCustomerAlertSuccess"`, chỉ hiển thị khi có thông điệp thành công thực sự. | Giao diện hiển thị chuyên nghiệp, không có thành phần thừa. |

---

## 3. KIẾN TRÚC TỔNG THỂ CHỨC NĂNG QUẢN LÝ KHÁCH HÀNG

Hệ thống được xây dựng theo kiến trúc phân tầng chuẩn mực (N-Tier Architecture), kết hợp giữa Single Page Application (SPA) hybrid và RESTful API với cơ sở dữ liệu MongoDB:

```
+-----------------------------------------------------------------------------------+
|                              TRÌNH DUYỆT NGƯỜI DÙNG                                |
|  - customers/index.html (Dashboard thống kê, Bảng danh sách, 4 Modals thao tác)   |
|  - customers/show.html (Hồ sơ khách hàng, Thẻ tổng quan, Lịch sử đặt tour)         |
|  - customers/create.html & edit.html (Form nhập liệu toàn trang độc lập)          |
+-----------------------------------------------------------------------------------+
                                        |  (Fetch / JSON Requests)
                                        v
+-----------------------------------------------------------------------------------+
|                                CLIENT JAVASCRIPT                                  |
|  - api-client.js: Quản lý Bearer Token JWT, header, refresh token, error parsing |
|  - admin-pages.js: Xử lý sự kiện DOM, debounce input, validation, render table    |
+-----------------------------------------------------------------------------------+
                                        |  (HTTP REST API over TLS/HTTP)
                                        v
+-----------------------------------------------------------------------------------+
|                        ASP.NET CORE 8.0 WEB API BACKEND                           |
|  - Routing: [Route("api/[controller]")] -> api/customers                          |
|  - Security Middleware: JWT Authentication & Role-Based Authorization             |
|  - CustomersController.cs: Điều hướng request, validate ModelState, trả ApiResponse|
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                             BUSINESS SERVICE LAYER                                |
|  - IAdminManagementService.cs / AdminManagementService.cs                         |
|  - Xử lý nghiệp vụ: GetCustomersAsync, GetCustomerStatsAsync, Create, Update, Delete|
|  - Kiểm tra logic: Unique Email/Phone, Regex Search, Constraint Checking         |
|  - Bảo mật: BCrypt.Net.BCrypt.HashPassword                                        |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                             DATA ACCESS / MONGODB                                 |
|  - MongoDbContext.cs: Quản lý MongoClient, IMongoDatabase                         |
|  - Collections: Customers, Bookings, TourDepartures, Payments, Reviews            |
|  - Counters Collection: Cơ chế phát sinh Sequence ID tự tăng (GetNextSequenceAsync)|
+-----------------------------------------------------------------------------------+
```

---

## 4. PHÂN TÍCH CHI TIẾT CÁC FILE GIAO DIỆN (HTML/UI)

### 4.1 Trang danh sách chính: `wwwroot/admin/customers/index.html`
- **Thanh tiêu đề và điều hướng:** Giữ phong cách thiết kế phẳng hiện đại với font chữ `Public Sans`, icon `Material Symbols Outlined`.
- **Khu vực tìm kiếm và bộ lọc:**
  - Ô input `#customerKeyword` hỗ trợ tìm kiếm đa năng.
  - Nút `#btnResetCustomerFilter` giúp xóa từ khóa và đưa bảng về trang 1.
  - Nút `#btnOpenCreateCustomerModal` mở modal thêm mới khách hàng trực tiếp, không reload trang.
- **Thẻ thống kê nhanh (Statistics Cards):**
  - `#statTotalCustomers`: Hiển thị tổng số khách hàng hiện có.
  - `#statNewThisMonth`: Số khách hàng đăng ký trong tháng hiện tại theo múi giờ Việt Nam.
  - `#statRegisteredToday`: Số khách hàng mới đăng ký trong ngày hôm nay.
- **Bảng dữ liệu khách hàng (`#customerTableBody`):**
  - Cột 1: Avatar chữ cái đầu với nền màu xanh Navy (`bg-blue-900 text-white`), Họ tên khách hàng (có thể click để xem chi tiết), Mã khách hàng `#ID`.
  - Cột 2: Thông tin liên hệ (Số điện thoại và Email với icon tương ứng).
  - Cột 3: Địa chỉ thường trú.
  - Cột 4: Số lượng tour đã đặt kèm badge bo tròn.
  - Cột 5: Ngày đăng ký định dạng `dd/MM/yyyy`.
  - Cột 6: Bộ nút tác vụ: Xem chi tiết (`.btn-view-cust`), Chỉnh sửa (`.btn-edit-cust`), Xóa (`.btn-delete-cust`).
- **Phân trang (`#customerPagination`):**
  - Tóm tắt: "Hiển thị 1–5 trên tổng số X khách hàng".
  - Nút điều hướng Previous, Next và các nút số trang động.
- **Hệ thống 4 Modals:**
  1. `#custDetailModal`: Hiển thị chi tiết khách hàng và bảng lịch sử đặt tour.
  2. `#custCreateModal`: Modal tạo mới khách hàng với đầy đủ trường thông tin.
  3. `#custEditModal`: Modal chỉnh sửa hồ sơ khách hàng.
  4. `#custDeleteModal`: Modal xác nhận xóa an toàn.

### 4.2 Trang xem chi tiết độc lập: `wwwroot/admin/customers/show.html`
- Dành cho các kịch bản cần xem toàn màn hình hoặc in ấn/trích xuất hồ sơ khách hàng.
- URL dạng: `show.html?id=12`.
- Hiển thị avatar tròn kích thước lớn, badge mã khách hàng, danh sách thông tin cá nhân và bảng lịch sử đơn đặt tour với ngày khởi hành và tổng tiền.
- Đã khắc phục lỗi hiển thị khối alert xanh rỗng bằng thuộc tính `hidden`.

### 4.3 Trang tạo mới độc lập: `wwwroot/admin/customers/create.html`
- Cung cấp form toàn trang với thông báo rõ ràng về mật khẩu mặc định `123456`.
- Sau khi gửi dữ liệu thành công, hiển thị thông báo và điều hướng về `index.html`.

### 4.4 Trang chỉnh sửa độc lập: `wwwroot/admin/customers/edit.html`
- Tải dữ liệu từ API `/api/customers/{id}` thông qua query param `id`.
- Cho phép cập nhật đầy đủ các trường thông tin.

---

## 5. PHÂN TÍCH CHI TIẾT JAVASCRIPT XỬ LÝ GIAO DIỆN (`admin-pages.js`)

Module quản lý khách hàng trong `admin-pages.js` được đóng gói trong hàm `handleCustomersIndex()` với phạm vi biến cục bộ an toàn:

### 5.1 Quản lý trạng thái phân trang và tìm kiếm
```javascript
let currentPage = 1;
const pageSize = 5;
let searchKeyword = '';
let isLoading = false;
```

### 5.2 Cơ chế gọi API thống kê thời gian thực
Hàm `fetchStats()` gửi request lên backend và điền số liệu vào 3 thẻ:
```javascript
async function fetchStats() {
  const statTotal = document.getElementById('statTotalCustomers');
  const statNewMonth = document.getElementById('statNewThisMonth');
  const statToday = document.getElementById('statRegisteredToday');

  if (window.BookingTourApi && typeof window.BookingTourApi.apiRequest === 'function') {
    try {
      const res = await window.BookingTourApi.apiRequest('/api/customers/stats');
      const data = res?.data || res || {};
      if (statTotal) statTotal.textContent = data.total_customers ?? data.totalCustomers ?? '0';
      if (statNewMonth) statNewMonth.textContent = data.new_this_month ?? data.newThisMonth ?? '0';
      if (statToday) statToday.textContent = data.registered_today ?? data.registeredToday ?? '0';
    } catch (err) {
      console.warn('Failed to load customer stats:', err);
    }
  }
}
```
*Điểm cải tiến:* Được gọi tự động khi khởi động trang `fetchStats(); fetchAndRender();` và sau mỗi thao tác tạo mới, sửa, hoặc xóa.

### 5.3 Tối ưu hóa tìm kiếm với kỹ thuật Debounce
Khi người dùng gõ vào ô tìm kiếm, hàm sẽ chờ 350ms sau phím gõ cuối cùng mới kích hoạt truy vấn mạng, tránh làm quá tải MongoDB:
```javascript
let searchDebounceTimer = null;
const keywordInput = document.getElementById('customerKeyword');
if (keywordInput) {
  keywordInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchKeyword = (keywordInput.value || '').trim();
      currentPage = 1;
      fetchAndRender();
    }, 350);
  });
}
```

### 5.4 Xử lý Modal Thêm mới Khách hàng ngay trên trang
```javascript
if (createForm) {
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Validate email regex và mật khẩu tối thiểu 6 ký tự
    // Gửi POST /api/customers
    // Đóng modal, hiển thị toast thành công, cập nhật stats và render lại bảng
  });
}
```

### 5.5 Đóng Modal bằng phím Escape và click Backdrop
```javascript
// Đóng khi click ngoài khung modal
[detailModal, editModal, deleteModal, createModal].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
});

// Đóng khi nhấn phím Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDetailModal();
    closeEditModal();
    closeDeleteModal();
    closeCreateModal();
  }
});
```

---

## 6. PHÂN TÍCH DTO VÀ DATA CONTRACTS (`AdminDtos.cs`)

### 6.1 `CustomerCreateRequest`
```csharp
public class CustomerCreateRequest
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string? FullNameCamel { set { if (!string.IsNullOrWhiteSpace(value)) FullName = value; } }

    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [JsonPropertyName("birthday")]
    public DateTime? Birthday { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }
}
```
*Tối ưu hóa:* `Password` được để dạng linh hoạt. Nếu người dùng không nhập, service sẽ tự động gán giá trị mặc định `"123456"`. Nếu có nhập, service sẽ kiểm tra độ dài tối thiểu $\ge 6$ ký tự.

### 6.2 `CustomerUpdateRequest`
Được thiết kế nhằm tránh ghi đè sai thông tin:
- Ngăn chặn việc sửa trường `Id`.
- Chỉ cập nhật các thông tin cá nhân: `FullName`, `Email`, `Phone`, `Address`, `Birthday`.

### 6.3 `CustomerStatsDto`
```csharp
public class CustomerStatsDto
{
    [JsonPropertyName("total_customers")]
    public int TotalCustomers { get; set; }

    [JsonPropertyName("new_this_month")]
    public int NewThisMonth { get; set; }

    [JsonPropertyName("registered_today")]
    public int RegisteredToday { get; set; }
}
```

---

## 7. PHÂN TÍCH MONGODB COLLECTION VÀ MODEL (`Customer.cs`, `Booking.cs`, `Payment.cs`)

### 7.1 Entity `Customer` (`Models/Customer.cs`)
```csharp
public class Customer : BaseEntity
{
    [BsonElement("email")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("password_hash")]
    [JsonIgnore] // Bảo mật: Không bao giờ trả hash mật khẩu ra API client
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("full_name")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("phone")]
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [BsonElement("address")]
    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [BsonElement("birthday")]
    [JsonPropertyName("birthday")]
    public DateTime? Birthday { get; set; }

    [BsonIgnore] // Không lưu trong document customers mà tính toán động
    [JsonPropertyName("booking_count")]
    public int BookingCount { get; set; }

    [BsonIgnore]
    [JsonPropertyName("bookings")]
    public List<Booking> Bookings { get; set; } = new();
}
```

### 7.2 Tính toàn vẹn quan hệ trong NoSQL
Trong cơ sở dữ liệu MongoDB phi quan hệ, quan hệ giữa các bảng không có khóa ngoại (Foreign Key Constraints) tự động ở mức database engine. Do đó, việc duy trì toàn vẹn dữ liệu phụ thuộc vào tầng **Application / Service Layer**:
- Mỗi đơn đặt tour (`Booking`) lưu trường `customer_id`.
- Mỗi bản ghi thanh toán (`Payment`) lưu trường `customer_id` hoặc liên kết qua `booking_id`.
- Mỗi đánh giá tour (`Review`) lưu trường `customer_id`.
Khi xóa khách hàng, hệ thống bắt buộc kiểm tra sự tồn tại của các bản ghi phụ thuộc này trước khi thực thi lệnh `DeleteOneAsync`.

---

## 8. PHÂN TÍCH API CONTROLLER (`CustomersController.cs`)

`CustomersController` được đặt tại Route `api/[controller]` (`api/customers`), bảo vệ bằng thuộc tính `[Authorize]`:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Sale")]
public class CustomersController : ControllerBase
{
    private readonly IAdminManagementService _service;

    public CustomersController(IAdminManagementService service)
    {
        _service = service;
    }

    // 1. Lấy danh sách khách hàng có phân trang & tìm kiếm
    [HttpGet]
    [HttpGet("/customers")]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? keyword, [FromQuery] int page = 1, [FromQuery] int pageSize = 5);

    // 2. Lấy số liệu thống kê thời gian thực
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats();

    // 3. Lấy chi tiết khách hàng và toàn bộ lịch sử tour
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id);

    // 4. Lấy riêng danh sách booking của khách hàng
    [HttpGet("{id:int}/bookings")]
    public async Task<IActionResult> GetBookings(int id);

    // 5. Thêm mới khách hàng
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerCreateRequest request);

    // 6. Cập nhật thông tin khách hàng
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerUpdateRequest request);

    // 7. Xóa khách hàng (Chỉ Admin mới có quyền thực thi)
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id);
}
```

---

## 9. PHÂN TÍCH BUSINESS LOGIC & SERVICE (`AdminManagementService.cs`)

### 9.1 Tra cứu danh sách và tính toán số lượng tour (`GetCustomersAsync`)
```csharp
public async Task<(List<Customer> Items, long TotalCount)> GetCustomersAsync(string? search, int page = 1, int pageSize = 5)
{
    var builder = Builders<Customer>.Filter;
    var filter = builder.Empty;

    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim();
        var regex = new MongoDB.Bson.BsonRegularExpression(s, "i");
        var filters = new List<FilterDefinition<Customer>>
        {
            builder.Regex(c => c.FullName, regex),
            builder.Regex(c => c.Email, regex),
            builder.Regex(c => c.Phone, regex),
            builder.Regex(c => c.Address, regex)
        };

        if (int.TryParse(s, out var idVal))
        {
            filters.Add(builder.Eq(c => c.Id, idVal));
        }
        else
        {
            // Trích xuất số nếu người dùng gõ "#5" hoặc "KH05"
            var cleanIdStr = System.Text.RegularExpressions.Regex.Replace(s, @"[^\d]", "");
            if (!string.IsNullOrEmpty(cleanIdStr) && int.TryParse(cleanIdStr, out var parsedId))
            {
                filters.Add(builder.Eq(c => c.Id, parsedId));
            }
        }
        filter = builder.Or(filters);
    }

    var total = await _context.Customers.CountDocumentsAsync(filter);
    var p = page > 0 ? page : 1;
    var ps = pageSize > 0 ? Math.Min(pageSize, 100) : 5;

    var items = await _context.Customers.Find(filter)
        .SortByDescending(c => c.Id)
        .Skip((p - 1) * ps)
        .Limit(ps)
        .ToListAsync();

    // Nạp số lượng booking cho từng khách hàng theo batching hiệu quả
    if (items.Any())
    {
        var customerIds = items.Select(c => c.Id).ToList();
        var bookings = await _context.Bookings.Find(b => customerIds.Contains(b.CustomerId)).ToListAsync();
        var bookingCounts = bookings.GroupBy(b => b.CustomerId).ToDictionary(g => g.Key, g => g.Count());
        foreach (var c in items)
        {
            c.BookingCount = bookingCounts.TryGetValue(c.Id, out var count) ? count : 0;
        }
    }

    return (items, total);
}
```

### 9.2 Thêm mới khách hàng (`CreateCustomerAsync`)
1. Kiểm tra rỗng Họ tên và Email.
2. Kiểm tra trùng Email trong hệ thống: `_context.Customers.Find(c => c.Email.ToLower() == trimmedEmail).AnyAsync()`.
3. Kiểm tra trùng Số điện thoại: `_context.Customers.Find(c => c.Phone == trimmedPhone).AnyAsync()`.
4. Sinh khóa chính tự tăng an toàn: `await _context.GetNextSequenceAsync("customers")`.
5. Băm mật khẩu bằng thuật toán an toàn: `BCrypt.Net.BCrypt.HashPassword(password)`.
6. Chèn vào MongoDB: `await _context.Customers.InsertOneAsync(customer)`.

### 9.3 Kiểm tra toàn vẹn khi xóa khách hàng (`DeleteCustomerAsync`)
```csharp
public async Task<bool> DeleteCustomerAsync(int id)
{
    var customer = await _context.Customers.Find(c => c.Id == id).FirstOrDefaultAsync()
                   ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng mã {id}.");

    // 1. Kiểm tra đơn đặt tour
    var customerBookingIds = await _context.Bookings.Find(b => b.CustomerId == id).Project(b => b.Id).ToListAsync();
    if (customerBookingIds.Count > 0)
    {
        throw new InvalidOperationException($"Không thể xóa khách hàng '{customer.FullName}' vì khách hàng đã có {customerBookingIds.Count} đơn đặt tour trong hệ thống.");
    }

    // 2. Kiểm tra lịch sử thanh toán
    var hasPayments = await _context.Payments.Find(p => p.CustomerId == id).AnyAsync();
    if (hasPayments)
    {
        throw new InvalidOperationException($"Không thể xóa khách hàng '{customer.FullName}' vì đang có giao dịch thanh toán liên kết.");
    }

    // 3. Kiểm tra đánh giá tour
    var hasReviews = await _context.Reviews.Find(r => r.CustomerId == id).AnyAsync();
    if (hasReviews)
    {
        throw new InvalidOperationException($"Không thể xóa khách hàng '{customer.FullName}' vì đã có đánh giá tour trong hệ thống.");
    }

    var result = await _context.Customers.DeleteOneAsync(c => c.Id == id);
    return result.DeletedCount > 0;
}
```

---

## 10. CƠ CHẾ THỐNG KÊ THỜI GIAN THỰC (REAL-TIME STATS)

Để giải quyết triệt để vấn đề lệch múi giờ giữa máy chủ (UTC) và người dùng Việt Nam (UTC+7):
```csharp
public async Task<CustomerStatsDto> GetCustomerStatsAsync()
{
    // Chuyển sang giờ Việt Nam (UTC+7) để xác định chính xác ngày và tháng hiện tại
    var vnNow = DateTime.UtcNow.AddHours(7);
    var vnStartOfMonth = new DateTime(vnNow.Year, vnNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7);
    var vnStartOfDay = new DateTime(vnNow.Year, vnNow.Month, vnNow.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7);

    var total = (int)await _context.Customers.CountDocumentsAsync(_ => true);
    var newMonth = (int)await _context.Customers.CountDocumentsAsync(c => c.CreatedAt >= vnStartOfMonth);
    var today = (int)await _context.Customers.CountDocumentsAsync(c => c.CreatedAt >= vnStartOfDay);

    return new CustomerStatsDto
    {
        TotalCustomers = total,
        NewThisMonth = newMonth,
        RegisteredToday = today
    };
}
```
Khi người dùng tải trang `admin/customers/index.html`, Javascript tự động gọi API `/api/customers/stats` và render các số liệu này vào 3 card ở đầu trang.

---

## 11. CƠ CHẾ TÌM KIẾM THÔNG MINH, DEBOUNCE VÀ PHÂN TRANG SERVER-SIDE

1. **Tìm kiếm tức thì (Debounced Search):**
   - Đặt thời gian trễ $350\text{ ms}$.
   - Tự động reset trang hiện tại về `page = 1`.
   - Gửi yêu cầu qua Query String: `?page=1&pageSize=5&search=...`.
2. **Tìm kiếm đa trường:**
   - Họ và tên (không phân biệt hoa thường).
   - Địa chỉ Email.
   - Số điện thoại.
   - Địa chỉ nơi ở.
   - Mã khách hàng (hỗ trợ cả gõ `12`, `#12`, `KH12`).
3. **Phân trang Server-Side:**
   - Dùng `.Skip((page - 1) * pageSize).Limit(pageSize)`.
   - Tính tổng trang `Math.Ceiling(totalItems / pageSize)`.
   - Sinh danh sách các nút phân trang linh hoạt, tự vô hiệu hóa nút Previous khi ở trang 1 và nút Next khi ở trang cuối.

---

## 12. MODAL XEM CHI TIẾT KHÁCH HÀNG VÀ LỊCH SỬ ĐẶT TOUR

Khi bấm vào tên khách hàng hoặc nút xem chi tiết (`.btn-view-cust`), hàm `openDetailModal(id)` thực thi:
1. Mở modal `#custDetailModal`, hiển thị spinner loading `#custDetailLoading`.
2. Gọi API `GET /api/customers/{id}` (Backend tự động populate danh sách `Bookings` và thông tin ngày giờ khởi hành từ `TourDepartures`).
3. Điền các trường thông tin: Họ tên, Email, Số điện thoại, Địa chỉ, Ngày sinh, Ngày tham gia.
4. Render bảng lịch sử đặt tour kèm badge trạng thái:
   - `confirmed`: "Đã xác nhận" (Xanh lá).
   - `pending`: "Chờ xác nhận" (Vàng hổ phách).
   - `paid`: "Đã thanh toán" (Xanh ngọc).
   - `completed`: "Hoàn thành" (Xanh dương).
   - `cancelled`: "Đã hủy" (Đỏ).
5. Cung cấp nút chuyển tiếp sang trang riêng `show.html?id={id}` và nút "Chỉnh sửa" mở ngay modal sửa.

---

## 13. MODAL THÊM MỚI KHÁCH HÀNG

1. **Giao diện:** Tích hợp trực tiếp trên `index.html` trong thẻ `#custCreateModal`.
2. **Các trường thông tin:**
   - Họ và tên (Bắt buộc).
   - Email (Bắt buộc, kiểm tra định dạng RFC 5322).
   - Số điện thoại (Tùy chọn).
   - Ngày sinh (Tùy chọn, input date).
   - Mật khẩu ban đầu (Tùy chọn, để trống dùng mặc định `123456`).
   - Địa chỉ liên hệ (Tùy chọn).
3. **Quy trình xử lý:**
   - Bấm "Thêm khách hàng" -> Form hiển thị trạng thái `Đang thêm...` kèm spinner và vô hiệu hóa nút submit để ngăn double submit.
   - Thành công: Đóng modal, hiển thị toast thông báo màu xanh lá, gọi `fetchStats()` và tải lại trang 1.
   - Thất bại: Hiển thị hộp lỗi `#modalCreateError` ngay trong modal với thông báo từ backend (ví dụ: "Email '...' đã được đăng ký trong hệ thống").

---

## 14. MODAL CHỈNH SỬA HỒ SƠ KHÁCH HÀNG

1. **Giao diện:** `#custEditModal` trên `index.html`.
2. **Khóa an toàn:** Input `modalEdit_id` được đặt `readonly` và `disabled` với giao diện màu xám nhằm đảm bảo người dùng không thể can thiệp sửa đổi khóa chính MongoDB.
3. **Quy trình kiểm tra tính duy nhất (Uniqueness Check):**
   - Backend kiểm tra email và số điện thoại mới có bị trùng với **khách hàng khác** hay không (`c.Email == newEmail && c.Id != id`).
   - Nếu không trùng, tiến hành cập nhật document và đặt lại `UpdatedAt = DateTime.UtcNow`.

---

## 15. MODAL XÓA KHÁCH HÀNG VÀ BẢO TOÀN DỮ LIỆU (CONSTRAINT CHECKS)

1. **Giao diện xác nhận:** `#custDeleteModal` với icon cảnh báo màu đỏ, hiển thị rõ tên và mã khách hàng cần xóa.
2. **Cơ chế phòng ngừa rủi ro:**
   - Nếu khách hàng có đơn đặt tour trong collection `Bookings`: Từ chối xóa ngay lập tức, trả về HTTP 400 Bad Request kèm thông báo: *"Không thể xóa khách hàng '...' vì khách hàng đã có X đơn đặt tour trong hệ thống."*
   - Nếu khách hàng có lịch sử thanh toán trong collection `Payments`: Từ chối xóa.
   - Nếu khách hàng có đánh giá tour trong collection `Reviews`: Từ chối xóa.
3. **Xử lý giao diện:** Sau khi xóa thành công một khách hàng, nếu hàng cuối cùng của trang bị xóa, hệ thống tự động lùi về trang trước đó (`currentPage--`).

---

## 16. PHÂN QUYỀN VÀ BẢO MẬT (AUTHORIZATION: ADMIN VS SALE)

1. **Xác thực JWT (JSON Web Token):** Toàn bộ các API của `CustomersController` đều yêu cầu Bearer Token hợp lệ. Client lưu trữ token trong `localStorage` và tự động đính kèm qua header `Authorization: Bearer <token>`.
2. **Phân quyền vai trò (Role-Based Access Control):**
   - **Tất cả các endpoint đọc, tạo, sửa:** Cho phép cả `Admin` và `Sale`.
   - **Endpoint xóa (`DELETE /api/customers/{id}`):** Khóa độc quyền cho `Admin` thông qua thuộc tính:
     ```csharp
     [HttpDelete("{id:int}")]
     [Authorize(Roles = "Admin")]
     public async Task<IActionResult> Delete(int id)
     ```
   - Khi nhân viên `Sale` gửi request xóa, ASP.NET Core sẽ tự động chặn lại ở tầng Authorization Filter và trả về mã trạng thái `403 Forbidden`.

---

## 17. KIỂM SOÁT MÃ HÓA MẬT KHẨU (BCRYPT HASHING)

- Hệ thống tuyệt đối không lưu trữ mật khẩu ở dạng plain text (văn bản thuần).
- Sử dụng thư viện `BCrypt.Net-Next` với salt được tạo tự động:
  ```csharp
  customer.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
  ```
- Thuộc tính `[JsonIgnore]` trên trường `PasswordHash` của model `Customer` đảm bảo mã băm không bao giờ bị rò rỉ trong các response JSON gửi về client.

---

## 18. XỬ LÝ MÚI GIỜ VÀ THỜI GIAN (UTC VS VIETNAM TIME)

- **Lưu trữ CSDL (Database):** Toàn bộ các trường thời gian (`CreatedAt`, `UpdatedAt`, `Birthday`) được lưu trữ chuẩn UTC trong MongoDB (`DateTimeKind.Utc`).
- **Xử lý nghiệp vụ Backend:** Khi tính toán thống kê ngày hôm nay hoặc tháng này, backend quy đổi theo độ lệch $+7\text{ giờ}$ của múi giờ `SE Asia Standard Time`.
- **Hiển thị Client:** Sử dụng hàm tiện ích `formatDate(dateStr)` dùng `toLocaleDateString('vi-VN')` để hiển thị định dạng chuẩn Việt Nam (`dd/MM/yyyy`). Input date được chuẩn hóa thông qua hàm `toVietnamDateInput()`.

---

## 19. XỬ LÝ NGOẠI LỆ VÀ PHẢN HỒI CHUẨN (`ApiResponse<T>`)

Tất cả các API trả về cấu trúc đồng nhất:
```json
{
  "success": true,
  "message": "Thao tác thành công.",
  "data": { ... },
  "total": 100,
  "page": 1,
  "pageSize": 5,
  "totalPages": 20
}
```
Khi xảy ra lỗi:
- Lỗi trùng email/sđt: Trả về HTTP 409 Conflict hoặc 400 Bad Request với `success: false`, `message: "Email '...' đã được đăng ký trong hệ thống."`.
- Lỗi không tìm thấy: Trả về HTTP 404 Not Found.
- Lỗi ràng buộc toàn vẹn: Trả về HTTP 400 Bad Request với lý do chi tiết.

---

## 20. TRẢI NGHIỆM NGƯỜI DÙNG (UX / ACCESSIBILITY)

1. **Auto-focus:** Khi mở modal thêm mới hoặc chỉnh sửa, con trỏ tự động focus vào trường Họ và tên.
2. **Keyboard Navigation:** Nhấn phím `Escape` bất cứ lúc nào sẽ đóng modal đang mở.
3. **Backdrop Click:** Click vào vùng xám mờ ngoài modal sẽ đóng modal ngay lập tức.
4. **Loading States:** Hiển thị spinner chuyển động tròn khi đang tải danh sách hoặc đang thực thi lưu dữ liệu, nút bấm chuyển sang trạng thái disabled để tránh thao tác lặp.

---

## 21. QUY TRÌNH KIỂM THỬ THỰC TẾ VÀ KẾT QUẢ XÁC MINH

| # | Kịch bản kiểm thử (Test Case) | Dữ liệu đầu vào | Kết quả kỳ vọng | Kết quả thực tế | Trạng thái |
|---|-------------------------------|-----------------|-----------------|-----------------|------------|
| 1 | Khởi động trang danh sách | Truy cập `admin/customers/index.html` | 3 thẻ thống kê hiển thị số thực từ MongoDB, bảng dữ liệu hiển thị phân trang 5 khách hàng | Thống kê hiển thị số thực, bảng nạp nhanh, avatar hiển thị chữ cái đầu | **PASS** |
| 2 | Mở modal Thêm mới khách hàng | Bấm nút "Thêm khách hàng" | Modal `#custCreateModal` mở ra, form trống, con trỏ tự focus ô Họ tên | Modal mở mượt mà, focus chuẩn | **PASS** |
| 3 | Tạo khách hàng không nhập mật khẩu | Điền Họ tên, Email hợp lệ, để trống ô mật khẩu | Khách hàng được tạo với mật khẩu mặc định `123456`, đóng modal, tăng thẻ thống kê | Tạo thành công HTTP 201 Created, thẻ thống kê cập nhật ngay | **PASS** |
| 4 | Tạo khách hàng trùng Email | Điền email đã có trong CSDL | Backend trả lỗi 400/409, modal hiển thị thông báo lỗi rõ ràng | Báo lỗi email đã tồn tại, không lưu dữ liệu trùng | **PASS** |
| 5 | Tìm kiếm theo họ tên có Debounce | Gõ "Nguyễn" vào ô tìm kiếm | Không reload trang, sau 350ms bảng tự động lọc các khách hàng có tên "Nguyễn" | Tự động lọc mượt mà | **PASS** |
| 6 | Tìm kiếm theo mã khách hàng | Gõ "#1" hoặc "1" | Lọc ra đúng khách hàng có ID = 1 | Lọc chính xác theo ID | **PASS** |
| 7 | Xem chi tiết khách hàng có tour | Bấm vào khách hàng đã đặt tour | Modal chi tiết hiển thị đầy đủ thông tin cá nhân và bảng các tour đã đặt kèm badge trạng thái | Hiển thị chính xác các đơn hàng | **PASS** |
| 8 | Sửa thông tin khách hàng | Thay đổi số điện thoại và địa chỉ | Thông tin được lưu vào MongoDB, cập nhật ngay trên bảng danh sách | Cập nhật thành công | **PASS** |
| 9 | Xóa khách hàng đã có tour | Bấm xóa khách hàng có booking | Modal cảnh báo mở ra; khi xác nhận, backend chặn lại và báo lỗi toàn vẹn | Bị chặn an toàn HTTP 400, không bị xóa | **PASS** |
| 10| Đóng modal bằng phím Escape | Mở modal và ấn phím `Escape` trên bàn phím | Modal lập tức biến mất | Đóng modal tức thì | **PASS** |
| 11| Kiểm tra biên dịch C# | Chạy `dotnet build --no-restore -t:Compile` | Biên dịch thành công 0 Warning, 0 Error | **0 Warning, 0 Error** | **PASS** |

---

## 22. NHẬT KÝ CHỈNH SỬA CHI TIẾT (CHANGELOG FILE-BY-FILE)

### 1. `Controllers/CustomersController.cs`
- Thêm endpoint `[HttpGet("{id:int}/bookings")]` để cung cấp lịch sử đặt tour riêng biệt theo chuẩn RESTful.
- Thêm thuộc tính `[Authorize(Roles = "Admin")]` cho endpoint `Delete(int id)`, ngăn chặn nhân viên `Sale` xóa khách hàng.

### 2. `DTOs/AdminDtos.cs`
- Trong `CustomerCreateRequest`: Loại bỏ ràng buộc cứng `[MinLength(8)]` trên trường `Password` để hỗ trợ mật khẩu mặc định `123456` (6 ký tự) khi quản trị viên tạo nhanh khách hàng.

### 3. `Services/AdminManagementService.cs`
- Trong `GetCustomersAsync`: Tối ưu hóa bộ lọc tìm kiếm bằng Regex trích xuất số nguyên khi người dùng tìm kiếm theo mã `#ID` hoặc `KH-ID`.
- Trong `GetCustomerStatsAsync`: Bổ sung tính toán thời gian bắt đầu ngày và bắt đầu tháng theo múi giờ Việt Nam (UTC+7).
- Trong `CreateCustomerAsync`: Thêm kiểm tra độ dài tối thiểu 6 ký tự cho mật khẩu khi có nhập; tự động fallback về `"123456"` khi để trống.
- Trong `DeleteCustomerAsync`: Tách biệt và kiểm tra độc lập cả 3 collection `Bookings`, `Payments`, và `Reviews` trước khi cho phép xóa tài khoản khách hàng.

### 4. `wwwroot/admin/customers/index.html`
- Chuyển thẻ `<a>` "Thêm khách hàng" thành nút `<button id="btnOpenCreateCustomerModal">` để kích hoạt modal trực tiếp.
- Bổ sung cấu trúc HTML cho Modal Thêm mới Khách hàng `#custCreateModal`.
- Hoàn thiện các thuộc tính và icon của 4 modal.

### 5. `wwwroot/admin/customers/show.html`
- Đặt thuộc tính `hidden` và id `#showCustomerAlertSuccess` cho thẻ div thông báo màu xanh rỗng ở dòng 153.

### 6. `wwwroot/assets/js/admin-pages.js`
- Bổ sung gọi `fetchStats()` ngay khi khởi tạo trang trong `handleCustomersIndex()`.
- Bổ sung gọi `fetchStats()` sau khi hoàn tất chỉnh sửa khách hàng trong `openEditModal()`.
- Xây dựng hoàn chỉnh logic mở, đóng và submit cho `#custCreateModal`.
- Tích hợp đóng modal qua backdrop click và phím `Escape` cho tất cả 4 modal.
- Bổ sung tìm kiếm tự động với Debounce 350ms trên ô input `#customerKeyword`.
- Bổ sung các badge trạng thái đơn đặt tour đa dạng (`paid`, `completed`, v.v.) trong modal xem chi tiết.

---

## 23. HƯỚNG DẪN DEMO VÀ KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN

### Kịch bản thuyết trình 5 phút ấn tượng trước Hội đồng:
1. **Phút 1: Giới thiệu kiến trúc module:**
   - "Kính thưa Thầy/Cô, module Quản lý Khách hàng của hệ thống được xây dựng theo mô hình phân tầng RESTful Web API kết hợp cơ sở dữ liệu MongoDB NoSQL. Đây là nơi quản lý toàn bộ hồ sơ khách hàng, phân tích mức độ gắn kết thông qua lịch sử booking và đảm bảo an toàn dữ liệu cá nhân."
2. **Phút 2: Demo số liệu thống kê thời gian thực & Tìm kiếm Debounce:**
   - Mở trang `admin/customers/index.html`.
   - Chỉ vào 3 thẻ thống kê: "Số liệu Tổng khách hàng, Khách mới tháng này và Đăng ký hôm nay được tính toán trực tiếp từ MongoDB theo múi giờ Việt Nam UTC+7."
   - Gõ vào ô tìm kiếm tên một khách hàng bất kỳ: "Hệ thống áp dụng cơ chế Debounce 350ms, giúp tìm kiếm tức thì theo Họ tên, Email, SĐT hoặc Mã khách hàng mà không cần bấm Enter hay tải lại trang."
3. **Phút 3: Demo Thêm mới khách hàng bằng In-page Modal:**
   - Bấm nút "Thêm khách hàng", mở modal `#custCreateModal`.
   - Nhập thông tin: Họ tên, Email, SĐT và để trống ô mật khẩu.
   - Bấm "Thêm khách hàng": "Hệ thống tự động cấp mật khẩu mặc định `123456`, mã hóa băm một chiều an toàn bằng BCrypt và lưu vào MongoDB. Ngay lập tức thẻ thống kê tự động nhảy số mà không cần F5."
4. **Phút 4: Demo Xem chi tiết và Lịch sử đơn đặt tour:**
   - Bấm vào tên khách hàng vừa tạo hoặc khách hàng đã có đơn đặt tour.
   - "Modal chi tiết hiển thị toàn bộ hồ sơ khách hàng cùng bảng lịch sử đặt tour, ngày khởi hành và tổng tiền được trích xuất qua cơ chế Aggregation từ collection Bookings."
5. **Phút 5: Demo Cơ chế Bảo toàn Dữ liệu (Constraint Checks) & Phân quyền:**
   - Chọn một khách hàng đã có lịch sử đặt tour và bấm nút Xóa.
   - Bấm "Xác nhận xóa": "Hệ thống từ chối xóa và hiển thị thông báo lỗi bảo toàn toàn vẹn dữ liệu. Trong NoSQL không có Foreign Key vật lý, do đó nhóm em đã cài đặt cơ chế kiểm soát 3 lớp tại Service Layer để bảo vệ tính toàn vẹn của dữ liệu."

---

## 24. BỘ CÂU HỎI PHẢN BIỆN CHUYÊN SÂU DÀNH CHO GIẢNG VIÊN (25 Q&A)

### Câu 1: Tại sao trong MongoDB không có khóa ngoại (Foreign Key) mà hệ thống vẫn ngăn chặn được việc xóa khách hàng khi đã có đơn đặt tour?
**Trả lời:** MongoDB là cơ sở dữ liệu NoSQL hướng tài liệu (Document Database), không hỗ trợ ràng buộc khóa ngoại (Foreign Key Constraints) ở mức database engine như SQL RDBMS. Để bảo đảm toàn vẹn dữ liệu (Referential Integrity), nhóm đã hiện thực hóa kiểm tra ràng buộc ở **Tầng Dịch vụ (Application/Service Layer)** trong hàm `DeleteCustomerAsync`. Trước khi thực hiện lệnh xóa, hệ thống truy vấn kiểm tra collection `Bookings`, `Payments`, và `Reviews`. Nếu tồn tại bất kỳ bản ghi nào liên quan đến `CustomerId`, hệ thống sẽ ném ra ngoại lệ `InvalidOperationException` và dừng giao dịch.

### Câu 2: Mật khẩu khách hàng được lưu trữ như thế nào trong cơ sở dữ liệu? Có thể xem lại mật khẩu ban đầu được không?
**Trả lời:** Mật khẩu được mã hóa băm một chiều bằng thuật toán **BCrypt** (`BCrypt.Net.BCrypt.HashPassword(password)`). BCrypt tự động kết hợp salt ngẫu nhiên và cost factor chống tấn công dò mật khẩu (Brute-force / Rainbow Table). Vì là hàm băm một chiều (One-way Hashing), ngay cả quản trị viên hệ thống cũng **không thể** dịch ngược hay xem lại mật khẩu gốc. Khi khách hàng đăng nhập, hệ thống sẽ dùng `BCrypt.Verify(inputPassword, storedHash)` để kiểm tra tính hợp lệ.

### Câu 3: Làm thế nào để đảm bảo số liệu "Đăng ký hôm nay" và "Mới trong tháng" không bị sai lệch do máy chủ đặt ở nước ngoài (chênh lệch múi giờ)?
**Trả lời:** Máy chủ thường chạy với giờ UTC ($+0$). Nếu tính ngày hôm nay bằng `DateTime.UtcNow.Date`, từ 0h đến 7h sáng giờ Việt Nam, máy chủ vẫn tính là ngày hôm trước. Nhóm đã giải quyết bằng cách lấy thời gian hiện tại cộng thêm 7 tiếng (`DateTime.UtcNow.AddHours(7)`) để xác định đúng ngày và tháng theo giờ Việt Nam, sau đó trừ đi 7 tiếng để chuyển mốc thời gian đó về chuẩn UTC khi truy vấn so sánh với trường `CreatedAt` trong MongoDB.

### Câu 4: Kỹ thuật Debounce trên ô tìm kiếm hoạt động như thế nào và đem lại lợi ích gì?
**Trả lời:** Debounce là kỹ thuật trì hoãn việc thực thi hàm cho đến khi người dùng ngừng thao tác trong một khoảng thời gian xác định (ở đây là $350\text{ ms}$). Nếu không có debounce, mỗi khi người dùng gõ 1 ký tự, hệ thống sẽ lập tức gửi 1 request lên server. Với từ khóa "Nguyễn", trình duyệt sẽ gửi 6 request liên tiếp gây lãng phí băng thông và nghẽn tài nguyên server. Với debounce, hệ thống chỉ gửi duy nhất 1 request sau khi người dùng dừng gõ.

### Câu 5: Trường `BookingCount` và `Bookings` trong model `Customer` có được lưu vào collection `customers` trong MongoDB không?
**Trả lời:** Không. Hai trường này được đánh dấu thuộc tính `[BsonIgnore]`. Trong MongoDB, document `Customer` chỉ lưu thông tin cá nhân cơ bản. Khi gọi API `GetCustomersAsync`, backend thực hiện truy vấn gom nhóm (`GroupBy`) trên collection `Bookings` theo danh sách các `CustomerId` của trang hiện tại và gán vào `BookingCount`. Điều này giúp dữ liệu không bị dư thừa (redundant) và luôn phản ánh chính xác số lượng tour thực tế.

### Câu 6: Làm thế nào hệ thống ngăn chặn việc nhân viên Sale thực hiện thao tác xóa khách hàng?
**Trả lời:** Hệ thống áp dụng cơ chế **Role-Based Access Control (RBAC)** của ASP.NET Core. Ở mức Controller, toàn bộ controller được gán `[Authorize(Roles = "Admin,Sale")]`, nhưng riêng action `Delete(int id)` được ghi đè bằng thuộc tính nghiêm ngặt `[Authorize(Roles = "Admin")]`. Khi một token JWT có Claim Role là `Sale` gửi request `DELETE /api/customers/{id}`, ASP.NET Core Authorization Middleware sẽ từ chối ngay lập tức với mã HTTP 403 Forbidden trước khi request đến được Controller.

### Câu 7: Cơ chế sinh mã khách hàng tự tăng (Sequence ID) trong MongoDB được thực hiện như thế nào?
**Trả lời:** Mặc định MongoDB sinh trường `_id` kiểu ObjectId 12-byte dạng chuỗi thập lục phân. Để tạo mã khách hàng là số nguyên tự tăng dễ nhớ (`Id = 1, 2, 3...`), nhóm sử dụng một collection riêng có tên là `counters`. Khi cần tạo khách hàng mới, hàm `GetNextSequenceAsync("customers")` sẽ thực thi lệnh nguyên tử `FindOneAndUpdateAsync` với toán tử `$inc: { seq: 1 }` để trả về số tiếp theo duy nhất, đảm bảo an toàn ngay cả trong môi trường đa luồng (thread-safe).

### Câu 8: Tại sao không dùng truy vấn Regex trong MongoDB cho tất cả các tìm kiếm mà lại cần tách riêng tìm theo ID?
**Trả lời:** Vì trong C# Model và MongoDB, trường `Id` được lưu dưới dạng số nguyên `int` (`BsonType.Int32`), còn toán tử Regex của MongoDB chỉ hoạt động trên kiểu dữ liệu chuỗi (String). Nếu áp dụng Regex trực tiếp lên trường kiểu số sẽ gây ra lỗi runtime hoặc không khớp. Do đó, hệ thống sử dụng Regex trích xuất chuỗi số `int.TryParse`, sau đó thêm điều kiện `builder.Eq(c => c.Id, idVal)` vào bộ lọc OR.

### Câu 9: Tại sao khi cập nhật khách hàng cần phải kiểm tra trùng email với điều kiện `c.Id != id`?
**Trả lời:** Khi một khách hàng giữ nguyên email cũ và chỉ cập nhật số điện thoại hoặc địa chỉ, nếu chỉ kiểm tra đơn thuần `email == request.Email` thì hệ thống sẽ tìm thấy chính bản ghi của khách hàng đó và báo lỗi "Email đã tồn tại". Điều kiện `c.Id != id` loại trừ chính khách hàng đang được chỉnh sửa, chỉ báo lỗi nếu email này đã bị tài khoản khác sử dụng.

### Câu 10: Nút "Thêm khách hàng" mở modal trên trang danh sách có ưu điểm gì so với việc điều hướng sang trang `create.html`?
**Trả lời:** Giúp nâng cao trải nghiệm người dùng (UX) theo chuẩn ứng dụng web hiện đại (SPA): người quản trị không bị mất ngữ cảnh của trang danh sách, không phải chờ tải lại toàn bộ tài nguyên tĩnh (CSS, JS, layout), và sau khi thêm thành công, bảng dữ liệu và thẻ thống kê được làm mới tức thì. Trang `create.html` vẫn được giữ lại để đáp ứng các kịch bản người dùng mở tab mới hoặc sử dụng bookmark trực tiếp.

### Câu 11: Làm thế nào để đóng modal nhanh trong trường hợp người dùng thao tác bằng bàn phím hoặc chuột?
**Trả lời:** Hệ thống lắng nghe 2 sự kiện:
1. Sự kiện bàn phím `keydown` kiểm tra `e.key === 'Escape'` để đóng bất kỳ modal nào đang mở.
2. Sự kiện click trên từng modal container: nếu `e.target === modal` (người dùng click vào vùng lớp phủ mờ bên ngoài), modal sẽ tự động ẩn đi.

### Câu 12: Tại sao trường `password` trong `CustomerCreateRequest` lại là nullable (`string?`)?
**Trả lời:** Vì trong nghiệp vụ thực tế của bộ phận chăm sóc khách hàng, quản trị viên thường cần tạo nhanh tài khoản cho khách đặt tour qua điện thoại mà không cần đặt mật khẩu riêng. Khi `Password` là `null` hoặc chuỗi rỗng, Service sẽ tự động thiết lập mật khẩu mặc định là `"123456"`. Nếu đặt `[Required]` hoặc `[MinLength(8)]` trên DTO, hệ sinh thái model validation sẽ chặn request trước khi đến được Service.

### Câu 13: Xử lý ngoại lệ trong `CustomersController` được cấu trúc ra sao?
**Trả lời:** Controller sử dụng các khối `try-catch` chuyên biệt:
- Bắt `KeyNotFoundException`: Trả về `404 Not Found`.
- Bắt `ArgumentException`: Trả về `409 Conflict` (ví dụ trùng email/sđt) hoặc `400 Bad Request`.
- Bắt `InvalidOperationException`: Trả về `400 Bad Request` (ví dụ vi phạm ràng buộc toàn vẹn khi xóa).
- Bắt `Exception` chung: Trả về `400 Bad Request` hoặc `500 Internal Server Error` với thông báo lỗi an toàn.

### Câu 14: Tại sao phân trang lại dùng `.Skip((p - 1) * ps).Limit(ps)` thay vì tải hết về RAM rồi phân trang trên Client?
**Trả lời:** Phân trang Server-side (Server-side Pagination) với `Skip` và `Limit` chỉ tải đúng số lượng bản ghi cần thiết (ví dụ 5 bản ghi) từ MongoDB về máy chủ và gửi về trình duyệt. Nếu tải toàn bộ 100.000 khách hàng về client rồi phân trang bằng Javascript, ứng dụng sẽ bị tràn bộ nhớ (Out of Memory), tiêu tốn lượng lớn băng thông mạng và gây đơ lag trình duyệt.

### Câu 15: Nếu bảng khách hàng có hàng triệu bản ghi, việc dùng `Skip` lớn có bị chậm không và giải pháp khắc phục là gì?
**Trả lời:** Khi giá trị `Skip` quá lớn (ví dụ `Skip(100000)`), MongoDB vẫn phải duyệt qua các document trước đó trong B-Tree Index. Đối với hệ thống quy mô cực lớn (Big Data), giải pháp tối ưu hơn là áp dụng kỹ thuật **Keyset Pagination (Cursor-based Pagination)**: thay vì `Skip`, hệ thống sẽ lưu `last_id` của trang trước và truy vấn `c => c.Id < last_id` kết hợp với Index trên trường `Id`.

### Câu 16: Cần đánh Index (Chỉ mục) nào trong MongoDB cho collection `customers` để tối ưu hóa hiệu năng?
**Trả lời:** Để tối ưu hóa hiệu năng cho các truy vấn thực tế của module này, cần đánh các chỉ mục:
1. `Unique Index` trên `email`: Tối ưu hóa kiểm tra đăng nhập và ngăn trùng lặp ở tầng database.
2. `Index` trên `phone`: Phục vụ tìm kiếm nhanh theo số điện thoại.
3. `Index` trên `created_at`: Tối ưu hóa việc lọc thống kê theo ngày và tháng (`CountDocumentsAsync`).
4. `Compound Index` trên `{ id: -1 }`: Hỗ trợ sắp xếp giảm dần theo ID khi phân trang.

### Câu 17: Khi nào hệ thống tự động sinh ra avatar chữ cái đầu cho khách hàng?
**Trả lời:** Nếu khách hàng chưa có hình ảnh đại diện cá nhân, Javascript sẽ lấy ký tự đầu tiên của họ tên khách hàng, chuyển thành chữ in hoa (`fullName.charAt(0).toUpperCase() || 'K'`) và hiển thị bên trong một hình tròn màu xanh Navy `bg-blue-900 text-white`. Điều này giúp giao diện luôn đồng nhất, trực quan và không bị lỗi vỡ ảnh.

### Câu 18: Client gửi token xác thực lên API như thế nào và điều gì xảy ra nếu token hết hạn?
**Trả lời:** `api-client.js` tự động lấy access token từ `localStorage` và đính kèm vào HTTP Header: `Authorization: Bearer <token>`. Nếu token hết hạn hoặc không hợp lệ, server trả về mã HTTP `401 Unauthorized`. Client sẽ tự động xóa token và chuyển hướng người dùng về trang đăng nhập `admin/login.html`.

### Câu 19: Làm thế nào để đảm bảo tính an toàn chống tấn công XSS (Cross-Site Scripting) khi hiển thị dữ liệu khách hàng?
**Trả lời:** Toàn bộ dữ liệu động trả về từ API (như Họ tên, Email, Số điện thoại, Địa chỉ) trước khi được nối vào chuỗi HTML đều phải đi qua hàm `escapeHtml()`:
```javascript
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```
Hàm này mã hóa các ký tự đặc biệt thành HTML entities, ngăn chặn triệt để mã độc Javascript nhúng trong dữ liệu được thực thi trên trình duyệt.

### Câu 20: Trang `customers/show.html` lấy dữ liệu bằng cách nào khi người dùng truy cập trực tiếp?
**Trả lời:** Trang sử dụng đối tượng `URLSearchParams` để trích xuất tham số `id` từ URL query string (`window.location.search`). Sau đó, hàm `loadCustomerDetail()` gọi API `GET /api/customers/{id}` và điền dữ liệu vào các phần tử tương ứng trên trang. Nếu không có `id`, trang sẽ tự động chuyển hướng người dùng quay lại `index.html`.

### Câu 21: Tại sao trong hàm xóa khách hàng lại cần kiểm tra `currentRows.length <= 1 && currentPage > 1`?
**Trả lời:** Đây là điểm xử lý tinh tế về mặt UX trong phân trang: Giả sử người dùng đang ở trang 3 và trang 3 chỉ còn duy nhất 1 khách hàng. Khi xóa khách hàng đó, trang 3 sẽ rỗng. Bằng việc kiểm tra điều kiện trên và giảm `currentPage--`, hệ thống sẽ tự động chuyển người dùng về trang 2 và tải lại danh sách, tránh việc người dùng nhìn thấy một bảng trắng rỗng.

### Câu 22: Làm sao để kiểm tra định dạng email ở cả Frontend và Backend?
**Trả lời:**
- **Frontend:** Sử dụng biểu thức chính quy (Regex) `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` để chặn ngay khi submit form, mang lại phản hồi tức thì cho người dùng.
- **Backend:** Áp dụng Data Annotation `[EmailAddress(ErrorMessage = "Email không đúng định dạng.")]` trên DTO, đảm bảo dữ liệu luôn hợp lệ ngay cả khi người dùng bypass qua các công cụ như Postman/Curl.

### Câu 23: Dữ liệu ngày sinh (Birthday) được xử lý đồng bộ giữa HTML date input và C# DateTime như thế nào?
**Trả lời:**
- Thẻ `<input type="date">` yêu cầu định dạng `YYYY-MM-DD`.
- Hàm `toVietnamDateInput(dateStr)` chuyển đổi chuỗi ngày ISO từ server thành `YYYY-MM-DD` theo chuẩn `en-CA`.
- Khi người dùng gửi form, chuỗi này được đóng gói thành định dạng ISO 8601 (`new Date(birthdayVal).toISOString()`) để C# deserialize chính xác thành `DateTime?` chuẩn UTC.

### Câu 24: Tại sao trong `AdminDtos.cs` lại có cả `FullName` và `FullNameCamel`?
**Trả lời:** Đây là kỹ thuật hỗ trợ tính linh hoạt cho Data Contract (Mapping Tolerance). Trong một số trường hợp, frontend hoặc các thư viện gửi payload JSON với naming convention camelCase (`fullName`), trong khi các form khác gửi snake_case (`full_name`). Bằng việc cung cấp setter `FullNameCamel` ghi đè giá trị vào `FullName`, backend tiếp nhận hoàn hảo cả 2 quy chuẩn đặt tên mà không gặp lỗi binding.

### Câu 25: Nếu hệ thống cần mở rộng tính năng khóa tài khoản (Soft Delete / Block) thay vì xóa vĩnh viễn, kiến trúc hiện tại có đáp ứng được không?
**Trả lời:** Hoàn toàn đáp ứng dễ dàng. Chúng ta chỉ cần bổ sung trường `[BsonElement("status")] public string Status { get; set; } = "active";` vào model `Customer`. Trong hàm `DeleteCustomerAsync`, thay vì gọi `DeleteOneAsync`, ta đổi thành `UpdateOneAsync` cập nhật `Status = "banned"` hoặc `"inactive"`. Trong hàm `GetCustomersAsync`, ta chỉ cần thêm điều kiện lọc `c => c.Status != "deleted"`. Kiến trúc phân tầng rõ ràng giúp việc mở rộng này không ảnh hưởng đến giao diện hay các module khác.

---

## 25. BỔ SUNG: TRUY VẾT VÀ XỬ LÝ THÔNG TIN NGÀY SINH (BIRTHDAY) TOÀN HỆ THỐNG

### 25.1 Nguyên nhân gốc rễ ban đầu khiến ngày sinh hiển thị `—`
1. **Dữ liệu thực tế trong MongoDB:** Kiểm tra trực tiếp trên collection `customers` trong cơ sở dữ liệu `BookingTourDB` cho thấy toàn bộ 10 document khách hàng ban đầu (từ ID 1 đến 10) đều có trường `birthday: null`. Do đó, hàm `formatDate(null)` trả về giá trị mặc định là `—`. Đây là hành vi chính xác đối với các khách hàng chưa từng cung cấp ngày sinh.
2. **Khiếm khuyết ở các trang nhập liệu:**
   - Trang độc lập `edit.html` và `create.html` trước đây hoàn toàn **không có trường Ngày sinh**. Khi quản trị viên mở `edit.html` để cập nhật số điện thoại hay địa chỉ, hàm submit gửi payload có `birthday: null`, vô tình ghi đè và làm mất ngày sinh trong MongoDB.
   - Trang chi tiết `show.html` thiếu khối hiển thị `Ngày sinh`.
3. **Thiếu cơ chế validation ngày sinh hợp lý:** Trước đây cả frontend và backend đều không kiểm tra ngày sinh trong tương lai (`birthday > today`), dẫn đến rủi ro dữ liệu phi logic.

### 25.2 Truy vết và xử lý đồng bộ xuyên suốt 6 tầng kiến trúc

```
+----------------------------------------------------------------------------------+
| 1. DATABASE (MongoDB): Collection 'customers'                                    |
|    Document field: "birthday": ISODate("YYYY-MM-DDT00:00:00Z") hoặc null        |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| 2. MODEL (C# Entity): Models/Customer.cs                                         |
|    - [BsonIgnoreExtraElements]                                                   |
|    - [BsonElement("birthday")]                                                   |
|    - [JsonPropertyName("birthday")]                                              |
|    - public DateTime? Birthday { get; set; }                                     |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| 3. DATA CONTRACT (DTOs): DTOs/AdminDtos.cs                                       |
|    - CustomerCreateRequest / CustomerUpdateRequest                               |
|    - Khai báo trường chính: public DateTime? Birthday { get; set; }              |
|    - Hỗ trợ aliases linh hoạt: BirthDate, DateOfBirth, Dob                       |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| 4. BUSINESS SERVICE: Services/AdminManagementService.cs                          |
|    - CreateCustomerAsync & UpdateCustomerAsync                                   |
|    - Ràng buộc: request.Birthday.Value.Date <= vnToday (Chặn ngày tương lai)    |
|    - Ràng buộc: request.Birthday.Value.Year >= 1900                              |
|    - Chuẩn hóa: DateTime.SpecifyKind(request.Birthday.Value.Date, DateTimeKind.Utc)|
|    - Khắc phục triệt để hiện tượng lệch ngày múi giờ giữa UTC và Client          |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| 5. CONTROLLER: Controllers/CustomersController.cs                                |
|    - Nhận request JSON và trả ApiResponse<Customer> đồng nhất                    |
|    - Bắt lỗi ArgumentException trả HTTP 400 Bad Request kèm thông điệp rõ ràng   |
+----------------------------------------------------------------------------------+
                                        |
                                        v
+----------------------------------------------------------------------------------+
| 6. FRONTEND CLIENT: admin-pages.js, index.html, show.html, edit.html, create.html |
|    - Đọc ngày sinh qua alias: c.birthday || c.Birthday || c.date_of_birth...     |
|    - Định dạng hiển thị chuẩn Việt Nam: dd/MM/yyyy qua formatDate()             |
|    - Định dạng input chuẩn HTML5: YYYY-MM-DD qua toVietnamDateInput()            |
|    - Giới hạn ngày sinh tối đa là ngày hôm nay: max="YYYY-MM-DD"                 |
|    - Gửi ngày sinh chuẩn UTC ISO không bị lệch giờ: birthdayVal + 'T00:00:00Z'  |
|    - Giữ nguyên ngày sinh cũ khi cập nhật các thông tin khác                     |
+----------------------------------------------------------------------------------+
```

### 25.3 Kết quả kiểm thử 7 trường hợp nghiệp vụ

| STT | Trường hợp kiểm thử | Dữ liệu đầu vào | Kết quả thực tế đạt được | Đánh giá |
|:---:|:---|:---|:---|:---:|
| 1 | Khách hàng có ngày sinh trong MongoDB | Document có `birthday: ISODate("1998-05-15T00:00:00Z")` | Modal `#custDetailModal` và trang `show.html` hiển thị chính xác **15/05/1998** với icon bánh kem (`cake`). | **ĐẠT** |
| 2 | Khách hàng chưa có ngày sinh | Document có `birthday: null` | Hiển thị dấu gạch ngang **`—`** lịch sự, không gặp lỗi `undefined` hay `Invalid Date`. | **ĐẠT** |
| 3 | Admin chỉnh sửa ngày sinh | Chọn ngày `20/10/1995` trong form sửa | Client gửi `1995-10-20T00:00:00Z`, MongoDB lưu đúng `ISODate`, sau khi lưu modal chi tiết hiển thị ngay **20/10/1995**. | **ĐẠT** |
| 4 | Admin sửa thông tin khác mà không đổi ngày sinh | Giữ nguyên ô Ngày sinh, chỉ đổi Số điện thoại | Backend nhận nguyên vẹn ngày sinh cũ, lưu lại đúng giá trị ban đầu, không bị mất dữ liệu. | **ĐẠT** |
| 5 | Ngày sinh không hợp lệ | Nhập năm $< 1900$ | Backend ném ngoại lệ: *"Năm sinh không hợp lệ (phải từ năm 1900 trở đi)."*, hiển thị thông báo lỗi trên UI. | **ĐẠT** |
| 6 | Ngày sinh trong tương lai | Chọn ngày mai hoặc năm sau | Input bị giới hạn thuộc tính `max="today"`. Nếu cố tình gửi, cả Client JS và Backend đều chặn lại với lỗi: *"Ngày sinh không thể là ngày trong tương lai."*. | **ĐẠT** |
| 7 | Kiểm tra lệch ngày do múi giờ | Chọn ngày `15/05/1998` | Chuỗi gửi đi `1998-05-15T00:00:00Z`, backend chuẩn hóa `DateTimeKind.Utc` ở mốc `00:00:00`, hiển thị lại đúng **15/05/1998**, không bao giờ bị lệch sang ngày 14 hay 16. | **ĐẠT** |

### 25.4 Danh sách file đã được cập nhật
1. `Models/Customer.cs`: Bổ sung `[BsonIgnoreExtraElements]`, bảo toàn mapping `[BsonElement("birthday")]`.
2. `DTOs/AdminDtos.cs`: Bổ sung các aliases `BirthDate`, `DateOfBirth`, `Dob` trong `CustomerCreateRequest` và `CustomerUpdateRequest`.
3. `Services/AdminManagementService.cs`: Bổ sung kiểm tra ngày trong tương lai, kiểm tra năm $\ge 1900$, chuẩn hóa UTC `DateTime.SpecifyKind` trong cả `CreateCustomerAsync` và `UpdateCustomerAsync`.
4. `wwwroot/admin/customers/index.html`: Hoàn thiện thuộc tính `max` cho date inputs, đảm bảo `#custDetailBirthday` hiển thị trang nhã.
5. `wwwroot/admin/customers/show.html`: Bổ sung khối thông tin `Ngày sinh` (`#showCustomerBirthday`).
6. `wwwroot/admin/customers/edit.html`: Bổ sung trường input `Ngày sinh` (`#edit_birthday`).
7. `wwwroot/admin/customers/create.html`: Bổ sung trường input `Ngày sinh` (`#cust_birthday`).
8. `wwwroot/assets/js/admin-pages.js`: Cập nhật logic load, format, validate tương lai và submit ngày sinh xuyên suốt các hàm `handleCustomersIndex`, `openDetailModal`, `openEditModal`, `openCreateModal`, `handleCustomersCreate`, `handleCustomersEdit`, `handleCustomersShow`.

---
**NGƯỜI LẬP BÁO CÁO:** Nhóm Phát Triển Dự Án BookingTour_DotNet  
**TRẠNG THÁI KIỂM DUYỆT:** ĐÃ KIỂM TRA & SẴN SÀNG BẢO VỆ ĐỒ ÁN

