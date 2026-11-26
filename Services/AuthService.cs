using Backend_DotNet.Data;
using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using MongoDB.Driver;

namespace Backend_DotNet.Services;

public class AuthService : IAuthService
{
    private readonly MongoDbContext _context;
    private readonly JwtHelper _jwtHelper;
    private readonly ILogger<AuthService> _logger;

    public AuthService(MongoDbContext context, JwtHelper jwtHelper, ILogger<AuthService> logger)
    {
        _context = context;
        _jwtHelper = jwtHelper;
        _logger = logger;
    }

    // Xác minh mật khẩu và cấp JWT; email dùng cho khách, username dùng cho nhân viên.
    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var input = request.UsernameOrEmail.Trim();
        bool isEmail = input.Contains('@');

        if (isEmail)
        {
            // Đăng nhập khách hàng bằng email.
            var customer = await _context.Customers.Find(c => c.Email.ToLower() == input.ToLower()).FirstOrDefaultAsync();
            if (customer == null || !VerifyPassword(request.Password, customer.PasswordHash))
            {
                throw new ArgumentException("Thông tin đăng nhập không chính xác.");
            }

            var (token, expiresAt) = _jwtHelper.GenerateCustomerToken(customer);
            return new LoginResponse
            {
                Token = token,
                UserType = "customer",
                Role = "Customer",
                User = new
                {
                    customer.Id,
                    customer.Email,
                    customer.FullName,
                    customer.Phone,
                    customer.Address
                },
                ExpiresAt = expiresAt
            };
        }
        else
        {
            // Đăng nhập nhân viên bằng username.
            var employee = await _context.Employees.Find(e => e.Username.ToLower() == input.ToLower()).FirstOrDefaultAsync();
            if (employee == null || !VerifyPassword(request.Password, employee.PasswordHash))
            {
                throw new ArgumentException("Thông tin đăng nhập không chính xác.");
            }

            var (token, expiresAt) = _jwtHelper.GenerateEmployeeToken(employee);
            var role = employee.RoleName ?? (employee.RoleId == 1 ? "Admin" : employee.RoleId == 2 ? "Sale" : "Guide");

            return new LoginResponse
            {
                Token = token,
                UserType = "employee",
                Role = role,
                User = new
                {
                    employee.Id,
                    employee.Username,
                    employee.Email,
                    employee.FullName,
                    employee.Phone,
                    employee.RoleId,
                    RoleName = role
                },
                ExpiresAt = expiresAt
            };
        }
    }

    // Kiểm tra email trùng, cấp mã và băm mật khẩu trước khi lưu tài khoản khách.
    public async Task<Customer> RegisterCustomerAsync(RegisterRequest request)
    {
        var existing = await _context.Customers.Find(c => c.Email.ToLower() == request.Email.ToLower()).FirstOrDefaultAsync();
        if (existing != null)
        {
            throw new ArgumentException("Email này đã được tài khoản khác sử dụng.");
        }

        var nextId = await _context.GetNextSequenceAsync("customers");
        var now = DateTime.UtcNow;

        var customer = new Customer
        {
            Id = nextId,
            Email = request.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            Address = request.Address?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Customers.InsertOneAsync(customer);
        return customer;
    }

    // Đọc khách theo mã đã xác thực từ JWT.
    public async Task<Customer?> GetCurrentCustomerAsync(int customerId)
    {
        return await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync();
    }

    // Đọc nhân viên hiện tại để đối chiếu tài khoản và vai trò còn hợp lệ.
    public async Task<Employee?> GetCurrentEmployeeAsync(int employeeId)
    {
        return await _context.Employees.Find(e => e.Id == employeeId).FirstOrDefaultAsync();
    }

    // Kiểm tra ngày sinh/email rồi $set các trường hồ sơ được phép thay đổi.
    public async Task<bool> UpdateCustomerProfileAsync(int customerId, UpdateProfileRequest request)
    {
        if (request.Birthday?.Date > DateTime.UtcNow.Date)
            throw new ArgumentException("Ngày sinh không được ở tương lai.");
        var customer = await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync();
        if (customer == null)
        {
            throw new KeyNotFoundException("Tài khoản khách hàng không tồn tại.");
        }

        var emailCheck = await _context.Customers.Find(c => c.Email.ToLower() == request.Email.ToLower() && c.Id != customerId).FirstOrDefaultAsync();
        if (emailCheck != null)
        {
            throw new ArgumentException("Email này đã được sử dụng bởi tài khoản khác.");
        }

        var update = Builders<Customer>.Update
            .Set(c => c.FullName, request.FullName.Trim())
            .Set(c => c.Email, request.Email.Trim())
            .Set(c => c.Phone, request.Phone?.Trim())
            .Set(c => c.Address, request.Address?.Trim())
            .Set(c => c.Birthday, request.Birthday)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        var result = await _context.Customers.UpdateOneAsync(c => c.Id == customerId, update);
        return result.ModifiedCount > 0;
    }

    // Kiểm tra mật khẩu cũ và xác nhận mật khẩu mới, sau đó lưu hash BCrypt mới.
    public async Task<bool> UpdateCustomerPasswordAsync(int customerId, UpdatePasswordRequest request)
    {
        if (request.NewPassword != request.NewPasswordConfirmation)
            throw new ArgumentException("Mật khẩu xác nhận không khớp.");
        var customer = await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync();
        if (customer == null)
        {
            throw new KeyNotFoundException("Tài khoản khách hàng không tồn tại.");
        }

        if (!VerifyPassword(request.CurrentPassword, customer.PasswordHash))
        {
            throw new ArgumentException("Mật khẩu hiện tại không chính xác.");
        }

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        var update = Builders<Customer>.Update
            .Set(c => c.PasswordHash, newHash)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        var result = await _context.Customers.UpdateOneAsync(c => c.Id == customerId, update);
        return result.ModifiedCount > 0;
    }

    // Đối chiếu mật khẩu nhập với hash BCrypt, không giải mã mật khẩu đã lưu.
    private static bool VerifyPassword(string password, string storedHash)
    {
        try
        {
            // BCrypt.Net hỗ trợ đối chiếu hash có tiền tố $2y$ và $2a$.
            if (storedHash.StartsWith("$2y$"))
            {
                storedHash = "$2a$" + storedHash.Substring(4);
            }
            return BCrypt.Net.BCrypt.Verify(password, storedHash);
        }
        catch
        {
            return false;
        }
    }
}

