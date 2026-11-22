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

    public async Task<(List<TourDeparture> Items, long TotalCount)> QueryDeparturesAsync(string? keyword, DateTime? date, string? status, int page = 1, int pageSize = 10)
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

        if (date.HasValue)
        {
            var dayStart = date.Value.Date;
            var dayEnd = dayStart.AddDays(1);
            filter &= builder.Gte(d => d.DepartureDate, dayStart) & builder.Lt(d => d.DepartureDate, dayEnd);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            filter &= builder.Eq(d => d.Status, status.Trim().ToLower());
        }

        var totalCount = await _context.TourDepartures.CountDocumentsAsync(filter);
        var p = page > 0 ? page : 1;
        var ps = pageSize > 0 ? pageSize : 10;

        var items = await _context.TourDepartures.Find(filter)
            .SortBy(d => d.DepartureDate)
            .Skip((p - 1) * ps)
            .Limit(ps)
            .ToListAsync();

        await PopulateDepartureRelationsAsync(items);
        return (items, totalCount);
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
        ValidateDeparture(request);
        var tour = await _context.Tours.Find(t => t.Id == request.TourId).FirstOrDefaultAsync()
                   ?? throw new ArgumentException($"Tour du lịch mã {request.TourId} không tồn tại.");

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
            AdultPrice = request.AdultPrice,
            ChildPrice = request.ChildPrice,
            Status = request.Status ?? "open",
            GuideId = request.GuideId,
            GuideName = guide?.FullName,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.TourDepartures.InsertOneAsync(departure);
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

        var update = Builders<TourDeparture>.Update
            .Set(d => d.TourId, tour.Id)
            .Set(d => d.TourTitle, tour.Title)
            .Set(d => d.DepartureDate, request.DepartureDate)
            .Set(d => d.ReturnDate, request.ReturnDate)
            .Set(d => d.MaxSeats, request.MaxSeats)
            .Set(d => d.AvailableSeats, available)
            .Set(d => d.AdultPrice, request.AdultPrice)
            .Set(d => d.ChildPrice, request.ChildPrice)
            .Set(d => d.Status, available == 0 && request.Status == "open" ? "full" : request.Status)
            .Set(d => d.GuideId, request.GuideId)
            .Set(d => d.GuideName, guide?.FullName)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);
        var updated = await _context.TourDepartures.FindOneAndUpdateAsync(
            d => d.Id == id && d.AvailableSeats == departure.AvailableSeats &&
                 d.MaxSeats == departure.MaxSeats && d.UpdatedAt == departure.UpdatedAt,
            update, new FindOneAndUpdateOptions<TourDeparture> { ReturnDocument = ReturnDocument.After });
        return updated ?? throw new ArgumentException("Lịch hoặc số ghế đã thay đổi. Vui lòng tải lại trang và thử lại.");
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
        return result.ModifiedCount > 0;
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
                d.Guide = guide;
                d.GuideName = guide.FullName;
            }
        }
    }
}

