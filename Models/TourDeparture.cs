using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class TourDeparture : BaseEntity
{
    [BsonElement("tour_id")]
    [JsonPropertyName("tour_id")]
    public int TourId { get; set; }

    [BsonElement("tour_title")]
    [JsonPropertyName("tour_title")]
    public string? TourTitle { get; set; }

    [BsonElement("departure_date")]
    [JsonPropertyName("departure_date")]
    public DateTime DepartureDate { get; set; }

    [BsonElement("return_date")]
    [JsonPropertyName("return_date")]
    public DateTime ReturnDate { get; set; }

    [BsonElement("max_seats")]
    [JsonPropertyName("max_seats")]
    public int MaxSeats { get; set; } = 20;

    [BsonElement("available_seats")]
    [JsonPropertyName("available_seats")]
    public int AvailableSeats { get; set; }

    [BsonElement("adult_price")]
    [JsonPropertyName("adult_price")]
    public decimal AdultPrice { get; set; }

    [BsonElement("child_price")]
    [JsonPropertyName("child_price")]
    public decimal ChildPrice { get; set; }

    [BsonElement("status")]
    [JsonPropertyName("status")]
    public string Status { get; set; } = "open"; // open, full, cancelled

    [BsonElement("guide_id")]
    [JsonPropertyName("guide_id")]
    public int? GuideId { get; set; }

    [BsonElement("guide_name")]
    [JsonPropertyName("guide_name")]
    public string? GuideName { get; set; }

    [BsonIgnore]
    [JsonPropertyName("tour")]
    public Tour? Tour { get; set; }

    [BsonIgnore]
    [JsonPropertyName("guide")]
    public Employee? Guide { get; set; }

    [BsonIgnore]
    [JsonPropertyName("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }
}

