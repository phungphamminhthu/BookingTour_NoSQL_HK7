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

public class CustomerUpdateRequest
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên.")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

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

public class DashboardStatsResponse
{
    [JsonPropertyName("totalTours")]
    public long TotalTours { get; set; }

    [JsonPropertyName("totalBookings")]
    public long TotalBookings { get; set; }

    [JsonPropertyName("cancelledBookings")]
    public long CancelledBookings { get; set; }

    [JsonPropertyName("cancellationRate")]
    public double CancellationRate { get; set; }

    [JsonPropertyName("newCustomers")]
    public long NewCustomers { get; set; }

    [JsonPropertyName("totalRevenue")]
    public decimal TotalRevenue { get; set; }

    [JsonPropertyName("openDepartures")]
    public long OpenDepartures { get; set; }

    [JsonPropertyName("recentBookings")]
    public object? RecentBookings { get; set; }
}

