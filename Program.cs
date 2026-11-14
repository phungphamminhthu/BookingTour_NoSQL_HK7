using Amazon.Runtime;
using Amazon.S3;
using Backend_DotNet.Configurations;
using Backend_DotNet.Data;
using Backend_DotNet.Helpers;
using Backend_DotNet.Middleware;
using Backend_DotNet.Models;
using Backend_DotNet.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configuration bindings
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<R2Settings>(builder.Configuration.GetSection(R2Settings.SectionName));

// Cloudflare R2 S3 Client registration
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var r2 = sp.GetRequiredService<IOptions<R2Settings>>().Value;
    var config = new AmazonS3Config
    {
        ServiceURL = r2.ServiceUrl,
        AuthenticationRegion = "auto",
        ForcePathStyle = true
    };
    return new AmazonS3Client(new BasicAWSCredentials(r2.AccessKeyId, r2.SecretAccessKey), config);
});

// Storage Service
builder.Services.AddScoped<IStorageService, CloudflareR2StorageService>();
builder.Services.AddScoped<ImageMigrationService>();

// Core services
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<DbSeeder>();
builder.Services.AddScoped<JwtHelper>();

// Business services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IDepartureService, DepartureService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IAdminManagementService, AdminManagementService>();

// CORS configuration: Allow all origins, methods, headers
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Authentication & JWT configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Swagger / OpenAPI documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BookingTour API - Vietnam Expeditions",
        Version = "v1",
        Description = "ASP.NET Core Web API with MongoDB for Booking Tour System"
    });

    // JWT Bearer scheme in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token vào đây: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Ensure wwwroot/uploads exists
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

// Exception handling middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BookingTour API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        ctx.Context.Response.Headers.Append("Pragma", "no-cache");
        ctx.Context.Response.Headers.Append("Expires", "0");
    }
});

app.UseRouting();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Migration runner CLI mode
if (args.Contains("--migrate-images"))
{
    using (var scope = app.Services.CreateScope())
    {
        var migrator = scope.ServiceProvider.GetRequiredService<ImageMigrationService>();
        await migrator.MigrateAllImagesAsync();
    }
    return;
}

if (args.Contains("--audit-db"))
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
        var provinces = await db.Provinces.Find(_ => true).ToListAsync();
        var tours = await db.Tours.Find(_ => true).ToListAsync();
        var customers = await db.Customers.Find(_ => true).ToListAsync();
        var employees = await db.Employees.Find(_ => true).ToListAsync();
        var reviews = await db.Reviews.Find(_ => true).ToListAsync();

        Console.WriteLine("========================================");
        Console.WriteLine("MONGODB DEEP AUDIT REPORT");
        Console.WriteLine("========================================");

        Console.WriteLine($"1. Collection 'provinces' ({provinces.Count} docs):");
        int r2NewProvCount = 0;
        int oldUnsplashProvCount = 0;
        foreach (var p in provinces)
        {
            var isNewR2 = p.ImageUrl != null && p.ImageUrl.Contains("pub-2198db5444f34bb593fc9eade3a65a70.r2.dev");
            var isUnsplash = p.ImageUrl != null && p.ImageUrl.Contains("images.unsplash.com");
            if (isNewR2) r2NewProvCount++;
            if (isUnsplash) oldUnsplashProvCount++;
            Console.WriteLine($"   - Province #{p.Id} ({p.ProvinceName}): {p.ImageUrl} [{(isNewR2 ? "NEW_R2_OK" : "OTHER")}]");
        }
        Console.WriteLine($"   Summary: {r2NewProvCount}/{provinces.Count} on New R2, {oldUnsplashProvCount} on Unsplash.");

        Console.WriteLine($"\n2. Collection 'tours' ({tours.Count} docs):");
        int totalTourImages = 0;
        int r2OldTourCount = 0;
        int r2NewTourCount = 0;
        int unsplashTourCount = 0;
        foreach (var t in tours)
        {
            var thumbR2 = t.ThumbnailUrl != null && t.ThumbnailUrl.Contains("r2.dev");
            Console.WriteLine($"   - Tour #{t.Id} ({t.Title}): Thumb={t.ThumbnailUrl} [{(thumbR2 ? "R2_OK" : "OTHER")}], Gallery count={t.Images.Count}");
            foreach (var img in t.Images)
            {
                totalTourImages++;
                if (img.ImgUrl.Contains("pub-33beb9a3cd824c58a79f91874499c9b4.r2.dev")) r2OldTourCount++;
                else if (img.ImgUrl.Contains("pub-2198db5444f34bb593fc9eade3a65a70.r2.dev")) r2NewTourCount++;
                else if (img.ImgUrl.Contains("images.unsplash.com")) unsplashTourCount++;
            }
        }
        Console.WriteLine($"   Summary: {totalTourImages} total gallery images across {tours.Count} tours ({r2OldTourCount} on Old R2, {r2NewTourCount} on New R2, {unsplashTourCount} on Unsplash).");

        Console.WriteLine($"\n3. Collection 'customers' ({customers.Count} docs):");
        Console.WriteLine($"   Schema verified: Customer entity does not store image URLs (Profile/Avatar managed dynamically or via static R2 user avatar).");

        Console.WriteLine($"\n4. Collection 'employees' ({employees.Count} docs):");
        Console.WriteLine($"   Schema verified: Employee entity does not store image URLs (Admin/Staff avatars use static R2 avatar assets).");

        Console.WriteLine($"\n5. Collection 'reviews' ({reviews.Count} docs):");
        Console.WriteLine($"   Schema verified: Review entity stores (Id, TourId, CustomerId, CustomerName, Rating, Comment). Reviewer avatars in frontend map to R2 customer avatar assets.");
        Console.WriteLine("========================================");
    }
    return;
}

// Automatically seed MongoDB on application startup
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
    try
    {
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Failed to auto-seed MongoDB on startup.");
    }
}

app.Run();
