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
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? keyword,
        [FromQuery] string? region,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] bool? all = false)
    {
        var q = !string.IsNullOrWhiteSpace(search) ? search : keyword;

        if (all == true || pageSize < 0 || pageSize >= 1000)
        {
            var allItems = await _service.GetAllProvincesAsync();
            return Ok(ApiResponse<List<Province>>.Ok(allItems, "Lấy danh sách địa điểm thành công.", allItems.Count, 1, allItems.Count));
        }

        var (items, total) = await _service.GetProvincesPagedAsync(q, region, page, pageSize);
        return Ok(ApiResponse<List<Province>>.Ok(items, "Lấy danh sách địa điểm thành công.", total, page, pageSize));
    }

    [HttpGet("stats")]
    [HttpGet("/api/provinces/stats")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _service.GetProvinceStatsAsync();
        return Ok(ApiResponse<ProvinceStatsDto>.Ok(stats, "Lấy thống kê địa điểm thành công."));
    }

    [HttpGet("tours")]
    [HttpGet("/api/provinces/tours")]
    [HttpGet("/locations/tours")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLocationTours(
        [FromQuery] string? search,
        [FromQuery] string? keyword,
        [FromQuery] string? region,
        [FromQuery] int? provinceId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        var q = !string.IsNullOrWhiteSpace(search) ? search : keyword;
        var (items, total) = await _service.GetLocationToursPagedAsync(q, region, provinceId, page, pageSize);
        return Ok(ApiResponse<List<LocationTourItemDto>>.Ok(
            items,
            "Lấy danh sách tuyến điểm & tour khai thác thành công.",
            total,
            page,
            pageSize
        ));
    }

    [HttpGet("{id:int}")]
    [HttpGet("/api/provinces/{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetProvinceByIdAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy địa điểm mã {id}."));
        return Ok(ApiResponse<Province>.Ok(item));
    }

    [HttpPost]
    [HttpPost("/api/provinces")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> Create([FromBody] ProvinceRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var created = await _service.CreateProvinceAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Province>.Ok(created, "Thêm địa điểm mới thành công."));
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
    [HttpPut("/api/provinces/{id:int}")]
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
    [HttpDelete("/api/provinces/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _service.DeleteProvinceAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa địa điểm thành công."));
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

