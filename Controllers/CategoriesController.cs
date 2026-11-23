using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IAdminManagementService _service;

    public CategoriesController(IAdminManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    [HttpGet("/categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] bool? all = false)
    {
        if (all == true || pageSize < 0 || pageSize >= 1000)
        {
            var allItems = await _service.GetAllCategoriesAsync();
            return Ok(ApiResponse<List<CategoryResponse>>.Ok(allItems, "Lấy danh mục thành công.", allItems.Count, 1, allItems.Count));
        }

        var (items, total, classifiedTours) = await _service.GetCategoriesPagedAsync(search, page, pageSize);
        return Ok(ApiResponse<List<CategoryResponse>>.Ok(items, "Lấy danh mục thành công.", total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetCategoryByIdAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy danh mục mã {id}."));
        return Ok(ApiResponse<CategoryResponse>.Ok(item));
    }

    [HttpGet("{id:int}/tours")]
    [AllowAnonymous]
    public async Task<IActionResult> GetToursByCategory(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5)
    {
        var category = await _service.GetCategoryByIdAsync(id);
        if (category == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Không tìm thấy danh mục mã {id}."));
        }

        var (items, total) = await _service.GetToursByCategoryIdPagedAsync(id, page, pageSize);
        return Ok(ApiResponse<List<CategoryTourItemDto>>.Ok(
            items,
            $"Lấy danh sách tour thuộc danh mục '{category.CategoryName}' thành công.",
            total,
            page,
            pageSize));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var created = await _service.CreateCategoryAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<CategoryResponse>.Ok(created, "Thêm danh mục thành công."));
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
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var updated = await _service.UpdateCategoryAsync(id, request);
            return Ok(ApiResponse<CategoryResponse>.Ok(updated, "Cập nhật danh mục thành công."));
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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _service.DeleteCategoryAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa danh mục thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<object>.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

