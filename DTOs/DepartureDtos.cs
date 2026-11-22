using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend_DotNet.DTOs;

public class DepartureCreateRequest
{
    [Required(ErrorMessage = "Vui lòng chọn tour.")]
    [JsonPropertyName("tour_id")]
    public int TourId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày khởi hành.")]
    [JsonPropertyName("departure_date")]
    public DateTime DepartureDate { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày trở về.")]
    [JsonPropertyName("return_date")]
    public DateTime ReturnDate { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập số chỗ tối đa.")]
    [Range(1, 100, ErrorMessage = "Số chỗ tối đa phải từ 1 đến 100.")]
    [JsonPropertyName("max_seats")]
    public int MaxSeats { get; set; } = 20;

    [Required(ErrorMessage = "Vui lòng nhập giá người lớn.")]
    [Range(0, double.MaxValue, ErrorMessage = "Giá không được là số âm.")]
    [JsonPropertyName("adult_price")]
    public decimal AdultPrice { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập giá trẻ em.")]
    [Range(0, double.MaxValue, ErrorMessage = "Giá không được là số âm.")]
    [JsonPropertyName("child_price")]
    public decimal ChildPrice { get; set; }

    [JsonPropertyName("guide_id")]
    public int? GuideId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "open";
}

public class DepartureUpdateRequest : DepartureCreateRequest
{
    [JsonPropertyName("available_seats")]
    public int? AvailableSeats { get; set; }
}

public class AssignGuideRequest
{
    [Required(ErrorMessage = "Vui lòng chọn hướng dẫn viên.")]
    [JsonPropertyName("guide_id")]
    public int GuideId { get; set; }
}

