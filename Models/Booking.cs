using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Booking : BaseEntity
{
    [BsonElement("booking_code")]
    [JsonPropertyName("booking_code")]
    public string BookingCode { get; set; } = string.Empty;

    [BsonElement("customer_id")]
    [JsonPropertyName("customer_id")]
    public int CustomerId { get; set; }

    [BsonElement("customer_name")]
    [JsonPropertyName("customer_name")]
    public string? CustomerName { get; set; }

    [BsonElement("departure_id")]
    [JsonPropertyName("departure_id")]
    public int DepartureId { get; set; }

    [BsonElement("tour_id")]
    [JsonPropertyName("tour_id")]
    public int? TourId { get; set; }

    [BsonElement("tour_title")]
    [JsonPropertyName("tour_title")]
    public string? TourTitle { get; set; }

    [BsonElement("total_adults")]
    [JsonPropertyName("total_adults")]
    public int TotalAdults { get; set; }

    [BsonElement("total_children")]
    [JsonPropertyName("total_children")]
    public int TotalChildren { get; set; }

    [BsonElement("total_amount")]
    [JsonPropertyName("total_amount")]
    public decimal TotalAmount { get; set; }

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "confirmed"; // pending, confirmed, cancelled

    [BsonElement("passengers")]
    [JsonPropertyName("passengers")]
    public List<BookingPassengerEmbedded> Passengers { get; set; } = new();

    // Additional info for responses
    [BsonIgnore]
    [JsonPropertyName("tour_image")]
    public string? TourImage { get; set; }

    [BsonIgnore]
    [JsonPropertyName("departure_date")]
    public DateTime? DepartureDate { get; set; }

    [BsonIgnore]
    [JsonPropertyName("return_date")]
    public DateTime? ReturnDate { get; set; }

    [BsonIgnore]
    [JsonPropertyName("destination")]
    public string? Destination { get; set; }

    [BsonIgnore]
    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; set; }

    [BsonIgnore]
    [JsonPropertyName("bill_number")]
    public string? BillNumber { get; set; }

    [BsonIgnore]
    [JsonPropertyName("can_review")]
    public bool CanReview { get; set; }
}

