using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Review : BaseEntity
{
    // Tham chiếu đơn được đánh giá; có thể null ở dữ liệu mẫu cũ, index unique chỉ áp dụng khi mã là số.
    [BsonElement("booking_id")]
    [JsonPropertyName("booking_id")]
    public int? BookingId { get; set; }

    [BsonElement("tour_id")]
    [JsonPropertyName("tour_id")]
    public int TourId { get; set; }

    [BsonElement("customer_id")]
    [JsonPropertyName("customer_id")]
    public int CustomerId { get; set; }

    [BsonElement("customer_name")]
    [JsonPropertyName("customer_name")]
    public string? CustomerName { get; set; }

    [BsonElement("rating")]
    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [BsonElement("comment")]
    [JsonPropertyName("comment")]
    public string Comment { get; set; } = string.Empty;

    [BsonIgnore]
    [JsonPropertyName("customer")]
    public Customer? Customer { get; set; }
}

