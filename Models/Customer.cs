using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Customer : BaseEntity
{
    [BsonElement("email")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("password_hash")]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("full_name")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("phone")]
    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [BsonElement("address")]
    [JsonPropertyName("address")]
    public string? Address { get; set; }

    [BsonElement("birthday")]
    [JsonPropertyName("birthday")]
    public DateTime? Birthday { get; set; }

    [BsonIgnore]
    [JsonPropertyName("booking_count")]
    public int BookingCount { get; set; }

    [BsonIgnore]
    [JsonPropertyName("bookings")]
    public List<Booking> Bookings { get; set; } = new();
}

