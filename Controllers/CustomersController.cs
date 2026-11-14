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
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _service.GetCustomersAsync(search, page, pageSize);
        return Ok(ApiResponse<List<Customer>>.Ok(items, "Lấy danh sách khách hàng thành công.", total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await _service.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy khách hàng mã {id}."));
        return Ok(ApiResponse<Customer>.Ok(customer));
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
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

