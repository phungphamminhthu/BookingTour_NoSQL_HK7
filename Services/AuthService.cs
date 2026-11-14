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

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var input = request.UsernameOrEmail.Trim();
        bool isEmail = input.Contains('@');

        if (isEmail)
        {
            // Login as customer
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
            // Login as employee
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

    public async Task<Customer?> GetCurrentCustomerAsync(int customerId)
    {
        return await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync();
    }

    public async Task<Employee?> GetCurrentEmployeeAsync(int employeeId)
    {
        return await _context.Employees.Find(e => e.Id == employeeId).FirstOrDefaultAsync();
    }

    public async Task<bool> UpdateCustomerProfileAsync(int customerId, UpdateProfileRequest request)
    {
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

    public async Task<bool> UpdateCustomerPasswordAsync(int customerId, UpdatePasswordRequest request)
    {
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

    private static bool VerifyPassword(string password, string storedHash)
    {
        try
        {
            // BCrypt.Net can verify $2y$ (PHP format) and $2a$ hashes
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

