using MongoDB.Bson.Serialization.Attributes;

namespace Backend_DotNet.Models;

public class Counter
{
    [BsonId]
    public string Id { get; set; } = string.Empty;

    [BsonElement("sequence_value")]
    public int SequenceValue { get; set; }
}

