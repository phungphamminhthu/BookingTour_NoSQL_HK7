using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/reviews")]
[Authorize(Roles = "Customer")]
public class ReviewsController : ControllerBase
{
    private readonly IBookingService _service;
    public ReviewsController(IBookingService service) { _service = service; }
    private int CustomerId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("mine")]
    public async Task<IActionResult> Mine() =>
        Ok(ApiResponse<object>.Ok(await _service.GetCustomerReviewsAsync(CustomerId)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ReviewCreateRequest request) =>
        Ok(ApiResponse<object>.Ok(await _service.UpdateReviewAsync(CustomerId, id, request), "Đã cập nhật đánh giá."));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) =>
        Ok(ApiResponse<bool>.Ok(await _service.DeleteReviewAsync(CustomerId, id), "Đã xóa đánh giá."));
}

