using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly IAdminManagementService _service;

    public LocationsController(IAdminManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    [HttpGet("/locations")]
    [HttpGet("/api/provinces")]
    public async Task<IActionResult> GetAll()
    {
        var items = await _service.GetAllProvincesAsync();
        return Ok(ApiResponse<List<Province>>.Ok(items, "Lấy danh sách địa điểm thành công."));
    }

    [HttpGet("{id:int}")]
    [HttpGet("/api/provinces/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetProvinceByIdAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy địa điểm mã {id}."));
        return Ok(ApiResponse<Province>.Ok(item));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> Create([FromBody] ProvinceRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var created = await _service.CreateProvinceAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Province>.Ok(created, "Thêm địa điểm mới thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> Update(int id, [FromBody] ProvinceRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var updated = await _service.UpdateProvinceAsync(id, request);
            return Ok(ApiResponse<Province>.Ok(updated, "Cập nhật địa điểm thành công."));
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

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _service.DeleteProvinceAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa địa điểm thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

