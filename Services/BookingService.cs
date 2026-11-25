using MongoDB.Bson;
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

    private static DateTime VietnamToday()
    {
        return DateTime.UtcNow.AddHours(7).Date;
    }

    private static decimal CalculateTotal(TourDeparture departure, DraftBookingRequest request)
    {
        return request.TotalAdults * departure.AdultPrice + request.TotalChildren * departure.ChildPrice;
    }

    public async Task<object> ValidateDraftAsync(DraftBookingRequest request)
    {
        var departure = await _context.TourDepartures.Find(d => d.Id == request.DepartureId).FirstOrDefaultAsync()
                        ?? throw new KeyNotFoundException($"Không tìm thấy chuyến đi mã {request.DepartureId}.");

        if (departure.Status != "open" || departure.DepartureDate.AddHours(7).Date < VietnamToday())
        {
            throw new ArgumentException("Lịch khởi hành không còn mở bán.");
        }

        var totalPassengers = request.TotalAdults + request.TotalChildren;
        if (departure.Status != "open" || departure.DepartureDate <= DateTime.UtcNow)
            throw new ArgumentException("Chuyến đi đã khởi hành hoặc không còn mở bán.");
        if (totalPassengers > departure.AvailableSeats)
        {
            throw new ArgumentException("Số lượng chỗ còn lại của chuyến đi không đủ để đáp ứng.");
        }

        var totalAmount = CalculateTotal(departure, request);

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
        var payLater = request.PaymentMethod is "bank_transfer" or "cash";
        if (!payLater && request.PaymentMethod != "card")
            throw new ArgumentException("Phương thức thanh toán không hợp lệ.");
        if (!payLater && new[] { request.CardNumber, request.CardHolder, request.CardExpiry, request.CardCvv }
            .Any(string.IsNullOrWhiteSpace))
            throw new ArgumentException("Vui lòng nhập đầy đủ thông tin thẻ.");

        var totalPassengers = request.TotalAdults + request.TotalChildren;
        if (request.Passengers.Any(p => p is null || string.IsNullOrWhiteSpace(p.FullName)) ||
            request.Passengers.Count != totalPassengers ||
            request.Passengers.Count(p => string.Equals(p.PassengerType, "adult", StringComparison.OrdinalIgnoreCase)) != request.TotalAdults ||
            request.Passengers.Count(p => string.Equals(p.PassengerType, "child", StringComparison.OrdinalIgnoreCase)) != request.TotalChildren)
        {
            throw new ArgumentException("Danh sách hành khách không khớp với số lượng vé.");
        }

        var today = VietnamToday();
        foreach (var p in request.Passengers)
        {
            if (p.DateOfBirth.HasValue)
            {
                if (p.DateOfBirth.Value.Date > today) throw new ArgumentException("Ngày sinh không hợp lệ.");
                var age = today.Year - p.DateOfBirth.Value.Year;
                if (p.DateOfBirth.Value.Date > today.AddYears(-age)) age--;
                if (string.Equals(p.PassengerType, "adult", StringComparison.OrdinalIgnoreCase) && age < 12)
                {
                    throw new ArgumentException($"Hành khách {p.FullName}: Người lớn phải từ 12 tuổi trở lên.");
                }
                if (string.Equals(p.PassengerType, "child", StringComparison.OrdinalIgnoreCase) && age >= 12)
                {
                    throw new ArgumentException($"Hành khách {p.FullName}: Trẻ em phải dưới 12 tuổi.");
                }
            }
        }

        var customer = await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync()
                       ?? throw new ArgumentException("Tài khoản khách hàng không tồn tại.");
        var departure = await _context.TourDepartures.Find(d => d.Id == request.DepartureId).FirstOrDefaultAsync()
                        ?? throw new ArgumentException("Không tìm thấy lịch khởi hành.");
        if (departure.Status != "open" || departure.AvailableSeats < totalPassengers ||
            departure.DepartureDate < today.AddHours(-7))
        {
            throw new ArgumentException("Lịch khởi hành không còn mở bán hoặc không đủ chỗ.");
        }

        var tour = await _context.Tours.Find(t => t.Id == departure.TourId).FirstOrDefaultAsync()
                   ?? throw new ArgumentException("Không tìm thấy tour của lịch khởi hành.");
        var totalAmount = CalculateTotal(departure, request);
        if (request.ExpectedTotalAmount is { } expected && expected != totalAmount)
        {
            throw new ArgumentException("Giá đã thay đổi. Vui lòng tải lại trang để kiểm tra tổng tiền.");
        }

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
                PassengerType = p.PassengerType.ToLowerInvariant(),
                IdCard = p.IdCard?.Trim(),
                DateOfBirth = p.DateOfBirth
            });
        }

        var booking = new Booking
        {
            MongoId = ObjectId.GenerateNewId().ToString(),
            Id = nextBookingId,
            BookingCode = bookingCode,
            CustomerId = customerId,
            CustomerName = customer.FullName,
            DepartureId = departure.Id,
            TourId = departure.TourId,
            TourTitle = departure.TourTitle ?? tour.Title,
            TotalAdults = request.TotalAdults,
            TotalChildren = request.TotalChildren,
            TotalAmount = totalAmount,
            Status = payLater ? "pending" : "confirmed",
            PaymentOption = payLater ? request.PaymentMethod : null,
            Passengers = passengers,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Record payment
        var nextPaymentId = payLater ? 0 : await _context.GetNextSequenceAsync("payments");
        var payment = new Payment
        {
            MongoId = ObjectId.GenerateNewId().ToString(),
            Id = nextPaymentId,
            BookingId = booking.Id,
            Amount = totalAmount,
            PaymentMethod = "Thẻ quốc tế",
            CreatedAt = now,
            UpdatedAt = now
        };

        // Record bill
        var nextBillId = payLater ? 0 : await _context.GetNextSequenceAsync("bills");
        var bill = new Bill
        {
            MongoId = ObjectId.GenerateNewId().ToString(),
            Id = nextBillId,
            BillNumber = $"INV-{booking.Id:D3}",
            BookingId = booking.Id,
            FinalAmount = totalAmount,
            CreatedAt = now,
            UpdatedAt = now
        };
        var departureFilter = Builders<TourDeparture>.Filter.Where(d =>
            d.Id == departure.Id && d.Status == "open" && d.DepartureDate >= today.AddHours(-7) &&
            d.AvailableSeats >= totalPassengers && d.AdultPrice == departure.AdultPrice &&
            d.ChildPrice == departure.ChildPrice && d.TourId == departure.TourId);
        var updates = Builders<TourDeparture>.Update;
        var reserve = updates.Inc(d => d.AvailableSeats, -totalPassengers).Set(d => d.UpdatedAt, now);
        var full = Builders<TourDeparture>.Filter.Where(d => d.Id == departure.Id && d.AvailableSeats == 0 && d.Status == "open");
        var markFull = updates.Set(d => d.Status, "full");
        var hello = await _context.Database.RunCommandAsync<BsonDocument>(new BsonDocument("hello", 1));
        if (hello.Contains("setName") || hello.GetValue("msg", "").AsString == "isdbgrid")
        {
            using var session = await _context.Database.Client.StartSessionAsync();
            await session.WithTransactionAsync(async (transaction, ct) =>
            {
                if (await _context.TourDepartures.FindOneAndUpdateAsync(transaction, departureFilter, reserve, cancellationToken: ct) is null)
                    throw new InvalidOperationException("Lịch khởi hành, giá hoặc số chỗ đã thay đổi. Vui lòng tải lại trang.");

                await _context.TourDepartures.UpdateOneAsync(transaction, full, markFull, cancellationToken: ct);
                await _context.Bookings.InsertOneAsync(transaction, booking, cancellationToken: ct);
                if (!payLater)
                {
                    await _context.Payments.InsertOneAsync(transaction, payment, cancellationToken: ct);
                    await _context.Bills.InsertOneAsync(transaction, bill, cancellationToken: ct);
                }
                return booking;
            });
        }
        else
        {
            // Standalone MongoDB has no multi-document transactions.
            if (await _context.TourDepartures.FindOneAndUpdateAsync(departureFilter, reserve) is null)
                throw new InvalidOperationException("Lịch khởi hành, giá hoặc số chỗ đã thay đổi. Vui lòng tải lại trang.");

            try
            {
                if (!payLater)
                {
                    await _context.Payments.InsertOneAsync(payment);
                    await _context.Bills.InsertOneAsync(bill);
                }
                await _context.TourDepartures.UpdateOneAsync(full, markFull);
                await _context.Bookings.InsertOneAsync(booking);
            }
            catch
            {
                // Match the generated MongoDB IDs so old documents can never be removed.
                await Task.WhenAll(
                    _context.Bookings.DeleteOneAsync(b => b.MongoId == booking.MongoId),
                    _context.Payments.DeleteOneAsync(p => p.MongoId == payment.MongoId),
                    _context.Bills.DeleteOneAsync(b => b.MongoId == bill.MongoId));
                await _context.TourDepartures.UpdateOneAsync(
                    d => d.Id == departure.Id,
                    updates.Inc(d => d.AvailableSeats, totalPassengers));
                await _context.TourDepartures.UpdateOneAsync(
                    d => d.Id == departure.Id && d.Status == "full" && d.AvailableSeats > 0,
                    updates.Set(d => d.Status, "open"));
                throw;
            }
        }

        if (!payLater)
        {
            booking.PaymentMethod = payment.PaymentMethod;
            booking.BillNumber = bill.BillNumber;
        }
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
        var pendingPayment = booking.PaymentOption is not null && booking.Status == "pending";
        var payment = pendingPayment ? null : await _context.Payments.Find(p => p.BookingId == booking.Id).FirstOrDefaultAsync();
        var bill = pendingPayment ? null : await _context.Bills.Find(b => b.BookingId == booking.Id).FirstOrDefaultAsync();

        booking.DepartureDate = departure?.DepartureDate;
        booking.ReturnDate = departure?.ReturnDate;
        booking.TourTitle = booking.TourTitle ?? tour?.Title ?? departure?.TourTitle;
        booking.TourImage = tour?.ThumbnailUrl ?? departure?.ThumbnailUrl;
        booking.Destination = tour?.ProvinceName;
        booking.PaymentMethod = payment?.PaymentMethod;
        booking.BillNumber = bill?.BillNumber;
        booking.CanReview = (booking.Status == "confirmed" || booking.Status == "completed") && departure?.ReturnDate < DateTime.UtcNow;

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

        var ids = bookings.Select(b => b.Id).ToList();
        var payments = await _context.Payments.Find(p => ids.Contains(p.BookingId)).ToListAsync();
        var paymentMethods = payments.ToLookup(p => p.BookingId, p => p.PaymentMethod);

        foreach (var b in bookings)
        {
            if (depMap.TryGetValue(b.DepartureId, out var dep))
            {
                b.DepartureDate = dep.DepartureDate;
                b.ReturnDate = dep.ReturnDate;
                b.TourTitle ??= dep.TourTitle;
                b.CanReview = (b.Status == "confirmed" || b.Status == "completed") && dep.ReturnDate < DateTime.UtcNow;
            }
            if (b.TourId.HasValue && tourMap.TryGetValue(b.TourId.Value, out var tour))
            {
                b.TourTitle ??= tour.Title;
                b.TourImage = tour.ThumbnailUrl;
            }
            if (b.PaymentOption == null || b.Status != "pending")
                b.PaymentMethod = paymentMethods[b.Id].FirstOrDefault();
        }

        return bookings;
    }

    public async Task<List<object>> GetCustomerPaymentHistoryAsync(int customerId)
    {
        var bookings = await _context.Bookings.Find(b => b.CustomerId == customerId).ToListAsync();
        if (!bookings.Any()) return new List<object>();

        var bookingIds = bookings.Where(b => b.PaymentOption == null || b.Status != "pending").Select(b => b.Id).ToList();
        var bookingMap = bookings.ToDictionary(b => b.Id);

        var payments = await _context.Payments.Find(p => bookingIds.Contains(p.BookingId))
            .SortByDescending(p => p.CreatedAt)
            .ToListAsync();

        var bills = await _context.Bills.Find(b => bookingIds.Contains(b.BookingId)).ToListAsync();
        var billMap = bills.ToLookup(b => b.BookingId);

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
            var bill = billMap[p.BookingId].FirstOrDefault();
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

    public async Task<List<object>> GetPendingPaymentsAsync(bool bankOnly)
    {
        var rows = await _context.Bookings.Find(b => (b.PaymentOption == "bank_transfer" || (!bankOnly && b.PaymentOption == "cash")) && b.Status == "pending")
            .SortByDescending(b => b.CreatedAt).ToListAsync();
        return rows.Select(b => (object)new { b.Id, b.BookingCode, b.TourTitle, b.TotalAmount, b.CreatedAt, b.PaymentOption }).ToList();
    }

    public async Task ConfirmPendingPaymentAsync(int bookingId, int employeeId, bool bankOnly)
    {
        var booking = await _context.Bookings.Find(b => b.Id == bookingId && (b.PaymentOption == "bank_transfer" || (!bankOnly && b.PaymentOption == "cash")))
            .FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Không tìm thấy đơn chờ thanh toán.");
        if (booking.Status == "confirmed") return;
        if (booking.Status != "pending") throw new InvalidOperationException("Đơn không còn chờ thanh toán.");

        // The booking's ObjectId is also the unique key in each settlement collection.
        // Retrying a partial confirmation reuses the same payment and bill.
        var now = DateTime.UtcNow;
        var paymentId = await _context.GetNextSequenceAsync("payments");
        await _context.Payments.UpdateOneAsync(p => p.MongoId == booking.MongoId,
            Builders<Payment>.Update
                .SetOnInsert(p => p.Id, paymentId)
                .SetOnInsert(p => p.BookingId, booking.Id)
                .SetOnInsert(p => p.Amount, booking.TotalAmount)
                .SetOnInsert(p => p.PaymentMethod, booking.PaymentOption == "cash" ? "Tiền mặt" : "Chuyển khoản")
                .SetOnInsert(p => p.CreatedAt, now)
                .SetOnInsert(p => p.UpdatedAt, now),
            new UpdateOptions { IsUpsert = true });
        var billId = await _context.GetNextSequenceAsync("bills");
        await _context.Bills.UpdateOneAsync(b => b.MongoId == booking.MongoId,
            Builders<Bill>.Update
                .SetOnInsert(b => b.Id, billId)
                .SetOnInsert(b => b.BookingId, booking.Id)
                .SetOnInsert(b => b.BillNumber, $"INV-{booking.Id:D3}")
                .SetOnInsert(b => b.FinalAmount, booking.TotalAmount)
                .SetOnInsert(b => b.EmployeeId, employeeId)
                .SetOnInsert(b => b.CreatedAt, now)
                .SetOnInsert(b => b.UpdatedAt, now),
            new UpdateOptions { IsUpsert = true });
        await _context.Bookings.UpdateOneAsync(b => b.Id == booking.Id && b.Status == "pending",
            Builders<Booking>.Update.Set(b => b.Status, "confirmed").Set(b => b.UpdatedAt, now));
    }

    public async Task<Review> SubmitReviewAsync(int customerId, int bookingId, ReviewCreateRequest request)
    {
        var booking = await _context.Bookings.Find(b => b.Id == bookingId && b.CustomerId == customerId).FirstOrDefaultAsync()
                      ?? throw new KeyNotFoundException("Không tìm thấy đơn đặt tour hợp lệ.");

        if (!booking.TourId.HasValue)
        {
            throw new ArgumentException("Đơn đặt tour không liên kết với tour du lịch hợp lệ.");
        }

        var departure = await _context.TourDepartures.Find(d => d.Id == booking.DepartureId).FirstOrDefaultAsync();
        if ((booking.Status != "confirmed" && booking.Status != "completed") || departure == null || departure.ReturnDate >= DateTime.UtcNow)
            throw new ArgumentException("Chỉ được đánh giá sau khi kết thúc chuyến đi không bị hủy.");
        if (await _context.Reviews.Find(r => r.BookingId == bookingId).AnyAsync())
            throw new ArgumentException("Bạn đã đánh giá đơn đặt tour này. Vui lòng sửa đánh giá hiện có.");

        var customer = await _context.Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync();
        var nextId = await _context.GetNextSequenceAsync("reviews");
        var now = DateTime.UtcNow;

        var review = new Review
        {
            BookingId = bookingId,
            Id = nextId,
            TourId = booking.TourId.Value,
            CustomerId = customerId,
            CustomerName = customer?.FullName,
            Rating = request.Rating,
            Comment = request.Comment.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        try { await _context.Reviews.InsertOneAsync(review); }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        { throw new ArgumentException("Đơn đặt tour này đã có đánh giá."); }
        return review;
    }

    public Task<List<Review>> GetCustomerReviewsAsync(int customerId) =>
        _context.Reviews.Find(r => r.CustomerId == customerId).SortByDescending(r => r.CreatedAt).ToListAsync();

    public async Task<bool> CancelBookingAsync(int customerId, int bookingId)
    {
        var booking = await _context.Bookings.Find(b => b.Id == bookingId && b.CustomerId == customerId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy đơn đặt tour của bạn.");
        var departure = await _context.TourDepartures.Find(d => d.Id == booking.DepartureId).FirstOrDefaultAsync();
        if (departure == null || departure.DepartureDate <= DateTime.UtcNow)
            throw new ArgumentException("Không thể hủy chuyến đã khởi hành.");

        // Điều kiện trạng thái bảo đảm bấm hủy lặp không hoàn ghế nhiều lần.
        var previous = await _context.Bookings.FindOneAndUpdateAsync(
            b => b.Id == bookingId && b.CustomerId == customerId && (b.Status == "confirmed" || b.Status == "pending"),
            Builders<Booking>.Update.Set(b => b.Status, "cancelled").Set(b => b.UpdatedAt, DateTime.UtcNow));
        if (previous == null) throw new ArgumentException("Đơn không còn ở trạng thái có thể hủy.");
        await _context.TourDepartures.UpdateOneAsync(d => d.Id == departure.Id,
            Builders<TourDeparture>.Update.Inc(d => d.AvailableSeats, previous.TotalAdults + previous.TotalChildren)
                .Set(d => d.UpdatedAt, DateTime.UtcNow));
        await _context.TourDepartures.UpdateOneAsync(d => d.Id == departure.Id && d.Status == "full" && d.AvailableSeats > 0,
            Builders<TourDeparture>.Update.Set(d => d.Status, "open"));
        return true;
    }

    public async Task<Review> UpdateReviewAsync(int customerId, int reviewId, ReviewCreateRequest request)
    {
        // Kèm customerId trong bộ lọc để không sửa được đánh giá của người khác.
        var update = Builders<Review>.Update.Set(r => r.Rating, request.Rating)
            .Set(r => r.Comment, request.Comment.Trim()).Set(r => r.UpdatedAt, DateTime.UtcNow);
        return await _context.Reviews.FindOneAndUpdateAsync(
            r => r.Id == reviewId && r.CustomerId == customerId, update,
            new FindOneAndUpdateOptions<Review> { ReturnDocument = ReturnDocument.After })
            ?? throw new KeyNotFoundException("Không tìm thấy đánh giá của bạn.");
    }

    public async Task<bool> DeleteReviewAsync(int customerId, int reviewId)
    {
        var result = await _context.Reviews.DeleteOneAsync(r => r.Id == reviewId && r.CustomerId == customerId);
        if (result.DeletedCount == 0) throw new KeyNotFoundException("Không tìm thấy đánh giá của bạn.");
        return true;
    }
}

