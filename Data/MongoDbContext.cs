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

    public async Task EnsureIndexesAsync()
    {
        // Roles indexes
        await Roles.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Role>(Builders<Role>.IndexKeys.Ascending(r => r.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Role>(Builders<Role>.IndexKeys.Ascending(r => r.RoleName), new CreateIndexOptions { Unique = true })
        });

        // Categories indexes
        await TourCategories.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<TourCategory>(Builders<TourCategory>.IndexKeys.Ascending(c => c.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<TourCategory>(Builders<TourCategory>.IndexKeys.Ascending(c => c.CategoryName), new CreateIndexOptions { Unique = true })
        });

        // Provinces indexes
        await Provinces.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Province>(Builders<Province>.IndexKeys.Ascending(p => p.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Province>(Builders<Province>.IndexKeys.Ascending(p => p.ProvinceName)),
            new CreateIndexModel<Province>(Builders<Province>.IndexKeys.Ascending(p => p.Region))
        });

        // Employees indexes
        await Employees.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Employee>(Builders<Employee>.IndexKeys.Ascending(e => e.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Employee>(Builders<Employee>.IndexKeys.Ascending(e => e.Username), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Employee>(Builders<Employee>.IndexKeys.Ascending(e => e.Email), new CreateIndexOptions { Unique = true })
        });

        // Customers indexes
        await Customers.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Customer>(Builders<Customer>.IndexKeys.Ascending(c => c.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Customer>(Builders<Customer>.IndexKeys.Ascending(c => c.Email), new CreateIndexOptions { Unique = true })
        });

        // Tours indexes
        await Tours.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.CategoryId)),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.ProvinceId)),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.MinPrice)),
            new CreateIndexModel<Tour>(Builders<Tour>.IndexKeys.Ascending(t => t.Title))
        });

        // Departures indexes
        await TourDepartures.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.TourId)),
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.DepartureDate)),
            new CreateIndexModel<TourDeparture>(Builders<TourDeparture>.IndexKeys.Ascending(d => d.Status))
        });

        // Bookings indexes
        await Bookings.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.BookingCode), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.CustomerId)),
            new CreateIndexModel<Booking>(Builders<Booking>.IndexKeys.Ascending(b => b.DepartureId))
        });

        // Payments indexes
        await Payments.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Payment>(Builders<Payment>.IndexKeys.Ascending(p => p.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Payment>(Builders<Payment>.IndexKeys.Ascending(p => p.BookingId))
        });

        // Bills indexes
        await Bills.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Bill>(Builders<Bill>.IndexKeys.Ascending(b => b.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Bill>(Builders<Bill>.IndexKeys.Ascending(b => b.BillNumber), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Bill>(Builders<Bill>.IndexKeys.Ascending(b => b.BookingId))
        });

        // Reviews indexes
        await Reviews.Indexes.CreateManyAsync(new[]
        {
            new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(r => r.Id), new CreateIndexOptions { Unique = true }),
            new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(r => r.TourId)),
            new CreateIndexModel<Review>(Builders<Review>.IndexKeys.Ascending(r => r.CustomerId))
        });
    }
}

