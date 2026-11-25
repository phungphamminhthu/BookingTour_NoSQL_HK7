using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_DotNet.DTOs;

public class TourQueryParameters
{
    [FromQuery(Name = "q")]
    public string? TuKhoa { get; set; }

    [FromQuery(Name = "destination")]
    public string? Destination { get; set; }

    [FromQuery(Name = "category_id")]
    public int? DanhMucId { get; set; }

    [FromQuery(Name = "province_id")]
    public int? TinhId { get; set; }

    [FromQuery(Name = "region")]
    public string? VungMien { get; set; }

    [FromQuery(Name = "startDate")]
    public DateTime? NgayBatDau { get; set; }

    [FromQuery(Name = "pickupPoint")]
    public string? DiemKhoiHanh { get; set; }

    [FromQuery(Name = "gia_tu")]
    [Range(0, double.MaxValue)]
    public decimal? GiaTu { get; set; }

    [FromQuery(Name = "gia_den")]
    [Range(0, double.MaxValue)]
    public decimal? GiaDen { get; set; }

    [FromQuery(Name = "so_ngay")]
    [Range(1, 365)]
    public int? SoNgay { get; set; }

    [FromQuery(Name = "sort")]
    [RegularExpression("^(featured|asc|desc)$")]
    public string? SapXep { get; set; } = "featured"; // featured, asc, desc

    [FromQuery(Name = "page")]
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [FromQuery(Name = "pageSize")]
    [Range(1, 100)]
    public int PageSize { get; set; } = 9;

    // Checkbox trên giao diện gửi nhiều category_id[] cùng lúc.
    [FromQuery(Name = "category_id[]")]
    public List<int> CategoryIds { get; set; } = new();
}

public class TourCreateRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên tour du lịch.")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn danh mục tour.")]
    [JsonPropertyName("categoryId")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn địa điểm tỉnh/thành.")]
    [JsonPropertyName("provinceId")]
    public int ProvinceId { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập số ngày.")]
    [Range(1, 30, ErrorMessage = "Số ngày phải từ 1 trở lên.")]
    [JsonPropertyName("durationDays")]
    public int DurationDays { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập số đêm.")]
    [Range(0, 30, ErrorMessage = "Số đêm không được nhỏ hơn 0.")]
    [JsonPropertyName("durationNights")]
    public int DurationNights { get; set; }

    [JsonPropertyName("pickupPoint")]
    public string? PickupPoint { get; set; }

    [Range(0, double.MaxValue)]
    [JsonPropertyName("minPrice")]
    public decimal? MinPrice { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("itinerarySummary")]
    public string? ItinerarySummary { get; set; }

    [JsonPropertyName("includedServices")]
    public string? IncludedServices { get; set; }

    [JsonPropertyName("thumbnailUrl")]
    public string? ThumbnailUrl { get; set; }
}

public class TourUpdateRequest : TourCreateRequest
{
}

public class ScheduleCreateRequest
{
    [Required(ErrorMessage = "Vui lòng nhập số thứ tự ngày.")]
    [Range(1, 30, ErrorMessage = "Số thứ tự ngày phải từ 1 trở lên.")]
    [JsonPropertyName("day_number")]
    public int DayNumber { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập tiêu đề hoạt động.")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("activities")]
    public string? Activities { get; set; }
}

public class ScheduleUpdateRequest : ScheduleCreateRequest
{
}

