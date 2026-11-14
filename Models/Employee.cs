using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Employee : BaseEntity
{
    [BsonElement("username")]
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("password_hash")]
    [JsonIgnore] // Don't expose password hash in JSON responses
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("full_name")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("email")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("phone")]
    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [BsonElement("role_id")]
    [JsonPropertyName("role_id")]
    public int RoleId { get; set; }

    [BsonElement("role_name")]
    [JsonPropertyName("role_name")]
    public string? RoleName { get; set; }
}

