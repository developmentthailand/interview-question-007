using Example.Com.InterviewQuestion007.Contracts;
using Example.Com.InterviewQuestion007.Data;
using Example.Com.InterviewQuestion007.Entities;
using Example.Com.InterviewQuestion007.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion007.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(ProductsDbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var products = await database.Products.AsNoTracking()
            .OrderByDescending(product => product.Id)
            .Select(product => new ProductResponse(product.Id, product.Code, product.CreatedAtUtc))
            .ToListAsync(cancellationToken);
        return Ok(products);
    }

    [HttpPost]
    [ProducesResponseType<ProductResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(CreateProductRequest request, CancellationToken cancellationToken)
    {
        if (!ProductCodeValidator.IsValid(request.Code))
            return BadRequest(new ProblemDetails { Title = "Code must use six uppercase alphanumeric groups, such as XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX." });

        if (await database.Products.AnyAsync(product => product.Code == request.Code, cancellationToken))
            return Conflict(new ProblemDetails { Title = "This product code already exists." });

        var product = new Product { Code = request.Code!, CreatedAtUtc = DateTimeOffset.UtcNow };
        database.Products.Add(product);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is SqliteException { SqliteErrorCode: 19 })
        {
            return Conflict(new ProblemDetails { Title = "This product code already exists." });
        }

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToResponse(product));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var product = await database.Products.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return product is null ? NotFound() : Ok(ToResponse(product));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var affected = await database.Products.Where(product => product.Id == id).ExecuteDeleteAsync(cancellationToken);
        return affected == 0 ? NotFound() : NoContent();
    }

    private static ProductResponse ToResponse(Product product) => new(product.Id, product.Code, product.CreatedAtUtc);
}
