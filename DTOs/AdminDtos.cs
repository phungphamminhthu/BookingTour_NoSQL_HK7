using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend_DotNet.DTOs;

public class CategoryRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên danh mục.")]
    [JsonPropertyName("category_name")]
    public string CategoryName { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public class CategoryResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("category_name")]
    public string CategoryName { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name => CategoryName;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("tours_count")]
    public int ToursCount { get; set; }

    [JsonPropertyName("tour_count")]
    public int TourCount => ToursCount;

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; }
}

public class CategoryTourItemDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }

    [JsonPropertyName("province_id")]
    public int ProvinceId { get; set; }

    [JsonPropertyName("province_name")]
    public string? ProvinceName { get; set; }

    [JsonPropertyName("min_price")]
    public decimal MinPrice { get; set; }

    [JsonPropertyName("duration_days")]
    public int DurationDays { get; set; }

    [JsonPropertyName("duration_nights")]
    public int DurationNights { get; set; }

    [JsonPropertyName("duration_text")]
    public string DurationText => $"{DurationDays}N{DurationNights}Đ";

    [JsonPropertyName("departures_count")]
    public int DeparturesCount { get; set; }

    [JsonPropertyName("status_text")]
    public string StatusText => DeparturesCount > 0 ? "Đang mở bán" : "Chờ lịch";

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
}

public class LocationTourItemDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }

    [JsonPropertyName("province_id")]
    public int ProvinceId { get; set; }

    [JsonPropertyName("province_name")]
    public string? ProvinceName { get; set; }

    [JsonPropertyName("category_id")]
    public int CategoryId { get; set; }

    [JsonPropertyName("category_name")]
    public string? CategoryName { get; set; }

    [JsonPropertyName("duration_days")]
    public int DurationDays { get; set; }

    [JsonPropertyName("duration_nights")]
    public int DurationNights { get; set; }

    [JsonPropertyName("duration_text")]
    public string DurationText => $"{DurationDays}N{DurationNights}Đ";

    [JsonPropertyName("pickup_point")]
    public string? PickupPoint { get; set; }

    [JsonPropertyName("min_price")]
    public decimal MinPrice { get; set; }

    [JsonPropertyName("departures_count")]
    public int DeparturesCount { get; set; }

    [JsonPropertyName("status_text")]
    public string StatusText => DeparturesCount > 0 ? "Đang mở bán" : "Chờ lịch";

    [JsonPropertyName("total_booked_passengers")]
    public int TotalBookedPassengers { get; set; }

    [JsonPropertyName("bookings_count")]
    public int BookingsCount { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
}

public class ProvinceRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên tỉnh/thành.")]
    [JsonPropertyName("province_name")]
    public string ProvinceName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn vùng miền.")]
    [JsonPropertyName("region")]
    public string Region { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }
}

public class ProvinceStatsDto
{
    [JsonPropertyName("total_provinces")]
    public int TotalProvinces { get; set; }

    [JsonPropertyName("north_count")]
    public int NorthCount { get; set; }

    [JsonPropertyName("central_count")]
    public int CentralCount { get; set; }

    [JsonPropertyName("south_count")]
    public int SouthCount { get; set; }

    [JsonPropertyName("total_tours")]
    public int TotalTours { get; set; }

    [JsonPropertyName("active_provinces_count")]
    public int ActiveProvincesCount { get; set; }

    [JsonPropertyName("pickup_points_count")]
    public int PickupPointsCount { get; set; }
}

public class EmployeeCreateRequest : IValidatableObject
{
    [Required(ErrorMessage = "Vui lòng nhập tên đăng nhập.")]
    [RegularExpression(@"^[A-Za-z][A-Za-z0-9_.-]{3,49}$", ErrorMessage = "Tên đăng nhập có 4–50 ký tự, bắt đầu bằng chữ; chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.")]
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
    [MinLength(8, ErrorMessage = "Mật khẩu tối thiểu 8 ký tự.")]
    [MaxLength(64, ErrorMessage = "Mật khẩu tối đa 64 ký tự.")]
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng xác nhận mật khẩu.")]
    [Compare(nameof(Password), ErrorMessage = "Mật khẩu xác nhận không khớp.")]
    [JsonPropertyName("password_confirmation")]
    public string PasswordConfirmation { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ và tên có từ 2 đến 100 ký tự.")]
    [RegularExpression(@"^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$", ErrorMessage = "Họ và tên chỉ gồm chữ, khoảng trắng, dấu chấm, dấu nháy hoặc gạch ngang.")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    [MaxLength(254, ErrorMessage = "Email tối đa 254 ký tự.")]
    [RegularExpression(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", ErrorMessage = "Vui lòng nhập email đầy đủ, ví dụ nhanvien@example.com.")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
    [MaxLength(20, ErrorMessage = "Số điện thoại tối đa 20 ký tự.")]
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn vai trò.")]
    [JsonPropertyName("role_id")]
    public int RoleId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        EmployeeFieldValidation.Validate(FullName, Phone, Password);
}

public class EmployeeUpdateRequest : IValidatableObject
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ và tên có từ 2 đến 100 ký tự.")]
    [RegularExpression(@"^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$", ErrorMessage = "Họ và tên chỉ gồm chữ, khoảng trắng, dấu chấm, dấu nháy hoặc gạch ngang.")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
    [MaxLength(254, ErrorMessage = "Email tối đa 254 ký tự.")]
    [RegularExpression(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", ErrorMessage = "Vui lòng nhập email đầy đủ, ví dụ nhanvien@example.com.")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
    [MaxLength(20, ErrorMessage = "Số điện thoại tối đa 20 ký tự.")]
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn vai trò.")]
    [JsonPropertyName("role_id")]
    public int RoleId { get; set; }

    [JsonPropertyName("password")]
    [MinLength(8, ErrorMessage = "Mật khẩu tối thiểu 8 ký tự.")]
    [MaxLength(64, ErrorMessage = "Mật khẩu tối đa 64 ký tự.")]
    public string? Password { get; set; }

    [Compare(nameof(Password), ErrorMessage = "Mật khẩu xác nhận không khớp.")]
    [JsonPropertyName("password_confirmation")]
    public string? PasswordConfirmation { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext) =>
        EmployeeFieldValidation.Validate(FullName, Phone, Password);
}

// Dùng cùng quy tắc cho thêm/sửa; cho phép nhập số điện thoại có khoảng trắng hoặc +84.
public static class EmployeeFieldValidation
{
    // Bỏ dấu phân cách và đổi đầu +84 thành 0 để kiểm tra/lưu số điện thoại thống nhất.
    public static string NormalizePhone(string phone)
    {
        var value = System.Text.RegularExpressions.Regex.Replace(phone ?? "", @"[\s().-]", "");
        return value.StartsWith("+84") ? "0" + value[3..] : value;
    }

    public static IEnumerable<ValidationResult> Validate(string fullName, string phone, string? password)
    {
        if ((fullName ?? "").Trim().Length < 2)
            yield return new ValidationResult("Họ và tên phải có ít nhất 2 ký tự.", new[] { "FullName" });
        if (!System.Text.RegularExpressions.Regex.IsMatch(NormalizePhone(phone), @"^0[35789][0-9]{8}$"))
            yield return new ValidationResult("Vui lòng nhập số di động Việt Nam hợp lệ (10 số hoặc +84).", new[] { "Phone" });
        // Kiểm tra cả độ dài byte để xử lý mật khẩu Unicode trước khi băm BCrypt.
        if (password != null && System.Text.Encoding.UTF8.GetByteCount(password) > 72)
            yield return new ValidationResult("Mật khẩu quá dài; vui lòng sử dụng mật khẩu ngắn hơn.", new[] { "Password" });
        if (password != null && string.IsNullOrWhiteSpace(password))
            yield return new ValidationResult("Mật khẩu không được chỉ gồm khoảng trắng.", new[] { "Password" });
    }
}

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
    [MinLength(8, ErrorMessage = "Mật khẩu tối thiểu 8 ký tự.")]
    public string? Password { get; set; }
}

public class CustomerUpdateRequest
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
}

public class CustomerStatsDto
{
    [JsonPropertyName("total_customers")]
    public int TotalCustomers { get; set; }

    [JsonPropertyName("new_this_month")]
    public int NewThisMonth { get; set; }

    [JsonPropertyName("registered_today")]
    public int RegisteredToday { get; set; }
}

public class DashboardRecentBookingDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("payment_id")]
    public int? PaymentId { get; set; }

    [JsonPropertyName("booking_code")]
    public string BookingCode { get; set; } = string.Empty;

    [JsonPropertyName("customer_name")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("tour_title")]
    public string TourTitle { get; set; } = string.Empty;

    [JsonPropertyName("total_amount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("booking_status")]
    public string BookingStatus { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
}

public class TransactionDetailDto
{
    // Thông tin giao dịch.
    [JsonPropertyName("transaction_id")]
    public int TransactionId { get; set; }

    [JsonPropertyName("transaction_code")]
    public string TransactionCode { get; set; } = string.Empty;

    [JsonPropertyName("payment_id")]
    public int? PaymentId { get; set; }

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = "Chưa thanh toán";

    [JsonPropertyName("payment_date")]
    public DateTime? PaymentDate { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "pending";

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    // Thông tin khách hàng.
    [JsonPropertyName("customer_id")]
    public int CustomerId { get; set; }

    [JsonPropertyName("customer_name")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("customer_email")]
    public string CustomerEmail { get; set; } = string.Empty;

    [JsonPropertyName("customer_phone")]
    public string? CustomerPhone { get; set; }

    [JsonPropertyName("customer_address")]
    public string? CustomerAddress { get; set; }

    // Thông tin đơn đặt tour và tour.
    [JsonPropertyName("booking_id")]
    public int? BookingId { get; set; }

    [JsonPropertyName("booking_code")]
    public string? BookingCode { get; set; }

    [JsonPropertyName("tour_id")]
    public int? TourId { get; set; }

    [JsonPropertyName("tour_title")]
    public string? TourTitle { get; set; }

    [JsonPropertyName("departure_date")]
    public DateTime? DepartureDate { get; set; }

    [JsonPropertyName("return_date")]
    public DateTime? ReturnDate { get; set; }

    [JsonPropertyName("total_adults")]
    public int TotalAdults { get; set; }

    [JsonPropertyName("total_children")]
    public int TotalChildren { get; set; }

    [JsonPropertyName("total_guests")]
    public int TotalGuests => TotalAdults + TotalChildren;

    [JsonPropertyName("total_booking_amount")]
    public decimal TotalBookingAmount { get; set; }

    [JsonPropertyName("paid_amount")]
    public decimal PaidAmount { get; set; }

    [JsonPropertyName("remaining_amount")]
    public decimal RemainingAmount => TotalBookingAmount > PaidAmount ? TotalBookingAmount - PaidAmount : 0;

    // Thông tin hóa đơn nội bộ.
    [JsonPropertyName("bill_id")]
    public int? BillId { get; set; }

    [JsonPropertyName("bill_number")]
    public string? BillNumber { get; set; }

    [JsonPropertyName("bill_amount")]
    public decimal? BillAmount { get; set; }

    [JsonPropertyName("bill_status")]
    public string? BillStatus { get; set; }

    [JsonPropertyName("bill_date")]
    public DateTime? BillDate { get; set; }

    [JsonPropertyName("awaiting_payment_confirmation")]
    public bool AwaitingPaymentConfirmation { get; set; }
}

public class DashboardStatsResponse
{
    [JsonPropertyName("totalTours")]
    public long TotalTours { get; set; }

    [JsonPropertyName("total_tours")]
    public long TotalToursSnake => TotalTours;

    [JsonPropertyName("totalBookings")]
    public long TotalBookings { get; set; }

    [JsonPropertyName("total_bookings")]
    public long TotalBookingsSnake => TotalBookings;

    [JsonPropertyName("cancelledBookings")]
    public long CancelledBookings { get; set; }

    [JsonPropertyName("cancelled_bookings")]
    public long CancelledBookingsSnake => CancelledBookings;

    [JsonPropertyName("cancellationRate")]
    public double CancellationRate { get; set; }

    [JsonPropertyName("cancellation_rate")]
    public double CancellationRateSnake => CancellationRate;

    [JsonPropertyName("newCustomers")]
    public long NewCustomers { get; set; }

    [JsonPropertyName("new_customers")]
    public long NewCustomersSnake => NewCustomers;

    [JsonPropertyName("totalRevenue")]
    public decimal TotalRevenue { get; set; }

    [JsonPropertyName("total_revenue")]
    public decimal TotalRevenueSnake => TotalRevenue;

    [JsonPropertyName("openDepartures")]
    public long OpenDepartures { get; set; }

    [JsonPropertyName("open_departures")]
    public long OpenDeparturesSnake => OpenDepartures;

    [JsonPropertyName("recentBookings")]
    public List<DashboardRecentBookingDto> RecentBookings { get; set; } = new();

    [JsonPropertyName("recent_bookings")]
    public List<DashboardRecentBookingDto> RecentBookingsSnake => RecentBookings;
}

public class TransactionStatsDto
{
    [JsonPropertyName("total_amount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("total_transactions")]
    public long TotalTransactions { get; set; }

    [JsonPropertyName("today_transactions")]
    public long TodayTransactions { get; set; }

    [JsonPropertyName("month_amount")]
    public decimal MonthAmount { get; set; }
}

