using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class TourImageEmbedded
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [BsonElement("img_url")]
    [JsonPropertyName("img_url")]
    public string ImgUrl { get; set; } = string.Empty;

    [BsonElement("is_thumbnail")]
    [JsonPropertyName("is_thumbnail")]
    public bool IsThumbnail { get; set; }
}

