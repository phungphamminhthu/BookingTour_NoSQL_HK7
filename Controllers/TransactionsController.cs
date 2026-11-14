using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Sale")]
public class TransactionsController : ControllerBase
{
    private readonly IAdminManagementService _service;

    public TransactionsController(IAdminManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    [HttpGet("/transactions")]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _service.GetTransactionsAsync(search, page, pageSize);
        return Ok(ApiResponse<List<Payment>>.Ok(items, "Lấy danh sách giao dịch thành công.", total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var payment = await _service.GetTransactionByIdAsync(id);
        if (payment == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy giao dịch mã {id}."));
        return Ok(ApiResponse<Payment>.Ok(payment));
    }
}

