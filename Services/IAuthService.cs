using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<Customer> RegisterCustomerAsync(RegisterRequest request);
    Task<Customer?> GetCurrentCustomerAsync(int customerId);
    Task<Employee?> GetCurrentEmployeeAsync(int employeeId);
    Task<bool> UpdateCustomerProfileAsync(int customerId, UpdateProfileRequest request);
    Task<bool> UpdateCustomerPasswordAsync(int customerId, UpdatePasswordRequest request);
}

