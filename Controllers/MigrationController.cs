using Backend_DotNet.Data;
using Backend_DotNet.Helpers;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace Backend_DotNet.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MigrationController : ControllerBase
{
    private readonly MongoDbContext _context;
    private readonly DbSeeder _seeder;

    public MigrationController(MongoDbContext context, DbSeeder seeder)
    {
        _context = context;
        _seeder = seeder;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        await _seeder.SeedAsync();
        return Ok(ApiResponse<string>.Ok("Dữ liệu và chỉ mục MongoDB đã được khởi tạo/đồng bộ thành công."));
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var counts = new
        {
            Roles = await _context.Roles.CountDocumentsAsync(_ => true),
            Categories = await _context.TourCategories.CountDocumentsAsync(_ => true),
            Provinces = await _context.Provinces.CountDocumentsAsync(_ => true),
            Employees = await _context.Employees.CountDocumentsAsync(_ => true),
            Customers = await _context.Customers.CountDocumentsAsync(_ => true),
            Tours = await _context.Tours.CountDocumentsAsync(_ => true),
            Departures = await _context.TourDepartures.CountDocumentsAsync(_ => true),
            Bookings = await _context.Bookings.CountDocumentsAsync(_ => true),
            Payments = await _context.Payments.CountDocumentsAsync(_ => true),
            Bills = await _context.Bills.CountDocumentsAsync(_ => true),
            Reviews = await _context.Reviews.CountDocumentsAsync(_ => true),
            Counters = await _context.Counters.CountDocumentsAsync(_ => true)
        };

        return Ok(ApiResponse<object>.Ok(counts, "Trạng thái các collection trong MongoDB."));
    }
}

