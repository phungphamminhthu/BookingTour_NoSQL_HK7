using Backend_DotNet.Data;
using Backend_DotNet.DTOs;
using Backend_DotNet.Models;
using MongoDB.Driver;
using System.ComponentModel.DataAnnotations;

namespace Backend_DotNet.Services;

public class AdminManagementService : IAdminManagementService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<AdminManagementService> _logger;

    public AdminManagementService(MongoDbContext context, ILogger<AdminManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Categories
    public async Task<List<TourCategory>> GetAllCategoriesAsync()
    {
        var categories = await _context.TourCategories.Find(_ => true).SortBy(c => c.CategoryName).ToListAsync();
        // MongoDB gom nhóm một lần, thay vì gửi thêm một truy vấn cho mỗi danh mục.
        var counts = await _context.Tours.Aggregate().Group(t => t.CategoryId,
            group => new { Id = group.Key, Count = group.Count() }).ToListAsync();
        var countMap = counts.ToDictionary(x => x.Id, x => x.Count);
        foreach (var c in categories)
        {
            c.ToursCount = countMap.GetValueOrDefault(c.Id);
        }
        return categories;
    }

    public async Task<TourCategory?> GetCategoryByIdAsync(int id)
    {
        var category = await _context.TourCategories.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (category != null)
        {
            category.ToursCount = (int)await _context.Tours.CountDocumentsAsync(t => t.CategoryId == category.Id);
        }
        return category;
    }

    public async Task<TourCategory> CreateCategoryAsync(CategoryRequest request)
    {
        var existing = await _context.TourCategories.Find(c => c.CategoryName.ToLower() == request.CategoryName.ToLower().Trim()).FirstOrDefaultAsync();
        if (existing != null)
        {
            throw new ArgumentException("Tên danh mục đã tồn tại.");
        }

        var nextId = await _context.GetNextSequenceAsync("tour_categories");
        var now = DateTime.UtcNow;

        var category = new TourCategory
        {
            Id = nextId,
            CategoryName = request.CategoryName.Trim(),
            Description = request.Description?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.TourCategories.InsertOneAsync(category);
        return category;
    }

    public async Task<TourCategory> UpdateCategoryAsync(int id, CategoryRequest request)
    {
        var category = await _context.TourCategories.Find(c => c.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy danh mục mã {id}.");

        var duplicate = await _context.TourCategories.Find(c => c.CategoryName.ToLower() == request.CategoryName.ToLower().Trim() && c.Id != id).FirstOrDefaultAsync();
        if (duplicate != null)
        {
            throw new ArgumentException("Tên danh mục đã được sử dụng.");
        }

        category.CategoryName = request.CategoryName.Trim();
        category.Description = request.Description?.Trim();
        category.UpdatedAt = DateTime.UtcNow;

        await _context.TourCategories.ReplaceOneAsync(c => c.Id == id, category);

        // Update category name in tours
        await _context.Tours.UpdateManyAsync(
            t => t.CategoryId == id,
            Builders<Tour>.Update.Set(t => t.CategoryName, category.CategoryName)
        );

        return category;
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var hasTours = await _context.Tours.Find(t => t.CategoryId == id).AnyAsync();
        if (hasTours)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đang có các tour du lịch liên kết.");
        }

        var result = await _context.TourCategories.DeleteOneAsync(c => c.Id == id);
        return result.DeletedCount > 0;
    }
    #endregion

    #region Provinces
    public async Task<List<Province>> GetAllProvincesAsync()
    {
        var provinces = await _context.Provinces.Find(_ => true).SortBy(p => p.ProvinceName).ToListAsync();
        var counts = await _context.Tours.Aggregate().Group(t => t.ProvinceId,
            group => new { Id = group.Key, Count = group.Count() }).ToListAsync();
        var countMap = counts.ToDictionary(x => x.Id, x => x.Count);
        foreach (var p in provinces)
        {
            p.ToursCount = countMap.GetValueOrDefault(p.Id);
        }
        return provinces;
    }

    public async Task<Province?> GetProvinceByIdAsync(int id)
    {
        var province = await _context.Provinces.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (province != null)
        {
            province.ToursCount = (int)await _context.Tours.CountDocumentsAsync(t => t.ProvinceId == province.Id);
        }
        return province;
    }

    public async Task<Province> CreateProvinceAsync(ProvinceRequest request)
    {
        var existing = await _context.Provinces.Find(p => p.ProvinceName.ToLower() == request.ProvinceName.ToLower().Trim()).FirstOrDefaultAsync();
        if (existing != null)
        {
            throw new ArgumentException("Tỉnh/thành này đã tồn tại trong hệ thống.");
        }

        var nextId = await _context.GetNextSequenceAsync("provinces");
        var now = DateTime.UtcNow;

        var province = new Province
        {
            Id = nextId,
            ProvinceName = request.ProvinceName.Trim(),
            Region = request.Region.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Provinces.InsertOneAsync(province);
        return province;
    }

    public async Task<Province> UpdateProvinceAsync(int id, ProvinceRequest request)
    {
        var province = await _context.Provinces.Find(p => p.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy tỉnh/thành mã {id}.");

        var duplicate = await _context.Provinces.Find(p => p.ProvinceName.ToLower() == request.ProvinceName.ToLower().Trim() && p.Id != id).FirstOrDefaultAsync();
        if (duplicate != null)
        {
            throw new ArgumentException("Tên tỉnh/thành đã được sử dụng.");
        }

        province.ProvinceName = request.ProvinceName.Trim();
        province.Region = request.Region.Trim();
        province.Description = request.Description?.Trim();
        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            province.ImageUrl = request.ImageUrl;
        }
        province.UpdatedAt = DateTime.UtcNow;

        await _context.Provinces.ReplaceOneAsync(p => p.Id == id, province);

        // Update province name in tours
        await _context.Tours.UpdateManyAsync(
            t => t.ProvinceId == id,
            Builders<Tour>.Update.Set(t => t.ProvinceName, province.ProvinceName)
        );

        return province;
    }

    public async Task<bool> DeleteProvinceAsync(int id)
    {
        var hasTours = await _context.Tours.Find(t => t.ProvinceId == id).AnyAsync();
        if (hasTours)
        {
            throw new InvalidOperationException("Không thể xóa tỉnh/thành này vì đang có các tour du lịch liên kết.");
        }

        var result = await _context.Provinces.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }
    #endregion

    #region Employees
    public async Task<List<Employee>> GetAllEmployeesAsync()
    {
        return await _context.Employees.Find(_ => true).SortBy(e => e.Id).ToListAsync();
    }

    public async Task<Employee?> GetEmployeeByIdAsync(int id)
    {
        return await _context.Employees.Find(e => e.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Employee> CreateEmployeeAsync(EmployeeCreateRequest request)
    {
        var existingUser = await _context.Employees.Find(e => e.Username.ToLower() == request.Username.ToLower().Trim()).FirstOrDefaultAsync();
        if (existingUser != null)
        {
            throw new ValidationException(new ValidationResult("Tên đăng nhập đã được sử dụng.", new[] { "username" }), null, null);
        }

        var existingEmail = await _context.Employees.Find(e => e.Email.ToLower() == request.Email.ToLower().Trim()).FirstOrDefaultAsync();
        if (existingEmail != null)
        {
            throw new ValidationException(new ValidationResult("Email nhân viên đã được sử dụng.", new[] { "email" }), null, null);
        }

        var role = await _context.Roles.Find(r => r.Id == request.RoleId).FirstOrDefaultAsync()
            ?? throw new ValidationException(new ValidationResult("Vai trò không tồn tại.", new[] { "role_id" }), null, null);
        var nextId = await _context.GetNextSequenceAsync("employees");
        var now = DateTime.UtcNow;

        var employee = new Employee
        {
            Id = nextId,
            Username = request.Username.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = EmployeeFieldValidation.NormalizePhone(request.Phone),
            RoleId = request.RoleId,
            RoleName = role?.RoleName ?? (request.RoleId == 1 ? "Admin" : request.RoleId == 2 ? "Sale" : "Guide"),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Employees.InsertOneAsync(employee);
        return employee;
    }

    public async Task<Employee> UpdateEmployeeAsync(int id, EmployeeUpdateRequest request)
    {
        var employee = await _context.Employees.Find(e => e.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy nhân viên mã {id}.");

        var emailCheck = await _context.Employees.Find(e => e.Email.ToLower() == request.Email.ToLower().Trim() && e.Id != id).FirstOrDefaultAsync();
        if (emailCheck != null)
        {
            throw new ValidationException(new ValidationResult("Email này đã được sử dụng bởi nhân viên khác.", new[] { "email" }), null, null);
        }

        var role = await _context.Roles.Find(r => r.Id == request.RoleId).FirstOrDefaultAsync()
            ?? throw new ValidationException(new ValidationResult("Vai trò không tồn tại.", new[] { "role_id" }), null, null);
        if (employee.RoleName == "Admin" && role.RoleName != "Admin" &&
            await _context.Employees.CountDocumentsAsync(e => e.RoleName == "Admin") <= 1)
            throw new ArgumentException("Không thể đổi vai trò của quản trị viên cuối cùng.");

        employee.FullName = request.FullName.Trim();
        employee.Email = request.Email.Trim().ToLowerInvariant();
        employee.Phone = EmployeeFieldValidation.NormalizePhone(request.Phone);
        employee.RoleId = request.RoleId;
        employee.RoleName = role?.RoleName ?? employee.RoleName;
        employee.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _context.Employees.ReplaceOneAsync(e => e.Id == id, employee);
        return employee;
    }
    #endregion

    public Task<List<Role>> GetRolesAsync() => _context.Roles.Find(_ => true).SortBy(r => r.Id).ToListAsync();

    public async Task<(List<Employee> Items, long Total)> QueryEmployeesAsync(string? search, int? roleId, int page, int pageSize)
    {
        var builder = Builders<Employee>.Filter;
        var filter = builder.Empty;
        if (!string.IsNullOrWhiteSpace(search))
        {
            var regex = new MongoDB.Bson.BsonRegularExpression(System.Text.RegularExpressions.Regex.Escape(search.Trim()), "i");
            filter &= builder.Or(builder.Regex(e => e.FullName, regex), builder.Regex(e => e.Username, regex), builder.Regex(e => e.Email, regex));
        }
        if (roleId.HasValue) filter &= builder.Eq(e => e.RoleId, roleId.Value);
        var total = await _context.Employees.CountDocumentsAsync(filter);
        var items = await _context.Employees.Find(filter).SortBy(e => e.Id)
            .Skip((page - 1) * pageSize).Limit(pageSize).ToListAsync();
        return (items, total);
    }

    public async Task<bool> DeleteEmployeeAsync(int id, int currentEmployeeId)
    {
        if (id == currentEmployeeId) throw new ArgumentException("Không thể xóa tài khoản đang đăng nhập.");
        var employee = await GetEmployeeByIdAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy nhân viên.");
        if (employee.RoleName == "Admin" && await _context.Employees.CountDocumentsAsync(e => e.RoleName == "Admin") <= 1)
            throw new ArgumentException("Không thể xóa quản trị viên cuối cùng.");
        if (await _context.TourDepartures.Find(d => d.GuideId == id).AnyAsync() ||
            await _context.Bills.Find(b => b.EmployeeId == id).AnyAsync() ||
            await _context.Tours.Find(t => t.CreatedBy == id).AnyAsync())
            throw new ArgumentException("Nhân viên đang liên kết với tour, chuyến đi hoặc hóa đơn; không thể xóa.");
        return (await _context.Employees.DeleteOneAsync(e => e.Id == id)).DeletedCount > 0;
    }

    #region Customers
    public async Task<(List<Customer> Items, long TotalCount)> GetCustomersAsync(string? search, int page = 1, int pageSize = 10)
    {
        var builder = Builders<Customer>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            filter = builder.Or(
                builder.Regex(c => c.FullName, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                builder.Regex(c => c.Email, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                builder.Regex(c => c.Phone, new MongoDB.Bson.BsonRegularExpression(s, "i"))
            );
        }

        var total = await _context.Customers.CountDocumentsAsync(filter);
        var p = page > 0 ? page : 1;
        var ps = pageSize > 0 ? pageSize : 10;

        var items = await _context.Customers.Find(filter)
            .SortByDescending(c => c.Id)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Customer?> GetCustomerByIdAsync(int id)
    {
        return await _context.Customers.Find(c => c.Id == id).FirstOrDefaultAsync();
    }

    public async Task<Customer> UpdateCustomerAsync(int id, CustomerUpdateRequest request)
    {
        var customer = await _context.Customers.Find(c => c.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng mã {id}.");

        var emailCheck = await _context.Customers.Find(c => c.Email.ToLower() == request.Email.ToLower().Trim() && c.Id != id).FirstOrDefaultAsync();
        if (emailCheck != null)
        {
            throw new ArgumentException("Email này đã được sử dụng bởi khách hàng khác.");
        }

        customer.FullName = request.FullName.Trim();
        customer.Email = request.Email.Trim();
        customer.Phone = request.Phone?.Trim();
        customer.Address = request.Address?.Trim();
        customer.Birthday = request.Birthday;
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.Customers.ReplaceOneAsync(c => c.Id == id, customer);
        return customer;
    }
    #endregion

    #region Transactions / Payments
    public async Task<(List<Payment> Items, long TotalCount)> GetTransactionsAsync(string? search, int page = 1, int pageSize = 10)
    {
        var builder = Builders<Payment>.Filter;
        var filter = builder.Empty;

        var total = await _context.Payments.CountDocumentsAsync(filter);
        var p = page > 0 ? page : 1;
        var ps = pageSize > 0 ? pageSize : 10;

        var items = await _context.Payments.Find(filter)
            .SortByDescending(pay => pay.CreatedAt)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        // Enrich payments with booking and customer info
        var bookingIds = items.Select(x => x.BookingId).Distinct().ToList();
        var bookings = await _context.Bookings.Find(b => bookingIds.Contains(b.Id)).ToListAsync();
        var bookingMap = bookings.ToDictionary(b => b.Id);

        foreach (var pay in items)
        {
            if (bookingMap.TryGetValue(pay.BookingId, out var b))
            {
                pay.BookingCode = b.BookingCode;
                pay.CustomerName = b.CustomerName;
                pay.TourTitle = b.TourTitle;
                pay.BookingStatus = b.Status;
            }
        }

        return (items, total);
    }

    public async Task<Payment?> GetTransactionByIdAsync(int id)
    {
        var payment = await _context.Payments.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (payment == null) return null;

        var booking = await _context.Bookings.Find(b => b.Id == payment.BookingId).FirstOrDefaultAsync();
        if (booking != null)
        {
            payment.BookingCode = booking.BookingCode;
            payment.CustomerName = booking.CustomerName;
            payment.TourTitle = booking.TourTitle;
            payment.BookingStatus = booking.Status;
        }

        return payment;
    }
    #endregion

    #region Dashboard
    public async Task<DashboardStatsResponse> GetDashboardStatsAsync(DateTime? startDate, DateTime? endDate)
    {
        var start = startDate ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var end = endDate ?? start.AddMonths(1).AddDays(-1).AddHours(23).AddMinutes(59).AddSeconds(59);

        var totalTours = await _context.Tours.CountDocumentsAsync(_ => true);

        var bookingFilter = Builders<Booking>.Filter.Gte(b => b.CreatedAt, start) &
                            Builders<Booking>.Filter.Lte(b => b.CreatedAt, end);

        var totalBookings = await _context.Bookings.CountDocumentsAsync(bookingFilter);
        var cancelledBookings = await _context.Bookings.CountDocumentsAsync(bookingFilter & Builders<Booking>.Filter.Eq(b => b.Status, "cancelled"));

        double cancellationRate = totalBookings > 0
            ? Math.Round((double)cancelledBookings / totalBookings * 100, 1)
            : 0;

        var customerFilter = Builders<Customer>.Filter.Gte(c => c.CreatedAt, start) &
                             Builders<Customer>.Filter.Lte(c => c.CreatedAt, end);
        var newCustomers = await _context.Customers.CountDocumentsAsync(customerFilter);

        var paymentFilter = Builders<Payment>.Filter.Gte(p => p.CreatedAt, start) &
                            Builders<Payment>.Filter.Lte(p => p.CreatedAt, end);
        var payments = await _context.Payments.Find(paymentFilter).ToListAsync();
        var totalRevenue = payments.Sum(p => p.Amount);

        var openDepartures = await _context.TourDepartures.CountDocumentsAsync(d => d.Status == "open");

        var recentBookings = await _context.Bookings.Find(_ => true)
            .SortByDescending(b => b.CreatedAt)
            .Limit(5)
            .ToListAsync();

        return new DashboardStatsResponse
        {
            TotalTours = totalTours,
            TotalBookings = totalBookings,
            CancelledBookings = cancelledBookings,
            CancellationRate = cancellationRate,
            NewCustomers = newCustomers,
            TotalRevenue = totalRevenue,
            OpenDepartures = openDepartures,
            RecentBookings = recentBookings
        };
    }
    #endregion
}

