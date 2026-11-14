using Amazon.S3;
using Amazon.S3.Model;
using Backend_DotNet.Configurations;
using Backend_DotNet.Data;
using Backend_DotNet.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Services;

public class MigrationTarget
{
    [JsonPropertyName("sourceUrl")]
    public string SourceUrl { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("objectKey")]
    public string ObjectKey { get; set; } = string.Empty;

    [JsonPropertyName("locations")]
    public List<string> Locations { get; set; } = new();
}

public class ManifestEntry
{
    [JsonPropertyName("sourceUrl")]
    public string SourceUrl { get; set; } = string.Empty;

    [JsonPropertyName("r2Url")]
    public string R2Url { get; set; } = string.Empty;

    [JsonPropertyName("objectKey")]
    public string ObjectKey { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("contentType")]
    public string ContentType { get; set; } = string.Empty;

    [JsonPropertyName("sizeBytes")]
    public long SizeBytes { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("migratedAt")]
    public DateTime MigratedAt { get; set; }

    [JsonPropertyName("locations")]
    public List<string> Locations { get; set; } = new();
}

public class MigrationReport
{
    public int TotalFound { get; set; }
    public int TotalUnique { get; set; }
    public int DownloadSuccess { get; set; }
    public int UploadSuccess { get; set; }
    public int Failed { get; set; }
    public List<string> FailedUrls { get; set; } = new();
    public int FrontendUrlsUpdated { get; set; }
    public List<string> ModifiedFiles { get; set; } = new();
}

public class ImageMigrationService
{
    private readonly IAmazonS3 _s3Client;
    private readonly R2Settings _r2Settings;
    private readonly MongoDbContext _context;
    private readonly ILogger<ImageMigrationService> _logger;

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/pjpeg",
        "image/png",
        "image/x-png",
        "image/webp"
    };

    public ImageMigrationService(
        IAmazonS3 s3Client,
        IOptions<R2Settings> r2Options,
        MongoDbContext context,
        ILogger<ImageMigrationService> logger)
    {
        _s3Client = s3Client;
        _r2Settings = r2Options.Value;
        _context = context;
        _logger = logger;
    }

    public async Task<MigrationReport> MigrateAllImagesAsync(CancellationToken cancellationToken = default)
    {
        var report = new MigrationReport();
        var baseDir = AppContext.BaseDirectory;
        // Search project root
        var projectRoot = Directory.GetCurrentDirectory();
        var targetsPath = Path.Combine(projectRoot, "Data", "migration-targets.json");

        if (!File.Exists(targetsPath))
        {
            _logger.LogError("Targets file not found at: {Path}", targetsPath);
            throw new FileNotFoundException("Migration targets file not found.", targetsPath);
        }

        var json = await File.ReadAllTextAsync(targetsPath, cancellationToken);
        var targets = JsonSerializer.Deserialize<List<MigrationTarget>>(json) ?? new();

        report.TotalFound = targets.Count;
        var uniqueKeys = targets.Select(t => t.ObjectKey).Distinct().ToList();
        report.TotalUnique = uniqueKeys.Count;

        _logger.LogInformation("Loaded {Total} target items ({Unique} unique R2 keys) to migrate.", report.TotalFound, report.TotalUnique);

        // Load existing manifest if exists
        var manifestPathWwwroot = Path.Combine(projectRoot, "wwwroot", "assets", "images-manifest.json");
        var manifestPathData = Path.Combine(projectRoot, "Data", "images-manifest.json");
        var manifestMap = new Dictionary<string, ManifestEntry>(StringComparer.OrdinalIgnoreCase);

        if (File.Exists(manifestPathData))
        {
            try
            {
                var existingJson = await File.ReadAllTextAsync(manifestPathData, cancellationToken);
                var existingList = JsonSerializer.Deserialize<List<ManifestEntry>>(existingJson);
                if (existingList != null)
                {
                    foreach (var entry in existingList)
                    {
                        manifestMap[entry.SourceUrl] = entry;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not load existing manifest, proceeding fresh.");
            }
        }

        using var httpClient = new HttpClient(new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(2),
            AutomaticDecompression = DecompressionMethods.All
        })
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BookingTourMigrator/1.0");

        var uploadedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // First, check what already exists on R2
        foreach (var key in uniqueKeys)
        {
            try
            {
                var metadata = await _s3Client.GetObjectMetadataAsync(_r2Settings.BucketName, key, cancellationToken);
                if (metadata.HttpStatusCode == HttpStatusCode.OK && metadata.ContentLength > 0)
                {
                    uploadedKeys.Add(key);
                }
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
            {
                // Not on R2 yet
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Checking object metadata failed for {Key}: {Message}", key, ex.Message);
            }
        }

        _logger.LogInformation("Objects already verified on R2: {Count}/{Total}", uploadedKeys.Count, report.TotalUnique);

        var publicBase = _r2Settings.PublicBaseUrl.TrimEnd('/');

        for (int idx = 0; idx < targets.Count; idx++)
        {
            var target = targets[idx];
            var progress = $"[{idx + 1}/{targets.Count}]";

            // If already uploaded and exists in manifest
            if (uploadedKeys.Contains(target.ObjectKey) && manifestMap.TryGetValue(target.SourceUrl, out var existingEntry) && existingEntry.Status == "Success")
            {
                _logger.LogInformation("{Progress} Already migrated: {Key}", progress, target.ObjectKey);
                report.DownloadSuccess++;
                report.UploadSuccess++;
                continue;
            }

            // Download image
            byte[]? imageBytes = null;
            string contentType = "image/jpeg";
            var downloadUrl = target.SourceUrl;

            // If ui-avatars.com, ensure format=png for high-fidelity raster PNG
            if (downloadUrl.Contains("ui-avatars.com") && !downloadUrl.Contains("format=png", StringComparison.OrdinalIgnoreCase))
            {
                downloadUrl += (downloadUrl.Contains("?") ? "&" : "?") + "format=png";
            }

            bool downloadOk = false;
            for (int attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    using var response = await httpClient.GetAsync(downloadUrl, cancellationToken);
                    if (response.IsSuccessStatusCode)
                    {
                        var rawCt = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
                        var data = await response.Content.ReadAsByteArrayAsync(cancellationToken);

                        if (data.Length > 0 && data.Length <= MaxFileSizeBytes)
                        {
                            imageBytes = data;
                            contentType = rawCt;
                            // If UI avatars returned png
                            if (downloadUrl.Contains("ui-avatars.com") || target.ObjectKey.EndsWith(".png", StringComparison.OrdinalIgnoreCase))
                            {
                                contentType = "image/png";
                            }
                            downloadOk = true;
                            break;
                        }
                    }
                    _logger.LogWarning("{Progress} Attempt {Attempt} failed for {Url}: HTTP {Status}", progress, attempt, downloadUrl, response.StatusCode);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("{Progress} Attempt {Attempt} error for {Url}: {Message}", progress, attempt, downloadUrl, ex.Message);
                }
                await Task.Delay(500 * attempt, cancellationToken);
            }

            if (!downloadOk || imageBytes == null)
            {
                _logger.LogError("{Progress} FAILED to download image: {Url}", progress, target.SourceUrl);
                report.Failed++;
                report.FailedUrls.Add(target.SourceUrl);
                manifestMap[target.SourceUrl] = new ManifestEntry
                {
                    SourceUrl = target.SourceUrl,
                    ObjectKey = target.ObjectKey,
                    Category = target.Category,
                    Status = "DownloadFailed",
                    MigratedAt = DateTime.UtcNow,
                    Locations = target.Locations
                };
                continue;
            }

            report.DownloadSuccess++;

            // Upload to R2 if not yet uploaded
            if (!uploadedKeys.Contains(target.ObjectKey))
            {
                try
                {
                    using var uploadStream = new MemoryStream(imageBytes);
                    var putRequest = new PutObjectRequest
                    {
                        BucketName = _r2Settings.BucketName,
                        Key = target.ObjectKey,
                        InputStream = uploadStream,
                        ContentType = contentType,
                        DisablePayloadSigning = true
                    };

                    var putResponse = await _s3Client.PutObjectAsync(putRequest, cancellationToken);
                    if (putResponse.HttpStatusCode != HttpStatusCode.OK)
                    {
                        throw new InvalidOperationException($"S3 PutObject returned {putResponse.HttpStatusCode}");
                    }
                    uploadedKeys.Add(target.ObjectKey);
                    _logger.LogInformation("{Progress} Uploaded to R2: {Key} ({Size} KB)", progress, target.ObjectKey, imageBytes.Length / 1024);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "{Progress} FAILED to upload to R2: {Key}", progress, target.ObjectKey);
                    report.Failed++;
                    report.FailedUrls.Add(target.SourceUrl);
                    manifestMap[target.SourceUrl] = new ManifestEntry
                    {
                        SourceUrl = target.SourceUrl,
                        ObjectKey = target.ObjectKey,
                        Category = target.Category,
                        Status = "UploadFailed",
                        MigratedAt = DateTime.UtcNow,
                        Locations = target.Locations
                    };
                    continue;
                }
            }

            report.UploadSuccess++;
            var newR2Url = $"{publicBase}/{target.ObjectKey}";

            manifestMap[target.SourceUrl] = new ManifestEntry
            {
                SourceUrl = target.SourceUrl,
                R2Url = newR2Url,
                ObjectKey = target.ObjectKey,
                Category = target.Category,
                ContentType = contentType,
                SizeBytes = imageBytes.Length,
                Status = "Success",
                MigratedAt = DateTime.UtcNow,
                Locations = target.Locations
            };
        }

        // Save manifest to both wwwroot/assets and Data
        var manifestList = manifestMap.Values.OrderBy(e => e.Category).ThenBy(e => e.ObjectKey).ToList();
        var manifestJson = JsonSerializer.Serialize(manifestList, new JsonSerializerOptions { WriteIndented = true });

        Directory.CreateDirectory(Path.GetDirectoryName(manifestPathWwwroot)!);
        Directory.CreateDirectory(Path.GetDirectoryName(manifestPathData)!);

        await File.WriteAllTextAsync(manifestPathWwwroot, manifestJson, cancellationToken);
        await File.WriteAllTextAsync(manifestPathData, manifestJson, cancellationToken);

        _logger.LogInformation("Saved manifest with {Count} entries to {P1} and {P2}", manifestList.Count, manifestPathWwwroot, manifestPathData);

        // Sync MongoDB province images if applicable
        await SyncMongoDbProvincesAsync(manifestMap, cancellationToken);

        return report;
    }

    private async Task SyncMongoDbProvincesAsync(Dictionary<string, ManifestEntry> manifestMap, CancellationToken cancellationToken)
    {
        try
        {
            var provinces = await _context.Provinces.Find(_ => true).ToListAsync(cancellationToken);
            int updatedCount = 0;
            foreach (var prov in provinces)
            {
                if (!string.IsNullOrEmpty(prov.ImageUrl) && manifestMap.TryGetValue(prov.ImageUrl, out var entry) && entry.Status == "Success")
                {
                    var update = Builders<Province>.Update
                        .Set(p => p.ImageUrl, entry.R2Url)
                        .Set(p => p.UpdatedAt, DateTime.UtcNow);

                    await _context.Provinces.UpdateOneAsync(p => p.Id == prov.Id, update, cancellationToken: cancellationToken);
                    updatedCount++;
                    _logger.LogInformation("Updated MongoDB Province #{Id} ({Name}) ImageUrl to {Url}", prov.Id, prov.ProvinceName, entry.R2Url);
                }
            }
            _logger.LogInformation("MongoDB Sync completed: {Count} provinces updated.", updatedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing MongoDB province images.");
        }
    }
}

