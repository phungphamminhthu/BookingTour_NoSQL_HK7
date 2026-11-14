using Backend_DotNet.Models;
using MongoDB.Driver;

namespace Backend_DotNet.Data;

public class DbSeeder
{
    private readonly MongoDbContext _context;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(MongoDbContext context, ILogger<DbSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            _logger.LogInformation("Ensuring MongoDB indexes...");
            await _context.EnsureIndexesAsync();

            await SeedRolesAsync();
            await SeedCategoriesAsync();
            await SeedProvincesAsync();
            await SeedEmployeesAsync();
            await SeedCustomersAsync();
            await SeedToursAsync();
            await SeedDeparturesAsync();
            await SeedBookingsAsync();
            await SeedPaymentsAsync();
            await SeedBillsAsync();
            await SeedReviewsAsync();
            await InitializeCountersAsync();

            _logger.LogInformation("MongoDB seeding completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while seeding MongoDB database.");
            throw;
        }
    }

    private async Task SeedRolesAsync()
    {
        if (await _context.Roles.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var roles = new List<Role>
            {
                new() { Id = 1, RoleName = "Admin", Description = "Quản trị hệ thống toàn quyền", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, RoleName = "Sale", Description = "Nhân viên kinh doanh và tư vấn khách hàng", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, RoleName = "Guide", Description = "Hướng dẫn viên dẫn đoàn", CreatedAt = now, UpdatedAt = now }
            };
            await _context.Roles.InsertManyAsync(roles);
            _logger.LogInformation("Seeded {Count} roles.", roles.Count);
        }
    }

    private async Task SeedCategoriesAsync()
    {
        if (await _context.TourCategories.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var categories = new List<TourCategory>
            {
                new() { Id = 1, CategoryName = "Tour Biển", Description = "Các chuyến đi nghỉ dưỡng tại các bãi biển đẹp", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, CategoryName = "Tour Núi", Description = "Khám phá vẻ đẹp núi rừng, trekking", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, CategoryName = "Tour Tâm Linh", Description = "Hành hương đến các chùa chiền, di tích lịch sử", CreatedAt = now, UpdatedAt = now },
                new() { Id = 4, CategoryName = "Tour Ẩm Thực", Description = "Trải nghiệm đặc sản các vùng miền", CreatedAt = now, UpdatedAt = now },
                new() { Id = 5, CategoryName = "Tour Nghỉ Dưỡng", Description = "Nghỉ dưỡng cao cấp tại Resort 5 sao", CreatedAt = now, UpdatedAt = now }
            };
            await _context.TourCategories.InsertManyAsync(categories);
            _logger.LogInformation("Seeded {Count} categories.", categories.Count);
        }
    }

    private async Task SeedProvincesAsync()
    {
        if (await _context.Provinces.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var provinces = new List<Province>
            {
                new() { Id = 1, ProvinceName = "Hà Nội", Region = "Bắc", Description = "Thủ đô nghìn năm văn hiến, trung tâm văn hóa chính trị với 36 phố phường cổ kính và ẩm thực phong phú.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1599707367072-cd6ada2bc375_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, ProvinceName = "Hà Giang", Region = "Bắc", Description = "Mảnh đất địa đầu Tổ quốc với cao nguyên đá Đồng Văn, đèo Mã Pí Lèng hùng vĩ và mùa hoa tam giác mạch rực rỡ.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1580837119756-563d608dd119_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, ProvinceName = "Lào Cai", Region = "Bắc", Description = "Xứ sở sương mù Sapa, đỉnh Fansipan nóc nhà Đông Dương cùng ruộng bậc thang kỳ vĩ Tây Bắc.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1544735716-392fe2489ffa_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 4, ProvinceName = "Quảng Ninh", Region = "Bắc", Description = "Kỳ quan thiên nhiên thế giới Vịnh Hạ Long, Vịnh Bái Tử Long với hàng ngàn đảo đá vôi tráng lệ.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1528127269322-539801943592_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 5, ProvinceName = "Ninh Bình", Region = "Bắc", Description = "Quần thể danh thắng Tràng An di sản hỗn hợp thế giới, chùa Bái Đính và Tam Cốc - Bích Động.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1506744038136-46273834b3fb_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 6, ProvinceName = "Đà Nẵng", Region = "Trung", Description = "Thành phố biển đáng sống, Bà Nà Hills, bán đảo Sơn Trà và trung tâm kết nối các di sản miền Trung.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1559592413-7cec4d0cae2b_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 7, ProvinceName = "Quảng Nam", Region = "Trung", Description = "Đô thị cổ Hội An lung linh đèn lồng, thánh địa Mỹ Sơn cổ kính và đảo ngọc Cù Lao Chàm.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1555921015-5532091f6026_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 8, ProvinceName = "Thừa Thiên Huế", Region = "Trung", Description = "Cố đô sông Hương núi Ngự, quần thể di tích Đại Nội lăng tẩm triều Nguyễn và nhã nhạc cung đình.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1578637387939-43c525550085_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 9, ProvinceName = "Khánh Hòa", Region = "Trung", Description = "Vịnh biển Nha Trang ngập tràn nắng ấm, các cụm đảo tuyệt đẹp và dịch vụ nghỉ dưỡng cao cấp.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1507525428034-b723cf961d3e_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 10, ProvinceName = "Lâm Đồng", Region = "Trung", Description = "Thành phố mộng mơ Đà Lạt ngàn hoa, khí hậu mát mẻ quanh năm và những đồi thông thơ mộng.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1518709268805-4e9042af9f23_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 11, ProvinceName = "TP.HCM", Region = "Nam", Description = "Đô thị kinh tế sầm uất, hiện đại bậc nhất Việt Nam kết hợp các công trình di sản kiến trúc độc đáo.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1583417319070-4a69db38a482_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 12, ProvinceName = "Cần Thơ", Region = "Nam", Description = "Thủ phủ miền Tây Nam Bộ với chợ nổi Cái Răng, bến Ninh Kiều và văn hóa sông nước miệt vườn.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1596401057633-54a8fe8ef647_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 13, ProvinceName = "Kiên Giang", Region = "Nam", Description = "Đảo ngọc Phú Quốc biển xanh cát trắng, các khu vui chơi giải trí quốc tế và hoàng hôn tuyệt đẹp.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1544644181-1484b3fdfc62_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 14, ProvinceName = "Bà Rịa - Vũng Tàu", Region = "Nam", Description = "Thành phố biển nghỉ dưỡng cuối tuần lý tưởng với Bãi Trước, Bãi Sau, ngọn hải đăng cổ kính.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1519046904884-53103b34b206_w800.jpg", CreatedAt = now, UpdatedAt = now },
                new() { Id = 15, ProvinceName = "Tây Ninh", Region = "Nam", Description = "Nóc nhà Đông Nam Bộ với đỉnh Núi Bà Đen linh thiêng, hệ thống cáp treo hiện đại và Tòa thánh Tây Ninh.", ImageUrl = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1563245372-f21724e3856d_w800.jpg", CreatedAt = now, UpdatedAt = now }
            };
            await _context.Provinces.InsertManyAsync(provinces);
            _logger.LogInformation("Seeded {Count} provinces.", provinces.Count);
        }
    }

    private async Task SeedEmployeesAsync()
    {
        if (await _context.Employees.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var hashed = BCrypt.Net.BCrypt.HashPassword("123456");
            var employees = new List<Employee>
            {
                new() { Id = 1, Username = "admin_thanh", PasswordHash = hashed, FullName = "Nguyễn Văn Thanh", Email = "thanh.nv@travel.com", Phone = "0901234567", RoleId = 1, RoleName = "Admin", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, Username = "sale_lan", PasswordHash = hashed, FullName = "Trần Thị Lan", Email = "lan.tt@travel.com", Phone = "0902345678", RoleId = 2, RoleName = "Sale", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, Username = "sale_nam", PasswordHash = hashed, FullName = "Phạm Hoàng Nam", Email = "nam.ph@travel.com", Phone = "0903456789", RoleId = 2, RoleName = "Sale", CreatedAt = now, UpdatedAt = now },
                new() { Id = 4, Username = "guide_hung", PasswordHash = hashed, FullName = "Lê Mạnh Hùng", Email = "hung.lm@travel.com", Phone = "0904567890", RoleId = 3, RoleName = "Guide", CreatedAt = now, UpdatedAt = now },
                new() { Id = 5, Username = "guiding", PasswordHash = hashed, FullName = "Đặng Hồng Ngọc", Email = "ngoc.dh@travel.com", Phone = "0905678901", RoleId = 3, RoleName = "Guide", CreatedAt = now, UpdatedAt = now },
                new() { Id = 6, Username = "guide_tuan", PasswordHash = hashed, FullName = "Vũ Anh Tuấn", Email = "tuan.va@travel.com", Phone = "0906789012", RoleId = 3, RoleName = "Guide", CreatedAt = now, UpdatedAt = now },
                new() { Id = 7, Username = "sale_mai", PasswordHash = hashed, FullName = "Hoàng Thanh Mai", Email = "mai.ht@travel.com", Phone = "0907890123", RoleId = 2, RoleName = "Sale", CreatedAt = now, UpdatedAt = now },
                new() { Id = 8, Username = "guide_linh", PasswordHash = hashed, FullName = "Bùi Khánh Linh", Email = "linh.bk@travel.com", Phone = "0908901234", RoleId = 3, RoleName = "Guide", CreatedAt = now, UpdatedAt = now },
                new() { Id = 9, Username = "admin_dung", PasswordHash = hashed, FullName = "Ngô Tiến Dũng", Email = "dung.nt@travel.com", Phone = "0909012345", RoleId = 1, RoleName = "Admin", CreatedAt = now, UpdatedAt = now },
                new() { Id = 10, Username = "guide_son", PasswordHash = hashed, FullName = "Trịnh Công Sơn", Email = "son.tc@travel.com", Phone = "0901112223", RoleId = 3, RoleName = "Guide", CreatedAt = now, UpdatedAt = now }
            };
            await _context.Employees.InsertManyAsync(employees);
            _logger.LogInformation("Seeded {Count} employees.", employees.Count);
        }
    }

    private async Task SeedCustomersAsync()
    {
        if (await _context.Customers.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var hashed = BCrypt.Net.BCrypt.HashPassword("123456");
            var customers = new List<Customer>
            {
                new() { Id = 1, Email = "khach1@gmail.com", PasswordHash = hashed, FullName = "Nguyễn An", Phone = "0912000001", Address = "Hà Nội", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, Email = "khach2@gmail.com", PasswordHash = hashed, FullName = "Lê Thị Hoa", Phone = "0912000002", Address = "TP.HCM", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, Email = "khach3@gmail.com", PasswordHash = hashed, FullName = "Phạm Minh Tuấn", Phone = "0830907899", Address = "Đà Nẵng", CreatedAt = now, UpdatedAt = now },
                new() { Id = 4, Email = "khach4@gmail.com", PasswordHash = hashed, FullName = "Đặng Mỹ Linh", Phone = "0912000004", Address = "Cần Thơ", CreatedAt = now, UpdatedAt = now },
                new() { Id = 5, Email = "khach5@gmail.com", PasswordHash = hashed, FullName = "Bùi Quang Huy", Phone = "0912000005", Address = "Hải Phòng", CreatedAt = now, UpdatedAt = now },
                new() { Id = 6, Email = "khach6@gmail.com", PasswordHash = hashed, FullName = "Hoàng Anh Đức", Phone = "0912000006", Address = "Huế", CreatedAt = now, UpdatedAt = now },
                new() { Id = 7, Email = "khach7@gmail.com", PasswordHash = hashed, FullName = "Đỗ Kim Liên", Phone = "0912000007", Address = "Nha Trang", CreatedAt = now, UpdatedAt = now },
                new() { Id = 8, Email = "khach8@gmail.com", PasswordHash = hashed, FullName = "Lý Thanh Tùng", Phone = "0912000008", Address = "Đà Lạt", CreatedAt = now, UpdatedAt = now },
                new() { Id = 9, Email = "khach9@gmail.com", PasswordHash = hashed, FullName = "Trịnh Công Sơn", Phone = "0912000009", Address = "Vũng Tàu", CreatedAt = now, UpdatedAt = now },
                new() { Id = 10, Email = "khach10@gmail.com", PasswordHash = hashed, FullName = "Phan Bích Hà", Phone = "0912000010", Address = "Quảng Ninh", CreatedAt = now, UpdatedAt = now },
                new() { Id = 11, Email = "khach11@gmail.com", PasswordHash = hashed, FullName = "Trịnh Nam", Phone = "0912000011", Address = "Bắc Ninh", CreatedAt = now, UpdatedAt = now },
                new() { Id = 12, Email = "khach12@gmail.com", PasswordHash = hashed, FullName = "Lý Oanh", Phone = "0912000012", Address = "Bình Dương", CreatedAt = now, UpdatedAt = now }
            };
            await _context.Customers.InsertManyAsync(customers);
            _logger.LogInformation("Seeded {Count} customers.", customers.Count);
        }
    }

    private async Task SeedToursAsync()
    {
        if (await _context.Tours.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var r2Base = "https://pub-33beb9a3cd824c58a79f91874499c9b4.r2.dev/Images_Project";

            var tourDefs = new (int Id, string Title, int CatId, string CatName, int ProvId, string ProvName, int Days, int Nights, string Pickup, decimal Price, string Desc, string Itin, string Inc, string Prefix, int ThumbIdx)[]
            {
                (1, "Khám phá Vịnh Hạ Long", 1, "Tour Biển", 4, "Quảng Ninh", 2, 1, "Hà Nội", 2000000m, "Tour đưa du khách khám phá kỳ quan thiên nhiên thế giới Vịnh Hạ Long với hàng nghìn đảo đá vôi kỳ vĩ, trải nghiệm du thuyền sang trọng và thưởng thức hải sản tươi sống.", "Ngày 1: Hà Nội - Hạ Long - Tham quan hang Sửng Sốt - Tắm biển Titop. Ngày 2: Chèo kayak - Mua sắm đặc sản - Về Hà Nội.", "Xe du lịch, khách sạn 3 sao, ăn sáng, vé tham quan, hướng dẫn viên, nước suối.", "VinhHaLong", 3),
                (2, "Sapa - Thành phố trong sương", 2, "Tour Núi", 3, "Lào Cai", 3, 2, "Hà Nội", 3000000m, "Hành trình khám phá thị trấn Sapa thơ mộng với ruộng bậc thang tuyệt đẹp, bản làng dân tộc và khí hậu se lạnh đặc trưng vùng núi Tây Bắc.", "Ngày 1: Hà Nội - Sapa - Nhà thờ đá. Ngày 2: Bản Cát Cát - Fansipan. Ngày 3: Chợ Sapa - Trở về Hà Nội.", "Xe giường nằm, khách sạn, buffet sáng, vé cáp treo Fansipan, hướng dẫn viên.", "Sapa", 1),
                (3, "Hà Giang - Mùa hoa tam giác mạch", 2, "Tour Núi", 2, "Hà Giang", 4, 3, "Hà Nội", 4500000m, "Tour khám phá cao nguyên đá Đồng Văn, đèo Mã Pí Lèng và vẻ đẹp mùa hoa tam giác mạch nổi tiếng của Hà Giang.", "Ngày 1: Hà Nội - Hà Giang. Ngày 2: Quản Bạ - Yên Minh - Đồng Văn. Ngày 3: Mã Pí Lèng - Sông Nho Quế. Ngày 4: Hà Giang - Hà Nội.", "Xe du lịch, homestay, ăn uống theo chương trình, vé tham quan, bảo hiểm du lịch.", "HaGiang", 1),
                (4, "Đà Nẵng - Hội An - Bà Nà Hills", 1, "Tour Biển", 6, "Đà Nẵng", 4, 3, "Đà Nẵng", 4200000m, "Khám phá các điểm đến hot nhất miền Trung: Cầu Vàng Bà Nà Hills, phố cổ Hội An lung linh và bán đảo Sơn Trà tuyệt đẹp.", "Ngày 1: Đón khách - Bán đảo Sơn Trà - Biển Mỹ Khê. Ngày 2: Bà Nà Hills - Cầu Vàng. Ngày 3: Phố cổ Hội An. Ngày 4: Mua sắm - Tiễn sân bay.", "Khách sạn 4 sao, vé cáp treo Bà Nà, các bữa ăn chính, hướng dẫn viên.", "DaNang", 1),
                (5, "Cố đô Huế - Vẻ đẹp trầm mặc", 3, "Tour Tâm Linh", 8, "Thừa Thiên Huế", 3, 2, "Huế", 2800000m, "Thăm quần thể di tích Cố đô Huế, Đại Nội, các lăng tẩm triều Nguyễn và trải nghiệm ca Huế trên sông Hương thơ mộng.", "Ngày 1: Đại Nội Huế - Chùa Thiên Mụ. Ngày 2: Lăng Tự Đức - Lăng Khải Định - Ca Huế. Ngày 3: Chợ Đông Ba - Tiễn đoàn.", "Khách sạn 3 sao, thuyền rồng sông Hương, vé tham quan, hướng dẫn viên nhiệt tình.", "Hue", 1),
                (6, "Nha Trang - Thiên đường biển đảo", 1, "Tour Biển", 9, "Khánh Hòa", 3, 2, "Nha Trang", 3200000m, "Trải nghiệm tour 4 đảo nổi tiếng, lặn ngắm san hô, tắm bùn khoáng và thưởng thức tiệc hải sản tươi sống tại vịnh biển Nha Trang.", "Ngày 1: Đón sân bay - Tháp Bà Ponagar - Tắm bùn. Ngày 2: Tour 4 đảo - Lặn ngắm san hô - VinWonders. Ngày 3: Chợ Đầm - Tiễn khách.", "Cano cao tốc, khách sạn gần biển, vé tham quan, bảo hiểm trọn tour.", "NhaTrang", 1),
                (7, "Đà Lạt - Xứ sở ngàn hoa", 5, "Tour Nghỉ Dưỡng", 10, "Lâm Đồng", 3, 2, "Đà Lạt", 3500000m, "Thư giãn giữa không gian mát mẻ quanh năm của Đà Lạt, check-in các quán cafe triệu view, vườn hoa cẩm tú cầu và Thung lũng Tình Yêu.", "Ngày 1: Quảng trường Lâm Viên - Hồ Xuân Hương. Ngày 2: Thung lũng Tình Yêu - Đồi chè Cầu Đất. Ngày 3: Chợ Đà Lạt - Mua quà - Kết thúc tour.", "Resort 4 sao, xe đưa đón riêng, vé tham quan, bữa ăn đặc sản Đà Lạt.", "DaLat", 1),
                (8, "Phú Quốc - Đảo ngọc thiên đường", 1, "Tour Biển", 13, "Kiên Giang", 4, 3, "Phú Quốc", 5200000m, "Nghỉ dưỡng đẳng cấp tại Phú Quốc: ngắm hoàng hôn Sunset Sanato, lặn biển ngắm san hô tại hòn Thơm, vui chơi Grand World không ngủ.", "Ngày 1: Đón sân bay - Grand World. Ngày 2: Tour cano 4 đảo - Cáp treo Hòn Thơm. Ngày 3: Bãi Sao - Nhà tù Phú Quốc - Sunset Sanato. Ngày 4: Mua sắm ngọc trai - Tiễn sân bay.", "Resort ven biển, cano riêng, vé cáp treo Sun World, các bữa hải sản.", "PhuQuoc", 1),
                (9, "Miền Tây sông nước - Cần Thơ", 4, "Tour Ẩm Thực", 12, "Cần Thơ", 2, 1, "TP.HCM", 1600000m, "Hành trình khám phá chợ nổi Cái Răng tấp nập buổi sớm mai, vườn trái cây trĩu quả và thưởng thức đờn ca tài tử Nam Bộ mộc mạc.", "Ngày 1: TP.HCM - Mỹ Tho - Bến Tre - Cần Thơ - Bến Ninh Kiều. Ngày 2: Chợ nổi Cái Răng - Vườn trái cây Mỹ Khánh - Về TP.HCM.", "Xe du lịch máy lạnh, tàu du lịch, khách sạn 3 sao, ăn uống theo chương trình.", "CanTho", 5),
                (10, "Chinh phục đỉnh núi Bà Đen", 3, "Tour Tâm Linh", 15, "Tây Ninh", 1, 0, "TP.HCM", 850000m, "Hành hương chiêm bái tượng Phật Bà Tây Bổ Đà Sơn cao nhất châu Á trên đỉnh núi Bà Đen, khám phá Tòa thánh Tây Ninh uy nghiêm.", "Sáng: TP.HCM - Tây Ninh - Đi cáp treo lên đỉnh núi Bà Đen chiêm bái. Chiều: Tham quan Tòa thánh Tây Ninh - Thưởng thức bánh tráng phơi sương - Về lại TP.HCM.", "Xe đưa đón, vé cáp treo khứ hồi, buffet trưa đỉnh núi, hướng dẫn viên.", "TayNinh", 1),
                (11, "Tràng An - Bái Đính Ninh Bình", 3, "Tour Tâm Linh", 5, "Ninh Bình", 2, 1, "Hà Nội", 2100000m, "Tham quan ngôi chùa lớn nhất Đông Nam Á Bái Đính và ngồi thuyền xuôi dòng sông Sào Khê khám phá quần thể danh thắng Tràng An kỳ vĩ.", "Ngày 1: Hà Nội - Hoa Lư - Tam Cốc. Ngày 2: Chùa Bái Đính - Quần thể danh thắng Tràng An - Về Hà Nội.", "Xe limousine đón trả, khách sạn 3 sao, thuyền chèo Tràng An, ăn trưa đặc sản dê núi.", "NinhBinh", 5),
                (12, "Vũng Tàu - Biển xanh gọi mời", 1, "Tour Biển", 14, "Bà Rịa - Vũng Tàu", 2, 1, "TP.HCM", 1400000m, "Chuyến đi biển cuối tuần thú vị tại thành phố biển Vũng Tàu, check-in ngọn hải đăng cổ kính, tượng Chúa Kito và thưởng thức hải sản Bãi Sau.", "Ngày 1: TP.HCM - Vũng Tàu - Bãi Sau tắm biển - Thưởng thức bánh khọt Gốc Vú Sữa. Ngày 2: Ngọn Hải Đăng - Mũi Nghinh Phong - Về TP.HCM.", "Xe du lịch đời mới, khách sạn sát biển, ăn uống tiêu chuẩn, bảo hiểm.", "VungTau", 1),
                (13, "Hà Nội - 36 phố phường nghìn năm", 4, "Tour Ẩm Thực", 1, "Hà Nội", 1, 0, "Hà Nội", 700000m, "Dạo quanh hồ Gươm, viếng lăng Bác, khám phá nét trầm mặc của phố cổ và thưởng thức cà phê trứng, phở gia truyền Hà Nội.", "Sáng: Viếng Lăng Bác - Chùa Một Cột - Văn Miếu Quốc Tử Giám. Chiều: Hồ Hoàn Kiếm - Đền Ngọc Sơn - Xích lô dạo phố cổ - Thưởng thức ẩm thực.", "Xe đưa đón, vé tham quan, ăn trưa ẩm thực Hà Nội, xích lô phố cổ.", "HaNoi", 1),
                (14, "Khám phá đảo Cù Lao Chàm", 1, "Tour Biển", 7, "Quảng Nam", 1, 0, "Đà Nẵng", 1100000m, "Cano cao tốc đưa bạn vượt sóng ra khu dự trữ sinh quyển thế giới Cù Lao Chàm, lặn ngắm rạn san hô đầy màu sắc và ăn trưa hải sản đảo.", "07h30: Đón khách tại Đà Nẵng/Hội An ra cảng Cửa Đại. 08h30: Cano đến đảo - Thăm chùa Hải Tạng, khu bảo tồn biển. 10h30: Tắm biển, lặn ngắm san hô bãi Chồng. 12h00: Ăn trưa hải sản. 14h30: Cano đưa về đất liền.", "Cano cao tốc khứ hồi, áo phao, kính lặn san hô, ăn trưa hải sản tươi sống, phí tham quan.", "CuLaoCham", 1),
                (15, "Hành trình di sản miền Trung", 3, "Tour Tâm Linh", 6, "Đà Nẵng", 5, 4, "Đà Nẵng", 6800000m, "Chuyến xuyên Việt mini nối liền các di sản văn hóa thế giới: Cố đô Huế, phố cổ Hội An, thánh địa Mỹ Sơn và thành phố biển Đà Nẵng.", "Ngày 1: Đà Nẵng - Bán đảo Sơn Trà - Ngũ Hành Sơn. Ngày 2: Bà Nà Hills - Cầu Vàng - Phố cổ Hội An. Ngày 3: Thánh địa Mỹ Sơn - Huế. Ngày 4: Đại Nội Huế - Chùa Thiên Mụ - Lăng Khải Định. Ngày 5: Chợ Đông Ba - Mua quà lưu niệm - Tiễn khách.", "Khách sạn 4 sao suốt tuyến, vé tham quan toàn bộ các điểm, xe đưa đón chất lượng cao, các bữa ăn đặc sản từng vùng.", "DSMienTrung", 1)
            };

            var tours = new List<Tour>();
            foreach (var d in tourDefs)
            {
                var tour = new Tour
                {
                    Id = d.Id,
                    Title = d.Title,
                    CategoryId = d.CatId,
                    CategoryName = d.CatName,
                    ProvinceId = d.ProvId,
                    ProvinceName = d.ProvName,
                    DurationDays = d.Days,
                    DurationNights = d.Nights,
                    PickupPoint = d.Pickup,
                    MinPrice = d.Price,
                    Description = d.Desc,
                    ItinerarySummary = d.Itin,
                    IncludedServices = d.Inc,
                    CreatedBy = 1,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                // Add 5 images
                for (int i = 1; i <= 5; i++)
                {
                    var isThumb = (i == d.ThumbIdx);
                    var imgUrl = $"{r2Base}/{d.Prefix}{i}.jpg";
                    tour.Images.Add(new TourImageEmbedded
                    {
                        Id = (d.Id - 1) * 5 + i,
                        ImgUrl = imgUrl,
                        IsThumbnail = isThumb
                    });

                    if (isThumb)
                    {
                        tour.ThumbnailUrl = imgUrl;
                    }
                }

                // Add schedules based on duration
                for (int day = 1; day <= d.Days; day++)
                {
                    tour.Schedules.Add(new TourScheduleEmbedded
                    {
                        Id = (d.Id - 1) * 10 + day,
                        DayNumber = day,
                        Title = $"Ngày {day}: Khám phá điểm đến nổi bật",
                        Activities = $"Hoạt động tham quan, trải nghiệm văn hóa, ẩm thực đặc sắc của ngày thứ {day}."
                    });
                }

                tours.Add(tour);
            }

            await _context.Tours.InsertManyAsync(tours);
            _logger.LogInformation("Seeded {Count} tours with embedded images and schedules.", tours.Count);
        }
    }

    private async Task SeedDeparturesAsync()
    {
        if (await _context.TourDepartures.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var departures = new List<TourDeparture>
            {
                new() { Id = 1, TourId = 1, TourTitle = "Khám phá Vịnh Hạ Long", DepartureDate = new DateTime(2026, 6, 1), ReturnDate = new DateTime(2026, 6, 2), MaxSeats = 20, AvailableSeats = 15, AdultPrice = 2500000m, ChildPrice = 1500000m, GuideId = 4, GuideName = "Lê Mạnh Hùng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, TourId = 1, TourTitle = "Khám phá Vịnh Hạ Long", DepartureDate = new DateTime(2026, 6, 15), ReturnDate = new DateTime(2026, 6, 16), MaxSeats = 20, AvailableSeats = 20, AdultPrice = 2500000m, ChildPrice = 1500000m, GuideId = 5, GuideName = "Đặng Hồng Ngọc", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, TourId = 2, TourTitle = "Sapa - Thành phố trong sương", DepartureDate = new DateTime(2026, 6, 10), ReturnDate = new DateTime(2026, 6, 12), MaxSeats = 15, AvailableSeats = 10, AdultPrice = 3200000m, ChildPrice = 2100000m, GuideId = 6, GuideName = "Vũ Anh Tuấn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 4, TourId = 2, TourTitle = "Sapa - Thành phố trong sương", DepartureDate = new DateTime(2026, 6, 25), ReturnDate = new DateTime(2026, 6, 27), MaxSeats = 15, AvailableSeats = 15, AdultPrice = 3200000m, ChildPrice = 2100000m, GuideId = 6, GuideName = "Vũ Anh Tuấn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 5, TourId = 3, TourTitle = "Hà Giang - Mùa hoa tam giác mạch", DepartureDate = new DateTime(2026, 7, 5), ReturnDate = new DateTime(2026, 7, 8), MaxSeats = 12, AvailableSeats = 5, AdultPrice = 4800000m, ChildPrice = 3200000m, GuideId = 7, GuideName = "Hoàng Thanh Mai", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 6, TourId = 3, TourTitle = "Hà Giang - Mùa hoa tam giác mạch", DepartureDate = new DateTime(2026, 7, 20), ReturnDate = new DateTime(2026, 7, 23), MaxSeats = 12, AvailableSeats = 12, AdultPrice = 4800000m, ChildPrice = 3200000m, GuideId = 4, GuideName = "Lê Mạnh Hùng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 7, TourId = 4, TourTitle = "Đà Nẵng - Hội An - Bà Nà Hills", DepartureDate = new DateTime(2026, 7, 1), ReturnDate = new DateTime(2026, 7, 4), MaxSeats = 30, AvailableSeats = 2, AdultPrice = 4500000m, ChildPrice = 3000000m, GuideId = 8, GuideName = "Bùi Khánh Linh", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 8, TourId = 4, TourTitle = "Đà Nẵng - Hội An - Bà Nà Hills", DepartureDate = new DateTime(2026, 7, 15), ReturnDate = new DateTime(2026, 7, 18), MaxSeats = 30, AvailableSeats = 25, AdultPrice = 4500000m, ChildPrice = 3000000m, GuideId = 9, GuideName = "Ngô Tiến Dũng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 9, TourId = 5, TourTitle = "Cố đô Huế - Vẻ đẹp trầm mặc", DepartureDate = new DateTime(2026, 6, 12), ReturnDate = new DateTime(2026, 6, 14), MaxSeats = 20, AvailableSeats = 18, AdultPrice = 2900000m, ChildPrice = 1900000m, GuideId = 5, GuideName = "Đặng Hồng Ngọc", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 10, TourId = 5, TourTitle = "Cố đô Huế - Vẻ đẹp trầm mặc", DepartureDate = new DateTime(2026, 6, 26), ReturnDate = new DateTime(2026, 6, 28), MaxSeats = 20, AvailableSeats = 20, AdultPrice = 2900000m, ChildPrice = 1900000m, GuideId = 10, GuideName = "Trịnh Công Sơn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 11, TourId = 6, TourTitle = "Nha Trang - Thiên đường biển đảo", DepartureDate = new DateTime(2026, 8, 1), ReturnDate = new DateTime(2026, 8, 3), MaxSeats = 25, AvailableSeats = 20, AdultPrice = 3500000m, ChildPrice = 2400000m, GuideId = 7, GuideName = "Hoàng Thanh Mai", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 12, TourId = 6, TourTitle = "Nha Trang - Thiên đường biển đảo", DepartureDate = new DateTime(2026, 8, 10), ReturnDate = new DateTime(2026, 8, 12), MaxSeats = 25, AvailableSeats = 25, AdultPrice = 3500000m, ChildPrice = 2400000m, GuideId = 8, GuideName = "Bùi Khánh Linh", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 13, TourId = 7, TourTitle = "Đà Lạt - Xứ sở ngàn hoa", DepartureDate = new DateTime(2026, 6, 20), ReturnDate = new DateTime(2026, 6, 22), MaxSeats = 25, AvailableSeats = 0, AdultPrice = 3800000m, ChildPrice = 2500000m, GuideId = 10, GuideName = "Trịnh Công Sơn", Status = "full", CreatedAt = now, UpdatedAt = now },
                new() { Id = 14, TourId = 7, TourTitle = "Đà Lạt - Xứ sở ngàn hoa", DepartureDate = new DateTime(2026, 7, 5), ReturnDate = new DateTime(2026, 7, 7), MaxSeats = 25, AvailableSeats = 10, AdultPrice = 3800000m, ChildPrice = 2500000m, GuideId = 4, GuideName = "Lê Mạnh Hùng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 15, TourId = 8, TourTitle = "Phú Quốc - Đảo ngọc thiên đường", DepartureDate = new DateTime(2026, 8, 5), ReturnDate = new DateTime(2026, 8, 8), MaxSeats = 20, AvailableSeats = 8, AdultPrice = 5500000m, ChildPrice = 3800000m, GuideId = 6, GuideName = "Vũ Anh Tuấn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 16, TourId = 8, TourTitle = "Phú Quốc - Đảo ngọc thiên đường", DepartureDate = new DateTime(2026, 8, 20), ReturnDate = new DateTime(2026, 8, 23), MaxSeats = 20, AvailableSeats = 20, AdultPrice = 5500000m, ChildPrice = 3800000m, GuideId = 9, GuideName = "Ngô Tiến Dũng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 17, TourId = 9, TourTitle = "Miền Tây sông nước - Cần Thơ", DepartureDate = new DateTime(2026, 6, 5), ReturnDate = new DateTime(2026, 6, 6), MaxSeats = 30, AvailableSeats = 12, AdultPrice = 1800000m, ChildPrice = 1200000m, GuideId = 5, GuideName = "Đặng Hồng Ngọc", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 18, TourId = 9, TourTitle = "Miền Tây sông nước - Cần Thơ", DepartureDate = new DateTime(2026, 6, 19), ReturnDate = new DateTime(2026, 6, 20), MaxSeats = 30, AvailableSeats = 30, AdultPrice = 1800000m, ChildPrice = 1200000m, GuideId = 8, GuideName = "Bùi Khánh Linh", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 19, TourId = 10, TourTitle = "Chinh phục đỉnh núi Bà Đen", DepartureDate = new DateTime(2026, 6, 1), ReturnDate = new DateTime(2026, 6, 1), MaxSeats = 40, AvailableSeats = 5, AdultPrice = 900000m, ChildPrice = 600000m, GuideId = 10, GuideName = "Trịnh Công Sơn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 20, TourId = 10, TourTitle = "Chinh phục đỉnh núi Bà Đen", DepartureDate = new DateTime(2026, 6, 7), ReturnDate = new DateTime(2026, 6, 7), MaxSeats = 40, AvailableSeats = 35, AdultPrice = 900000m, ChildPrice = 600000m, GuideId = 4, GuideName = "Lê Mạnh Hùng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 21, TourId = 11, TourTitle = "Tràng An - Bái Đính Ninh Bình", DepartureDate = new DateTime(2026, 7, 10), ReturnDate = new DateTime(2026, 7, 11), MaxSeats = 20, AvailableSeats = 15, AdultPrice = 2200000m, ChildPrice = 1400000m, GuideId = 6, GuideName = "Vũ Anh Tuấn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 22, TourId = 11, TourTitle = "Tràng An - Bái Đính Ninh Bình", DepartureDate = new DateTime(2026, 7, 24), ReturnDate = new DateTime(2026, 7, 25), MaxSeats = 20, AvailableSeats = 20, AdultPrice = 2200000m, ChildPrice = 1400000m, GuideId = 7, GuideName = "Hoàng Thanh Mai", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 23, TourId = 12, TourTitle = "Vũng Tàu - Biển xanh gọi mời", DepartureDate = new DateTime(2026, 6, 13), ReturnDate = new DateTime(2026, 6, 14), MaxSeats = 35, AvailableSeats = 30, AdultPrice = 1500000m, ChildPrice = 1000000m, GuideId = 9, GuideName = "Ngô Tiến Dũng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 24, TourId = 12, TourTitle = "Vũng Tàu - Biển xanh gọi mời", DepartureDate = new DateTime(2026, 6, 27), ReturnDate = new DateTime(2026, 6, 28), MaxSeats = 35, AvailableSeats = 35, AdultPrice = 1500000m, ChildPrice = 1000000m, GuideId = 5, GuideName = "Đặng Hồng Ngọc", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 25, TourId = 13, TourTitle = "Hà Nội - 36 phố phường nghìn năm", DepartureDate = new DateTime(2026, 6, 2), ReturnDate = new DateTime(2026, 6, 2), MaxSeats = 15, AvailableSeats = 2, AdultPrice = 750000m, ChildPrice = 500000m, GuideId = 6, GuideName = "Vũ Anh Tuấn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 26, TourId = 13, TourTitle = "Hà Nội - 36 phố phường nghìn năm", DepartureDate = new DateTime(2026, 6, 9), ReturnDate = new DateTime(2026, 6, 9), MaxSeats = 15, AvailableSeats = 12, AdultPrice = 750000m, ChildPrice = 500000m, GuideId = 10, GuideName = "Trịnh Công Sơn", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 27, TourId = 14, TourTitle = "Khám phá đảo Cù Lao Chàm", DepartureDate = new DateTime(2026, 7, 2), ReturnDate = new DateTime(2026, 7, 2), MaxSeats = 25, AvailableSeats = 10, AdultPrice = 1200000m, ChildPrice = 850000m, GuideId = 8, GuideName = "Bùi Khánh Linh", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 28, TourId = 14, TourTitle = "Khám phá đảo Cù Lao Chàm", DepartureDate = new DateTime(2026, 7, 16), ReturnDate = new DateTime(2026, 7, 16), MaxSeats = 25, AvailableSeats = 25, AdultPrice = 1200000m, ChildPrice = 850000m, GuideId = 4, GuideName = "Lê Mạnh Hùng", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 29, TourId = 15, TourTitle = "Hành trình di sản miền Trung", DepartureDate = new DateTime(2026, 8, 1), ReturnDate = new DateTime(2026, 8, 5), MaxSeats = 15, AvailableSeats = 4, AdultPrice = 7200000m, ChildPrice = 4900000m, GuideId = 7, GuideName = "Hoàng Thanh Mai", Status = "open", CreatedAt = now, UpdatedAt = now },
                new() { Id = 30, TourId = 15, TourTitle = "Hành trình di sản miền Trung", DepartureDate = new DateTime(2026, 8, 15), ReturnDate = new DateTime(2026, 8, 19), MaxSeats = 15, AvailableSeats = 15, AdultPrice = 7200000m, ChildPrice = 4900000m, GuideId = 6, GuideName = "Vũ Anh Tuấn", Status = "open", CreatedAt = now, UpdatedAt = now }
            };
            await _context.TourDepartures.InsertManyAsync(departures);
            _logger.LogInformation("Seeded {Count} departures.", departures.Count);
        }
    }

    private async Task SeedBookingsAsync()
    {
        if (await _context.Bookings.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var bookings = new List<Booking>
            {
                new()
                {
                    Id = 1, BookingCode = "BK001", CustomerId = 1, CustomerName = "Nguyễn An", DepartureId = 1, TourId = 1, TourTitle = "Khám phá Vịnh Hạ Long", TotalAdults = 2, TotalChildren = 1, TotalAmount = 6500000m, Status = "confirmed", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 1, FullName = "Nguyễn An", PassengerType = "adult", IdCard = "001200000001", DateOfBirth = new DateTime(1990, 1, 15) },
                        new() { Id = 2, FullName = "Trần Thị Mai", PassengerType = "adult", IdCard = "001200000002", DateOfBirth = new DateTime(1992, 5, 20) },
                        new() { Id = 3, FullName = "Nguyễn Gia Bảo", PassengerType = "child", IdCard = null, DateOfBirth = new DateTime(2018, 9, 10) }
                    }
                },
                new()
                {
                    Id = 2, BookingCode = "BK002", CustomerId = 2, CustomerName = "Lê Thị Hoa", DepartureId = 3, TourId = 2, TourTitle = "Sapa - Thành phố trong sương", TotalAdults = 2, TotalChildren = 1, TotalAmount = 6400000m, Status = "pending", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 4, FullName = "Lê Thị Hoa", PassengerType = "adult", IdCard = "079200000001", DateOfBirth = new DateTime(1988, 3, 12) },
                        new() { Id = 5, FullName = "Phạm Quốc Dũng", PassengerType = "adult", IdCard = "079200000002", DateOfBirth = new DateTime(1985, 7, 24) },
                        new() { Id = 6, FullName = "Phạm Ngọc Hân", PassengerType = "child", IdCard = null, DateOfBirth = new DateTime(2019, 11, 5) }
                    }
                },
                new()
                {
                    Id = 3, BookingCode = "BK003", CustomerId = 3, CustomerName = "Phạm Minh Tuấn", DepartureId = 4, TourId = 2, TourTitle = "Sapa - Thành phố trong sương", TotalAdults = 2, TotalChildren = 0, TotalAmount = 8000000m, Status = "confirmed", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 7, FullName = "Phạm Minh Tuấn", PassengerType = "adult", IdCard = "048200000001", DateOfBirth = new DateTime(1993, 8, 19) },
                        new() { Id = 8, FullName = "Đỗ Thùy Trang", PassengerType = "adult", IdCard = "048200000002", DateOfBirth = new DateTime(1995, 12, 30) }
                    }
                },
                new()
                {
                    Id = 4, BookingCode = "BK004", CustomerId = 4, CustomerName = "Đặng Mỹ Linh", DepartureId = 2, TourId = 1, TourTitle = "Khám phá Vịnh Hạ Long", TotalAdults = 2, TotalChildren = 2, TotalAmount = 12500000m, Status = "confirmed", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 9, FullName = "Đặng Mỹ Linh", PassengerType = "adult", IdCard = "092200000001", DateOfBirth = new DateTime(1991, 4, 18) },
                        new() { Id = 10, FullName = "Vũ Đình Trọng", PassengerType = "adult", IdCard = "092200000002", DateOfBirth = new DateTime(1989, 9, 9) }
                    }
                },
                new()
                {
                    Id = 5, BookingCode = "BK005", CustomerId = 5, CustomerName = "Bùi Quang Huy", DepartureId = 5, TourId = 3, TourTitle = "Hà Giang - Mùa hoa tam giác mạch", TotalAdults = 1, TotalChildren = 0, TotalAmount = 3200000m, Status = "confirmed", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 11, FullName = "Bùi Quang Huy", PassengerType = "adult", IdCard = "031200000001", DateOfBirth = new DateTime(1996, 6, 25) }
                    }
                },
                new()
                {
                    Id = 6, BookingCode = "BK006", CustomerId = 6, CustomerName = "Hoàng Anh Đức", DepartureId = 1, TourId = 1, TourTitle = "Khám phá Vịnh Hạ Long", TotalAdults = 2, TotalChildren = 0, TotalAmount = 7000000m, Status = "cancelled", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 12, FullName = "Hoàng Anh Đức", PassengerType = "adult", IdCard = "046200000001", DateOfBirth = new DateTime(1992, 10, 14) }
                    }
                },
                new()
                {
                    Id = 7, BookingCode = "BK007", CustomerId = 7, CustomerName = "Đỗ Kim Liên", DepartureId = 3, TourId = 2, TourTitle = "Sapa - Thành phố trong sương", TotalAdults = 2, TotalChildren = 0, TotalAmount = 6800000m, Status = "confirmed", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 13, FullName = "Đỗ Kim Liên", PassengerType = "adult", IdCard = "056200000001", DateOfBirth = new DateTime(1994, 2, 28) }
                    }
                },
                new()
                {
                    Id = 8, BookingCode = "BK008", CustomerId = 8, CustomerName = "Lý Thanh Tùng", DepartureId = 4, TourId = 2, TourTitle = "Sapa - Thành phố trong sương", TotalAdults = 1, TotalChildren = 1, TotalAmount = 5500000m, Status = "pending", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 14, FullName = "Lý Thanh Tùng", PassengerType = "adult", IdCard = "068200000001", DateOfBirth = new DateTime(1987, 8, 8) }
                    }
                },
                new()
                {
                    Id = 9, BookingCode = "BK009", CustomerId = 9, CustomerName = "Trịnh Công Sơn", DepartureId = 2, TourId = 1, TourTitle = "Khám phá Vịnh Hạ Long", TotalAdults = 1, TotalChildren = 0, TotalAmount = 4200000m, Status = "confirmed", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 15, FullName = "Trịnh Công Sơn", PassengerType = "adult", IdCard = "077200000001", DateOfBirth = new DateTime(1995, 11, 11) }
                    }
                },
                new()
                {
                    Id = 10, BookingCode = "BK010", CustomerId = 10, CustomerName = "Phan Bích Hà", DepartureId = 5, TourId = 3, TourTitle = "Hà Giang - Mùa hoa tam giác mạch", TotalAdults = 1, TotalChildren = 2, TotalAmount = 9000000m, Status = "confirmed", CreatedAt = now, UpdatedAt = now,
                    Passengers = new List<BookingPassengerEmbedded>
                    {
                        new() { Id = 16, FullName = "Phan Bích Hà", PassengerType = "adult", IdCard = "022200000001", DateOfBirth = new DateTime(1986, 5, 16) }
                    }
                }
            };

            await _context.Bookings.InsertManyAsync(bookings);
            _logger.LogInformation("Seeded {Count} bookings with embedded passengers.", bookings.Count);
        }
    }

    private async Task SeedPaymentsAsync()
    {
        if (await _context.Payments.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var payments = new List<Payment>
            {
                new() { Id = 1, BookingId = 1, Amount = 6500000m, PaymentMethod = "Chuyển khoản", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, BookingId = 3, Amount = 8000000m, PaymentMethod = "Tiền mặt", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, BookingId = 4, Amount = 12500000m, PaymentMethod = "Thẻ tín dụng", CreatedAt = now, UpdatedAt = now },
                new() { Id = 4, BookingId = 5, Amount = 3200000m, PaymentMethod = "Chuyển khoản", CreatedAt = now, UpdatedAt = now },
                new() { Id = 5, BookingId = 7, Amount = 6800000m, PaymentMethod = "Ví điện tử Momo", CreatedAt = now, UpdatedAt = now },
                new() { Id = 6, BookingId = 9, Amount = 4200000m, PaymentMethod = "Thẻ ghi nợ", CreatedAt = now, UpdatedAt = now },
                new() { Id = 7, BookingId = 10, Amount = 9000000m, PaymentMethod = "Chuyển khoản", CreatedAt = now, UpdatedAt = now }
            };
            await _context.Payments.InsertManyAsync(payments);
            _logger.LogInformation("Seeded {Count} payments.", payments.Count);
        }
    }

    private async Task SeedBillsAsync()
    {
        if (await _context.Bills.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var bills = new List<Bill>
            {
                new() { Id = 1, BillNumber = "INV-001", BookingId = 1, EmployeeId = 2, FinalAmount = 6500000m, CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, BillNumber = "INV-003", BookingId = 3, EmployeeId = 3, FinalAmount = 8000000m, CreatedAt = now, UpdatedAt = now }
            };
            await _context.Bills.InsertManyAsync(bills);
            _logger.LogInformation("Seeded {Count} bills.", bills.Count);
        }
    }

    private async Task SeedReviewsAsync()
    {
        if (await _context.Reviews.CountDocumentsAsync(_ => true) == 0)
        {
            var now = DateTime.UtcNow;
            var reviews = new List<Review>
            {
                new() { Id = 1, TourId = 1, CustomerId = 1, CustomerName = "Nguyễn An", Rating = 4, Comment = "Chuyến đi rất vui, du thuyền đẹp và sạch sẽ. Đồ ăn hải sản tươi ngon nhưng lịch trình ngày đầu hơi dày.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 2, TourId = 1, CustomerId = 2, CustomerName = "Lê Thị Hoa", Rating = 5, Comment = "Hướng dẫn viên nhiệt tình, cảnh Vịnh Hạ Long thì không có gì để chê. Khách sạn 3 sao ở mức ổn, phòng ốc sạch sẽ.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 3, TourId = 1, CustomerId = 3, CustomerName = "Phạm Minh Tuấn", Rating = 5, Comment = "Gia đình mình có trải nghiệm rất tốt, các bé nhà mình cực kỳ thích hoạt động chèo thuyền kayak.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 4, TourId = 1, CustomerId = 4, CustomerName = "Đặng Mỹ Linh", Rating = 4, Comment = "Phong cảnh Vịnh Hạ Long rất đẹp, tuy nhiên hôm mình đi trời hơi mưa nhẹ. Bù lại HDV xử lý tình huống linh hoạt.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 5, TourId = 1, CustomerId = 5, CustomerName = "Bùi Quang Huy", Rating = 5, Comment = "Dịch vụ xe đưa đón đón đúng giờ, tài xế lái xe an toàn. Đoàn ghép rất vui vẻ, phòng khách sạn sạch sẽ.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 6, TourId = 2, CustomerId = 3, CustomerName = "Phạm Minh Tuấn", Rating = 5, Comment = "Tour Sapa quá hời vì có sẵn vé Fansipan rồi. Khách sạn view núi siêu đẹp, buổi tối đi dạo nhà thờ đá rất thích.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 7, TourId = 2, CustomerId = 4, CustomerName = "Đặng Mỹ Linh", Rating = 4, Comment = "Xe giường nằm êm, dịch vụ tốt. Tuy nhiên Sapa dịp này hơi đông đúc nên xếp hàng chờ cáp treo hơi lâu.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 8, TourId = 3, CustomerId = 5, CustomerName = "Bùi Quang Huy", Rating = 5, Comment = "Cảnh sắc Hà Giang quá hùng vĩ, hoa tam giác mạch nở đẹp lắm. Homestay sạch sẽ, chủ nhà thân thiện mến khách.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 9, TourId = 3, CustomerId = 6, CustomerName = "Hoàng Anh Đức", Rating = 4, Comment = "Đường đèo dốc quanh co ai say xe nên cân nhắc kỹ. Bù lại HDV lái xe và thuyết minh rất chuyên nghiệp, chụp ảnh có tâm.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 10, TourId = 4, CustomerId = 7, CustomerName = "Đỗ Kim Liên", Rating = 5, Comment = "Dịch vụ tuyệt vời! Khách sạn 4 sao ngay gần biển Mỹ Khê, buffet sáng ngon miệng. Đi Bà Nà Hills chụp được rất nhiều ảnh đẹp.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 11, TourId = 4, CustomerId = 8, CustomerName = "Lý Thanh Tùng", Rating = 5, Comment = "Lịch trình hợp lý, không bị mệt. Phố cổ Hội An về đêm lung linh lắm. Rất hài lòng với công ty du lịch.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 12, TourId = 5, CustomerId = 9, CustomerName = "Trịnh Công Sơn", Rating = 4, Comment = "Đại Nội Huế cổ kính và uy nghiêm, nghe hướng dẫn viên thuyết minh về lịch sử rất cuốn hút.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 13, TourId = 5, CustomerId = 10, CustomerName = "Phan Bích Hà", Rating = 4, Comment = "Chuyến đi yên bình, phù hợp với ai thích lịch sử. Vé vào cổng di tích đã bao gồm hết.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 14, TourId = 6, CustomerId = 1, CustomerName = "Nguyễn An", Rating = 5, Comment = "Đi tour 4 đảo lặn ngắm san hô siêu vui, nước biển trong vắt. Khách sạn gần biển đi bộ vài bước là tới. Đánh giá 5 sao!", CreatedAt = now, UpdatedAt = now },
                new() { Id = 15, TourId = 6, CustomerId = 2, CustomerName = "Lê Thị Hoa", Rating = 4, Comment = "Giá cả hợp lý, tàu đi đảo an toàn. Ngày cuối đi chợ Đầm mua hải sản khô hơi vội, ước gì tour dài hơn 1 ngày.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 16, TourId = 7, CustomerId = 3, CustomerName = "Phạm Minh Tuấn", Rating = 5, Comment = "Thời tiết Đà Lạt mát mẻ, Thung lũng Tình Yêu lãng mạn. Khách sạn trung tâm tiện đi bộ ra hồ Xuân Hương và chợ đêm.", CreatedAt = now, UpdatedAt = now },
                new() { Id = 17, TourId = 7, CustomerId = 4, CustomerName = "Đặng Mỹ Linh", Rating = 4, Comment = "Tour đi các điểm check-in đẹp nhưng một số điểm hơi đông người. Hướng dẫn viên vui tính.", CreatedAt = now, UpdatedAt = now }
            };
            await _context.Reviews.InsertManyAsync(reviews);
            _logger.LogInformation("Seeded {Count} reviews.", reviews.Count);
        }
    }

    private async Task InitializeCountersAsync()
    {
        var counters = new[]
        {
            ("roles", 3),
            ("tour_categories", 5),
            ("provinces", 15),
            ("employees", 10),
            ("customers", 12),
            ("tours", 15),
            ("tour_departures", 30),
            ("bookings", 10),
            ("payments", 7),
            ("bills", 2),
            ("reviews", 17),
            ("schedules", 150),
            ("images", 75),
            ("passengers", 20)
        };

        foreach (var (name, value) in counters)
        {
            var filter = Builders<Counter>.Filter.Eq(c => c.Id, name);
            var existing = await _context.Counters.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
            {
                await _context.Counters.InsertOneAsync(new Counter { Id = name, SequenceValue = value });
            }
            else if (existing.SequenceValue < value)
            {
                await _context.Counters.UpdateOneAsync(filter, Builders<Counter>.Update.Set(c => c.SequenceValue, value));
            }
        }
    }
}

