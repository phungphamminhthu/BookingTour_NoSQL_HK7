using Backend_DotNet.DTOs;
using Backend_DotNet.Models;

namespace Backend_DotNet.Services;

public interface ITourService
{
    Task<List<Tour>> GetFeaturedToursAsync(int limit = 8);
    Task<(List<Tour> Items, long TotalCount)> QueryToursAsync(TourQueryParameters parameters);
    Task<Tour?> GetTourByIdAsync(int id);
    Task<List<Tour>> GetToursByProvinceIdAsync(int provinceId);
    Task<Tour> CreateTourAsync(TourCreateRequest request);
    Task<Tour> UpdateTourAsync(int id, TourUpdateRequest request);
    Task<bool> DeleteTourAsync(int id);
    Task<TourScheduleEmbedded> AddScheduleAsync(int tourId, ScheduleCreateRequest request);
    Task<bool> UpdateScheduleAsync(int scheduleId, ScheduleUpdateRequest request);
    Task<bool> DeleteScheduleAsync(int scheduleId);
    Task<TourImageEmbedded> AddImageAsync(int tourId, string imgUrl, bool isThumbnail);
    Task<bool> DeleteImageAsync(int imageId);
}

