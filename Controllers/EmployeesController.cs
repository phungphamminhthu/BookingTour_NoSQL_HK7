using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class EmployeesController : ControllerBase
{
    private readonly IAdminManagementService _service;

    public EmployeesController(IAdminManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    [HttpGet("/employees")]
    public async Task<IActionResult> GetAll()
    {
        var items = await _service.GetAllEmployeesAsync();
        return Ok(ApiResponse<List<Employee>>.Ok(items, "Lấy danh sách nhân viên thành công."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetEmployeeByIdAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy nhân viên mã {id}."));
        return Ok(ApiResponse<Employee>.Ok(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EmployeeCreateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var employee = await _service.CreateEmployeeAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Employee>.Ok(employee, "Tạo nhân viên thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] EmployeeUpdateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var employee = await _service.UpdateEmployeeAsync(id, request);
            return Ok(ApiResponse<Employee>.Ok(employee, "Cập nhật nhân viên thành công."));
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

