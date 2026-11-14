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

    public async Task<TourDeparture> CreateDepartureAsync(DepartureCreateRequest request)
    {
        var tour = await _context.Tours.Find(t => t.Id == request.TourId).FirstOrDefaultAsync()
                   ?? throw new ArgumentException($"Tour du lịch mã {request.TourId} không tồn tại.");

        string? guideName = null;
        if (request.GuideId.HasValue && request.GuideId.Value > 0)
        {
            var guide = await _context.Employees.Find(e => e.Id == request.GuideId.Value).FirstOrDefaultAsync();
            guideName = guide?.FullName;
        }

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
            GuideName = guideName,
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

        var tour = await _context.Tours.Find(t => t.Id == request.TourId).FirstOrDefaultAsync()
                   ?? throw new ArgumentException($"Tour du lịch mã {request.TourId} không tồn tại.");

        string? guideName = departure.GuideName;
        if (request.GuideId.HasValue && request.GuideId.Value > 0)
        {
            var guide = await _context.Employees.Find(e => e.Id == request.GuideId.Value).FirstOrDefaultAsync();
            guideName = guide?.FullName;
        }

        departure.TourId = tour.Id;
        departure.TourTitle = tour.Title;
        departure.DepartureDate = request.DepartureDate;
        departure.ReturnDate = request.ReturnDate;
        departure.MaxSeats = request.MaxSeats;
        departure.AvailableSeats = request.AvailableSeats;
        departure.AdultPrice = request.AdultPrice;
        departure.ChildPrice = request.ChildPrice;
        departure.Status = request.AvailableSeats <= 0 ? "full" : (request.Status ?? departure.Status);
        departure.GuideId = request.GuideId;
        departure.GuideName = guideName;
        departure.UpdatedAt = DateTime.UtcNow;

        await _context.TourDepartures.ReplaceOneAsync(d => d.Id == id, departure);
        return departure;
    }

    public async Task<bool> DeleteDepartureAsync(int id)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == id).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {id}.");

        var hasBookings = await _context.Bookings.Find(b => b.DepartureId == id).AnyAsync();
        if (hasBookings)
        {
            throw new InvalidOperationException($"Không thể xóa chuyến đi mã {id} vì đã có khách đặt chỗ.");
        }

        var result = await _context.TourDepartures.DeleteOneAsync(d => d.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<bool> AssignGuideAsync(int id, int guideId)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == id).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {id}.");

        var guide = await _context.Employees.Find(e => e.Id == guideId).FirstOrDefaultAsync()
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

