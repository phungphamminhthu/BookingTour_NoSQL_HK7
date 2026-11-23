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
    [JsonPropertyName("transaction_code")]
    public string TransactionCode => $"TXN-{Id:D4}";

    [BsonIgnore]
    [JsonPropertyName("booking_code")]
    public string? BookingCode { get; set; }

    [BsonIgnore]
    [JsonPropertyName("customer_id")]
    public int? CustomerId { get; set; }

    [BsonIgnore]
    [JsonPropertyName("customer_name")]
    public string? CustomerName { get; set; }

    [BsonIgnore]
    [JsonPropertyName("customer_email")]
    public string? CustomerEmail { get; set; }

    [BsonIgnore]
    [JsonPropertyName("customer_phone")]
    public string? CustomerPhone { get; set; }

    [BsonIgnore]
    [JsonPropertyName("customer_address")]
    public string? CustomerAddress { get; set; }

    [BsonIgnore]
    [JsonPropertyName("tour_id")]
    public int? TourId { get; set; }

    [BsonIgnore]
    [JsonPropertyName("tour_title")]
    public string? TourTitle { get; set; }

    [BsonIgnore]
    [JsonPropertyName("departure_date")]
    public DateTime? DepartureDate { get; set; }

    [BsonIgnore]
    [JsonPropertyName("booking_status")]
    public string? BookingStatus { get; set; }

    [BsonIgnore]
    [JsonPropertyName("status")]
    public string Status => BookingStatus ?? "confirmed";

    [BsonIgnore]
    [JsonPropertyName("bill_number")]
    public string? BillNumber { get; set; }

    [BsonIgnore]
    [JsonPropertyName("total_adults")]
    public int TotalAdults { get; set; }

    [BsonIgnore]
    [JsonPropertyName("total_children")]
    public int TotalChildren { get; set; }
}

