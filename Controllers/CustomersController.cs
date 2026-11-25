using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Sale")]
public class CustomersController : ControllerBase
{
    private readonly IAdminManagementService _service;

    public CustomersController(IAdminManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    [HttpGet("/customers")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        var q = !string.IsNullOrWhiteSpace(search) ? search : keyword;
        var (items, total) = await _service.GetCustomersAsync(q, page, pageSize);
        return Ok(ApiResponse<List<Customer>>.Ok(items, "Lấy danh sách khách hàng thành công.", total, page, pageSize));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _service.GetCustomerStatsAsync();
        return Ok(ApiResponse<CustomerStatsDto>.Ok(stats, "Lấy thống kê khách hàng thành công."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await _service.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy khách hàng mã {id}."));
        return Ok(ApiResponse<Customer>.Ok(customer));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CustomerCreateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var created = await _service.CreateCustomerAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Customer>.Ok(created, "Thêm khách hàng mới thành công."));
        }
        catch (ArgumentException ex)
        {
            return Conflict(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerUpdateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var customer = await _service.UpdateCustomerAsync(id, request);
            return Ok(ApiResponse<Customer>.Ok(customer, "Cập nhật khách hàng thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (ArgumentException ex)
        {
            return Conflict(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _service.DeleteCustomerAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa khách hàng thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

