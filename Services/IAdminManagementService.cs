using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface IAdminManagementService
{
    // Categories
    Task<List<TourCategory>> GetAllCategoriesAsync();
    Task<TourCategory?> GetCategoryByIdAsync(int id);
    Task<TourCategory> CreateCategoryAsync(CategoryRequest request);
    Task<TourCategory> UpdateCategoryAsync(int id, CategoryRequest request);
    Task<bool> DeleteCategoryAsync(int id);

    // Provinces
    Task<List<Province>> GetAllProvincesAsync();
    Task<Province?> GetProvinceByIdAsync(int id);
    Task<Province> CreateProvinceAsync(ProvinceRequest request);
    Task<Province> UpdateProvinceAsync(int id, ProvinceRequest request);
    Task<bool> DeleteProvinceAsync(int id);

    // Employees
    Task<List<Employee>> GetAllEmployeesAsync();
    Task<Employee?> GetEmployeeByIdAsync(int id);
    Task<Employee> CreateEmployeeAsync(EmployeeCreateRequest request);
    Task<Employee> UpdateEmployeeAsync(int id, EmployeeUpdateRequest request);

    // Customers
    Task<(List<Customer> Items, long TotalCount)> GetCustomersAsync(string? search, int page = 1, int pageSize = 10);
    Task<Customer?> GetCustomerByIdAsync(int id);
    Task<Customer> UpdateCustomerAsync(int id, CustomerUpdateRequest request);

    // Transactions / Payments
    Task<(List<Payment> Items, long TotalCount)> GetTransactionsAsync(string? search, int page = 1, int pageSize = 10);
    Task<Payment?> GetTransactionByIdAsync(int id);

    // Dashboard
    Task<DashboardStatsResponse> GetDashboardStatsAsync(DateTime? startDate, DateTime? endDate);
}

