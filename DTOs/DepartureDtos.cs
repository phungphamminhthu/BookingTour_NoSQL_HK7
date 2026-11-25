using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Backend_DotNet.Models;

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

public class DepartureStatsDto
{
    [JsonPropertyName("open_count")]
    public int OpenCount { get; set; }

    [JsonPropertyName("unassigned_count")]
    public int UnassignedCount { get; set; }

    [JsonPropertyName("today_count")]
    public int TodayCount { get; set; }

    [JsonPropertyName("total_count")]
    public int TotalCount { get; set; }

    [JsonPropertyName("full_count")]
    public int FullCount { get; set; }

    [JsonPropertyName("cancelled_count")]
    public int CancelledCount { get; set; }
}

public class DepartureBookingDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("booking_code")]
    public string BookingCode { get; set; } = string.Empty;

    [JsonPropertyName("customer_id")]
    public int CustomerId { get; set; }

    [JsonPropertyName("customer_name")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("customer_phone")]
    public string? CustomerPhone { get; set; }

    [JsonPropertyName("customer_email")]
    public string? CustomerEmail { get; set; }

    [JsonPropertyName("departure_id")]
    public int DepartureId { get; set; }

    [JsonPropertyName("tour_id")]
    public int? TourId { get; set; }

    [JsonPropertyName("tour_title")]
    public string? TourTitle { get; set; }

    [JsonPropertyName("total_adults")]
    public int TotalAdults { get; set; }

    [JsonPropertyName("total_children")]
    public int TotalChildren { get; set; }

    [JsonPropertyName("total_passengers")]
    public int TotalPassengers => TotalAdults + TotalChildren;

    [JsonPropertyName("total_amount")]
    public decimal TotalAmount { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "confirmed";

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("passengers")]
    public List<BookingPassengerEmbedded> Passengers { get; set; } = new();
}

public class DepartureBookingsResponse
{
    [JsonPropertyName("departure_id")]
    public int DepartureId { get; set; }

    [JsonPropertyName("tour_title")]
    public string TourTitle { get; set; } = string.Empty;

    [JsonPropertyName("total_bookings")]
    public int TotalBookings { get; set; }

    [JsonPropertyName("total_passengers")]
    public int TotalPassengers { get; set; }

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("page_size")]
    public int PageSize { get; set; }

    [JsonPropertyName("total_pages")]
    public int TotalPages { get; set; }

    [JsonPropertyName("items")]
    public List<DepartureBookingDto> Items { get; set; } = new();
}


