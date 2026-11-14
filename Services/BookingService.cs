using Backend_DotNet.Data;
using Backend_DotNet.DTOs;
using Backend_DotNet.Models;
using MongoDB.Driver;

namespace Backend_DotNet.Services;

public class BookingService : IBookingService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<BookingService> _logger;

    public BookingService(MongoDbContext context, ILogger<BookingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<object> ValidateDraftAsync(DraftBookingRequest request)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == request.DepartureId).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {request.DepartureId}.");

        var totalPassengers = request.TotalAdults + request.TotalChildren;
        if (totalPassengers > departure.AvailableSeats)
        {
            throw new ArgumentException("Số lượng chỗ còn lại của chuyến đi không đủ để đáp ứng.");
        }

        var totalAmount = (request.TotalAdults * departure.AdultPrice) + (request.TotalChildren * departure.ChildPrice);

        var tour = await _context.Tours.Find(t => t.Id == departure.TourId).FirstOrDefaultAsync();

        return new
        {
            departureId = departure.Id,
            tourTitle = departure.TourTitle ?? tour?.Title,
            departureDate = departure.DepartureDate,
            returnDate = departure.ReturnDate,
            adultPrice = departure.AdultPrice,
            childPrice = departure.ChildPrice,
            totalAdults = request.TotalAdults,
            totalChildren = request.TotalChildren,
            totalAmount = totalAmount,
            contactName = request.UserFullName,
            contactPhone = request.UserPhone,
            contactEmail = request.UserEmail,
            thumbnailUrl = departure.ThumbnailUrl ?? tour?.ThumbnailUrl
        };
    }

    public async Task<Booking> CheckoutAsync(int customerId, CheckoutRequest request)
    {
        var totalPassengers = request.TotalAdults + request.TotalChildren;
        if (totalPassengers <= 0)
        {
            throw new ArgumentException("Số lượng hành khách phải lớn hơn 0.");
        }

        // Validate passenger ages
        foreach (var p in request.Passengers)
        {
            if (p.DateOfBirth.HasValue)
            {
                var age = DateTime.UtcNow.Year - p.DateOfBirth.Value.Year;
                if (p.PassengerType == "adult" && age < 12)
                {
                    throw new ArgumentException($"Hành khách {p.FullName}: Người lớn phải từ 12 tuổi trở lên.");
                }
                if (p.PassengerType == "child" && age >= 12)
                {
                    throw new ArgumentException($"Hành khách {p.FullName}: Trẻ em phải dưới 12 tuổi.");
                }
            }
        }

        // Atomic seat reduction
        var depFilter = Builders<TourDeparture>.Filter.And(
            Builders<TourDeparture>.Filter.Eq(d => d.Id, request.DepartureId),
            Builders<TourDeparture>.Filter.Gte(d => d.AvailableSeats, totalPassengers)
        );

        var depUpdate = Builders<TourDeparture>.Update
            .Inc(d => d.AvailableSeats, -totalPassengers)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);

        var departure = await _context.TourDepartures.FindOneAndUpdateAsync(depFilter, depUpdate);
        if (departure == null)
        {
            throw new InvalidOperationException("Rất tiếc, số lượng chỗ còn lại của chuyến đi không đủ hoặc chuyến đi không tồn tại.");
        }

        // If seats reached 0, update status
        if (departure.AvailableSeats - totalPassengers <= 0)
        {
            await _context.TourDepartures.UpdateOneAsync(
                d => d.Id == departure.Id,
                Builders<TourDeparture>.Update.Set(d => d.Status, "full")
            );
        }

        var customer = await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync();
        var tour = await _context.Tours.Find(t => t.Id == departure.TourId).FirstOrDefaultAsync();

        var totalAmount = (request.TotalAdults * departure.AdultPrice) + (request.TotalChildren * departure.ChildPrice);
        var nextBookingId = await _context.GetNextSequenceAsync("bookings");
        var bookingCode = $"BK{nextBookingId:D3}";

        var now = DateTime.UtcNow;

        var passengers = new List<BookingPassengerEmbedded>();
        foreach (var p in request.Passengers)
        {
            var pId = await _context.GetNextSequenceAsync("passengers");
            passengers.Add(new BookingPassengerEmbedded
            {
                Id = pId,
                FullName = p.FullName.Trim(),
                PassengerType = p.PassengerType.ToLower(),
                IdCard = p.IdCard?.Trim(),
                DateOfBirth = p.DateOfBirth
            });
        }

        var booking = new Booking
        {
            Id = nextBookingId,
            BookingCode = bookingCode,
            CustomerId = customerId,
            CustomerName = customer?.FullName ?? request.UserFullName,
            DepartureId = departure.Id,
            TourId = departure.TourId,
            TourTitle = departure.TourTitle ?? tour?.Title,
            TotalAdults = request.TotalAdults,
            TotalChildren = request.TotalChildren,
            TotalAmount = totalAmount,
            Status = "confirmed",
            Passengers = passengers,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Bookings.InsertOneAsync(booking);

        // Record payment
        var nextPaymentId = await _context.GetNextSequenceAsync("payments");
        var payment = new Payment
        {
            Id = nextPaymentId,
            BookingId = booking.Id,
            Amount = totalAmount,
            PaymentMethod = "Thẻ quốc tế",
            CreatedAt = now,
            UpdatedAt = now
        };
        await _context.Payments.InsertOneAsync(payment);

        // Record bill
        var nextBillId = await _context.GetNextSequenceAsync("bills");
        var bill = new Bill
        {
            Id = nextBillId,
            BillNumber = $"INV-{booking.Id:D3}",
            BookingId = booking.Id,
            FinalAmount = totalAmount,
            CreatedAt = now,
            UpdatedAt = now
        };
        await _context.Bills.InsertOneAsync(bill);

        return booking;
    }

    public async Task<Booking?> GetBookingByIdAsync(int id, int? customerId = null)
    {
        var filter = Builders<Booking>.Filter.Eq(b => b.Id, id);
        if (customerId.HasValue && customerId.Value > 0)
        {
            filter &= Builders<Booking>.Filter.Eq(b => b.CustomerId, customerId.Value);
        }

        var booking = await _context.Bookings.Find(filter).FirstOrDefaultAsync();
        if (booking == null) return null;

        var departure = await _context.TourDepartures.Find(d => d.Id == booking.DepartureId).FirstOrDefaultAsync();
        var tour = booking.TourId.HasValue
            ? await _context.Tours.Find(t => t.Id == booking.TourId.Value).FirstOrDefaultAsync()
            : null;
        var payment = await _context.Payments.Find(p => p.BookingId == booking.Id).FirstOrDefaultAsync();
        var bill = await _context.Bills.Find(b => b.BookingId == booking.Id).FirstOrDefaultAsync();

        booking.DepartureDate = departure?.DepartureDate;
        booking.ReturnDate = departure?.ReturnDate;
        booking.TourTitle = tour?.Title ?? departure?.TourTitle;
        booking.TourImage = tour?.ThumbnailUrl ?? departure?.ThumbnailUrl;
        booking.Destination = tour?.ProvinceName;
        booking.PaymentMethod = payment?.PaymentMethod;
        booking.BillNumber = bill?.BillNumber;

        return booking;
    }

    public async Task<List<Booking>> GetCustomerBookingsAsync(int customerId)
    {
        var bookings = await _context.Bookings.Find(b => b.CustomerId == customerId)
            .SortByDescending(b => b.CreatedAt)
            .ToListAsync();

        if (!bookings.Any()) return bookings;

        var depIds = bookings.Select(b => b.DepartureId).Distinct().ToList();
        var tourIds = bookings.Where(b => b.TourId.HasValue).Select(b => b.TourId!.Value).Distinct().ToList();

        var departures = await _context.TourDepartures.Find(d => depIds.Contains(d.Id)).ToListAsync();
        var tours = await _context.Tours.Find(t => tourIds.Contains(t.Id)).ToListAsync();

        var depMap = departures.ToDictionary(d => d.Id);
        var tourMap = tours.ToDictionary(t => t.Id);

        foreach (var b in bookings)
        {
            if (depMap.TryGetValue(b.DepartureId, out var dep))
            {
                b.DepartureDate = dep.DepartureDate;
                b.ReturnDate = dep.ReturnDate;
            }
            if (b.TourId.HasValue && tourMap.TryGetValue(b.TourId.Value, out var tour))
            {
                b.TourTitle = tour.Title;
                b.TourImage = tour.ThumbnailUrl;
            }
        }

        return bookings;
    }

    public async Task<List<object>> GetCustomerPaymentHistoryAsync(int customerId)
    {
        var bookings = await _context.Bookings.Find(b => b.CustomerId == customerId).ToListAsync();
        if (!bookings.Any()) return new List<object>();

        var bookingIds = bookings.Select(b => b.Id).ToList();
        var bookingMap = bookings.ToDictionary(b => b.Id);

        var payments = await _context.Payments.Find(p => bookingIds.Contains(p.BookingId))
            .SortByDescending(p => p.CreatedAt)
            .ToListAsync();

        var bills = await _context.Bills.Find(b => bookingIds.Contains(b.BookingId)).ToListAsync();
        var billMap = bills.ToDictionary(b => b.BookingId);

        var depIds = bookings.Select(b => b.DepartureId).Distinct().ToList();
        var departures = await _context.TourDepartures.Find(d => depIds.Contains(d.Id)).ToListAsync();
        var depMap = departures.ToDictionary(d => d.Id);

        var tourIds = bookings.Where(b => b.TourId.HasValue).Select(b => b.TourId!.Value).Distinct().ToList();
        var tours = await _context.Tours.Find(t => tourIds.Contains(t.Id)).ToListAsync();
        var tourMap = tours.ToDictionary(t => t.Id);

        var result = new List<object>();
        foreach (var p in payments)
        {
            bookingMap.TryGetValue(p.BookingId, out var b);
            billMap.TryGetValue(p.BookingId, out var bill);
            TourDeparture? dep = null;
            if (b != null) depMap.TryGetValue(b.DepartureId, out dep);
            Tour? tour = null;
            if (b?.TourId != null) tourMap.TryGetValue(b.TourId.Value, out tour);

            result.Add(new
            {
                payment_id = p.Id,
                amount = p.Amount,
                payment_method = p.PaymentMethod,
                payment_date = p.CreatedAt,
                booking_id = b?.Id,
                booking_code = b?.BookingCode,
                total_amount = b?.TotalAmount,
                booking_status = b?.Status,
                tour_id = b?.TourId,
                tour_title = tour?.Title ?? b?.TourTitle,
                tour_image = tour?.ThumbnailUrl,
                departure_date = dep?.DepartureDate,
                bill_id = bill?.Id,
                bill_number = bill?.BillNumber,
                final_amount = bill?.FinalAmount
            });
        }

        return result;
    }

    public async Task<Review> SubmitReviewAsync(int customerId, int bookingId, ReviewCreateRequest request)
    {
        var booking = await _context.Bookings.Find(b => b.Id == bookingId && b.CustomerId == customerId).FirstOrDefaultAsync()
                      ?? throw new KeyNotFoundException("Không tìm thấy đơn đặt tour hợp lệ.");

        if (!booking.TourId.HasValue)
        {
            throw new ArgumentException("Đơn đặt tour không liên kết với tour du lịch hợp lệ.");
        }

        var customer = await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync();
        var nextId = await _context.GetNextSequenceAsync("reviews");
        var now = DateTime.UtcNow;

        var review = new Review
        {
            Id = nextId,
            TourId = booking.TourId.Value,
            CustomerId = customerId,
            CustomerName = customer?.FullName,
            Rating = request.Rating,
            Comment = request.Comment.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        await _context.Reviews.InsertOneAsync(review);
        return review;
    }
}

