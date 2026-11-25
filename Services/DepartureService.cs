using Backend_DotNet.Data;
using Backend_DotNet.DTOs;
using Backend_DotNet.Models;
using MongoDB.Driver;

namespace Backend_DotNet.Services;

public class DepartureService : IDepartureService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DepartureService> _logger;

    public DepartureService(MongoDbContext context, ILogger<DepartureService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<(List<TourDeparture> Items, long TotalCount)> QueryDeparturesAsync(string? keyword, int? tourId, DateTime? date, string? status, int page = 1, int pageSize = 5)
    {
        var builder = Builders<TourDeparture>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var k = keyword.Trim();
            if (int.TryParse(k, out var parsedId))
            {
                filter &= builder.Or(
                    builder.Eq(d => d.Id, parsedId),
                    builder.Regex(d => d.TourTitle, new MongoDB.Bson.BsonRegularExpression(k, "i")),
                    builder.Regex(d => d.GuideName, new MongoDB.Bson.BsonRegularExpression(k, "i"))
                );
            }
            else
            {
                filter &= builder.Or(
                    builder.Regex(d => d.TourTitle, new MongoDB.Bson.BsonRegularExpression(k, "i")),
                    builder.Regex(d => d.GuideName, new MongoDB.Bson.BsonRegularExpression(k, "i"))
                );
            }
        }

        if (tourId.HasValue && tourId.Value > 0)
        {
            filter &= builder.Eq(d => d.TourId, tourId.Value);
        }

        if (date.HasValue)
        {
            var dayStart = date.Value.Date;
            var dayEnd = dayStart.AddDays(1);
            filter &= builder.Gte(d => d.DepartureDate, dayStart) & builder.Lt(d => d.DepartureDate, dayEnd);
        }

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status.Trim(), "all", StringComparison.OrdinalIgnoreCase))
        {
            var st = status.Trim().ToLower();
            if (st == "full" || st == "sold_out")
            {
                filter &= builder.Or(
                    builder.Eq(d => d.Status, "full"),
                    builder.Eq(d => d.Status, "sold_out"),
                    builder.Lte(d => d.AvailableSeats, 0)
                );
            }
            else
            {
                filter &= builder.Eq(d => d.Status, st);
            }
        }

        var totalCount = await _context.TourDepartures.CountDocumentsAsync(filter);
        var p = page > 0 ? page : 1;
        var ps = pageSize > 0 ? Math.Min(pageSize, 100) : 5;

        var items = await _context.TourDepartures.Find(filter)
            .SortBy(d => d.DepartureDate)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        await PopulateDepartureRelationsAsync(items);
        return (items, totalCount);
    }

    private static readonly TimeZoneInfo VietnamTimeZone = GetVietnamTimeZone();

    private static TimeZoneInfo GetVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (TimeZoneNotFoundException)
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.CreateCustomTimeZone("Vietnam Standard Time", TimeSpan.FromHours(7), "Vietnam Standard Time", "Vietnam Standard Time");
            }
        }
    }

    private static (DateTime StartUtc, DateTime EndUtc) GetVietnamTodayUtcRange()
    {
        var nowUtc = DateTime.UtcNow;
        var nowVn = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, VietnamTimeZone);
        var startVn = new DateTime(nowVn.Year, nowVn.Month, nowVn.Day, 0, 0, 0, DateTimeKind.Unspecified);
        var endVn = startVn.AddDays(1);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startVn, VietnamTimeZone);
        var endUtc = TimeZoneInfo.ConvertTimeToUtc(endVn, VietnamTimeZone);
        return (startUtc, endUtc);
    }

    public async Task<DepartureStatsDto> GetStatsAsync()
    {
        var all = await _context.TourDepartures.Find(_ => true).ToListAsync();
        var (todayStartUtc, todayEndUtc) = GetVietnamTodayUtcRange();

        return new DepartureStatsDto
        {
            TotalCount = all.Count,
            OpenCount = all.Count(d => (d.Status == "open" || string.IsNullOrWhiteSpace(d.Status)) && d.AvailableSeats > 0),
            UnassignedCount = all.Count(d => !d.GuideId.HasValue || d.GuideId.Value <= 0 || string.IsNullOrWhiteSpace(d.GuideName) || d.GuideName == "Chưa phân công"),
            TodayCount = all.Count(d => d.DepartureDate >= todayStartUtc && d.DepartureDate < todayEndUtc),
            FullCount = all.Count(d => d.Status == "sold_out" || d.Status == "full" || d.AvailableSeats <= 0),
            CancelledCount = all.Count(d => d.Status == "cancelled")
        };
    }

    public async Task<TourDeparture?> GetDepartureByIdAsync(int id)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == id).FirstOrDefaultAsync();
        if (departure == null) return null;

        var list = new List<TourDeparture> { departure };
        await PopulateDepartureRelationsAsync(list);
        return departure;
    }

    private static void ValidateDeparture(DepartureCreateRequest request)
    {
        if (request.DepartureDate == default || request.ReturnDate < request.DepartureDate)
            throw new ArgumentException("Ngày về phải bằng hoặc sau ngày khởi hành.");
        if (request.Status is not ("open" or "full" or "cancelled"))
            throw new ArgumentException("Trạng thái chuyến khởi hành không hợp lệ.");
    }

    private async Task<Employee?> FindGuideAsync(int? id)
    {
        if (id is null) return null;
        return await _context.Employees.Find(e => e.Id == id.Value && e.RoleId == 3).FirstOrDefaultAsync()
            ?? throw new ArgumentException("Hướng dẫn viên không hợp lệ.");
    }

    public async Task<TourDeparture> CreateDepartureAsync(DepartureCreateRequest request)
    {
        if (request.TourId <= 0)
        {
            throw new ArgumentException("Vui lòng chọn tour du lịch.");
        }

        var tour = await _context.Tours.Find(t => t.Id == request.TourId).FirstOrDefaultAsync()
                   ?? throw new ArgumentException($"Tour du lịch mã {request.TourId} không tồn tại.");

        if (request.DepartureDate == default)
        {
            throw new ArgumentException("Vui lòng chọn ngày khởi hành hợp lệ.");
        }

        if (request.ReturnDate == default)
        {
            throw new ArgumentException("Vui lòng chọn ngày kết thúc hợp lệ.");
        }

        if (request.ReturnDate < request.DepartureDate)
        {
            throw new ArgumentException("Ngày kết thúc phải cùng ngày hoặc sau ngày khởi hành.");
        }

        if (request.MaxSeats <= 0)
        {
            throw new ArgumentException("Số lượng khách tối đa phải lớn hơn 0.");
        }

        if (request.AdultPrice < 0 || request.ChildPrice < 0)
        {
            throw new ArgumentException("Giá vé không được là số âm.");
        }

        var adultPrice = request.AdultPrice > 0 ? request.AdultPrice : tour.MinPrice;
        var childPrice = request.ChildPrice > 0 ? request.ChildPrice : Math.Round(adultPrice * 0.7m);

        var guide = await FindGuideAsync(request.GuideId);

        var nextId = await _context.GetNextSequenceAsync("tour_departures");
        var now = DateTime.UtcNow;

        var departure = new TourDeparture
        {
            Id = nextId,
            TourId = tour.Id,
            TourTitle = tour.Title,
            DepartureDate = request.DepartureDate,
            ReturnDate = request.ReturnDate,
            MaxSeats = request.MaxSeats,
            AvailableSeats = request.MaxSeats,
            AdultPrice = adultPrice,
            ChildPrice = childPrice,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "open" : request.Status.Trim().ToLower(),
            GuideId = request.GuideId,
            GuideName = guide?.FullName,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.TourDepartures.InsertOneAsync(departure);
        departure.Tour = tour;
        return departure;
    }

    public async Task<TourDeparture> UpdateDepartureAsync(int id, DepartureUpdateRequest request)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == id).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {id}.");

        ValidateDeparture(request);
        var tour = await _context.Tours.Find(t => t.Id == request.TourId).FirstOrDefaultAsync()
                   ?? throw new ArgumentException($"Tour du lịch mã {request.TourId} không tồn tại.");
        var guide = await FindGuideAsync(request.GuideId);
        var reserved = Math.Max(0, departure.MaxSeats - departure.AvailableSeats);
        var available = request.AvailableSeats ?? request.MaxSeats - reserved;
        if (available < 0 || available > request.MaxSeats - reserved)
            throw new ArgumentException($"Sức chứa và chỗ trống phải giữ đủ {reserved} chỗ đã đặt.");
        if (tour.Id != departure.TourId && (reserved > 0 ||
            await _context.Bookings.Find(b => b.DepartureId == id).AnyAsync()))
            throw new ArgumentException("Không thể đổi tour của lịch đã có khách đặt.");

        var adultPrice = request.AdultPrice > 0 ? request.AdultPrice : (departure.AdultPrice > 0 ? departure.AdultPrice : tour.MinPrice);
        var childPrice = request.ChildPrice > 0 ? request.ChildPrice : Math.Round(adultPrice * 0.7m);

        var update = Builders<TourDeparture>.Update
            .Set(d => d.TourId, tour.Id)
            .Set(d => d.TourTitle, tour.Title)
            .Set(d => d.DepartureDate, request.DepartureDate)
            .Set(d => d.ReturnDate, request.ReturnDate)
            .Set(d => d.MaxSeats, request.MaxSeats)
            .Set(d => d.AvailableSeats, available)
            .Set(d => d.AdultPrice, adultPrice)
            .Set(d => d.ChildPrice, childPrice)
            .Set(d => d.Status, available == 0 && request.Status == "open" ? "full" : (request.Status ?? departure.Status))
            .Set(d => d.GuideId, request.GuideId)
            .Set(d => d.GuideName, guide?.FullName)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);
        var updated = await _context.TourDepartures.FindOneAndUpdateAsync(
            d => d.Id == id && d.AvailableSeats == departure.AvailableSeats &&
                 d.MaxSeats == departure.MaxSeats && d.UpdatedAt == departure.UpdatedAt,
            update, new FindOneAndUpdateOptions<TourDeparture> { ReturnDocument = ReturnDocument.After });
        if (updated == null)
            throw new ArgumentException("Lịch hoặc số ghế đã thay đổi. Vui lòng tải lại trang và thử lại.");
        updated.Tour = tour;
        return updated;
    }

    public async Task<bool> DeleteDepartureAsync(int id)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == id).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {id}.");

        var hasBookings = await _context.Bookings.Find(b => b.DepartureId == id).AnyAsync();
        if (hasBookings || departure.AvailableSeats < departure.MaxSeats)
        {
            throw new InvalidOperationException($"Không thể xóa chuyến đi mã {id} vì đã có khách đặt chỗ.");
        }

        var result = await _context.TourDepartures.DeleteOneAsync(d => d.Id == id &&
            d.AvailableSeats == departure.AvailableSeats && d.UpdatedAt == departure.UpdatedAt);
        if (result.DeletedCount == 0)
            throw new InvalidOperationException("Lịch hoặc số ghế đã thay đổi. Vui lòng tải lại trang.");
        return true;
    }

    public async Task<bool> AssignGuideAsync(int id, int guideId)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == id).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {id}.");

        var guide = await _context.Employees.Find(e => e.Id == guideId && e.RoleId == 3).FirstOrDefaultAsync()
                    ?? throw new KeyNotFoundException($"Không tìm thấy hướng dẫn viên mã {guideId}.");

        var update = Builders<TourDeparture>.Update
            .Set(d => d.GuideId, guide.Id)
            .Set(d => d.GuideName, guide.FullName)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);

        var result = await _context.TourDepartures.UpdateOneAsync(d => d.Id == id, update);
        return result.MatchedCount > 0;
    }

    public async Task<DepartureBookingsResponse> GetDepartureBookingsAsync(int departureId, int page = 1, int pageSize = 5)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == departureId).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {departureId}.");

        if (page < 1) page = 1;
        if (pageSize <= 0) pageSize = 5;

        // Lấy tất cả booking của chuyến khởi hành này để tính tổng số khách và tổng số đơn
        var allBookings = await _context.Bookings
            .Find(b => b.DepartureId == departureId)
            .ToListAsync();

        var totalBookings = allBookings.Count;
        var totalPassengers = allBookings.Sum(b => b.TotalAdults + b.TotalChildren);
        var totalPages = (int)Math.Ceiling((double)totalBookings / pageSize);
        if (totalPages == 0) totalPages = 1;

        // Phân trang danh sách booking sắp xếp theo Id giảm dần
        var pagedBookings = allBookings
            .OrderByDescending(b => b.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var customerIds = pagedBookings.Select(b => b.CustomerId).Distinct().ToList();
        var customers = await _context.Customers
            .Find(c => customerIds.Contains(c.Id))
            .ToListAsync();
        var customerDict = customers.ToDictionary(c => c.Id);

        var tourTitle = departure.TourTitle;
        if (string.IsNullOrWhiteSpace(tourTitle) && departure.TourId > 0)
        {
            var tour = await _context.Tours.Find(t => t.Id == departure.TourId).FirstOrDefaultAsync();
            tourTitle = tour?.Title;
        }

        var items = pagedBookings.Select(b =>
        {
            customerDict.TryGetValue(b.CustomerId, out var cust);
            return new DepartureBookingDto
            {
                Id = b.Id,
                BookingCode = b.BookingCode,
                CustomerId = b.CustomerId,
                CustomerName = !string.IsNullOrWhiteSpace(b.CustomerName) ? b.CustomerName : (cust?.FullName ?? $"Khách #{b.CustomerId}"),
                CustomerPhone = cust?.Phone,
                CustomerEmail = cust?.Email,
                DepartureId = b.DepartureId,
                TourId = b.TourId ?? departure.TourId,
                TourTitle = !string.IsNullOrWhiteSpace(b.TourTitle) ? b.TourTitle : tourTitle,
                TotalAdults = b.TotalAdults,
                TotalChildren = b.TotalChildren,
                TotalAmount = b.TotalAmount,
                Status = b.Status,
                CreatedAt = b.CreatedAt,
                Passengers = b.Passengers ?? new()
            };
        }).ToList();

        return new DepartureBookingsResponse
        {
            DepartureId = departureId,
            TourTitle = tourTitle ?? "Chuyến đi",
            TotalBookings = totalBookings,
            TotalPassengers = totalPassengers,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages,
            Items = items
        };
    }

    private async Task PopulateDepartureRelationsAsync(List<TourDeparture> departures)
    {
        if (!departures.Any()) return;

        var tourIds = departures.Select(d => d.TourId).Distinct().ToList();
        var guideIds = departures.Where(d => d.GuideId.HasValue).Select(d => d.GuideId!.Value).Distinct().ToList();

        var tours = await _context.Tours.Find(t => tourIds.Contains(t.Id)).ToListAsync();
        var guides = await _context.Employees.Find(e => guideIds.Contains(e.Id)).ToListAsync();

        var tourMap = tours.ToDictionary(t => t.Id);
        var guideMap = guides.ToDictionary(g => g.Id);

        foreach (var d in departures)
        {
            if (tourMap.TryGetValue(d.TourId, out var tour))
            {
                d.Tour = tour;
                d.TourTitle = tour.Title;
                d.ThumbnailUrl = tour.ThumbnailUrl;
            }
            if (d.GuideId.HasValue && guideMap.TryGetValue(d.GuideId.Value, out var guide))
            {
                d.GuideName = guide.FullName;
            }
        }
    }
}

