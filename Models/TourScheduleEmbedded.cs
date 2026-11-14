using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class TourScheduleEmbedded
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [BsonElement("day_number")]
    [JsonPropertyName("day_number")]
    public int DayNumber { get; set; }

    [BsonElement("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("activities")]
    [JsonPropertyName("activities")]
    public string? Activities { get; set; }
}

