using Example.Com.InterviewQuestion007.Entities;
using Microsoft.EntityFrameworkCore;

namespace Example.Com.InterviewQuestion007.Data;

public sealed class ProductsDbContext(DbContextOptions<ProductsDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().ToTable("Products").HasKey(product => product.Id);
        modelBuilder.Entity<Product>().Property(product => product.Code).HasMaxLength(35).IsRequired();
        modelBuilder.Entity<Product>().HasIndex(product => product.Code).IsUnique();
        modelBuilder.Entity<Product>().HasIndex(product => product.CreatedAtUtc);
    }
}
