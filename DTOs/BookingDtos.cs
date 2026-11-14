using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend_DotNet.DTOs;

public class PassengerDto
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên hành khách.")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn loại hành khách.")]
    [JsonPropertyName("passenger_type")]
    public string PassengerType { get; set; } = "adult"; // adult, child

    [JsonPropertyName("id_card")]
    public string? IdCard { get; set; }

    [JsonPropertyName("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }
}

public class DraftBookingRequest
{
    [Required]
    [JsonPropertyName("departure_id")]
    public int DepartureId { get; set; }

    [Required]
    [Range(1, 20, ErrorMessage = "Số lượng người lớn từ 1 đến 20.")]
    [JsonPropertyName("total_adults")]
    public int TotalAdults { get; set; } = 1;

    [Range(0, 20, ErrorMessage = "Số lượng trẻ em từ 0 đến 20.")]
    [JsonPropertyName("total_children")]
    public int TotalChildren { get; set; } = 0;

    [Required(ErrorMessage = "Vui lòng nhập họ tên người liên hệ.")]
    [JsonPropertyName("userFullName")]
    public string UserFullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
    [JsonPropertyName("userPhone")]
    public string UserPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập email.")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
    [JsonPropertyName("userEmail")]
    public string UserEmail { get; set; } = string.Empty;
}

public class CheckoutRequest : DraftBookingRequest
{
    [Required(ErrorMessage = "Vui lòng cung cấp danh sách hành khách.")]
    [JsonPropertyName("passengers")]
    public List<PassengerDto> Passengers { get; set; } = new();

    [Required(ErrorMessage = "Vui lòng nhập số thẻ.")]
    [JsonPropertyName("card_number")]
    public string CardNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập tên trên thẻ.")]
    [JsonPropertyName("card_holder")]
    public string CardHolder { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập hạn thẻ (MM/YY).")]
    [JsonPropertyName("card_expiry")]
    public string CardExpiry { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mã bảo mật CVV.")]
    [JsonPropertyName("card_cvv")]
    public string CardCvv { get; set; } = string.Empty;
}

public class ReviewCreateRequest
{
    [Required]
    [Range(1, 5, ErrorMessage = "Đánh giá từ 1 đến 5 sao.")]
    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập nội dung đánh giá.")]
    [JsonPropertyName("comment")]
    public string Comment { get; set; } = string.Empty;
}

