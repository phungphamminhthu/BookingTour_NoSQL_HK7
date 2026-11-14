using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Province : BaseEntity
{
    [BsonElement("province_name")]
    [JsonPropertyName("province_name")]
    public string ProvinceName { get; set; } = string.Empty;

    [BsonElement("region")]
    [JsonPropertyName("region")]
    public string Region { get; set; } = string.Empty;

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [BsonElement("image_url")]
    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }

    [BsonIgnore]
    [JsonPropertyName("tours_count")]
    public int ToursCount { get; set; }
}

