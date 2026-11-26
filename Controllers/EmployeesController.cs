using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using MongoDB.Driver;

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
    // API dành cho Admin: nhận tìm kiếm, vai trò và thông tin phân trang.
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? roleId,
        [FromQuery, Range(1, int.MaxValue)] int page = 1, [FromQuery, Range(1, 100)] int pageSize = 10)
    {
        var (items, total) = await _service.QueryEmployeesAsync(search, roleId, page, pageSize);
        return Ok(ApiResponse<List<Employee>>.Ok(items, "Lấy danh sách nhân viên thành công.", total, page, pageSize));
    }

    [HttpGet("roles")]
    // Trả danh sách vai trò để dựng bộ lọc và form nhân viên.
    public async Task<IActionResult> Roles() => Ok(ApiResponse<object>.Ok(await _service.GetRolesAsync()));

    [HttpDelete("{id:int}")]
    // Truyền mã người đang đăng nhập từ JWT để Service chặn thao tác tự xóa.
    public async Task<IActionResult> Delete(int id) => Ok(ApiResponse<bool>.Ok(
        await _service.DeleteEmployeeAsync(id, int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)), "Đã xóa nhân viên."));

    [HttpGet("{id:int}")]
    // Lấy hồ sơ nhân viên để điền form chỉnh sửa.
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetEmployeeByIdAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy nhân viên mã {id}."));
        return Ok(ApiResponse<Employee>.Ok(item));
    }

    [HttpPost]
    // Nhận dữ liệu đã kiểm tra từ DTO, tạo nhân viên và trả lỗi theo trường khi cần.
    public async Task<IActionResult> Create([FromBody] EmployeeCreateRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var employee = await _service.CreateEmployeeAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Employee>.Ok(employee, "Tạo nhân viên thành công."));
        }
        catch (ValidationException ex)
        {
            return FieldValidationError(ex);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return BadRequest(ApiResponse<object>.Fail("Tên đăng nhập hoặc email đã được sử dụng."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    // Cập nhật nhân viên qua Service và trả lỗi kiểm tra dữ liệu cho form.
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
        catch (ValidationException ex)
        {
            return FieldValidationError(ex);
        }
        catch (MongoWriteException ex) when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            return BadRequest(ApiResponse<object>.Fail("Email đã được sử dụng."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    // Đổi lỗi kiểm tra dữ liệu thành danh sách thông báo gắn với từng ô nhập.
    private IActionResult FieldValidationError(ValidationException exception)
    {
        var errors = exception.ValidationResult!.MemberNames.ToDictionary(
            field => field, _ => new[] { exception.Message });
        return BadRequest(ApiResponse<object>.Fail("Vui lòng kiểm tra lại thông tin.", errors));
    }
}

