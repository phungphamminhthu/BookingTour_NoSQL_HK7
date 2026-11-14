using Backend_DotNet.Configurations;
using Backend_DotNet.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend_DotNet.Helpers;

public class JwtHelper
{
    private readonly JwtSettings _jwtSettings;

    public JwtHelper(IOptions<JwtSettings> jwtSettings)
    {
        _jwtSettings = jwtSettings.Value;
    }

    public (string Token, DateTime ExpiresAt) GenerateCustomerToken(Customer customer)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, customer.Id.ToString()),
            new(ClaimTypes.Email, customer.Email),
            new(ClaimTypes.Name, customer.FullName),
            new(ClaimTypes.Role, "Customer"),
            new("user_type", "customer")
        };

        return GenerateToken(claims);
    }

    public (string Token, DateTime ExpiresAt) GenerateEmployeeToken(Employee employee)
    {
        var role = employee.RoleName ?? (employee.RoleId == 1 ? "Admin" : employee.RoleId == 2 ? "Sale" : "Guide");
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, employee.Id.ToString()),
            new(ClaimTypes.Name, employee.Username),
            new(ClaimTypes.Email, employee.Email),
            new("full_name", employee.FullName),
            new(ClaimTypes.Role, role),
            new("user_type", "employee")
        };

        return GenerateToken(claims);
    }

    private (string Token, DateTime ExpiresAt) GenerateToken(IEnumerable<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}

