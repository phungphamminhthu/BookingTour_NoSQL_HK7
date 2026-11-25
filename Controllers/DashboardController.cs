using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IAdminManagementService _service;

    public DashboardController(IAdminManagementService service)
    {
        _service = service;
    }

    [HttpGet]
    [HttpGet("/api/dashboard")]
    [HttpGet("/admin/dashboard/stats")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDashboard([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var stats = await _service.GetDashboardStatsAsync(startDate, endDate);
        return Ok(ApiResponse<DashboardStatsResponse>.Ok(stats, "Lấy số liệu thống kê thành công."));
    }
}

