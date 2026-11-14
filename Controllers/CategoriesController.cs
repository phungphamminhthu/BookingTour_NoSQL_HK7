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
    public async Task<IActionResult> GetAll()
    {
        var items = await _service.GetAllCategoriesAsync();
        return Ok(ApiResponse<List<TourCategory>>.Ok(items, "Lấy danh mục thành công."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _service.GetCategoryByIdAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail($"Không tìm thấy danh mục mã {id}."));
        return Ok(ApiResponse<TourCategory>.Ok(item));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Sale")]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", ModelState));

        try
        {
            var created = await _service.CreateCategoryAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<TourCategory>.Ok(created, "Thêm danh mục thành công."));
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
            return Ok(ApiResponse<TourCategory>.Ok(updated, "Cập nhật danh mục thành công."));
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
            var success = await _service.DeleteCategoryAsync(id);
            return Ok(ApiResponse<bool>.Ok(success, "Xóa danh mục thành công."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

