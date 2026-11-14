using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Payment : BaseEntity
{
    [BsonElement("booking_id")]
    [JsonPropertyName("booking_id")]
    public int BookingId { get; set; }

    [BsonElement("amount")]
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [BsonElement("payment_method")]
    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = "Thẻ quốc tế";

    // Extra fields for Transaction listing in Admin
    [BsonIgnore]
    [JsonPropertyName("booking_code")]
    public string? BookingCode { get; set; }

    [BsonIgnore]
    [JsonPropertyName("customer_name")]
    public string? CustomerName { get; set; }

    [BsonIgnore]
    [JsonPropertyName("tour_title")]
    public string? TourTitle { get; set; }

    [BsonIgnore]
    [JsonPropertyName("booking_status")]
    public string? BookingStatus { get; set; }
}

