using Backend_DotNet.Configurations;
using Backend_DotNet.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace Backend_DotNet.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        var connectionString = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING")
                               ?? settings.Value.ConnectionString;
        var databaseName = Environment.GetEnvironmentVariable("MONGODB_DATABASE_NAME")
                           ?? settings.Value.DatabaseName;

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);
    }

    public IMongoDatabase Database => _database;

    public IMongoCollection<Role> Roles => _database.GetCollection<Role>("roles");
    public IMongoCollection<TourCategory> TourCategories => _database.GetCollection<TourCategory>("tour_categories");
    public IMongoCollection<Province> Provinces => _database.GetCollection<Province>("provinces");
    public IMongoCollection<Employee> Employees => _database.GetCollection<Employee>("employees");
    public IMongoCollection<Customer> Customers => _database.GetCollection<Customer>("customers");
    public IMongoCollection<Tour> Tours => _database.GetCollection<Tour>("tours");
    public IMongoCollection<TourDeparture> TourDepartures => _database.GetCollection<TourDeparture>("tour_departures");
    public IMongoCollection<Booking> Bookings => _database.GetCollection<Booking>("bookings");
    public IMongoCollection<Payment> Payments => _database.GetCollection<Payment>("payments");
    public IMongoCollection<Bill> Bills => _database.GetCollection<Bill>("bills");
    public IMongoCollection<Review> Reviews => _database.GetCollection<Review>("reviews");
    public IMongoCollection<Counter> Counters => _database.GetCollection<Counter>("counters");
    // Dùng $inc và FindOneAndUpdate để cấp id tăng dần nguyên tử; không lấy số document làm id.
    public async Task<int> GetNextSequenceAsync(string counterName)
    {
        var filter = Builders<Counter>.Filter.Eq(c => c.Id, counterName);
        var update = Builders<Counter>.Update.Inc(c => c.SequenceValue, 1);
        var options = new FindOneAndUpdateOptions<Counter>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After
        };

        var result = await Counters.FindOneAndUpdateAsync(filter, update, options);
        return result.SequenceValue;
    }

    // Tạo index phục vụ tìm kiếm và ràng buộc duy nhất ngay khi khởi tạo dữ liệu.
    public async Task EnsureIndexesAsync()
    {
        // Index cho vai trò.
        await Roles.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Role>(Builders<Role>.IndexKeys.Ascending(r => r.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Role>(Builders<Role>.IndexKeys.Ascending(r => r.RoleName), new CreateIndexOptions { Unique = true })
        });

        // Index cho danh mục.
        await TourCategories.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<TourCategory>(Builders<TourCategory>.IndexKeys.Ascending(c => c.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<TourCategory>(Builders<TourCategory>.IndexKeys.Ascending(c => c.CategoryName), new CreateIndexOptions { Unique = true })
        });

        // Index cho tỉnh/thành.
        await Provinces.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Province>(Builders<Province>.IndexKeys.Ascending(p => p.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Province>(Builders<Province>.IndexKeys.Ascending(p => p.ProvinceName)),
            new CreateIndexModel<Province>(Builders<Province>.IndexKeys.Ascending(p => p.Region))
        });

        // Index cho nhân viên.
        await Employees.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Employee>(Builders<Employee>.IndexKeys.Ascending(e => e.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Employee>(Builders<Employee>.IndexKeys.Ascending(e => e.Username), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Employee>(Builders<Employee>.IndexKeys.Ascending(e => e.Email), new CreateIndexOptions { Unique = true })
        });

        // Index cho khách hàng.
        await Customers.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Customer>(Builders<Customer>.IndexKeys.Ascending(c => c.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Customer>(Builders<Customer>.IndexKeys.Ascending(c => c.Email), new CreateIndexOptions { Unique = true })
        });

        // Index cho tour.
        await Tours.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.CategoryId)),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.ProvinceId)),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.MinPrice)),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.Title))
        });

        // Index cho lịch khởi hành.
        await TourDepartures.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.TourId)),
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.DepartureDate)),
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.Status))
        });

        // Index cho đơn đặt tour.
        await Bookings.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.BookingCode), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.CustomerId)),
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.DepartureId))
        });

        // Index cho thanh toán.
        await Payments.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Payment>(Builders<Payment>.IndexKeys.Ascending(p => p.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Payment>(Builders<Payment>.IndexKeys.Ascending(p => p.BookingId))
        });

        // Index cho hóa đơn.
        await Bills.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Bill>(Builders<Bill>.IndexKeys.Ascending(b => b.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Bill>(Builders<Bill>.IndexKeys.Ascending(b => b.BillNumber), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Bill>(Builders<Bill>.IndexKeys.Ascending(b => b.BookingId))
        });

        // Index cho đánh giá.
        await Reviews.Indexes.CreateManyAsync(new[]
        {
            // Dữ liệu mẫu cũ chưa có booking_id; chỉ áp dụng unique cho bản ghi có ID số.
            new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(r => r.BookingId),
                new CreateIndexOptions<Review> { Unique = true, PartialFilterExpression =
                    new MongoDB.Bson.BsonDocument("booking_id", new MongoDB.Bson.BsonDocument("$type", "number")) }),
            new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(r => r.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(r => r.TourId)),
            new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(r => r.CustomerId))
        });
        // Index ghép theo thứ tự tỉnh, giá, mã tour; hiệu quả phụ thuộc bộ lọc/thứ tự sắp xếp thực tế.
        await Tours.Indexes.CreateOneAsync(new CreateIndexModel<Tour>(
            Builders<Tour>.IndexKeys.Ascending(t => t.ProvinceId).Ascending(t => t.MinPrice).Ascending(t => t.Id)));
        await TourDepartures.Indexes.CreateOneAsync(new CreateIndexModel<TourDeparture>(
            Builders<TourDeparture>.IndexKeys.Ascending(d => d.TourId).Ascending(d => d.DepartureDate)));
    }
}

