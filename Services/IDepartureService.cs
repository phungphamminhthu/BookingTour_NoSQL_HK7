using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface IDepartureService
{
    Task<(List<TourDeparture> Items, long TotalCount)> QueryDeparturesAsync(string? keyword, DateTime? date, string? status, int page = 1, int pageSize = 10);
    Task<TourDeparture?> GetDepartureByIdAsync(int id);
    Task<TourDeparture> CreateDepartureAsync(DepartureCreateRequest request);
    Task<TourDeparture> UpdateDepartureAsync(int id, DepartureUpdateRequest request);
    Task<bool> DeleteDepartureAsync(int id);
    Task<bool> AssignGuideAsync(int id, int guideId);
}

