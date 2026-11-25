using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface IDepartureService
{
    Task<(List<TourDeparture> Items, long TotalCount)> QueryDeparturesAsync(string? keyword, int? tourId, DateTime? date, string? status, int page = 1, int pageSize = 5);
    Task<DepartureStatsDto> GetStatsAsync();
    Task<TourDeparture?> GetDepartureByIdAsync(int id);
    Task<TourDeparture> CreateDepartureAsync(DepartureCreateRequest request);
    Task<TourDeparture> UpdateDepartureAsync(int id, DepartureUpdateRequest request);
    Task<bool> DeleteDepartureAsync(int id);
    Task<bool> AssignGuideAsync(int id, int guideId);
    Task<DepartureBookingsResponse> GetDepartureBookingsAsync(int departureId, int page = 1, int pageSize = 5);
}

