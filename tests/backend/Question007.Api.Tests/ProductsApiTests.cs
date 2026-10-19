using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Example.Com.InterviewQuestion007.Tests;

public sealed class ProductsApiTests
{
    private const string ValidCode = "ABCDE-12345-FGHIJ-67890-KLMNO-54321";

    [Fact]
    public async Task Create_accepts_the_30_character_grouped_code()
    {
        using var factory = new ProductApiFactory();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/products", new { code = ValidCode });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(body.RootElement.GetProperty("id").GetInt32() > 0);
        Assert.Equal(ValidCode, body.RootElement.GetProperty("code").GetString());
    }

    [Theory]
    [InlineData("abcde-12345-FGHIJ-67890-KLMNO-54321")]
    [InlineData("ABCDE-12345-FGHIJ-67890-KLMNO-5432")]
    [InlineData("ABCDE12345FGHIJ67890KLMNO54321")]
    public async Task Create_rejects_invalid_code_groups(string code)
    {
        using var factory = new ProductApiFactory();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/products", new { code });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_rejects_duplicate_codes()
    {
        using var factory = new ProductApiFactory();
        using var client = factory.CreateClient();
        using var first = await client.PostAsJsonAsync("/api/products", new { code = ValidCode });
        using var second = await client.PostAsJsonAsync("/api/products", new { code = ValidCode });

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Delete_removes_a_saved_code()
    {
        using var factory = new ProductApiFactory();
        using var client = factory.CreateClient();
        using var created = await client.PostAsJsonAsync("/api/products", new { code = ValidCode });
        using var body = JsonDocument.Parse(await created.Content.ReadAsStringAsync());
        var id = body.RootElement.GetProperty("id").GetInt32();

        using var deleted = await client.DeleteAsync($"/api/products/{id}");
        var products = await client.GetFromJsonAsync<JsonElement[]>("/api/products");

        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Empty(products ?? []);
    }
}
