# BookingTour - Hệ thống quản lý đặt tour

## 1. Giới thiệu

BookingTour là hệ thống quản lý và đặt tour du lịch, được xây dựng với các công nghệ:

- **Backend:** ASP.NET Core (.NET 8)
- **Database:** MongoDB
- **Frontend:** HTML, CSS, JavaScript
- **Frontend assets:** Thư mục `wwwroot`
- **Image Storage:** Cloudflare R2
- **API Documentation:** Swagger / OpenAPI
- **Authentication:** JWT (JSON Web Token)

Repository: https://github.com/phungphamminhthu/BookingTour_NoSQL_HK7

## 2. Yêu cầu môi trường

Trước khi chạy project, cần cài đặt các công cụ sau:

| Công cụ | Yêu cầu |
|---|---|
| .NET SDK | .NET 8 |
| MongoDB | MongoDB Community Server |
| MongoDB Compass | Khuyến nghị để quản lý database |
| Git | Dùng để clone và cập nhật source |
| Visual Studio Code hoặc Visual Studio | IDE để mở source code |

Kiểm tra phiên bản .NET:

```powershell
dotnet --version
```

Nếu chưa có .NET 8 SDK, tải tại:

https://dotnet.microsoft.com/download/dotnet/8.0

Tải MongoDB Community Server:

https://www.mongodb.com/try/download/community

Tải MongoDB Compass:

https://www.mongodb.com/products/tools/compass

## 3. Clone source code

Mở PowerShell tại thư mục muốn lưu project và chạy:

```powershell
git clone https://github.com/phungphamminhthu/BookingTour_NoSQL_HK7.git
```

Di chuyển vào thư mục vừa clone:

```powershell
cd BookingTour_NoSQL_HK7
```

Kiểm tra file project:

```powershell
dir
```

Đảm bảo thư mục hiện tại có file:

```text
Backend_DotNet.csproj
```

Mở project bằng VS Code:

```powershell
code .
```

## 4. Cài đặt và cấu hình MongoDB

### 4.1. Cài đặt MongoDB

Tải MongoDB Community Server:

https://www.mongodb.com/try/download/community

Trong quá trình cài đặt, nên chọn cài đặt MongoDB dưới dạng Windows Service để MongoDB có thể tự khởi động cùng hệ điều hành.

Có thể cài thêm MongoDB Compass để quản lý database trực quan.

### 4.2. Khởi động MongoDB

Mở PowerShell và kiểm tra dịch vụ:

```powershell
Get-Service MongoDB
```

Nếu dịch vụ đang dừng, chạy:

```powershell
Start-Service MongoDB
```

MongoDB mặc định sử dụng cổng `27017`.

### 4.3. Kết nối MongoDB Compass

Mở MongoDB Compass và nhập connection string:

```text
mongodb://localhost:27017
```

Nhấn Connect để kết nối đến MongoDB trên máy tính cá nhân.

Database của project:

```text
BookingTourDB
```

### 4.4. Cấu hình MongoDB trong project

Mở file:

```text
appsettings.json
```

Tìm section cấu hình `MongoDbSettings`.

Đảm bảo connection string trỏ đến MongoDB trên máy tính của thành viên:

```text
mongodb://localhost:27017
```

Tên database sử dụng:

```text
BookingTourDB
```

**Lưu ý:**

- Giữ nguyên tên section và các key cấu hình đang được sử dụng trong source code.
- Chỉ thay đổi connection string nếu cần.
- Không tự ý đổi tên các key vì có thể khiến ứng dụng không đọc được cấu hình.
- Nếu sử dụng MongoDB Atlas, thay connection string bằng URI của Atlas và cấu hình tài khoản database tương ứng.

## 5. Khởi tạo dữ liệu MongoDB tự động

Project đã tích hợp chức năng khởi tạo dữ liệu mẫu thông qua file:

```text
Data/DbSeeder.cs
```

Trong `Program.cs`, ứng dụng tự động gọi phương thức:

```csharp
await seeder.SeedAsync();
```

khi khởi động.

### 5.1. Các dữ liệu được khởi tạo

DbSeeder hỗ trợ khởi tạo dữ liệu cho các Collection:

| STT | Collection | Nội dung |
|---|---|---|
| 1 | Roles | Vai trò người dùng |
| 2 | TourCategories | Danh mục tour |
| 3 | Provinces | Tỉnh thành |
| 4 | Employees | Nhân viên |
| 5 | Customers | Khách hàng |
| 6 | Tours | Thông tin tour |
| 7 | TourDepartures | Lịch khởi hành |
| 8 | Bookings | Đơn đặt tour |
| 9 | Payments | Thanh toán |
| 10 | Bills | Hóa đơn |
| 11 | Reviews | Đánh giá tour |

Ngoài ra, chương trình còn thực hiện tạo các Index và khởi tạo bộ đếm ID.

### 5.2. Cơ chế hoạt động

DbSeeder kiểm tra dữ liệu trong từng Collection trước khi thêm dữ liệu mẫu.

- Nếu Collection chưa có dữ liệu: tự động thêm dữ liệu mẫu.
- Nếu Collection đã có dữ liệu: bỏ qua việc thêm dữ liệu cho Collection đó.
- Không tự động xóa dữ liệu hiện có.

**Lưu ý quan trọng:**

Dữ liệu được khởi tạo là dữ liệu mẫu được định nghĩa trong source code, không phải toàn bộ dữ liệu phát sinh trên máy của thành viên khác.

Nếu Collection đã tồn tại một phần dữ liệu, Seeder sẽ không tự bổ sung những bản ghi còn thiếu vì điều kiện hiện tại kiểm tra số lượng Documents bằng 0.

### 5.3. Kiểm tra dữ liệu sau khi chạy

Sau khi khởi động ứng dụng thành công:

1. Mở MongoDB Compass.
2. Kết nối `mongodb://localhost:27017`.
3. Tìm database `BookingTourDB`.
4. Kiểm tra các Collection đã được khởi tạo.
5. Chọn từng Collection để xem Documents.

Thành viên không cần import database mẫu thủ công nếu chỉ sử dụng dữ liệu khởi tạo được cung cấp bởi DbSeeder.

## 6. Cấu hình Cloudflare R2

Project sử dụng Cloudflare R2 để lưu trữ hình ảnh.

Để sử dụng đầy đủ các chức năng liên quan đến upload hình ảnh, cần cấu hình thông tin R2.

### 6.1. Thông tin cần chuẩn bị

Thành viên cần được cung cấp hoặc tự cấu hình các thông tin tương ứng:

- Cloudflare R2 Service URL.
- Access Key ID.
- Secret Access Key.
- Các thông tin bucket và đường dẫn lưu trữ theo cấu hình của project.

### 6.2. Cấu hình trong project

Mở file:

```text
appsettings.json
```

Kiểm tra section cấu hình R2 được sử dụng trong source code.

Trong `Program.cs`, project sử dụng:

```csharp
builder.Services.Configure<R2Settings>(
    builder.Configuration.GetSection(R2Settings.SectionName));
```

Vì vậy, cần giữ nguyên tên section và các key được định nghĩa trong class `R2Settings`.

**Lưu ý bảo mật:**

- Không đưa Access Key ID và Secret Access Key thật lên GitHub.
- Không chia sẻ thông tin xác thực R2 trong nhóm chat công khai.
- Nên sử dụng User Secrets hoặc biến môi trường để lưu thông tin nhạy cảm.
- Nếu chỉ chạy các chức năng không liên quan đến upload hình ảnh, cần kiểm tra cấu hình và cách khởi tạo dịch vụ theo source code hiện tại.

## 7. Cài đặt thư viện và chạy Backend

Tại thư mục chứa file `Backend_DotNet.csproj`, mở Terminal và thực hiện lần lượt:

### Bước 1: Khôi phục thư viện

```powershell
dotnet restore
```

### Bước 2: Build project

```powershell
dotnet build
```

Nếu build thành công, tiếp tục chạy ứng dụng.

### Bước 3: Chạy Backend

```powershell
dotnet run
```

Quan sát Terminal để biết địa chỉ ứng dụng đang chạy.

Nếu ứng dụng chạy tại:

```text
http://localhost:5281
```

Mở trình duyệt và truy cập địa chỉ trên.

Địa chỉ thực tế có thể khác tùy theo cấu hình chạy project.

### Bước 4: Truy cập Swagger

Khi chạy ở môi trường Development, Swagger được cấu hình tại:

```text
/swagger
```

Ví dụ:

```text
http://localhost:5281/swagger
```

Swagger hỗ trợ kiểm tra và thử nghiệm các API của hệ thống.

Frontend được đặt trong thư mục `wwwroot` và được phục vụ trực tiếp thông qua ứng dụng ASP.NET Core.

## 8. Cấu trúc thư mục

```text
BookingTour_NoSQL_HK7/
│
├── Configurations/              # Cấu hình ứng dụng
├── Controllers/                 # Xử lý HTTP requests
├── DTOs/                        # Data Transfer Objects
├── Data/                        # MongoDB Context và DbSeeder
├── Helpers/                     # Các hàm hỗ trợ
├── Middleware/                  # Middleware
├── Models/                      # Các Model dữ liệu
├── Properties/                  # Cấu hình chạy project
├── Repositories/                # Tầng truy xuất dữ liệu
├── Services/                    # Xử lý nghiệp vụ
│
├── wwwroot/                     # Frontend HTML, CSS, JavaScript
│
├── Backend_DotNet.csproj        # File cấu hình project
├── Program.cs                   # Điểm khởi chạy ứng dụng
├── appsettings.json             # Cấu hình ứng dụng
├── appsettings.Development.json # Cấu hình Development
└── README.md                    # Tài liệu hướng dẫn
```

## 9. Cập nhật source code mới nhất

Khi thành viên đã clone project và muốn lấy code mới nhất:

```powershell
git pull origin main
```

Nếu đang có thay đổi code chưa commit, nên commit hoặc sao lưu trước khi pull để tránh mất dữ liệu.

Khuyến nghị mỗi thành viên nên làm việc trên branch riêng cho từng chức năng để hạn chế xung đột code.

## 10. Một số lỗi thường gặp

### 10.1. Lỗi không kết nối được MongoDB

Nguyên nhân có thể:

- MongoDB chưa được cài đặt.
- Dịch vụ MongoDB chưa khởi động.
- Connection string không đúng.
- Cổng `27017` đang được sử dụng hoặc bị chặn.

Kiểm tra dịch vụ:

```powershell
Get-Service MongoDB
```

Nếu dịch vụ dừng:

```powershell
Start-Service MongoDB
```

### 10.2. Lỗi thiếu package hoặc thư viện

Chạy lại:

```powershell
dotnet restore
```

Sau đó:

```powershell
dotnet build
```

### 10.3. Lỗi không có dữ liệu trong MongoDB

Kiểm tra:

- Connection string trong `appsettings.json`.
- Tên database `BookingTourDB`.
- MongoDB đã được khởi động hay chưa.
- Log của ứng dụng có thông báo lỗi khởi tạo dữ liệu từ DbSeeder hay không.

### 10.4. Lỗi liên quan đến Cloudflare R2

Kiểm tra:

- Service URL đã chính xác chưa.
- Access Key ID và Secret Access Key đã được cấu hình chưa.
- Bucket đã tồn tại và có quyền truy cập chưa.
- Các cấu hình có đúng với `R2Settings` trong source code không.

### 10.5. Lỗi cổng đang được sử dụng

Nếu ứng dụng báo cổng đang được sử dụng, hãy kiểm tra ứng dụng khác đang chiếm cổng hoặc cấu hình lại cổng chạy phù hợp.

## 11. Lưu ý khi làm việc nhóm

- Không tự ý đổi tên các thư mục hoặc file cấu hình quan trọng.
- Không commit mật khẩu, API Key, Access Key hoặc Secret Key.
- Mỗi thành viên nên pull code mới nhất trước khi bắt đầu công việc.
- Nên tạo branch riêng cho từng chức năng để hạn chế xung đột code.
- Kiểm tra lại project bằng `dotnet build` trước khi push.
- Khi thay đổi Model, Collection hoặc dữ liệu mẫu trong DbSeeder, cần thông báo cho các thành viên còn lại.
- Không tự ý xóa hoặc ghi đè dữ liệu MongoDB khi chưa thống nhất với nhóm.

## 12. Tài liệu tham khảo

- .NET: https://dotnet.microsoft.com/
- MongoDB: https://www.mongodb.com/docs/
- MongoDB .NET Driver: https://www.mongodb.com/docs/drivers/csharp/current/
- MongoDB Compass: https://www.mongodb.com/products/tools/compass
- Cloudflare R2: https://developers.cloudflare.com/r2/

---

**BookingTour Team**

Hệ thống quản lý và đặt tour du lịch.
