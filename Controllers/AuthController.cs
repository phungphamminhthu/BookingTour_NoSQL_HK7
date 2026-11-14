using Backend_DotNet.DTOs;
using Backend_DotNet.Helpers;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [HttpPost("/login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu đăng nhập không hợp lệ.", ModelState));
        }

        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(ApiResponse<LoginResponse>.Ok(response, "Đăng nhập thành công."));
        }
        catch (ArgumentException ex)
        {
            return Unauthorized(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("register")]
    [HttpPost("/register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("Dữ liệu đăng ký không hợp lệ.", ModelState));
        }

        try
        {
            var customer = await _authService.RegisterCustomerAsync(request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<object>.Ok(new
            {
                customer.Id,
                customer.Email,
                customer.FullName,
                customer.Phone,
                customer.Address
            }, "Đăng ký tài khoản thành công! Hãy đăng nhập ngay."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("logout")]
    [HttpPost("/logout")]
    public IActionResult Logout()
    {
        return Ok(ApiResponse<string>.Ok("Đăng xuất thành công."));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userType = User.FindFirstValue("user_type");

        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail("Không xác định được danh tính người dùng."));
        }

        if (userType == "customer")
        {
            var customer = await _authService.GetCurrentCustomerAsync(userId);
            if (customer == null) return NotFound(ApiResponse<object>.Fail("Không tìm thấy thông tin khách hàng."));

            return Ok(ApiResponse<object>.Ok(new
            {
                customer.Id,
                customer.Email,
                customer.FullName,
                customer.Phone,
                customer.Address,
                customer.Birthday,
                userType = "customer"
            }));
        }
        else
        {
            var employee = await _authService.GetCurrentEmployeeAsync(userId);
            if (employee == null) return NotFound(ApiResponse<object>.Fail("Không tìm thấy thông tin nhân viên."));

            return Ok(ApiResponse<object>.Ok(new
            {
                employee.Id,
                employee.Username,
                employee.Email,
                employee.FullName,
                employee.Phone,
                employee.RoleId,
                employee.RoleName,
                userType = "employee"
            }));
        }
    }
}

