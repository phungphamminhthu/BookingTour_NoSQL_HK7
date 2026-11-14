using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class BookingPassengerEmbedded
{
    [BsonElement("id")]
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [BsonElement("full_name")]
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("passenger_type")]
    [JsonPropertyName("passenger_type")]
    public string PassengerType { get; set; } = "adult"; // adult, child

    [BsonElement("id_card")]
    [JsonPropertyName("id_card")]
    public string? IdCard { get; set; }

    [BsonElement("date_of_birth")]
    [JsonPropertyName("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }
}

