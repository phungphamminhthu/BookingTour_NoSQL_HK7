using Microsoft.AspNetCore.Http;

namespace Backend_DotNet.Services;

public interface IStorageService
{
    Task<string> UploadTourImageAsync(int tourId, IFormFile file, CancellationToken cancellationToken = default);
    Task<bool> DeleteImageAsync(string? imageUrl, CancellationToken cancellationToken = default);
    bool IsManagedUrl(string? imageUrl);
}

