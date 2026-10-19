using Example.Com.InterviewQuestion007.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddDbContext<ProductsDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Products") ?? "Data Source=products.db"));
builder.Services.AddOpenApi();

var app = builder.Build();
await using (var scope = app.Services.CreateAsyncScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ProductsDbContext>();
    await database.Database.EnsureCreatedAsync();
}

if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
