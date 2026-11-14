using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;
    private readonly IStorageService _storageService;

    public ToursController(ITourService tourService, IStorageService storageService)
    {
        _tourService = tourService;
        _storageService = storageService;
    }

    [HttpGet]
    [HttpGet("/tours")]
    public async Task<IActionResult> GetTours([FromQuery] TourQueryParameters parameters)
    {
        var (items, total) = await _tourService.QueryToursAsync(parameters);
        return Ok(ApiResponse<List<Tour>>.Ok(items, "Lấy danh sách tour thành công.", total, parameters.Page, parameters.PageSize));
    }

    [HttpGet("featured")]
    public async Task<IActionResult> GetFeaturedTours([FromQuery] int limit = 8)
    {
        var items = await _tourService.GetFeaturedToursAsync(limit);
        return Ok(ApiResponse<List<Tour>>.Ok(items, "Lấy danh sách tour nổi bật thành công."));
    }

    [HttpGet("{id:int}")]
    [HttpGet("/tours/{id:int}")]
    public async Task<IActionResult> GetTourById(int id)
    {
        var tour = await _tourService.GetTourByIdAsync(id);
        if (tour == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy tour du lịch với mã {id}."));
        }
        return Ok(ApiResponse<Tour>.Ok(tour, "Lấy chi tiết tour thành công."));
    }

    [HttpGet("province/{provinceId:int}")]
    [HttpGet("/tours/province/{provinceId:int}")]
    public async Task<IActionResult> GetToursByProvince(int provinceId)
    {
        var items = await _tourService.GetToursByProvinceIdAsync(provinceId);
        return Ok(ApiResponse<List<Tour>>.Ok(items, $"Lấy danh sách tour theo tỉnh {provinceId} thành công."));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> CreateTour([FromBody] TourCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu tạo tour không hợp lệ.", ModelState));
        }

        try
        {
            var tour = await _tourService.CreateTourAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<Tour>.Ok(tour, "Tạo mới tour du lịch thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> UpdateTour(int id, [FromBody] TourUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu cập nhật không hợp lệ.", ModelState));
        }

        try
        {
            var tour = await _tourService.UpdateTourAsync(id, request);
            return Ok(ApiResponse<Tour>.Ok(tour, "Cập nhật tour du lịch thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteTour(int id)
    {
        try
        {
            var success = await _tourService.DeleteTourAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa tour du lịch thành công."));
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

    #region Schedules
    [HttpPost("{tourId:int}/schedules")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> AddSchedule(int tourId, [FromBody] ScheduleCreateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu lịch trình không hợp lệ.", ModelState));
        }

        try
        {
            var schedule = await _tourService.AddScheduleAsync(tourId, request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<TourScheduleEmbedded>.Ok(schedule, "Thêm lịch trình thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("/api/schedules/{id:int}")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> UpdateSchedule(int id, [FromBody] ScheduleUpdateRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu lịch trình không hợp lệ.", ModelState));
        }

        try
        {
            var success = await _tourService.UpdateScheduleAsync(id, request);
            return Ok(ApiResponse<bool>.Ok(success, "Cập nhật lịch trình thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("/api/schedules/{id:int}")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> DeleteSchedule(int id)
    {
        try
        {
            var success = await _tourService.DeleteScheduleAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa lịch trình thành công."));
        }
        catch (Exception ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }
    #endregion

    #region Images
    [HttpPost("{id:int}/images")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> UploadImage(int id, [FromForm] IFormFile? file, [FromForm] string? imageUrl, [FromForm] bool isThumbnail = false)
    {
        string? url = imageUrl;

        // Nếu client gửi file, tải lên Cloudflare R2
        if (file != null && file.Length > 0)
        {
            try
            {
                url = await _storageService.UploadTourImageAsync(id, file);
            }
            catch (ArgumentException argEx)
            {
                return BadRequest(ApiResponse<object>.Fail(argEx.Message));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<object>.Fail($"Lỗi khi tải ảnh lên Cloudflare R2: {ex.Message}"));
            }
        }

        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest(ApiResponse<object>.Fail("Vui lòng tải lên file ảnh hoặc cung cấp URL hình ảnh hợp lệ."));
        }

        try
        {
            var img = await _tourService.AddImageAsync(id, url, isThumbnail);
            return Ok(ApiResponse<TourImageEmbedded>.Ok(img, "Tải ảnh lên thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("images/{imageId:int}")]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> DeleteImage(int imageId)
    {
        try
        {
            var success = await _tourService.DeleteImageAsync(imageId);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa hình ảnh thành công."));
        }
        catch (Exception ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }
    #endregion
}

