using System.Text.Json.Serialization;

namespace Backend_DotNet.Helpers;

public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("total")]
    public long? Total { get; set; }

    [JsonPropertyName("totalItems")]
    public long? TotalItems => Total;

    [JsonPropertyName("page")]
    public int? Page { get; set; }

    [JsonPropertyName("currentPage")]
    public int? CurrentPage => Page;

    [JsonPropertyName("pageSize")]
    public int? PageSize { get; set; }

    [JsonPropertyName("totalPages")]
    // Tổng số trang = làm tròn lên (tổng bản ghi / kích thước trang), vì trang cuối có thể chưa đầy.
    public int? TotalPages => (Total.HasValue && PageSize.HasValue && PageSize.Value > 0)
        ? (int)Math.Ceiling((double)Total.Value / PageSize.Value)
        : null;

    [JsonPropertyName("total_pages")]
    public int? TotalPagesSnake => TotalPages;

    [JsonPropertyName("errors")]
    public object? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Success", long? total = null, int? page = null, int? pageSize = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public static ApiResponse<T> Fail(string message, object? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors
        };
    }
}

