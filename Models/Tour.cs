using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Tour : BaseEntity
{
    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("category_id")]
    [JsonPropertyName("category_id")]
    public int CategoryId { get; set; }

    [BsonElement("category_name")]
    [JsonPropertyName("category_name")]
    public string? CategoryName { get; set; }

    [BsonElement("province_id")]
    [JsonPropertyName("province_id")]
    public int ProvinceId { get; set; }

    [BsonElement("province_name")]
    [JsonPropertyName("province_name")]
    public string? ProvinceName { get; set; }

    [BsonElement("duration_days")]
    [JsonPropertyName("duration_days")]
    public int DurationDays { get; set; }

    [BsonElement("duration_nights")]
    [JsonPropertyName("duration_nights")]
    public int DurationNights { get; set; }

    [BsonElement("pickup_point")]
    [JsonPropertyName("pickup_point")]
    public string? PickupPoint { get; set; }

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [BsonElement("itinerary_summary")]
    [JsonPropertyName("itinerary_summary")]
    public string? ItinerarySummary { get; set; }

    [BsonElement("included_services")]
    [JsonPropertyName("included_services")]
    public string? IncludedServices { get; set; }

    [BsonElement("excluded_services")]
    [JsonPropertyName("excluded_services")]
    public string? ExcludedServices { get; set; }

    [BsonElement("language")]
    [JsonPropertyName("language")]
    public string? Language { get; set; }

    [BsonElement("transport")]
    [JsonPropertyName("transport")]
    public string? Transport { get; set; }

    [BsonElement("accommodation")]
    [JsonPropertyName("accommodation")]
    public string? Accommodation { get; set; }

    [BsonElement("min_price")]
    [JsonPropertyName("min_price")]
    public decimal MinPrice { get; set; }

    [BsonElement("created_by")]
    [JsonPropertyName("created_by")]
    public int CreatedBy { get; set; } = 1;

    [BsonElement("thumbnail_url")]
    [JsonPropertyName("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }

    [BsonElement("images")]
    [JsonPropertyName("images")]
    public List<TourImageEmbedded> Images { get; set; } = new();

    [BsonElement("schedules")]
    [JsonPropertyName("schedules")]
    public List<TourScheduleEmbedded> Schedules { get; set; } = new();

    // Navigation-like properties for API responses
    [BsonIgnore]
    [JsonPropertyName("category")]
    public TourCategory? Category { get; set; }

    [BsonIgnore]
    [JsonPropertyName("province")]
    public Province? Province { get; set; }

    [BsonIgnore]
    [JsonPropertyName("departures")]
    public List<TourDeparture>? Departures { get; set; }

    [BsonIgnore]
    [JsonPropertyName("reviews")]
    public List<Review>? Reviews { get; set; }

    [BsonIgnore]
    [JsonPropertyName("departures_count")]
    public int DeparturesCount { get; set; }

    [BsonIgnore]
    [JsonPropertyName("schedules_count")]
    public int SchedulesCount { get; set; }
}

