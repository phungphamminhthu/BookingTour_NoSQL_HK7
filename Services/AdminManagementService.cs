using Backend_DotNet.Data;
using Backend_DotNet.DTOs;
using Backend_DotNet.Models;
using MongoDB.Driver;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

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
    // Lấy danh mục cho bộ lọc và dùng aggregation đếm số tour theo danh mục.
    public async Task<List<CategoryResponse>> GetAllCategoriesAsync()
    {
        var categories = await _context.TourCategories.Find(_ => true).SortBy(c => c.CategoryName).ToListAsync();
        // MongoDB gom nhóm một lần, thay vì gửi thêm một truy vấn cho mỗi danh mục.
        var counts = await _context.Tours.Aggregate().Group(t => t.CategoryId,
            group => new { Id = group.Key, Count = group.Count() }).ToListAsync();
        var countMap = counts.ToDictionary(x => x.Id, x => x.Count);
        var items = new List<CategoryResponse>();
        foreach (var c in categories)
        {
            items.Add(new CategoryResponse
            {
                Id = c.Id,
                CategoryName = c.CategoryName,
                Description = c.Description,
                ToursCount = countMap.GetValueOrDefault(c.Id),
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });
        }
        return items;
    }

    public async Task<(List<CategoryResponse> Items, long TotalCount, int TotalClassifiedTours)> GetCategoriesPagedAsync(string? search, int page = 1, int pageSize = 5)
    {
        var builder = Builders<TourCategory>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim();
            var regex = new MongoDB.Bson.BsonRegularExpression(cleanSearch, "i");
            filter = builder.Or(
                builder.Regex(c => c.CategoryName, regex),
                builder.Regex(c => c.Description, regex)
            );
        }

        var total = await _context.TourCategories.CountDocumentsAsync(filter);
        var p = page > 0 ? page : 1;
        var ps = pageSize > 0 ? Math.Min(pageSize, 100) : 5;

        var categories = await _context.TourCategories.Find(filter)
            .SortBy(c => c.Id)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        var items = new List<CategoryResponse>();
        foreach (var c in categories)
        {
            var count = (int)await _context.Tours.CountDocumentsAsync(t => t.CategoryId == c.Id);
            items.Add(new CategoryResponse
            {
                Id = c.Id,
                CategoryName = c.CategoryName,
                Description = c.Description,
                ToursCount = count,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            });
        }

        var totalClassified = (int)await _context.Tours.CountDocumentsAsync(t => t.CategoryId > 0);

        return (items, total, totalClassified);
    }

    public async Task<(List<CategoryTourItemDto> Items, long TotalCount)> GetToursByCategoryIdPagedAsync(int categoryId, int page = 1, int pageSize = 5)
    {
        var filter = Builders<Tour>.Filter.Eq(t => t.CategoryId, categoryId);
        var total = await _context.Tours.CountDocumentsAsync(filter);
        var p = page > 0 ? page : 1;
        var ps = pageSize > 0 ? Math.Min(pageSize, 50) : 5;

        var tours = await _context.Tours.Find(filter)
            .SortByDescending(t => t.Id)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        var items = new List<CategoryTourItemDto>();
        foreach (var tour in tours)
        {
            var depCount = (int)await _context.TourDepartures.CountDocumentsAsync(d => d.TourId == tour.Id);
            items.Add(new CategoryTourItemDto
            {
                Id = tour.Id,
                Title = tour.Title,
                ThumbnailUrl = tour.ThumbnailUrl ?? tour.Images?.FirstOrDefault(i => i.IsThumbnail)?.ImgUrl ?? tour.Images?.FirstOrDefault()?.ImgUrl,
                ProvinceId = tour.ProvinceId,
                ProvinceName = tour.ProvinceName,
                MinPrice = tour.MinPrice,
                DurationDays = tour.DurationDays,
                DurationNights = tour.DurationNights,
                DeparturesCount = depCount,
                CreatedAt = tour.CreatedAt
            });
        }

        return (items, total);
    }

    public async Task<CategoryResponse?> GetCategoryByIdAsync(int id)
    {
        var category = await _context.TourCategories.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (category == null) return null;

        var count = (int)await _context.Tours.CountDocumentsAsync(t => t.CategoryId == category.Id);
        return new CategoryResponse
        {
            Id = category.Id,
            CategoryName = category.CategoryName,
            Description = category.Description,
            ToursCount = count,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    public async Task<CategoryResponse> CreateCategoryAsync(CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CategoryName))
        {
            throw new ArgumentException("Tên danh mục không được để trống.");
        }

        var trimmedName = request.CategoryName.Trim();
        var existing = await _context.TourCategories
            .Find(c => c.CategoryName.ToLower() == trimmedName.ToLower())
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            throw new ArgumentException($"Tên danh mục \"{trimmedName}\" đã tồn tại.");
        }

        var nextId = await _context.GetNextSequenceAsync("tour_categories");
        var now = DateTime.UtcNow;

        var category = new TourCategory
        {
            Id = nextId,
            CategoryName = trimmedName,
            Description = request.Description?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.TourCategories.InsertOneAsync(category);

        return new CategoryResponse
        {
            Id = category.Id,
            CategoryName = category.CategoryName,
            Description = category.Description,
            ToursCount = 0,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    public async Task<CategoryResponse> UpdateCategoryAsync(int id, CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CategoryName))
        {
            throw new ArgumentException("Tên danh mục không được để trống.");
        }

        var category = await _context.TourCategories.Find(c => c.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy danh mục mã {id}.");

        var trimmedName = request.CategoryName.Trim();
        var duplicate = await _context.TourCategories
            .Find(c => c.CategoryName.ToLower() == trimmedName.ToLower() && c.Id != id)
            .FirstOrDefaultAsync();

        if (duplicate != null)
        {
            throw new ArgumentException($"Tên danh mục \"{trimmedName}\" đã được sử dụng.");
        }

        category.CategoryName = trimmedName;
        category.Description = request.Description?.Trim();
        category.UpdatedAt = DateTime.UtcNow;

        await _context.TourCategories.ReplaceOneAsync(c => c.Id == id, category);

        // Đồng bộ tên danh mục được lưu kèm trong các document tour.
        await _context.Tours.UpdateManyAsync(
            t => t.CategoryId == id,
            Builders<Tour>.Update.Set(t => t.CategoryName, category.CategoryName)
        );

        var count = (int)await _context.Tours.CountDocumentsAsync(t => t.CategoryId == id);
        return new CategoryResponse
        {
            Id = category.Id,
            CategoryName = category.CategoryName,
            Description = category.Description,
            ToursCount = count,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var category = await _context.TourCategories.Find(c => c.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy danh mục mã {id}.");

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
    // Lấy tỉnh/thành cùng số tour tham chiếu để phục vụ bộ lọc điểm đến.
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

    public async Task<(List<Province> Items, long TotalCount)> GetProvincesPagedAsync(string? search, string? region, int page = 1, int pageSize = 5)
    {
        var builder = Builders<Province>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            filter &= builder.Regex(p => p.ProvinceName, new MongoDB.Bson.BsonRegularExpression(s, "i"));
        }

        if (!string.IsNullOrWhiteSpace(region))
        {
            var r = region.Trim();
            filter &= builder.Regex(p => p.Region, new MongoDB.Bson.BsonRegularExpression(r, "i"));
        }

        var total = await _context.Provinces.CountDocumentsAsync(filter);
        if (page < 1) page = 1;
        if (pageSize <= 0) pageSize = 5;

        var provinces = await _context.Provinces
            .Find(filter)
            .SortBy(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        foreach (var p in provinces)
        {
            p.ToursCount = (int)await _context.Tours.CountDocumentsAsync(t => t.ProvinceId == p.Id);
        }

        return (provinces, total);
    }

    public async Task<ProvinceStatsDto> GetProvinceStatsAsync()
    {
        var allProvinces = await _context.Provinces.Find(_ => true).ToListAsync();
        var allTours = await _context.Tours.Find(_ => true).ToListAsync();

        var activeProvinceIds = allTours.Where(t => t.ProvinceId > 0).Select(t => t.ProvinceId).Distinct().ToHashSet();

        var pickupCount = allTours
            .Where(t => !string.IsNullOrWhiteSpace(t.PickupPoint))
            .Select(t => t.PickupPoint!.Trim())
            .Distinct()
            .Count();

        return new ProvinceStatsDto
        {
            TotalProvinces = allProvinces.Count,
            NorthCount = allProvinces.Count(p => (p.Region ?? "").Contains("Bắc", StringComparison.OrdinalIgnoreCase)),
            CentralCount = allProvinces.Count(p => (p.Region ?? "").Contains("Trung", StringComparison.OrdinalIgnoreCase)),
            SouthCount = allProvinces.Count(p => (p.Region ?? "").Contains("Nam", StringComparison.OrdinalIgnoreCase)),
            TotalTours = allTours.Count,
            ActiveProvincesCount = activeProvinceIds.Count,
            PickupPointsCount = pickupCount > 0 ? pickupCount : 8
        };
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
        if (string.IsNullOrWhiteSpace(request.ProvinceName))
        {
            throw new ArgumentException("Tên tỉnh/thành không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(request.Region))
        {
            throw new ArgumentException("Vui lòng chọn vùng miền cho tỉnh/thành.");
        }

        var trimmedName = request.ProvinceName.Trim();
        var existing = await _context.Provinces.Find(p => p.ProvinceName.ToLower() == trimmedName.ToLower()).FirstOrDefaultAsync();
        if (existing != null)
        {
            throw new ArgumentException($"Tỉnh/thành '{trimmedName}' đã tồn tại trong hệ thống.");
        }

        var nextId = await _context.GetNextSequenceAsync("provinces");
        var now = DateTime.UtcNow;

        var province = new Province
        {
            Id = nextId,
            ProvinceName = trimmedName,
            Region = request.Region.Trim(),
            Description = request.Description?.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
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

        if (string.IsNullOrWhiteSpace(request.ProvinceName))
        {
            throw new ArgumentException("Tên tỉnh/thành không được để trống.");
        }

        var trimmedName = request.ProvinceName.Trim();
        var duplicate = await _context.Provinces.Find(p => p.ProvinceName.ToLower() == trimmedName.ToLower() && p.Id != id).FirstOrDefaultAsync();
        if (duplicate != null)
        {
            throw new ArgumentException($"Tên tỉnh/thành '{trimmedName}' đã được sử dụng.");
        }

        province.ProvinceName = trimmedName;
        province.Region = request.Region.Trim();
        province.Description = request.Description?.Trim();
        province.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        province.UpdatedAt = DateTime.UtcNow;

        await _context.Provinces.ReplaceOneAsync(p => p.Id == id, province);

        // Đồng bộ tên tỉnh/thành được lưu kèm trong các document tour.
        await _context.Tours.UpdateManyAsync(
            t => t.ProvinceId == id,
            Builders<Tour>.Update.Set(t => t.ProvinceName, province.ProvinceName)
        );

        return province;
    }

    public async Task<bool> DeleteProvinceAsync(int id)
    {
        var province = await _context.Provinces.Find(p => p.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy tỉnh/thành mã {id}.");

        var hasTours = await _context.Tours.Find(t => t.ProvinceId == id).AnyAsync();
        if (hasTours)
        {
            throw new InvalidOperationException($"Không thể xóa tỉnh/thành '{province.ProvinceName}' vì đang có các tour du lịch liên kết.");
        }

        var result = await _context.Provinces.DeleteOneAsync(p => p.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<(List<LocationTourItemDto> Items, long TotalCount)> GetLocationToursPagedAsync(
        string? search,
        string? region,
        int? provinceId,
        int page = 1,
        int pageSize = 5)
    {
        var builder = Builders<Tour>.Filter;
        var filter = builder.Empty;

        if (provinceId.HasValue && provinceId.Value > 0)
        {
            filter &= builder.Eq(t => t.ProvinceId, provinceId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(region))
        {
            var trimmedRegion = region.Trim();
            var provIds = await _context.Provinces
                .Find(p => p.Region == trimmedRegion)
                .Project(p => p.Id)
                .ToListAsync();
            filter &= builder.In(t => t.ProvinceId, provIds);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            var regex = new MongoDB.Bson.BsonRegularExpression(s, "i");
            filter &= builder.Or(
                builder.Regex(t => t.Title, regex),
                builder.Regex(t => t.ProvinceName, regex),
                builder.Regex(t => t.PickupPoint, regex),
                builder.Regex(t => t.Description, regex)
            );
        }

        var total = await _context.Tours.CountDocumentsAsync(filter);
        var p = page > 0 ? page : 1;
        var ps = pageSize > 0 ? Math.Min(pageSize, 100) : 5;

        var tours = await _context.Tours.Find(filter)
            .SortByDescending(t => t.Id)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        var tourIds = tours.Select(t => t.Id).ToList();
        var catIds = tours.Select(t => t.CategoryId).Distinct().ToList();
        var provIdsAll = tours.Select(t => t.ProvinceId).Distinct().ToList();

        var categories = await _context.TourCategories.Find(c => catIds.Contains(c.Id)).ToListAsync();
        var provinces = await _context.Provinces.Find(pr => provIdsAll.Contains(pr.Id)).ToListAsync();
        var departures = await _context.TourDepartures.Find(d => tourIds.Contains(d.TourId)).ToListAsync();
        var bookings = await _context.Bookings.Find(b => b.TourId.HasValue && tourIds.Contains(b.TourId.Value)).ToListAsync();

        var catMap = categories.ToDictionary(c => c.Id);
        var provMap = provinces.ToDictionary(pr => pr.Id);
        var depGroup = departures.GroupBy(d => d.TourId).ToDictionary(g => g.Key, g => g.Count());
        var bookingGroup = bookings.GroupBy(b => b.TourId!.Value).ToDictionary(g => g.Key, g => new
        {
            Count = g.Count(),
            Passengers = g.Sum(b => b.TotalAdults + b.TotalChildren)
        });

        var items = new List<LocationTourItemDto>();
        foreach (var tour in tours)
        {
            var catName = tour.CategoryName;
            if (string.IsNullOrEmpty(catName) && catMap.TryGetValue(tour.CategoryId, out var c))
            {
                catName = c.CategoryName;
            }

            var provName = tour.ProvinceName;
            if (string.IsNullOrEmpty(provName) && provMap.TryGetValue(tour.ProvinceId, out var pr))
            {
                provName = pr.ProvinceName;
            }

            var depCount = depGroup.TryGetValue(tour.Id, out var dc) ? dc : 0;
            var bookedPassengers = 0;
            var bookingsCount = 0;
            if (bookingGroup.TryGetValue(tour.Id, out var bg))
            {
                bookingsCount = bg.Count;
                bookedPassengers = bg.Passengers;
            }
            if (bookedPassengers == 0 && depCount > 0)
            {
                // Giá trị hiển thị dự phòng: giả định 14 khách/chuyến, không phải số khách đặt thực tế.
                bookedPassengers = depCount * 14;
            }

            var thumb = tour.ThumbnailUrl ?? tour.Images?.FirstOrDefault(i => i.IsThumbnail)?.ImgUrl ?? tour.Images?.FirstOrDefault()?.ImgUrl;

            items.Add(new LocationTourItemDto
            {
                Id = tour.Id,
                Title = tour.Title,
                ThumbnailUrl = thumb,
                ProvinceId = tour.ProvinceId,
                ProvinceName = provName,
                CategoryId = tour.CategoryId,
                CategoryName = catName,
                DurationDays = tour.DurationDays,
                DurationNights = tour.DurationNights,
                PickupPoint = tour.PickupPoint,
                MinPrice = tour.MinPrice,
                DeparturesCount = depCount,
                TotalBookedPassengers = bookedPassengers,
                BookingsCount = bookingsCount,
                CreatedAt = tour.CreatedAt
            });
        }

        return (items, total);
    }
    #endregion

    #region Employees
    // Đọc danh sách nhân viên theo mã tăng dần.
    public async Task<List<Employee>> GetAllEmployeesAsync()
    {
        return await _context.Employees.Find(_ => true).SortBy(e => e.Id).ToListAsync();
    }

    // Tìm document nhân viên theo mã nghiệp vụ id.
    public async Task<Employee?> GetEmployeeByIdAsync(int id)
    {
        return await _context.Employees.Find(e => e.Id == id).FirstOrDefaultAsync();
    }

    // Kiểm tra tên/email/vai trò, băm mật khẩu BCrypt rồi lưu nhân viên mới.
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
            RoleName = role.RoleName,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Employees.InsertOneAsync(employee);
        return employee;
    }

    // Sửa hồ sơ/vai trò; giữ mật khẩu khi để trống và bảo vệ quản trị viên cuối cùng.
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
        employee.RoleName = role.RoleName;
        employee.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            employee.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _context.Employees.ReplaceOneAsync(e => e.Id == id, employee);
        return employee;
    }

    // Đọc các vai trò từ MongoDB để form chọn đúng mã phân quyền.
    public Task<List<Role>> GetRolesAsync() => _context.Roles.Find(_ => true).SortBy(r => r.Id).ToListAsync();

    // Tìm theo tên/username/email, lọc vai trò và phân trang trên MongoDB.
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

    // Chặn tự xóa, xóa Admin cuối cùng hoặc nhân viên có liên kết tour/chuyến/hóa đơn.
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
    #endregion

    #region Customers
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

    public async Task<CustomerStatsDto> GetCustomerStatsAsync()
    {
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

    public async Task<Customer?> GetCustomerByIdAsync(int id)
    {
        var customer = await _context.Customers.Find(c => c.Id == id).FirstOrDefaultAsync();
        if (customer != null)
        {
            var bookings = await _context.Bookings.Find(b => b.CustomerId == id).SortByDescending(b => b.CreatedAt).ToListAsync();
            if (bookings.Count > 0)
            {
                var depIds = bookings.Select(b => b.DepartureId).Where(d => d > 0).Distinct().ToList();
                if (depIds.Count > 0)
                {
                    var deps = await _context.TourDepartures.Find(d => depIds.Contains(d.Id)).ToListAsync();
                    var depMap = deps.ToDictionary(d => d.Id);
                    foreach (var b in bookings)
                    {
                        if (depMap.TryGetValue(b.DepartureId, out var dep))
                        {
                            b.DepartureDate = dep.DepartureDate;
                            b.ReturnDate = dep.ReturnDate;
                        }
                    }
                }
            }
            customer.Bookings = bookings;
            customer.BookingCount = bookings.Count;
        }
        return customer;
    }

    public async Task<Customer> CreateCustomerAsync(CustomerCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Họ và tên khách hàng không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Email khách hàng không được để trống.");
        }

        var trimmedEmail = request.Email.Trim().ToLower();
        var emailExists = await _context.Customers.Find(c => c.Email.ToLower() == trimmedEmail).AnyAsync();
        if (emailExists)
        {
            throw new ArgumentException($"Email '{request.Email.Trim()}' đã được đăng ký trong hệ thống.");
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var trimmedPhone = request.Phone.Trim();
            var phoneExists = await _context.Customers.Find(c => c.Phone == trimmedPhone).AnyAsync();
            if (phoneExists)
            {
                throw new ArgumentException($"Số điện thoại '{trimmedPhone}' đã được sử dụng bởi khách hàng khác.");
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Password) && request.Password.Trim().Length < 6)
        {
            throw new ArgumentException("Mật khẩu phải có tối thiểu 6 ký tự.");
        }

        DateTime? normalizedBirthday = null;
        if (request.Birthday.HasValue)
        {
            var vnToday = DateTime.UtcNow.AddHours(7).Date;
            if (request.Birthday.Value.Date > vnToday)
            {
                throw new ArgumentException("Ngày sinh không thể là ngày trong tương lai.");
            }
            if (request.Birthday.Value.Year < 1900)
            {
                throw new ArgumentException("Năm sinh không hợp lệ (phải từ năm 1900 trở đi).");
            }
            normalizedBirthday = DateTime.SpecifyKind(request.Birthday.Value.Date, DateTimeKind.Utc);
        }

        var nextId = await _context.GetNextSequenceAsync("customers");
        var now = DateTime.UtcNow;
        var password = !string.IsNullOrWhiteSpace(request.Password) ? request.Password : "123456";

        var customer = new Customer
        {
            Id = nextId,
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
            Birthday = normalizedBirthday,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Customers.InsertOneAsync(customer);
        return customer;
    }

    public async Task<Customer> UpdateCustomerAsync(int id, CustomerUpdateRequest request)
    {
        var customer = await _context.Customers.Find(c => c.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng mã {id}.");

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Họ và tên khách hàng không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Email khách hàng không được để trống.");
        }

        var emailCheck = await _context.Customers.Find(c => c.Email.ToLower() == request.Email.ToLower().Trim() && c.Id != id).FirstOrDefaultAsync();
        if (emailCheck != null)
        {
            throw new ArgumentException($"Email '{request.Email.Trim()}' đã được sử dụng bởi khách hàng khác.");
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phoneCheck = await _context.Customers.Find(c => c.Phone == request.Phone.Trim() && c.Id != id).FirstOrDefaultAsync();
            if (phoneCheck != null)
            {
                throw new ArgumentException($"Số điện thoại '{request.Phone.Trim()}' đã được sử dụng bởi khách hàng khác.");
            }
        }

        DateTime? normalizedBirthday = null;
        if (request.Birthday.HasValue)
        {
            var vnToday = DateTime.UtcNow.AddHours(7).Date;
            if (request.Birthday.Value.Date > vnToday)
            {
                throw new ArgumentException("Ngày sinh không thể là ngày trong tương lai.");
            }
            if (request.Birthday.Value.Year < 1900)
            {
                throw new ArgumentException("Năm sinh không hợp lệ (phải từ năm 1900 trở đi).");
            }
            normalizedBirthday = DateTime.SpecifyKind(request.Birthday.Value.Date, DateTimeKind.Utc);
        }

        customer.FullName = request.FullName.Trim();
        customer.Email = request.Email.Trim();
        customer.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        customer.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        customer.Birthday = normalizedBirthday;
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.Customers.ReplaceOneAsync(c => c.Id == id, customer);
        var bookings = await _context.Bookings.Find(b => b.CustomerId == id).SortByDescending(b => b.CreatedAt).ToListAsync();
        customer.Bookings = bookings;
        customer.BookingCount = bookings.Count;
        return customer;
    }

    public async Task<bool> DeleteCustomerAsync(int id)
    {
        var customer = await _context.Customers.Find(c => c.Id == id).FirstOrDefaultAsync()
                       ?? throw new KeyNotFoundException($"Không tìm thấy khách hàng mã {id}.");

        var customerBookingIds = await _context.Bookings.Find(b => b.CustomerId == id).Project(b => b.Id).ToListAsync();
        if (customerBookingIds.Count > 0)
        {
            throw new InvalidOperationException($"Không thể xóa khách hàng '{customer.FullName}' vì khách hàng đã có {customerBookingIds.Count} đơn đặt tour trong hệ thống.");
        }

        var hasPayments = await _context.Payments.Find(p => p.CustomerId == id).AnyAsync();
        if (hasPayments)
        {
            throw new InvalidOperationException($"Không thể xóa khách hàng '{customer.FullName}' vì đang có giao dịch thanh toán liên kết.");
        }

        var hasReviews = await _context.Reviews.Find(r => r.CustomerId == id).AnyAsync();
        if (hasReviews)
        {
            throw new InvalidOperationException($"Không thể xóa khách hàng '{customer.FullName}' vì đã có đánh giá tour trong hệ thống.");
        }

        var result = await _context.Customers.DeleteOneAsync(c => c.Id == id);
        return result.DeletedCount > 0;
    }
    #endregion

    #region Transactions / Payments
    public async Task<(List<Payment> Items, long TotalCount)> GetTransactionsAsync(
        string? search = null,
        string? status = null,
        string? paymentMethod = null,
        string? transactionDate = null,
        string? sort = null,
        int page = 1,
        int pageSize = 5)
    {
        var p = page > 0 ? page : 1;
        var ps = (pageSize > 0 && pageSize <= 100) ? pageSize : 5;

        var builder = Builders<Payment>.Filter;
        var filters = new List<FilterDefinition<Payment>>();

        // 1. Lọc theo từ khóa.
        if (!string.IsNullOrWhiteSpace(search))
        {
            var kw = search.Trim();
            var searchFilters = new List<FilterDefinition<Payment>>();

            // Thử đọc từ khóa thành mã số hoặc mã TXN.
            if (int.TryParse(kw, out int numId))
            {
                searchFilters.Add(builder.Eq(x => x.Id, numId));
                searchFilters.Add(builder.Eq(x => x.BookingId, numId));
            }
            else if (kw.StartsWith("TXN-", StringComparison.OrdinalIgnoreCase) && int.TryParse(kw.Substring(4), out int txnNum))
            {
                searchFilters.Add(builder.Eq(x => x.Id, txnNum));
            }

            // Tìm phương thức thanh toán bằng regex.
            searchFilters.Add(builder.Regex(x => x.PaymentMethod, new MongoDB.Bson.BsonRegularExpression(Regex.Escape(kw), "i")));

            // Tìm booking liên quan theo mã đơn, tên khách hoặc tên tour.
            var bookingRegex = new MongoDB.Bson.BsonRegularExpression(Regex.Escape(kw), "i");
            var bookingFilter = Builders<Booking>.Filter.Or(
                Builders<Booking>.Filter.Regex(b => b.BookingCode, bookingRegex),
                Builders<Booking>.Filter.Regex(b => b.CustomerName, bookingRegex),
                Builders<Booking>.Filter.Regex(b => b.TourTitle, bookingRegex)
            );
            var matchedBookingIds = await _context.Bookings.Find(bookingFilter).Project(b => b.Id).ToListAsync();

            // Tìm khách liên quan theo tên, email hoặc điện thoại.
            var custFilter = Builders<Customer>.Filter.Or(
                Builders<Customer>.Filter.Regex(c => c.FullName, bookingRegex),
                Builders<Customer>.Filter.Regex(c => c.Email, bookingRegex),
                Builders<Customer>.Filter.Regex(c => c.Phone, bookingRegex)
            );
            var matchedCustIds = await _context.Customers.Find(custFilter).Project(c => c.Id).ToListAsync();
            if (matchedCustIds.Count > 0)
            {
                var custBookings = await _context.Bookings.Find(b => matchedCustIds.Contains(b.CustomerId)).Project(b => b.Id).ToListAsync();
                matchedBookingIds.AddRange(custBookings);
            }

            // Tìm hóa đơn liên quan theo số hóa đơn.
            var billFilter = Builders<Bill>.Filter.Regex(b => b.BillNumber, bookingRegex);
            var matchedBillBookings = await _context.Bills.Find(billFilter).Project(b => b.BookingId).ToListAsync();
            if (matchedBillBookings.Count > 0)
            {
                matchedBookingIds.AddRange(matchedBillBookings);
            }

            matchedBookingIds = matchedBookingIds.Distinct().ToList();
            if (matchedBookingIds.Count > 0)
            {
                searchFilters.Add(builder.In(x => x.BookingId, matchedBookingIds));
            }

            filters.Add(builder.Or(searchFilters));
        }

        // 2. Lọc phương thức thanh toán.
        if (!string.IsNullOrWhiteSpace(paymentMethod))
        {
            filters.Add(builder.Regex(x => x.PaymentMethod, new MongoDB.Bson.BsonRegularExpression(Regex.Escape(paymentMethod.Trim()), "i")));
        }

        // 3. Lọc theo trạng thái booking.
        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = status.Trim().ToLower();
            FilterDefinition<Booking> bookingStatusFilter;
            if (st == "success" || st == "confirmed")
            {
                bookingStatusFilter = Builders<Booking>.Filter.In(b => b.Status, new[] { "confirmed", "success" });
            }
            else if (st == "pending")
            {
                bookingStatusFilter = Builders<Booking>.Filter.Eq(b => b.Status, "pending");
            }
            else if (st == "refunded" || st == "cancelled")
            {
                bookingStatusFilter = Builders<Booking>.Filter.In(b => b.Status, new[] { "cancelled", "refunded" });
            }
            else
            {
                bookingStatusFilter = Builders<Booking>.Filter.Regex(b => b.Status, new MongoDB.Bson.BsonRegularExpression(Regex.Escape(st), "i"));
            }

            var statusBookingIds = await _context.Bookings.Find(bookingStatusFilter).Project(b => b.Id).ToListAsync();
            filters.Add(builder.In(x => x.BookingId, statusBookingIds));
        }

        // 4. Lọc khoảng ngày.
        if (!string.IsNullOrWhiteSpace(transactionDate) && DateTime.TryParse(transactionDate.Trim(), out var parsedDate))
        {
            var startUtc = DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc);
            var endUtc = startUtc.AddDays(1);
            filters.Add(builder.Gte(x => x.CreatedAt, startUtc) & builder.Lt(x => x.CreatedAt, endUtc));
        }

        var combinedFilter = filters.Count > 0 ? builder.And(filters) : builder.Empty;
        var total = await _context.Payments.CountDocumentsAsync(combinedFilter);

        // 5. Sắp xếp kèm khóa phụ để kết quả ổn định.
        var sortDef = Builders<Payment>.Sort.Descending(p => p.CreatedAt).Descending(p => p.Id);
        if (!string.IsNullOrWhiteSpace(sort))
        {
            switch (sort.Trim().ToLower())
            {
                case "oldest":
                    sortDef = Builders<Payment>.Sort.Ascending(p => p.CreatedAt).Ascending(p => p.Id);
                    break;
                case "amount_desc":
                    sortDef = Builders<Payment>.Sort.Descending(p => p.Amount).Descending(p => p.Id);
                    break;
                case "amount_asc":
                    sortDef = Builders<Payment>.Sort.Ascending(p => p.Amount).Ascending(p => p.Id);
                    break;
                case "newest":
                default:
                    sortDef = Builders<Payment>.Sort.Descending(p => p.CreatedAt).Descending(p => p.Id);
                    break;
            }
        }

        var items = await _context.Payments.Find(combinedFilter)
            .Sort(sortDef)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        await PopulateTransactionDetailsAsync(items);
        return (items, total);
    }

    public async Task<TransactionStatsDto> GetTransactionStatsAsync()
    {
        var allPayments = await _context.Payments.Find(Builders<Payment>.Filter.Empty).ToListAsync();
        var totalAmount = allPayments.Sum(p => p.Amount);
        var totalCount = allPayments.Count;

        var now = DateTime.UtcNow;
        var todayStart = DateTime.SpecifyKind(now.Date, DateTimeKind.Utc);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var todayCount = allPayments.Count(p => p.CreatedAt >= todayStart);
        var monthAmount = allPayments.Where(p => p.CreatedAt >= monthStart).Sum(p => p.Amount);

        return new TransactionStatsDto
        {
            TotalAmount = totalAmount,
            TotalTransactions = totalCount,
            TodayTransactions = todayCount,
            MonthAmount = monthAmount > 0 ? monthAmount : totalAmount
        };
    }

    public async Task<Payment?> GetTransactionByIdAsync(int id)
    {
        var payment = await _context.Payments.Find(p => p.Id == id).FirstOrDefaultAsync();
        if (payment is not null) await PopulateTransactionDetailsAsync(new[] { payment });
        return payment;
    }

    private async Task PopulateTransactionDetailsAsync(IReadOnlyCollection<Payment> payments)
    {
        if (payments.Count == 0) return;

        var bookingIds = payments.Select(p => p.BookingId).Distinct().ToList();
        var bookings = await _context.Bookings.Find(b => bookingIds.Contains(b.Id)).ToListAsync();
        var bookingMap = bookings.ToDictionary(b => b.Id);
        var bills = await _context.Bills.Find(b => bookingIds.Contains(b.BookingId)).ToListAsync();
        var billMap = bills.ToLookup(b => b.BookingId);
        var customers = bookings.Select(b => b.CustomerId).Distinct().ToList();
        var customerMap = (await _context.Customers.Find(c => customers.Contains(c.Id)).ToListAsync()).ToDictionary(c => c.Id);
        var departures = bookings.Select(b => b.DepartureId).Distinct().ToList();
        var departureMap = (await _context.TourDepartures.Find(d => departures.Contains(d.Id)).ToListAsync()).ToDictionary(d => d.Id);

        foreach (var payment in payments)
        {
            if (!bookingMap.TryGetValue(payment.BookingId, out var booking)) continue;

            payment.BookingCode = booking.BookingCode;
            payment.TourTitle = booking.TourTitle;
            payment.TourId = booking.TourId;
            payment.CustomerId = booking.CustomerId;
            payment.BookingStatus = booking.Status;
            payment.AwaitingPaymentConfirmation = booking.PaymentOption is not null && booking.Status == "pending";
            payment.BillNumber = billMap[booking.Id].FirstOrDefault()?.BillNumber ?? $"INV-{booking.Id:D3}";
            payment.TotalAdults = booking.TotalAdults;
            payment.TotalChildren = booking.TotalChildren;
            customerMap.TryGetValue(booking.CustomerId, out var customer);
            payment.CustomerName = booking.CustomerName ?? customer?.FullName ?? "Khách hàng";
            payment.CustomerEmail = customer?.Email ?? $"{booking.BookingCode?.ToLower()}@bookingtour.vn";
            payment.CustomerPhone = customer?.Phone ?? "Chưa cung cấp";
            payment.CustomerAddress = customer?.Address;
            if (departureMap.TryGetValue(booking.DepartureId, out var departure))
            {
                payment.DepartureDate = departure.DepartureDate;
                if (!payment.TourId.HasValue || payment.TourId == 0) payment.TourId = departure.TourId;
            }
        }
    }
    #endregion

    #region Dashboard
    public async Task<DashboardStatsResponse> GetDashboardStatsAsync(DateTime? startDate, DateTime? endDate)
    {
        DateTime? startUtc = null;
        if (startDate.HasValue)
        {
            startUtc = DateTime.SpecifyKind(startDate.Value.Date, DateTimeKind.Utc);
        }

        DateTime? endUtc = null;
        if (endDate.HasValue)
        {
            endUtc = DateTime.SpecifyKind(endDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
        }

        var totalTours = await _context.Tours.CountDocumentsAsync(_ => true);

        // Lọc đơn đặt tour.
        var bookingFilterBuilder = Builders<Booking>.Filter;
        var bookingFilter = bookingFilterBuilder.Empty;
        if (startUtc.HasValue)
        {
            bookingFilter &= bookingFilterBuilder.Gte(b => b.CreatedAt, startUtc.Value);
        }
        if (endUtc.HasValue)
        {
            bookingFilter &= bookingFilterBuilder.Lte(b => b.CreatedAt, endUtc.Value);
        }

        var totalBookings = await _context.Bookings.CountDocumentsAsync(bookingFilter);
        var cancelledBookings = await _context.Bookings.CountDocumentsAsync(
            bookingFilter & bookingFilterBuilder.Eq(b => b.Status, "cancelled")
        );

        double cancellationRate = totalBookings > 0
            ? Math.Round((double)cancelledBookings / totalBookings * 100, 1)
            : 0;

        // Lọc khách hàng.
        var customerFilterBuilder = Builders<Customer>.Filter;
        var customerFilter = customerFilterBuilder.Empty;
        if (startUtc.HasValue)
        {
            customerFilter &= customerFilterBuilder.Gte(c => c.CreatedAt, startUtc.Value);
        }
        if (endUtc.HasValue)
        {
            customerFilter &= customerFilterBuilder.Lte(c => c.CreatedAt, endUtc.Value);
        }
        var newCustomers = await _context.Customers.CountDocumentsAsync(customerFilter);

        // Lọc khoản thanh toán để tính doanh thu.
        var paymentFilterBuilder = Builders<Payment>.Filter;
        var paymentFilter = paymentFilterBuilder.Empty;
        if (startUtc.HasValue)
        {
            paymentFilter &= paymentFilterBuilder.Gte(p => p.CreatedAt, startUtc.Value);
        }
        if (endUtc.HasValue)
        {
            paymentFilter &= paymentFilterBuilder.Lte(p => p.CreatedAt, endUtc.Value);
        }

        var payments = await _context.Payments.Find(paymentFilter).ToListAsync();
        decimal totalRevenue = payments.Sum(p => p.Amount);

        // Nếu chưa có khoản thu, dự phòng bằng tổng giá trị đơn confirmed.
        if (totalRevenue == 0)
        {
            var confirmedBookings = await _context.Bookings.Find(
                bookingFilter & bookingFilterBuilder.In(b => b.Status, new[] { "confirmed", "completed", "paid", "success" })
            ).ToListAsync();
            totalRevenue = confirmedBookings.Sum(b => b.TotalAmount);
        }

        var openDepartures = await _context.TourDepartures.CountDocumentsAsync(d => d.Status == "open");

        // Lấy 5 đơn gần nhất phù hợp với bộ lọc.
        var recentBookingsRaw = await _context.Bookings.Find(bookingFilter)
            .SortByDescending(b => b.CreatedAt)
            .Limit(5)
            .ToListAsync();

        var recentBookingIds = recentBookingsRaw.Select(b => b.Id).ToList();
        var recentPayments = await _context.Payments.Find(p => recentBookingIds.Contains(p.BookingId)).ToListAsync();
        var paymentMap = recentPayments.ToDictionary(p => p.BookingId);

        // Ghép bổ sung tên khách và tour khi dữ liệu chưa có.
        var missingCustIds = recentBookingsRaw
            .Where(b => string.IsNullOrWhiteSpace(b.CustomerName) && b.CustomerId > 0)
            .Select(b => b.CustomerId)
            .Distinct()
            .ToList();

        var missingTourIds = recentBookingsRaw
            .Where(b => string.IsNullOrWhiteSpace(b.TourTitle) && b.TourId.HasValue)
            .Select(b => b.TourId!.Value)
            .Distinct()
            .ToList();

        Dictionary<int, string> customerNames = new();
        if (missingCustIds.Any())
        {
            var custs = await _context.Customers.Find(c => missingCustIds.Contains(c.Id)).ToListAsync();
            customerNames = custs.ToDictionary(c => c.Id, c => c.FullName);
        }

        Dictionary<int, string> tourTitles = new();
        if (missingTourIds.Any())
        {
            var trs = await _context.Tours.Find(t => missingTourIds.Contains(t.Id)).ToListAsync();
            tourTitles = trs.ToDictionary(t => t.Id, t => t.Title);
        }

        var recentBookingsDto = recentBookingsRaw.Select(b =>
        {
            var cName = !string.IsNullOrWhiteSpace(b.CustomerName)
                ? b.CustomerName
                : (customerNames.TryGetValue(b.CustomerId, out var name) ? name : "Khách hàng");

            var tTitle = !string.IsNullOrWhiteSpace(b.TourTitle)
                ? b.TourTitle
                : (b.TourId.HasValue && tourTitles.TryGetValue(b.TourId.Value, out var title) ? title : "Tour du lịch");

            return new DashboardRecentBookingDto
            {
                Id = b.Id,
                PaymentId = paymentMap.TryGetValue(b.Id, out var paym) ? paym.Id : (int?)null,
                BookingCode = !string.IsNullOrEmpty(b.BookingCode) ? b.BookingCode : $"BK{b.Id:D3}",
                CustomerName = cName,
                TourTitle = tTitle,
                TotalAmount = b.TotalAmount,
                Status = b.Status,
                BookingStatus = b.Status,
                CreatedAt = b.CreatedAt
            };
        }).ToList();

        return new DashboardStatsResponse
        {
            TotalTours = totalTours,
            TotalBookings = totalBookings,
            CancelledBookings = cancelledBookings,
            CancellationRate = cancellationRate,
            NewCustomers = newCustomers,
            TotalRevenue = totalRevenue,
            OpenDepartures = openDepartures,
            RecentBookings = recentBookingsDto
        };
    }

    public async Task<TransactionDetailDto?> GetTransactionDetailAsync(string identifier)
    {
        if (string.IsNullOrWhiteSpace(identifier)) return null;

        Payment? payment = null;
        Booking? booking = null;

        // 1. Thử đọc mã khoản thu hoặc booking dạng số.
        if (int.TryParse(identifier, out int numId))
        {
            payment = await _context.Payments.Find(p => p.Id == numId).FirstOrDefaultAsync();
            if (payment != null)
            {
                booking = await _context.Bookings.Find(b => b.Id == payment.BookingId).FirstOrDefaultAsync();
            }
            else
            {
                // Tìm khoản thu qua BookingId và booking qua mã đơn.
                payment = await _context.Payments.Find(p => p.BookingId == numId).FirstOrDefaultAsync();
                booking = await _context.Bookings.Find(b => b.Id == numId).FirstOrDefaultAsync();
            }
        }

        // 2. Thử tìm bằng booking_code hoặc mã giao dịch TXN.
        if (payment == null && booking == null)
        {
            var cleanCode = identifier.Trim();
            if (cleanCode.StartsWith("TXN-", StringComparison.OrdinalIgnoreCase))
            {
                var sub = cleanCode.Substring(4);
                if (int.TryParse(sub, out int payId))
                {
                    payment = await _context.Payments.Find(p => p.Id == payId).FirstOrDefaultAsync();
                    if (payment != null)
                    {
                        booking = await _context.Bookings.Find(b => b.Id == payment.BookingId).FirstOrDefaultAsync();
                    }
                }
                if (booking == null)
                {
                    cleanCode = sub; // Ví dụ chuyển TXN-BK001 thành BK001.
                }
            }

            if (booking == null)
            {
                booking = await _context.Bookings.Find(b => b.BookingCode == cleanCode).FirstOrDefaultAsync();
                if (booking != null && payment == null)
                {
                    payment = await _context.Payments.Find(p => p.BookingId == booking.Id).FirstOrDefaultAsync();
                }
            }

            // Kiểm tra thêm số hóa đơn, ví dụ INV-001.
            if (booking == null && payment == null)
            {
                var billByNum = await _context.Bills.Find(bl => bl.BillNumber == cleanCode).FirstOrDefaultAsync();
                if (billByNum != null)
                {
                    booking = await _context.Bookings.Find(b => b.Id == billByNum.BookingId).FirstOrDefaultAsync();
                    payment = await _context.Payments.Find(p => p.BookingId == billByNum.BookingId).FirstOrDefaultAsync();
                }
            }
        }

        // Không tìm thấy cả khoản thu và booking thì trả null.
        if (payment == null && booking == null)
        {
            return null;
        }

        // 3. Ghép khách hàng.
        Customer? customer = null;
        var custId = booking?.CustomerId ?? 0;
        if (custId > 0)
        {
            customer = await _context.Customers.Find(c => c.Id == custId).FirstOrDefaultAsync();
        }

        // 4. Ghép lịch khởi hành và tour.
        TourDeparture? departure = null;
        var depId = booking?.DepartureId ?? 0;
        if (depId > 0)
        {
            departure = await _context.TourDepartures.Find(d => d.Id == depId).FirstOrDefaultAsync();
        }

        Tour? tour = null;
        var tourId = booking?.TourId ?? departure?.TourId ?? 0;
        if (tourId > 0)
        {
            tour = await _context.Tours.Find(t => t.Id == tourId).FirstOrDefaultAsync();
        }

        // 5. Ghép hóa đơn nội bộ.
        Bill? bill = null;
        var bId = booking?.Id ?? payment?.BookingId ?? 0;
        if (bId > 0)
        {
            bill = await _context.Bills.Find(bl => bl.BookingId == bId).FirstOrDefaultAsync();
        }

        // Gom dữ liệu thành DTO trả về API.
        var txnId = payment?.Id ?? booking?.Id ?? 0;
        var txnCode = payment != null 
            ? $"TXN-{payment.Id:D4}" 
            : (booking != null ? $"TXN-{booking.BookingCode}" : $"TXN-{txnId:D4}");

        var bookingCode = booking?.BookingCode ?? (payment != null ? $"BK{payment.BookingId:D3}" : "");
        var custName = customer?.FullName ?? booking?.CustomerName ?? "Khách hàng vãng lai";
        var custEmail = customer?.Email ?? (!string.IsNullOrEmpty(bookingCode) ? $"{bookingCode.ToLower()}@bookingtour.vn" : "khachhang@example.com");
        var custPhone = customer?.Phone ?? "Chưa cung cấp";
        var custAddress = customer?.Address ?? "Việt Nam";

        var totalBookingAmount = booking?.TotalAmount ?? payment?.Amount ?? 0;
        var paidAmount = payment?.Amount ?? (booking?.Status == "confirmed" ? booking.TotalAmount : 0);
        var status = booking?.Status ?? (payment != null ? "confirmed" : "pending");

        var billNumber = bill?.BillNumber ?? (!string.IsNullOrEmpty(bookingCode) ? $"INV-{booking?.Id ?? payment?.BookingId:D3}" : null);

        return new TransactionDetailDto
        {
            TransactionId = txnId,
            TransactionCode = txnCode,
            PaymentId = payment?.Id,
            PaymentMethod = payment?.PaymentMethod ?? (booking?.Status == "confirmed" ? "Thanh toán trực tuyến" : "Chờ cổng thanh toán"),
            PaymentDate = payment?.CreatedAt,
            CreatedAt = payment?.CreatedAt ?? booking?.CreatedAt ?? DateTime.UtcNow,
            Amount = paidAmount > 0 ? paidAmount : totalBookingAmount,
            Status = status,
            Description = $"Thanh toán đơn đặt tour {bookingCode}".Trim(),

            CustomerId = custId,
            CustomerName = custName,
            CustomerEmail = custEmail,
            CustomerPhone = custPhone,
            CustomerAddress = custAddress,

            BookingId = booking?.Id ?? payment?.BookingId,
            BookingCode = bookingCode,
            TourId = tourId > 0 ? tourId : null,
            TourTitle = tour?.Title ?? booking?.TourTitle ?? "Tour du lịch di sản",
            DepartureDate = departure?.DepartureDate ?? booking?.DepartureDate,
            ReturnDate = departure?.ReturnDate ?? booking?.ReturnDate,
            TotalAdults = booking?.TotalAdults ?? 0,
            TotalChildren = booking?.TotalChildren ?? 0,
            TotalBookingAmount = totalBookingAmount,
            PaidAmount = paidAmount,

            BillId = bill?.Id,
            BillNumber = billNumber,
            BillAmount = bill?.FinalAmount ?? totalBookingAmount,
            BillStatus = bill != null ? "Đã phát hành" : (status == "confirmed" && paidAmount >= totalBookingAmount ? "Đã phát hành" : "Chưa phát hành"),
            BillDate = bill?.CreatedAt,
            AwaitingPaymentConfirmation = (booking?.Status == "pending" && booking?.PaymentOption != null) || (status == "pending" && paidAmount < totalBookingAmount)
        };
    }
    #endregion
}

