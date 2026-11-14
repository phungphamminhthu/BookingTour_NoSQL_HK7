using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IAuthService _authService;

    public BookingsController(IBookingService bookingService, IAuthService authService)
    {
        _bookingService = bookingService;
        _authService = authService;
    }

    [HttpPost("validate-draft")]
    [HttpPost("/booking/{id:int}/continue")]
    public async Task<IActionResult> ValidateDraft([FromBody] DraftBookingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu đặt tour không hợp lệ.", ModelState));
        }

        try
        {
            var result = await _bookingService.ValidateDraftAsync(request);
            return Ok(ApiResponse<object>.Ok(result, "Kiểm tra thông tin chuyến đi thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize]
    [HttpPost("checkout")]
    [HttpPost("/payments/checkout/{id:int}")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu thanh toán không hợp lệ.", ModelState));
        }

        var customerId = GetCurrentCustomerId();
        if (customerId <= 0)
        {
            return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập với tài khoản khách hàng để đặt tour."));
        }

        try
        {
            var booking = await _bookingService.CheckoutAsync(customerId, request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Booking>.Ok(booking, $"Đặt tour thành công! Mã đơn: {booking.BookingCode}"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize]
    [HttpGet("{id:int}")]
    [HttpGet("/my-tours/{id:int}")]
    public async Task<IActionResult> GetBookingDetail(int id)
    {
        var customerId = GetCurrentCustomerId();
        var booking = await _bookingService.GetBookingByIdAsync(id, customerId > 0 ? customerId : null);

        if (booking == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy vé đặt tour với mã {id}."));
        }

        return Ok(ApiResponse<Booking>.Ok(booking, "Lấy thông tin vé đặt tour thành công."));
    }

    [Authorize]
    [HttpGet("my-tours")]
    [HttpGet("/my-tours")]
    [HttpGet("/customer/booking")]
    public async Task<IActionResult> GetMyBookings()
    {
        var customerId = GetCurrentCustomerId();
        if (customerId <= 0)
        {
            return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập."));
        }

        var list = await _bookingService.GetCustomerBookingsAsync(customerId);
        return Ok(ApiResponse<List<Booking>>.Ok(list, "Lấy danh sách tour đã đặt thành công."));
    }

    [Authorize]
    [HttpPost("{id:int}/review")]
    [HttpPost("/my-tours/{id:int}/review")]
    public async Task<IActionResult> SubmitReview(int id, [FromBody] ReviewCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu đánh giá không hợp lệ.", ModelState));
        }

        var customerId = GetCurrentCustomerId();
        if (customerId <= 0)
        {
            return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập để đánh giá."));
        }

        try
        {
            var review = await _bookingService.SubmitReviewAsync(customerId, id, request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Review>.Ok(review, "Đánh giá chuyến đi thành công! Cảm ơn phản hồi của bạn."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize]
    [HttpGet("/api/customer/payment-history")]
    [HttpGet("/customer/payment-history")]
    public async Task<IActionResult> GetPaymentHistory()
    {
        var customerId = GetCurrentCustomerId();
        if (customerId <= 0)
        {
            return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập để xem lịch sử thanh toán."));
        }

        var history = await _bookingService.GetCustomerPaymentHistoryAsync(customerId);
        return Ok(ApiResponse<List<object>>.Ok(history, "Lấy lịch sử thanh toán thành công."));
    }

    [Authorize]
    [HttpGet("/api/customer/profile")]
    [HttpGet("/customer/profile")]
    public async Task<IActionResult> GetProfile()
    {
        var customerId = GetCurrentCustomerId();
        if (customerId <= 0)
        {
            return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập."));
        }

        var customer = await _authService.GetCurrentCustomerAsync(customerId);
        if (customer == null) return NotFound(ApiResponse<object>.Fail("Không tìm thấy thông tin khách hàng."));

        var bookings = await _bookingService.GetCustomerBookingsAsync(customerId);
        var activeBookings = bookings.Where(b => b.Status != "cancelled").ToList();
        var totalSpent = activeBookings.Sum(b => b.TotalAmount);
        var rewardPoints = (int)Math.Floor(totalSpent / 1000m);

        string tier = rewardPoints switch
        {
            >= 30000 => "Hạng Diamond",
            >= 15000 => "Lotus Elite • Hạng Bạch Kim",
            >= 5000 => "Hạng Vàng",
            >= 1000 => "Hạng Bạc",
            _ => "Thành viên thân thiết"
        };

        return Ok(ApiResponse<object>.Ok(new
        {
            customer,
            totalBookings = activeBookings.Count,
            totalSpent,
            rewardPoints,
            memberTier = tier
        }));
    }

    [Authorize]
    [HttpPost("/api/customer/profile/update")]
    [HttpPut("/api/customer/profile")]
    [HttpPost("/customer/profile/update")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu cập nhật hồ sơ không hợp lệ.", ModelState));
        }

        var customerId = GetCurrentCustomerId();
        if (customerId <= 0)
        {
            return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập."));
        }

        try
        {
            await _authService.UpdateCustomerProfileAsync(customerId, request);
            return Ok(ApiResponse<string>.Ok("Cập nhật hồ sơ thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize]
    [HttpPost("/api/customer/password/update")]
    [HttpPost("/customer/password/update")]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu đổi mật khẩu không hợp lệ.", ModelState));
        }

        var customerId = GetCurrentCustomerId();
        if (customerId <= 0)
        {
            return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập."));
        }

        try
        {
            await _authService.UpdateCustomerPasswordAsync(customerId, request);
            return Ok(ApiResponse<string>.Ok("Cập nhật mật khẩu thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize]
    [HttpGet("/api/reward-points")]
    [HttpGet("/reward-points")]
    public async Task<IActionResult> GetRewardPoints()
    {
        var customerId = GetCurrentCustomerId();
        if (customerId <= 0) return Unauthorized(ApiResponse<object>.Fail("Vui lòng đăng nhập."));

        var bookings = await _bookingService.GetCustomerBookingsAsync(customerId);
        var totalSpent = bookings.Where(b => b.Status != "cancelled").Sum(b => b.TotalAmount);
        var points = (int)Math.Floor(totalSpent / 1000m);

        return Ok(ApiResponse<object>.Ok(new
        {
            rewardPoints = points,
            totalSpent
        }));
    }

    private int GetCurrentCustomerId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idClaim, out var id) ? id : 0;
    }
}

