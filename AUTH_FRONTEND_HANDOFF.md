# BookingTour – bàn giao tích hợp Frontend và xác thực

## Chạy dự án
1. Cài .NET 8 SDK và MongoDB Community Server.
2. Đảm bảo MongoDB đang chạy tại `mongodb://localhost:27017`.
3. Mở terminal tại thư mục `Backend_DotNet`.
4. Chạy `dotnet restore`, `dotnet build`, `dotnet run`.
5. Mở `http://localhost:5281/` để vào giao diện; Swagger ở `http://localhost:5281/swagger`.

Frontend HTML/CSS/JS đã được đặt trong `wwwroot`. ASP.NET Core phục vụ giao diện và API cùng origin, vì vậy `api-client.js` mặc định gọi API theo `window.location.origin`.

## API xác thực đang có trong source
- `POST /api/auth/register`: đăng ký tài khoản khách hàng (role Customer).
- `POST /api/auth/login`: đăng nhập bằng email khách hàng hoặc username nhân viên.
- `GET /api/auth/me`: lấy thông tin tài khoản hiện tại, yêu cầu Bearer JWT.
- `POST /api/auth/logout`: endpoint logout mẫu (JWT stateless; client cần xóa token).

### Request đăng ký
```json
{
  "email": "customer@example.com",
  "password": "123456",
  "password_confirmation": "123456",
  "full_name": "Nguyen Van A",
  "phone": "0900000000",
  "address": "Ho Chi Minh City"
}
```

### Request đăng nhập
```json
{ "usernameOrEmail": "customer@example.com", "password": "123456", "remember": true }
```
Nhân viên đăng nhập bằng `username` (ví dụ `admin_thanh`, `sale_lan`, `guide_hung`), khách hàng đăng nhập bằng email. API trả `data.token`, `data.userType`, `data.role`, `data.user`.

## Điều hướng giao diện theo role hiện tại
- Customer → `/client/home.html`
- Admin → `/admin/dashboard.html`
- Sale → `/admin/dashboard.html` (tạm dùng dashboard hiện có)
- Guide → `/admin/departures/index.html` (tạm dùng trang lịch khởi hành hiện có)

Đây mới là điều hướng phía trình duyệt. **Không được xem điều hướng Frontend là bảo mật**: Backend phải dùng `[Authorize(Roles = "Admin")]`, `[Authorize(Roles = "Sale")]`, `[Authorize(Roles = "Guide")]` hoặc policy tương ứng để bảo vệ từng API. Không cho người dùng tự chọn role Customer/Admin/Sale/Guide ở form đăng ký công khai; đăng ký công khai chỉ tạo Customer. Role nhân viên phải được quản trị viên gán trong dữ liệu nhân viên.

## Việc Backend cần xác nhận/hoàn thiện
1. Xác nhận `RegisterRequest` kiểm tra `password_confirmation` ở server, không chỉ dựa vào JavaScript.
2. Đảm bảo token chứa role chính xác: `Customer`, `Admin`, `Sale`, `Guide`.
3. Áp dụng authorization theo role cho từng API.
4. Kiểm tra email/username trùng lặp và dữ liệu nhân viên thực tế trong MongoDB.
5. Không seed đè hoặc xóa dữ liệu MongoDB hiện có.
6. Đổi JWT secret mẫu sang User Secrets/biến môi trường trước khi triển khai.
7. Kiểm tra CORS chỉ khi Frontend được host khác origin; hiện tại UI và API cùng host.

## Phạm vi tích hợp hiện tại
- Đã đưa các trang HTML/CSS/JS tĩnh vào `wwwroot`.
- Đã nối form đăng nhập/đăng ký tới API Auth hiện có và lưu JWT phía trình duyệt.
- Chưa tích hợp API dữ liệu tour, lịch khởi hành, booking, thanh toán, quản trị vào từng trang. Các vùng dữ liệu động trong bản chuyển đổi Blade sang HTML vẫn cần tiếp tục hoàn thiện.
- Chức năng quên mật khẩu và logout giao diện chưa được hoàn thiện.
