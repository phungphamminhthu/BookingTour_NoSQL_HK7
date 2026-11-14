# BookingTour - Hệ thống quản lý đặt tour

## 1. Giới thiệu

BookingTour là hệ thống quản lý và đặt tour du lịch, được xây dựng với:

- **Backend:** ASP.NET Core (.NET 8)
- **Database:** MongoDB
- **Frontend:** HTML, CSS, JavaScript
- **Frontend assets:** Thư mục `wwwroot`
- **Image Storage:** Cloudflare R2 (nếu được cấu hình)

Repository: https://github.com/phungphamminhthu/BookingTour_NoSQL_HK7

## 2. Yêu cầu môi trường

Trước khi chạy project, cần cài đặt:

| Công cụ | Yêu cầu |
|---|---|
| .NET SDK | .NET 8 |
| MongoDB | MongoDB Community Server |
| MongoDB Compass | Khuyến nghị để quản lý database trực quan |
| Visual Studio Code hoặc Visual Studio | IDE để mở source code |
| Git | Để clone và cập nhật source |

Kiểm tra phiên bản .NET:

```powershell
dotnet --version
```

Nếu chưa có .NET 8 SDK, tải tại:

https://dotnet.microsoft.com/download/dotnet/8.0

## 3. Clone source code

Mở PowerShell tại thư mục muốn lưu project và chạy:

```powershell
git clone https://github.com/phungphamminhthu/BookingTour_NoSQL_HK7.git
```

Di chuyển vào thư mục project:

```powershell
cd BookingTour_NoSQL_HK7
```

Nếu repository chứa project trong thư mục con `BookingTour_DotNet`, di chuyển vào thư mục đó:

```powershell
cd BookingTour_DotNet
```

Mở project bằng VS Code:

```powershell
code .
```

## 4. Cài đặt và cấu hình MongoDB

### 4.1. Cài đặt MongoDB

Tải MongoDB Community Server:

https://www.mongodb.com/try/download/community

Trong quá trình cài đặt, nên chọn cài đặt MongoDB dưới dạng Windows Service để MongoDB tự chạy cùng hệ điều hành.

Có thể cài thêm MongoDB Compass để xem và quản lý dữ liệu:

https://www.mongodb.com/products/tools/compass

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

Nhấn Connect để kết nối đến MongoDB cục bộ.

Database của project:

```text
BookingTourDB
```

Database sẽ được sử dụng bởi ứng dụng khi kết nối và thực hiện các thao tác dữ liệu.

### 4.4. Cấu hình MongoDB trong project

Mở file:

```text
appsettings.json
```

Kiểm tra phần cấu hình MongoDB đang được project sử dụng.

Đảm bảo connection string trỏ đến MongoDB trên máy tính của thành viên:

```text
mongodb://localhost:27017
```

Tên database:

```text
BookingTourDB
```

**Lưu ý:** Giữ nguyên tên các section và key cấu hình hiện có trong `appsettings.json`. Chỉ thay đổi giá trị connection string nếu cần, không tự ý đổi tên key vì có thể làm ứng dụng không đọc được cấu hình.

Nếu sử dụng MongoDB Atlas thay vì MongoDB cục bộ, cần thay connection string bằng URI của Atlas và cấu hình tài khoản database tương ứng.

## 5. Cài đặt các package và chạy Backend

Tại thư mục chứa file `Backend_DotNet.csproj`, chạy:

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

Quan sát cửa sổ Terminal để biết địa chỉ ứng dụng đang chạy.

Nếu project chạy tại:

```text
http://localhost:5281
```

Mở trình duyệt và truy cập địa chỉ trên để kiểm tra.

Frontend được đặt trong thư mục `wwwroot` và được phục vụ thông qua ứng dụng ASP.NET Core theo cấu hình của project.

## 6. Cấu trúc thư mục

```text
BookingTour_DotNet/
│
├── Configurations/       # Cấu hình ứng dụng
├── Controllers/          # Xử lý các HTTP request
├── DTOs/                 # Data Transfer Objects
├── Data/                 # Làm việc với dữ liệu
├── Helpers/              # Các hàm hỗ trợ
├── Middleware/           # Middleware
├── Models/               # Các model dữ liệu
├── Properties/           # Cấu hình chạy project
├── Repositories/         # Tầng truy xuất dữ liệu
├── Services/             # Xử lý nghiệp vụ
│
├── wwwroot/              # Frontend HTML, CSS, JavaScript
│
├── Backend_DotNet.csproj # File cấu hình project
├── Program.cs            # Điểm khởi chạy ứng dụng
├── appsettings.json      # Cấu hình ứng dụng
├── appsettings.Development.json
└── README.md             # Hướng dẫn sử dụng
```

## 7. Cập nhật source code mới nhất

Khi thành viên trong nhóm đã clone project và muốn lấy code mới:

```powershell
git pull origin main
```

Nếu đang có thay đổi code chưa commit, nên commit hoặc sao lưu trước khi pull để tránh mất dữ liệu.

## 8. Một số lỗi thường gặp

### Lỗi không kết nối được MongoDB

Nguyên nhân có thể:
- MongoDB chưa được cài đặt.
- Dịch vụ MongoDB chưa khởi động.
- Connection string không đúng.
- Cổng `27017` đang bị sử dụng hoặc bị chặn.

Cách kiểm tra:

```powershell
Get-Service MongoDB
```

Nếu dịch vụ dừng:

```powershell
Start-Service MongoDB
```

### Lỗi thiếu package hoặc thư viện

Chạy lại:

```powershell
dotnet restore
```

Sau đó:

```powershell
dotnet build
```

### Lỗi cổng đang được sử dụng

Nếu ứng dụng báo cổng đang được sử dụng, hãy kiểm tra ứng dụng khác đang chiếm cổng hoặc chạy project bằng một cổng khác phù hợp.

## 9. Lưu ý khi làm việc nhóm

- Không tự ý đổi tên các thư mục hoặc file cấu hình quan trọng.
- Không commit mật khẩu, API Key, Access Key hoặc Secret Key.
- Mỗi thành viên nên pull code mới nhất trước khi bắt đầu công việc.
- Nên tạo branch riêng cho từng chức năng để hạn chế xung đột code.
- Kiểm tra lại project bằng `dotnet build` trước khi push.
- Nếu có thay đổi cấu trúc database hoặc cấu hình, cần thông báo cho các thành viên còn lại.

## 10. Tài liệu tham khảo

- .NET: https://dotnet.microsoft.com/
- MongoDB: https://www.mongodb.com/docs/
- MongoDB .NET Driver: https://www.mongodb.com/docs/drivers/csharp/current/
- MongoDB Compass: https://www.mongodb.com/products/tools/compass

---

**BookingTour Team**

Hệ thống quản lý và đặt tour du lịch.
