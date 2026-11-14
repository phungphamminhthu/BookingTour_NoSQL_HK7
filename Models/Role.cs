using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Role : BaseEntity
{
    [BsonElement("role_name")]
    [JsonPropertyName("role_name")]
    public string RoleName { get; set; } = string.Empty;

    [BsonElement("description")]
    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

