using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface IAdminManagementService
{
    // Categories
    Task<List<CategoryResponse>> GetAllCategoriesAsync();
    Task<(List<CategoryResponse> Items, long TotalCount, int TotalClassifiedTours)> GetCategoriesPagedAsync(string? search, int page = 1, int pageSize = 5);
    Task<(List<CategoryTourItemDto> Items, long TotalCount)> GetToursByCategoryIdPagedAsync(int categoryId, int page = 1, int pageSize = 5);
    Task<CategoryResponse?> GetCategoryByIdAsync(int id);
    Task<CategoryResponse> CreateCategoryAsync(CategoryRequest request);
    Task<CategoryResponse> UpdateCategoryAsync(int id, CategoryRequest request);
    Task<bool> DeleteCategoryAsync(int id);

    // Provinces
    Task<List<Province>> GetAllProvincesAsync();
    Task<(List<Province> Items, long TotalCount)> GetProvincesPagedAsync(string? search, string? region, int page = 1, int pageSize = 5);
    Task<ProvinceStatsDto> GetProvinceStatsAsync();
    Task<Province?> GetProvinceByIdAsync(int id);
    Task<Province> CreateProvinceAsync(ProvinceRequest request);
    Task<Province> UpdateProvinceAsync(int id, ProvinceRequest request);
    Task<bool> DeleteProvinceAsync(int id);
    Task<(List<LocationTourItemDto> Items, long TotalCount)> GetLocationToursPagedAsync(string? search, string? region, int? provinceId, int page = 1, int pageSize = 5);

    // Employees
    Task<List<Employee>> GetAllEmployeesAsync();
    Task<Employee?> GetEmployeeByIdAsync(int id);
    Task<Employee> CreateEmployeeAsync(EmployeeCreateRequest request);
    Task<Employee> UpdateEmployeeAsync(int id, EmployeeUpdateRequest request);

    // Customers
    Task<(List<Customer> Items, long TotalCount)> GetCustomersAsync(string? search, int page = 1, int pageSize = 5);
    Task<CustomerStatsDto> GetCustomerStatsAsync();
    Task<Customer?> GetCustomerByIdAsync(int id);
    Task<Customer> CreateCustomerAsync(CustomerCreateRequest request);
    Task<Customer> UpdateCustomerAsync(int id, CustomerUpdateRequest request);
    Task<bool> DeleteCustomerAsync(int id);

    // Transactions / Payments
    Task<(List<Payment> Items, long TotalCount)> GetTransactionsAsync(
        string? search = null,
        string? status = null,
        string? paymentMethod = null,
        string? transactionDate = null,
        string? sort = null,
        int page = 1,
        int pageSize = 5);
    Task<TransactionStatsDto> GetTransactionStatsAsync();
    Task<Payment?> GetTransactionByIdAsync(int id);
    Task<TransactionDetailDto?> GetTransactionDetailAsync(string identifier);

    // Dashboard
    Task<DashboardStatsResponse> GetDashboardStatsAsync(DateTime? startDate, DateTime? endDate);
}

