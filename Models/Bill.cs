using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend_DotNet.Models;

public class Bill : BaseEntity
{
    [BsonElement("bill_number")]
    [JsonPropertyName("bill_number")]
    public string BillNumber { get; set; } = string.Empty;

    [BsonElement("booking_id")]
    [JsonPropertyName("booking_id")]
    public int BookingId { get; set; }

    [BsonElement("employee_id")]
    [JsonPropertyName("employee_id")]
    public int? EmployeeId { get; set; }

    [BsonElement("final_amount")]
    [JsonPropertyName("final_amount")]
    public decimal FinalAmount { get; set; }
}

