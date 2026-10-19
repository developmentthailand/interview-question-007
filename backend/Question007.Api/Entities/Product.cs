namespace Example.Com.InterviewQuestion007.Entities;

public sealed class Product
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
