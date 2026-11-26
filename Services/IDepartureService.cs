using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface IDepartureService
{
    // tìm kiếm, lọc và phân trang danh sách lịch khởi hành
    Task<(List<TourDeparture> Items, long TotalCount)> QueryDeparturesAsync(string? keyword, int? tourId, DateTime? date, string? status, int page = 1, int pageSize = 5);
    // Lấy các số liệu thống kê tổng quan về lịch khởi hành
    Task<DepartureStatsDto> GetStatsAsync();
    //Lấy thông tin chi tiết của một lịch khởi hành cụ thể
    Task<TourDeparture?> GetDepartureByIdAsync(int id);
    //Tạo một lịch khởi hành mới cho tour
    Task<TourDeparture> CreateDepartureAsync(DepartureCreateRequest request);
    //Cập nhật thông tin lịch khởi hành
    Task<TourDeparture> UpdateDepartureAsync(int id, DepartureUpdateRequest request);
    Task<bool> DeleteDepartureAsync(int id);
    //Phân công hướng dẫn viên phụ trách chuyến đi đó
    Task<bool> AssignGuideAsync(int id, int guideId);
    Task<DepartureBookingsResponse> GetDepartureBookingsAsync(int departureId, int page = 1, int pageSize = 5);
}

