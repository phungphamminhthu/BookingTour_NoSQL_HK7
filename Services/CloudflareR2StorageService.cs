using Amazon.S3;
using Amazon.S3.Model;
using Backend_DotNet.Configurations;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;

namespace Backend_DotNet.Services;

public class CloudflareR2StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly R2Settings _r2Settings;
    private readonly ILogger<CloudflareR2StorageService> _logger;

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/pjpeg",
        "image/png",
        "image/x-png",
        "image/webp"
    };

    public CloudflareR2StorageService(
        IAmazonS3 s3Client,
        IOptions<R2Settings> r2Options,
        ILogger<CloudflareR2StorageService> logger)
    {
        _s3Client = s3Client;
        _r2Settings = r2Options.Value;
        _logger = logger;
    }

    public async Task<string> UploadTourImageAsync(int tourId, IFormFile file, CancellationToken cancellationToken = default)
    {
        // 1. Kiểm tra file rỗng
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Tập tin hình ảnh không được để trống.");
        }

        // 2. Giới hạn dung lượng upload (tối đa 5 MB)
        if (file.Length > MaxFileSizeBytes)
        {
            throw new ArgumentException("Dung lượng hình ảnh vượt quá giới hạn tối đa cho phép (5 MB).");
        }

        // 3. Kiểm tra phần mở rộng file
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
        {
            throw new ArgumentException("Định dạng file không hợp lệ. Hệ thống chỉ chấp nhận hình ảnh định dạng JPG, JPEG, PNG, WEBP.");
        }

        // 4. Kiểm tra MIME type (ContentType)
        if (string.IsNullOrWhiteSpace(file.ContentType) || !AllowedContentTypes.Contains(file.ContentType))
        {
            throw new ArgumentException("MIME type hình ảnh không hợp lệ.");
        }

        // 5. Sinh object key an toàn: tours/{tourId}/{guid}.{ext}
        var safeExt = ext.ToLowerInvariant();
        var objectKey = $"tours/{tourId}/{Guid.NewGuid():N}{safeExt}";

        try
        {
            using var stream = file.OpenReadStream();
            var putRequest = new PutObjectRequest
            {
                BucketName = _r2Settings.BucketName,
                Key = objectKey,
                InputStream = stream,
                ContentType = file.ContentType,
                DisablePayloadSigning = true
            };

            var response = await _s3Client.PutObjectAsync(putRequest, cancellationToken);
            if (response.HttpStatusCode != HttpStatusCode.OK)
            {
                _logger.LogError("Upload file lên Cloudflare R2 thất bại với mã trạng thái: {StatusCode}", response.HttpStatusCode);
                throw new InvalidOperationException($"Tải ảnh lên kho lưu trữ thất bại (Mã lỗi: {response.HttpStatusCode}).");
            }

            var publicBase = _r2Settings.PublicBaseUrl.TrimEnd('/');
            var publicUrl = $"{publicBase}/{objectKey}";
            _logger.LogInformation("Upload ảnh tour {TourId} lên Cloudflare R2 thành công: {Url}", tourId, publicUrl);
            return publicUrl;
        }
        catch (AmazonS3Exception s3Ex)
        {
            _logger.LogError(s3Ex, "Lỗi kết nối hoặc xử lý S3/Cloudflare R2: {Message}", s3Ex.Message);
            throw new InvalidOperationException($"Lỗi lưu trữ Cloudflare R2: {s3Ex.Message}");
        }
    }

    public async Task<bool> DeleteImageAsync(string? imageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return false;
        }

        // Kiểm tra xem ảnh có thuộc quyền quản lý của bucket hiện tại không
        if (!IsManagedUrl(imageUrl))
        {
            _logger.LogInformation("URL ảnh không thuộc bucket của dự án hiện tại, bỏ qua lệnh xóa trên R2: {Url}", imageUrl);
            return true;
        }

        var publicBase = _r2Settings.PublicBaseUrl.TrimEnd('/');
        var objectKey = imageUrl.Substring(publicBase.Length).TrimStart('/');

        // Bảo mật: Không cho phép object key chứa ký tự lùi thư mục hoặc không thuộc tiền tố tours/
        if (string.IsNullOrWhiteSpace(objectKey) || objectKey.Contains("..") || !objectKey.StartsWith("tours/", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Bỏ qua lệnh xóa do object key không hợp lệ hoặc có dấu hiệu can thiệp đường dẫn: {Key}", objectKey);
            return false;
        }

        try
        {
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _r2Settings.BucketName,
                Key = objectKey
            };

            var response = await _s3Client.DeleteObjectAsync(deleteRequest, cancellationToken);
            var isSuccess = response.HttpStatusCode == HttpStatusCode.NoContent || response.HttpStatusCode == HttpStatusCode.OK;
            if (isSuccess)
            {
                _logger.LogInformation("Đã xóa object trên Cloudflare R2 thành công: {Key}", objectKey);
            }
            return isSuccess;
        }
        catch (AmazonS3Exception s3Ex)
        {
            _logger.LogError(s3Ex, "Lỗi khi xóa object trên Cloudflare R2: {Message}", s3Ex.Message);
            return false;
        }
    }

    public bool IsManagedUrl(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return false;
        }

        var publicBase = _r2Settings.PublicBaseUrl.TrimEnd('/');
        // URL thuộc bucket do dự án quản lý phải bắt đầu bằng PublicBaseUrl được cấu hình
        return imageUrl.StartsWith(publicBase, StringComparison.OrdinalIgnoreCase);
    }
}

