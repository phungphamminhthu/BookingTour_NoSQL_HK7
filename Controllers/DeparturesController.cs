using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeparturesController : ControllerBase
{
    private readonly IDepartureService _departureService;

    public DeparturesController(IDepartureService departureService)
    {
        _departureService = departureService;
    }

    [HttpGet]
    [HttpGet("/departures")]
    public async Task<IActionResult> GetDepartures(
        [FromQuery] string? keyword,
        [FromQuery] DateTime? date,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _departureService.QueryDeparturesAsync(keyword, date, status, page, pageSize);
        return Ok(ApiResponse<List<TourDeparture>>.Ok(items, "Lấy danh sách chuyến đi thành công.", total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    [HttpGet("/departures/{id:int}")]
    public async Task<IActionResult> GetDepartureById(int id)
    {
        var departure = await _departureService.GetDepartureByIdAsync(id);
        if (departure == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy chuyến đi mã {id}."));
        }
        return Ok(ApiResponse<TourDeparture>.Ok(departure, "Lấy chi tiết chuyến đi thành công."));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> CreateDeparture([FromBody] DepartureCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu chuyến đi không hợp lệ.", ModelState));
        }

        try
        {
            var departure = await _departureService.CreateDepartureAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<TourDeparture>.Ok(departure, "Tạo chuyến khởi hành thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> UpdateDeparture(int id, [FromBody] DepartureUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu cập nhật chuyến đi không hợp lệ.", ModelState));
        }

        try
        {
            var departure = await _departureService.UpdateDepartureAsync(id, request);
            return Ok(ApiResponse<TourDeparture>.Ok(departure, "Cập nhật chuyến đi thành công."));
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
    public async Task<IActionResult> DeleteDeparture(int id)
    {
        try
        {
            var success = await _departureService.DeleteDepartureAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa chuyến khởi hành thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:int}/assign-guide")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> AssignGuide(int id, [FromBody] AssignGuideRequest request)
    {
        try
        {
            var success = await _departureService.AssignGuideAsync(id, request.GuideId);
            return Ok(ApiResponse<bool>.Ok(success, "Phân công hướng dẫn viên thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

