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
[Authorize(Roles = "Admin,Sale")]
public class TransactionsController : ControllerBase
{
    private readonly IAdminManagementService _service;
    private readonly IBookingService _bookingService;

    public TransactionsController(IAdminManagementService service, IBookingService bookingService)
    {
        _service = service;
        _bookingService = bookingService;
    }

    [HttpGet]
    [HttpGet("/transactions")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? keyword,
        [FromQuery] string? status,
        [FromQuery(Name = "payment_method")] string? paymentMethodSnake,
        [FromQuery] string? paymentMethod,
        [FromQuery(Name = "transaction_date")] string? transactionDateSnake,
        [FromQuery] string? transactionDate,
        [FromQuery] string? date,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        var effectiveSearch = !string.IsNullOrWhiteSpace(search) ? search : keyword;
        var effectiveMethod = !string.IsNullOrWhiteSpace(paymentMethod) ? paymentMethod : paymentMethodSnake;
        var effectiveDate = !string.IsNullOrWhiteSpace(transactionDate) ? transactionDate : (!string.IsNullOrWhiteSpace(transactionDateSnake) ? transactionDateSnake : date);

        var (items, total) = await _service.GetTransactionsAsync(effectiveSearch, status, effectiveMethod, effectiveDate, sort, page, pageSize);
        return Ok(ApiResponse<List<Payment>>.Ok(items, "Lấy danh sách giao dịch thành công.", total, page, pageSize));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _service.GetTransactionStatsAsync();
        return Ok(ApiResponse<TransactionStatsDto>.Ok(stats, "Lấy thống kê giao dịch thành công."));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var detail = await _service.GetTransactionDetailAsync(id);
        if (detail == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy thông tin giao dịch mã '{id}'."));
        return Ok(ApiResponse<TransactionDetailDto>.Ok(detail, "Lấy thông tin chi tiết giao dịch thành công."));
    }

    [Authorize(Roles = "Admin,Sale")]
    [HttpPost("{id}/confirm-payment")]
    public async Task<IActionResult> ConfirmPayment(string id)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var employeeId) || employeeId <= 0)
            return Unauthorized();

        var detail = await _service.GetTransactionDetailAsync(id);
        if (detail == null || !detail.BookingId.HasValue)
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy giao dịch hoặc đơn đặt tour tương ứng với '{id}'."));

        try
        {
            await _bookingService.ConfirmPendingPaymentAsync(detail.BookingId.Value, employeeId, false);
            return Ok(ApiResponse<bool>.Ok(true, "Đã xác nhận thanh toán thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

