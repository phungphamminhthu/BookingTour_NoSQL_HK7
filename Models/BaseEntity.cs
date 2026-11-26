using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public abstract class BaseEntity
{
    // _id dùng ObjectId của MongoDB; id số nguyên là mã nghiệp vụ để API/giao diện tham chiếu.
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("mongoId")]
    public string? MongoId { get; set; }

    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [BsonElement("created_at")]
    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updated_at")]
    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

