using Backend_DotNet.Data;
using Backend_DotNet.DTOs;
using Backend_DotNet.Models;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace Backend_DotNet.Services;

public class TourService : ITourService
{
    private readonly MongoDbContext _context;
    private readonly IStorageService _storageService;
    private readonly ILogger<TourService> _logger;

    public TourService(MongoDbContext context, IStorageService storageService, ILogger<TourService> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<List<Tour>> GetFeaturedToursAsync(int limit = 8)
    {
        var tours = await _context.Tours.Find(_ => true)
            .SortByDescending(t => t.Id)
            .Limit(Math.Clamp(limit, 1, 20))
            .ToListAsync();

        await PopulateTourRelationsAsync(tours);
        return tours;
    }

    public async Task<(List<Tour> Items, long TotalCount)> QueryToursAsync(TourQueryParameters p)
    {
        var builder = Builders<Tour>.Filter;
        var filter = builder.Empty;

        if (p.GiaTu.HasValue && p.GiaDen.HasValue && p.GiaTu > p.GiaDen)
            throw new ArgumentException("Giá từ phải nhỏ hơn hoặc bằng giá đến.");

        foreach (var keyword in new[] { p.TuKhoa, p.Destination }.Where(value => !string.IsNullOrWhiteSpace(value)))
        {
            var k = Regex.Escape(keyword!.Trim()); // Tìm chuỗi người dùng nhập, không chạy regex tùy ý.
            var textFilter = builder.Or(
                builder.Regex(t => t.Title, new MongoDB.Bson.BsonRegularExpression(k, "i")),
                builder.Regex(t => t.Description, new MongoDB.Bson.BsonRegularExpression(k, "i")),
                builder.Regex(t => t.ProvinceName, new MongoDB.Bson.BsonRegularExpression(k, "i"))
            );
            filter &= textFilter;
        }

        if (p.DanhMucId.HasValue && p.DanhMucId.Value > 0)
        {
            filter &= builder.Eq(t => t.CategoryId, p.DanhMucId.Value);
        }
        if (p.CategoryIds.Count > 0)
            filter &= builder.In(t => t.CategoryId, p.CategoryIds);

        if (p.TinhId.HasValue && p.TinhId.Value > 0)
        {
            filter &= builder.Eq(t => t.ProvinceId, p.TinhId.Value);
        }

        if (!string.IsNullOrWhiteSpace(p.VungMien))
        {
            // Find provinces in that region
            var region = p.VungMien.Trim().Replace("Miền ", "", StringComparison.OrdinalIgnoreCase);
            var provinceIds = await _context.Provinces.Find(pr => pr.Region == region).Project(pr => pr.Id).ToListAsync();
            filter &= builder.In(t => t.ProvinceId, provinceIds);
        }

        if (!string.IsNullOrWhiteSpace(p.DiemKhoiHanh))
        {
            filter &= builder.Regex(t => t.PickupPoint, new MongoDB.Bson.BsonRegularExpression(Regex.Escape(p.DiemKhoiHanh.Trim()), "i"));
        }

        if (p.GiaTu.HasValue && p.GiaTu.Value > 0)
        {
            filter &= builder.Gte(t => t.MinPrice, p.GiaTu.Value);
        }

        if (p.GiaDen.HasValue && p.GiaDen.Value > 0)
        {
            filter &= builder.Lte(t => t.MinPrice, p.GiaDen.Value);
        }

        if (p.SoNgay.HasValue && p.SoNgay.Value > 0)
        {
            filter &= builder.Lte(t => t.DurationDays, p.SoNgay.Value);
        }

        if (p.NgayBatDau.HasValue)
        {
            var validTourIds = await _context.TourDepartures
                .Find(d => d.DepartureDate >= p.NgayBatDau.Value && d.Status == "open" && d.AvailableSeats > 0)
                .Project(d => d.TourId)
                .ToListAsync();
            filter &= builder.In(t => t.Id, validTourIds.Distinct());
        }

        var totalCount = await _context.Tours.CountDocumentsAsync(filter);

        var query = _context.Tours.Find(filter);

        switch (p.SapXep?.ToLower())
        {
            case "asc":
                query = query.SortBy(t => t.MinPrice).ThenBy(t => t.Id);
                break;
            case "desc":
                query = query.SortByDescending(t => t.MinPrice).ThenBy(t => t.Id);
                break;
            default:
                query = query.SortByDescending(t => t.Id);
                break;
        }

        var page = p.Page > 0 ? p.Page : 1;
        var pageSize = p.PageSize > 0 ? p.PageSize : 9;

        var items = await query.Skip((page - 1) * pageSize).Limit(pageSize).ToListAsync();
        await PopulateTourRelationsAsync(items);

        return (items, totalCount);
    }

    public async Task<Tour?> GetTourByIdAsync(int id)
    {
        var tour = await _context.Tours.Find(t => t.Id == id).FirstOrDefaultAsync();
        if (tour == null) return null;

        tour.Category = await _context.TourCategories.Find(c => c.Id == tour.CategoryId).FirstOrDefaultAsync();
        tour.Province = await _context.Provinces.Find(p => p.Id == tour.ProvinceId).FirstOrDefaultAsync();
        tour.Departures = await _context.TourDepartures.Find(d => d.TourId == tour.Id)
            .SortBy(d => d.DepartureDate)
            .ToListAsync();

        // Populate guide info for departures
        var guideIds = tour.Departures.Where(d => d.GuideId.HasValue).Select(d => d.GuideId!.Value).Distinct().ToList();
        if (guideIds.Any())
        {
            var guides = await _context.Employees.Find(e => guideIds.Contains(e.Id)).ToListAsync();
            var guideMap = guides.ToDictionary(g => g.Id);
            foreach (var d in tour.Departures)
            {
                if (d.GuideId.HasValue && guideMap.TryGetValue(d.GuideId.Value, out var g))
                {
                    d.GuideName = g.FullName;
                }
            }
        }

        tour.Reviews = await _context.Reviews.Find(r => r.TourId == tour.Id)
            .SortByDescending(r => r.CreatedAt)
            .ToListAsync();

        var customerIds = tour.Reviews.Select(r => r.CustomerId).Distinct().ToList();
        if (customerIds.Any())
        {
            var customers = await _context.Customers.Find(c => customerIds.Contains(c.Id)).ToListAsync();
            var custMap = customers.ToDictionary(c => c.Id);
            foreach (var r in tour.Reviews)
            {
                if (custMap.TryGetValue(r.CustomerId, out var c))
                {
                    r.CustomerName = c.FullName;
                }
            }
        }

        tour.Schedules = tour.Schedules.OrderBy(s => s.DayNumber).ToList();
        tour.DeparturesCount = tour.Departures.Count;
        tour.SchedulesCount = tour.Schedules.Count;

        return tour;
    }

    public async Task<List<Tour>> GetToursByProvinceIdAsync(int provinceId)
    {
        var tours = await _context.Tours.Find(t => t.ProvinceId == provinceId).ToListAsync();
        await PopulateTourRelationsAsync(tours);
        return tours;
    }

    public async Task<Tour> CreateTourAsync(TourCreateRequest request)
    {
        var category = await _context.TourCategories.Find(c => c.Id == request.CategoryId).FirstOrDefaultAsync()
                       ?? throw new ArgumentException("Danh mục tour không tồn tại.");
        var province = await _context.Provinces.Find(p => p.Id == request.ProvinceId).FirstOrDefaultAsync()
                       ?? throw new ArgumentException("Tỉnh/thành không tồn tại.");

        var nextId = await _context.GetNextSequenceAsync("tours");
        var now = DateTime.UtcNow;

        var tour = new Tour
        {
            Id = nextId,
            Title = request.Title.Trim(),
            CategoryId = category.Id,
            CategoryName = category.CategoryName,
            ProvinceId = province.Id,
            ProvinceName = province.ProvinceName,
            DurationDays = request.DurationDays,
            DurationNights = request.DurationNights,
            PickupPoint = request.PickupPoint?.Trim(),
            MinPrice = request.MinPrice ?? 0m,
            Description = request.Description?.Trim(),
            ItinerarySummary = request.ItinerarySummary?.Trim(),
            IncludedServices = request.IncludedServices?.Trim(),
            ExcludedServices = request.ExcludedServices?.Trim(),
            Language = request.Language?.Trim(),
            Transport = request.Transport?.Trim(),
            Accommodation = request.Accommodation?.Trim(),
            ThumbnailUrl = request.ThumbnailUrl,
            CreatedBy = 1,
            CreatedAt = now,
            UpdatedAt = now
        };

        if (!string.IsNullOrWhiteSpace(request.ThumbnailUrl))
        {
            var imgId = await _context.GetNextSequenceAsync("images");
            tour.Images.Add(new TourImageEmbedded
            {
                Id = imgId,
                ImgUrl = request.ThumbnailUrl,
                IsThumbnail = true
            });
        }

        await _context.Tours.InsertOneAsync(tour);
        return tour;
    }

    public async Task<Tour> UpdateTourAsync(int id, TourUpdateRequest request)
    {
        var tour = await _context.Tours.Find(t => t.Id == id).FirstOrDefaultAsync()
                   ?? throw new KeyNotFoundException($"Không tìm thấy tour với mã {id}.");

        var category = await _context.TourCategories.Find(c => c.Id == request.CategoryId).FirstOrDefaultAsync()
                       ?? throw new ArgumentException("Danh mục tour không tồn tại.");
        var province = await _context.Provinces.Find(p => p.Id == request.ProvinceId).FirstOrDefaultAsync()
                       ?? throw new ArgumentException("Tỉnh/thành không tồn tại.");

        tour.Title = request.Title.Trim();
        tour.CategoryId = category.Id;
        tour.CategoryName = category.CategoryName;
        tour.ProvinceId = province.Id;
        tour.ProvinceName = province.ProvinceName;
        tour.DurationDays = request.DurationDays;
        tour.DurationNights = request.DurationNights;
        tour.PickupPoint = request.PickupPoint?.Trim();
        tour.MinPrice = request.MinPrice ?? tour.MinPrice;
        tour.Description = request.Description?.Trim();
        tour.ItinerarySummary = request.ItinerarySummary?.Trim();
        tour.IncludedServices = request.IncludedServices?.Trim();
        // Form cũ chưa gửi các trường mới thì giữ thông tin đã có trong MongoDB.
        if (request.ExcludedServices != null) tour.ExcludedServices = request.ExcludedServices.Trim();
        if (request.Language != null) tour.Language = request.Language.Trim();
        if (request.Transport != null) tour.Transport = request.Transport.Trim();
        if (request.Accommodation != null) tour.Accommodation = request.Accommodation.Trim();
        tour.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.ThumbnailUrl))
        {
            tour.ThumbnailUrl = request.ThumbnailUrl;
            // Mark existing as not thumbnail
            foreach (var img in tour.Images)
            {
                img.IsThumbnail = false;
            }
            var nextImgId = await _context.GetNextSequenceAsync("images");
            tour.Images.Add(new TourImageEmbedded
            {
                Id = nextImgId,
                ImgUrl = request.ThumbnailUrl,
                IsThumbnail = true
            });
        }

        await _context.Tours.ReplaceOneAsync(t => t.Id == id, tour);
        return tour;
    }

    public async Task<bool> DeleteTourAsync(int id)
    {
        var tour = await _context.Tours.Find(t => t.Id == id).FirstOrDefaultAsync()
                   ?? throw new KeyNotFoundException($"Không tìm thấy tour với mã {id}.");

        // Check if there are active bookings for departures of this tour
        var departureIds = await _context.TourDepartures.Find(d => d.TourId == id).Project(d => d.Id).ToListAsync();
        if (departureIds.Any())
        {
            var hasBookings = await _context.Bookings.Find(b => departureIds.Contains(b.DepartureId)).AnyAsync();
            if (hasBookings)
            {
                throw new InvalidOperationException($"Không thể xóa tour '{tour.Title}' vì đã có khách hàng đặt chuyến đi thuộc tour này.");
            }
        }

        // Delete departures of this tour
        await _context.TourDepartures.DeleteManyAsync(d => d.TourId == id);
        var result = await _context.Tours.DeleteOneAsync(t => t.Id == id);
        return result.DeletedCount > 0;
    }

    public async Task<TourScheduleEmbedded> AddScheduleAsync(int tourId, ScheduleCreateRequest request)
    {
        var filters = Builders<Tour>.Filter;
        var byId = filters.Eq(t => t.Id, tourId);
        var uniqueDay = filters.Not(filters.ElemMatch(t => t.Schedules, item => item.DayNumber == request.DayNumber));
        if (!await _context.Tours.Find(byId).AnyAsync())
            throw new KeyNotFoundException($"Không tìm thấy tour {tourId}.");

        var schedule = new TourScheduleEmbedded
        {
            Id = await _context.GetNextSequenceAsync("schedules"),
            DayNumber = request.DayNumber,
            Title = request.Title.Trim(),
            Activities = request.Activities?.Trim()
        };
        var result = await _context.Tours.UpdateOneAsync(byId & uniqueDay, Builders<Tour>.Update
            .Push(t => t.Schedules, schedule)
            .Set(t => t.UpdatedAt, DateTime.UtcNow));
        if (result.MatchedCount == 0)
            throw new ArgumentException($"Không thể thêm ngày {request.DayNumber}. Ngày này đã có hoặc tour không còn tồn tại.");

        return schedule;
    }

    public async Task<bool> UpdateScheduleAsync(int scheduleId, ScheduleUpdateRequest request)
    {
        var filters = Builders<Tour>.Filter;
        var hasSchedule = filters.ElemMatch(t => t.Schedules, item => item.Id == scheduleId);
        var uniqueDay = filters.Not(filters.ElemMatch(t => t.Schedules,
            item => item.Id != scheduleId && item.DayNumber == request.DayNumber));
        var schedule = new TourScheduleEmbedded
        {
            Id = scheduleId,
            DayNumber = request.DayNumber,
            Title = request.Title.Trim(),
            Activities = request.Activities?.Trim()
        };
        var result = await _context.Tours.UpdateOneAsync(hasSchedule & uniqueDay, Builders<Tour>.Update
            .Set("schedules.$[item]", schedule)
            .Set(t => t.UpdatedAt, DateTime.UtcNow),
            new UpdateOptions
            {
                ArrayFilters = new[]
                {
                    new BsonDocumentArrayFilterDefinition<TourScheduleEmbedded>(
                        new MongoDB.Bson.BsonDocument("item.id", scheduleId))
                }
            });
        if (result.MatchedCount == 0)
        {
            if (!await _context.Tours.Find(hasSchedule).AnyAsync())
                throw new KeyNotFoundException($"Không tìm thấy lịch trình mã {scheduleId}.");
            throw new ArgumentException($"Ngày thứ {request.DayNumber} đã tồn tại trong lịch trình.");
        }

        return true;
    }

    public async Task<bool> DeleteScheduleAsync(int scheduleId)
    {
        var filter = Builders<Tour>.Filter.ElemMatch(t => t.Schedules, item => item.Id == scheduleId);
        var result = await _context.Tours.UpdateOneAsync(filter, Builders<Tour>.Update
            .PullFilter(t => t.Schedules, item => item.Id == scheduleId)
            .Set(t => t.UpdatedAt, DateTime.UtcNow));
        if (result.MatchedCount == 0)
            throw new KeyNotFoundException($"Không tìm thấy lịch trình mã {scheduleId}.");

        return true;
    }

    public async Task<TourImageEmbedded> AddImageAsync(int tourId, string imgUrl, bool isThumbnail)
    {
        var tour = await _context.Tours.Find(t => t.Id == tourId).FirstOrDefaultAsync()
                   ?? throw new KeyNotFoundException($"Không tìm thấy tour {tourId}.");

        if (isThumbnail)
        {
            foreach (var img in tour.Images)
            {
                img.IsThumbnail = false;
            }
            tour.ThumbnailUrl = imgUrl;
        }

        var nextImgId = await _context.GetNextSequenceAsync("images");
        var newImg = new TourImageEmbedded
        {
            Id = nextImgId,
            ImgUrl = imgUrl,
            IsThumbnail = isThumbnail
        };

        tour.Images.Add(newImg);
        tour.UpdatedAt = DateTime.UtcNow;

        await _context.Tours.ReplaceOneAsync(t => t.Id == tourId, tour);
        return newImg;
    }

    public async Task<bool> DeleteImageAsync(int imageId)
    {
        var tour = await _context.Tours.Find(t => t.Images.Any(i => i.Id == imageId)).FirstOrDefaultAsync()
                   ?? throw new KeyNotFoundException($"Không tìm thấy hình ảnh mã {imageId}.");

        var targetImg = tour.Images.FirstOrDefault(i => i.Id == imageId);
        if (targetImg != null)
        {
            // Nếu ảnh thuộc bucket do dự án quản lý trên Cloudflare R2, xóa object trên R2
            if (_storageService.IsManagedUrl(targetImg.ImgUrl))
            {
                try
                {
                    await _storageService.DeleteImageAsync(targetImg.ImgUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Xóa object R2 cho ảnh {ImageId} ({Url}) thất bại, tiếp tục xóa metadata trong MongoDB.", imageId, targetImg.ImgUrl);
                }
            }
            else
            {
                _logger.LogInformation("Ảnh {ImageId} ({Url}) là URL bên ngoài hoặc thuộc bucket cũ, bỏ qua xóa object R2.", imageId, targetImg.ImgUrl);
            }
        }

        tour.Images.RemoveAll(i => i.Id == imageId);

        // Nếu ảnh vừa xóa là ThumbnailUrl, tự động cập nhật lại thumbnail từ các ảnh còn lại nếu có
        if (targetImg != null && tour.ThumbnailUrl == targetImg.ImgUrl)
        {
            var nextThumb = tour.Images.FirstOrDefault(i => i.IsThumbnail) ?? tour.Images.FirstOrDefault();
            tour.ThumbnailUrl = nextThumb?.ImgUrl;
            if (nextThumb != null)
            {
                nextThumb.IsThumbnail = true;
            }
        }

        tour.UpdatedAt = DateTime.UtcNow;

        var result = await _context.Tours.ReplaceOneAsync(t => t.Id == tour.Id, tour);
        return result.ModifiedCount > 0;
    }

    private async Task PopulateTourRelationsAsync(List<Tour> tours)
    {
        if (!tours.Any()) return;

        var catIds = tours.Select(t => t.CategoryId).Distinct().ToList();
        var provIds = tours.Select(t => t.ProvinceId).Distinct().ToList();
        var tourIds = tours.Select(t => t.Id).Distinct().ToList();

        var categories = await _context.TourCategories.Find(c => catIds.Contains(c.Id)).ToListAsync();
        var provinces = await _context.Provinces.Find(p => provIds.Contains(p.Id)).ToListAsync();
        var departures = await _context.TourDepartures.Find(d => tourIds.Contains(d.TourId)).ToListAsync();

        var catMap = categories.ToDictionary(c => c.Id);
        var provMap = provinces.ToDictionary(p => p.Id);
        var depGroup = departures.GroupBy(d => d.TourId).ToDictionary(g => g.Key, g => g.ToList());

        foreach (var t in tours)
        {
            if (catMap.TryGetValue(t.CategoryId, out var c))
            {
                t.Category = c;
                t.CategoryName = c.CategoryName;
            }
            if (provMap.TryGetValue(t.ProvinceId, out var p))
            {
                t.Province = p;
                t.ProvinceName = p.ProvinceName;
            }
            if (depGroup.TryGetValue(t.Id, out var deps))
            {
                t.Departures = deps;
                t.DeparturesCount = deps.Count;
            }
            t.SchedulesCount = t.Schedules.Count;
            if (string.IsNullOrEmpty(t.ThumbnailUrl))
            {
                t.ThumbnailUrl = t.Images.FirstOrDefault(i => i.IsThumbnail)?.ImgUrl
                                 ?? t.Images.FirstOrDefault()?.ImgUrl;
            }
        }
    }
}

