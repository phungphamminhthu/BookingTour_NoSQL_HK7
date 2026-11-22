using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface IBookingService
{
    Task<object> ValidateDraftAsync(DraftBookingRequest request);
    Task<Booking> CheckoutAsync(int customerId, CheckoutRequest request);
    Task<Booking?> GetBookingByIdAsync(int id, int? customerId = null);
    Task<List<Booking>> GetCustomerBookingsAsync(int customerId);
    Task<List<object>> GetCustomerPaymentHistoryAsync(int customerId);
    Task<List<object>> GetPendingPaymentsAsync(bool bankOnly);
    Task ConfirmPendingPaymentAsync(int bookingId, int employeeId, bool bankOnly);
    Task<Review> SubmitReviewAsync(int customerId, int bookingId, ReviewCreateRequest request);
}

