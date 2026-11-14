# BookingTour – ASP.NET Core + MongoDB + Frontend HTML/CSS/JS

Đây là bản Backend .NET có tích hợp bộ giao diện HTML/CSS/JS trong `wwwroot`.

- Mở `Backend_DotNet.csproj` bằng Visual Studio hoặc chạy bằng .NET CLI.
- MongoDB mặc định: `mongodb://localhost:27017`, database `BookingTourDB`.
- Giao diện: `http://localhost:5281/`.
- Swagger: `http://localhost:5281/swagger` (Development).
- Hướng dẫn chi tiết API xác thực và phân quyền: xem `AUTH_FRONTEND_HANDOFF.md`.

**Lưu ý:** Bản giao diện hiện là HTML tĩnh chuyển từ Blade. Đăng nhập/đăng ký đã được nối tới Auth API trong source. Các nghiệp vụ tour/booking/thanh toán vẫn cần nối API và hoàn thiện tiếp.
