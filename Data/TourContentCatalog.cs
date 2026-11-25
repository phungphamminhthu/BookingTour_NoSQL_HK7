using Backend_DotNet.Models;

namespace Backend_DotNet.Data;

// Nội dung chương trình do đồ án thiết kế, không phải cam kết của một hãng lữ hành.
// Dùng khi tạo database mới hoặc chạy chủ động --refresh-tour-content cho dữ liệu cũ.
public static class TourContentCatalog
{
    public record Day(string Title, string Activities);
    public record Content(int Id, string Title, string Description, string Transport,
        string Accommodation, string IncludedServices, string ExcludedServices, Day[] Days);

    public static void Apply(Tour tour, Content content)
    {
        var previousSchedules = tour.Schedules;
        tour.Description = content.Description;
        tour.Language = "Tiếng Việt";
        tour.Transport = content.Transport;
        tour.Accommodation = content.Accommodation;
        tour.IncludedServices = content.IncludedServices;
        tour.ExcludedServices = content.ExcludedServices;
        tour.ItinerarySummary = string.Join("\n", content.Days.Select((day, i) => $"Ngày {i + 1}: {day.Title}."));
        // Lịch trình nhúng thuộc document tour; giữ ID các ngày đã tồn tại để admin sửa tiếp.
        tour.Schedules = content.Days.Select((day, i) => new TourScheduleEmbedded
        {
            Id = previousSchedules.FirstOrDefault(s => s.DayNumber == i + 1)?.Id ?? (tour.Id - 1) * 10 + i + 1,
            DayNumber = i + 1,
            Title = day.Title,
            Activities = day.Activities
        }).ToList();
    }

    public static readonly IReadOnlyList<Content> All = new Content[]
    {
        new(1, "Khám phá Vịnh Hạ Long",
            "Hành trình 2 ngày 1 đêm từ Hà Nội đến Hạ Long, kết hợp du thuyền ban ngày trên vịnh, khám phá hang Sửng Sốt, đảo Ti Tốp và trải nghiệm văn hóa làng chài tại Bảo tàng Quảng Ninh. Đoàn nghỉ một đêm tại khách sạn khu vực Bãi Cháy; không ngủ đêm trên tàu.",
            "Xe du lịch máy lạnh Hà Nội – Hạ Long; tàu tham quan vịnh ban ngày",
            "1 đêm khách sạn 3 sao tại Bãi Cháy; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đưa đón tại Nhà hát Lớn Hà Nội và di chuyển theo lịch trình.\nTàu tham quan vịnh, vé hang Sửng Sốt, đảo Ti Tốp và Bảo tàng Quảng Ninh.\n1 đêm khách sạn 3 sao, 1 bữa sáng, 2 bữa trưa và 1 bữa tối; bữa chính 150.000đ/khách.\nHướng dẫn viên tiếng Việt; 1 chai nước 500ml/khách/ngày; bảo hiểm du lịch tối đa 20 triệu đồng/khách/vụ.",
            "Phụ thu phòng đơn 400.000đ/đêm.\nChèo kayak tự chọn, đồ uống gọi thêm và mua hải sản mang về.\nGiặt ủi, minibar và tiền bồi dưỡng tự nguyện cho tài xế, hướng dẫn viên.",
            new Day[]
            {
                new("Hà Nội – du thuyền vịnh Hạ Long – Sửng Sốt – Ti Tốp", "07:45 Tập trung tại Nhà hát Lớn Hà Nội; 08:00 khởi hành, dừng nghỉ trên cao tốc.\n11:30 Đến cảng Tuần Châu, lên tàu và dùng bữa trưa hải sản.\n13:00–16:30 Tham quan hang Sửng Sốt, đi bộ lên điểm ngắm vịnh hoặc tắm biển tại đảo Ti Tốp; mặc áo phao khi di chuyển bằng xuồng.\n17:00 Tàu về cảng, xe đưa đoàn nhận phòng tại Bãi Cháy. 18:30 Ăn tối, tự do dạo biển; nghỉ đêm tại khách sạn."),
                new("Bảo tàng Quảng Ninh – chợ Hạ Long – trở về Hà Nội", "07:00 Ăn sáng tại khách sạn, thu xếp hành lý.\n08:30 Tham quan Bảo tàng Quảng Ninh, tìm hiểu nghề khai thác than và đời sống ngư dân. 10:00 Mua sắm tại chợ Hạ Long, chi phí mua hàng tự túc.\n11:30 Trả phòng, ăn trưa với chả mực và món địa phương.\n13:30 Xe trở về Hà Nội, dừng nghỉ dọc đường; dự kiến 17:00–18:00 trả khách tại điểm đón, kết thúc chương trình.")
            }),
        new(2, "Sapa - Thành phố trong sương",
            "Khám phá Sa Pa trong 3 ngày 2 đêm với bản Cát Cát, đỉnh Fansipan và nét sinh hoạt của đồng bào vùng cao. Lịch trình dành thời gian đi bộ tại bản, nghỉ ngơi giữa các chặng; cáp treo Fansipan đã nằm trong gói dịch vụ, tàu leo núi đỉnh cao tự chọn.",
            "Xe giường nằm Hà Nội – Sa Pa khứ hồi; xe trung chuyển tại Sa Pa; cáp treo Fansipan",
            "2 đêm khách sạn 3 sao ở trung tâm Sa Pa; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe giường nằm khứ hồi, đón tại khu vực Trần Quang Khải, Hoàn Kiếm; xe tham quan tại Sa Pa.\n2 đêm khách sạn 3 sao; 2 bữa sáng và 5 bữa chính, 150.000đ/khách/bữa chính.\nVé bản Cát Cát, cáp treo Fansipan khứ hồi và xe đưa đón ga cáp treo.\nHướng dẫn viên tiếng Việt, nước uống 500ml/ngày và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Phụ thu phòng đơn 350.000đ/đêm.\nTàu hỏa leo núi Mường Hoa, tàu leo núi lên đỉnh Fansipan và xe ôm trong bản.\nThuê trang phục dân tộc, tắm lá thuốc, đồ uống và các bữa ăn ngoài 5 bữa chính đã nêu.",
            new Day[]
            {
                new("Hà Nội – Sa Pa – nhà thờ đá", "07:45 Có mặt tại điểm đón Trần Quang Khải, Hà Nội; 08:00 đi Sa Pa bằng xe giường nằm. Nghỉ dọc đường và dùng bữa trưa tại trạm dừng.\n15:00 Đến Sa Pa, nhận phòng và nghỉ ngơi sau chặng đường dài.\n16:30 Đi bộ quanh quảng trường, tham quan bên ngoài nhà thờ đá, tìm hiểu sinh hoạt thị trấn.\n18:30 Ăn tối với cá suối, rau ôn đới; tự do dạo phố, nghỉ đêm tại Sa Pa."),
                new("Bản Cát Cát – cáp treo Fansipan", "07:00 Ăn sáng. 08:00 Xe đưa đoàn đến bản Cát Cát, đi bộ qua các nếp nhà, thác nước và khu nghề thủ công; mang giày chống trượt.\n11:30 Ăn trưa tại nhà hàng, nghỉ khoảng một giờ.\n13:00 Đến ga cáp treo Fansipan, lên khu quần thể tâm linh và điểm ngắm núi; đoạn lên đỉnh đi bộ, tàu leo núi tự túc nếu sử dụng.\n17:00 Về khách sạn nghỉ ngơi. 18:30 Ăn tối với lẩu cá hồi, nghỉ đêm tại Sa Pa."),
                new("Chợ Sa Pa – mua đặc sản – Hà Nội", "07:00 Ăn sáng và chuẩn bị hành lý.\n08:00 Dạo chợ Sa Pa, tìm hiểu sản vật vùng cao; thời gian tự do mua thổ cẩm, trà và nông sản.\n10:30 Trả phòng, dùng bữa trưa sớm. 11:30 Khởi hành về Hà Nội, nghỉ tại trạm dừng trên cao tốc.\nDự kiến 18:00 đến điểm đón ban đầu tại Hà Nội, hướng dẫn viên bàn giao hành lý và kết thúc tour.")
            }),
        new(3, "Hà Giang - Mùa hoa tam giác mạch",
            "Cung đường 4 ngày 3 đêm từ Hà Nội qua Quản Bạ, Yên Minh, phố cổ Đồng Văn, đèo Mã Pí Lèng và sông Nho Quế. Các điểm dừng ngắm hoa được bố trí tại khu vực Sủng Là; hoa nở theo mùa, ngoài mùa hoa đoàn vẫn tham quan cảnh quan cao nguyên đá và bản làng.",
            "Xe du lịch 16–29 chỗ Hà Nội – Hà Giang; xe trung chuyển và thuyền sông Nho Quế",
            "3 đêm: 2 đêm khách sạn 3 sao tại TP Hà Giang, 1 đêm homestay phòng riêng tại Đồng Văn",
            "Xe du lịch khứ hồi từ Nhà hát Lớn Hà Nội, xe trung chuyển xuống bến và thuyền Nho Quế.\n3 đêm lưu trú, 2 người/phòng, ghép 3 khi lẻ khách; 3 bữa sáng và 7 bữa chính, 150.000đ/khách/bữa chính.\nVé tham quan Sủng Là, dinh thự họ Vương và các điểm trong lịch trình.\nHướng dẫn viên tiếng Việt, nước 500ml/ngày và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Phụ thu phòng đơn 300.000đ/đêm; thuê xe máy tự lái không nằm trong chương trình.\nĐồ uống, thuê trang phục chụp ảnh, mua đặc sản và dịch vụ cá nhân.\nChi phí tham quan tự chọn ngoài danh sách điểm đã nêu.",
            new Day[]
            {
                new("Hà Nội – thành phố Hà Giang", "07:45 Tập trung tại Nhà hát Lớn; 08:00 khởi hành đi Hà Giang, dừng nghỉ trên đường.\n12:00 Ăn trưa tại Tuyên Quang, tiếp tục di chuyển và nghe giới thiệu về cao nguyên đá.\n16:00 Đến TP Hà Giang, chụp ảnh cột mốc số 0, nhận phòng khách sạn.\n18:30 Ăn tối với món địa phương, nghỉ đêm tại TP Hà Giang để chuẩn bị chặng đường đèo."),
                new("Quản Bạ – Yên Minh – Sủng Là – Đồng Văn", "07:00 Ăn sáng, trả phòng. 08:00 Đi qua dốc Bắc Sum, dừng ngắm cảnh tại cổng trời Quản Bạ.\n11:30 Ăn trưa tại Yên Minh. 13:00 Tham quan Sủng Là, các nếp nhà trình tường và khu trồng hoa theo mùa.\n15:00 Tham quan dinh thự họ Vương, sau đó tới Đồng Văn nhận phòng homestay riêng.\n18:30 Ăn tối, đi bộ phố cổ Đồng Văn; nghỉ đêm tại Đồng Văn."),
                new("Mã Pí Lèng – thuyền sông Nho Quế – Hà Giang", "06:30 Ăn sáng, trả phòng; 07:30 đi đèo Mã Pí Lèng, dừng tại điểm ngắm toàn cảnh hẻm vực.\n09:30 Xe trung chuyển đưa xuống bến, mặc áo phao và đi thuyền trên sông Nho Quế khoảng một giờ; không bố trí trekking mạo hiểm.\n12:00 Ăn trưa tại Mèo Vạc. 13:00 Theo đường qua Yên Minh trở về TP Hà Giang, có các điểm nghỉ dọc chặng.\n18:00 Nhận phòng, ăn tối và nghỉ đêm tại TP Hà Giang."),
                new("Hà Giang – Tuyên Quang – trở về Hà Nội", "07:00 Ăn sáng, tự do mua mật ong bạc hà, bánh tam giác mạch tại cửa hàng đặc sản.\n08:30 Trả phòng, lên xe về Hà Nội; dừng nghỉ giữa chặng.\n12:00 Ăn trưa tại Tuyên Quang, tiếp tục hành trình về đồng bằng.\nDự kiến 17:00–18:00 trả khách tại Nhà hát Lớn Hà Nội; kiểm tra hành lý, kết thúc chương trình.")
            }),
        new(4, "Đà Nẵng - Hội An - Bà Nà Hills",
            "Chương trình 4 ngày 3 đêm kết hợp biển Mỹ Khê, bán đảo Sơn Trà, một ngày tại Bà Nà Hills và buổi tối phố cổ Hội An. Đoàn nghỉ trọn 3 đêm tại Đà Nẵng, không đổi khách sạn giữa hành trình; đã bao gồm vé cáp treo Bà Nà và vé tham quan phố cổ.",
            "Xe du lịch máy lạnh đón tại Đà Nẵng; cáp treo Bà Nà khứ hồi",
            "3 đêm khách sạn 4 sao khu Mỹ Khê; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón tại sân bay Đà Nẵng lúc 08:00 hoặc khách sạn khu trung tâm, đưa tiễn theo lịch trình.\n3 đêm khách sạn 4 sao; 3 bữa sáng, 6 bữa chính tại nhà hàng 150.000đ/khách/bữa và 1 buffet trưa Bà Nà.\nVé cáp treo Bà Nà, Ngũ Hành Sơn, Bảo tàng Điêu khắc Chăm và vé tham quan phố cổ Hội An.\nHướng dẫn viên tiếng Việt, nước 500ml/ngày, bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Vé máy bay hoặc tàu đến và rời Đà Nẵng.\nPhụ thu phòng đơn 500.000đ/đêm; minibar và giặt ủi.\nBảo tàng tượng sáp, trò chơi trả phí riêng tại Bà Nà, thuyền thả hoa đăng và đồ uống gọi thêm.",
            new Day[]
            {
                new("Đà Nẵng – bán đảo Sơn Trà – biển Mỹ Khê", "08:00 Đón đoàn tại sân bay Đà Nẵng hoặc khách sạn trung tâm; gửi hành lý tại khách sạn.\n09:00 Tham quan chùa Linh Ứng trên bán đảo Sơn Trà, ngắm biển từ khuôn viên chùa.\n11:30 Ăn trưa; 14:00 nhận phòng và nghỉ ngơi. 16:00 Tắm biển Mỹ Khê trong khu vực có cứu hộ.\n18:30 Ăn tối; đi dạo bờ sông Hàn, chụp ảnh cầu Rồng, nghỉ đêm tại Đà Nẵng."),
                new("Bà Nà Hills – Cầu Vàng – làng Pháp", "07:00 Ăn sáng; 08:00 xe đến chân núi Bà Nà, đi cáp treo lên khu du lịch.\n09:30 Tham quan Cầu Vàng, vườn hoa và các điểm ngắm cảnh trên núi.\n12:00 Dùng buffet trưa; 13:30 dạo làng Pháp, vui chơi khu trò chơi nằm trong vé vào cổng.\n16:00 Xuống cáp treo, về Đà Nẵng. 18:30 Ăn tối và nghỉ tại khách sạn."),
                new("Ngũ Hành Sơn – làng đá – phố cổ Hội An", "07:00 Ăn sáng; 08:30 tham quan Ngũ Hành Sơn, chùa và hang động trên tuyến đi bộ; ghé làng điêu khắc đá Non Nước.\n11:30 Ăn trưa, về khách sạn nghỉ giữa ngày.\n14:30 Đi Hội An, tham quan nhà cổ, hội quán và khu vực Chùa Cầu theo tuyến vé phố cổ.\n18:00 Ăn tối với cao lầu, cơm gà; tự do dạo phố đèn lồng. 20:00 Xe đưa về Đà Nẵng nghỉ đêm."),
                new("Chợ Hàn – bảo tàng Chăm – tiễn đoàn", "07:00 Ăn sáng, chuẩn bị hành lý. 08:30 Tham quan Bảo tàng Điêu khắc Chăm, nghe giới thiệu nghệ thuật Champa.\n10:00 Dạo chợ Hàn, tự do mua quà; 11:30 trả phòng và ăn trưa.\n13:30–16:00 Nghỉ tại quán cà phê ven sông, đồ uống tự túc; xe sắp xếp tiễn đoàn tại sân bay trong khung 16:00–18:00.\nKết thúc tour tại Đà Nẵng; khách tự chuẩn bị vé máy bay sau giờ tiễn.")
            }),
        new(5, "Cố đô Huế - Vẻ đẹp trầm mặc",
            "Ba ngày tìm hiểu đời sống cung đình và nét thanh bình của Huế qua Đại Nội, lăng Tự Đức, lăng Khải Định, chùa Thiên Mụ và làng hương Thủy Xuân. Một buổi nghe ca Huế trên sông Hương và các bữa ăn với món Huế giúp hành trình có đủ trải nghiệm văn hóa, ẩm thực và nghỉ ngơi.",
            "Xe du lịch máy lạnh đón tại Huế; thuyền rồng nghe ca Huế trên sông Hương",
            "2 đêm khách sạn 3 sao trung tâm Huế; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón ga Huế hoặc khách sạn trung tâm lúc 08:00, tham quan và tiễn tại ga Huế.\n2 đêm khách sạn 3 sao; 2 bữa sáng và 5 bữa chính, 140.000đ/khách/bữa chính.\nVé Đại Nội, lăng Tự Đức, lăng Khải Định, nhà vườn An Hiên và thuyền nghe ca Huế ghép đoàn.\nHướng dẫn viên tiếng Việt, nước 500ml/ngày và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Vé máy bay, vé tàu đến Huế; xe sân bay Phú Bài không nằm trong điểm đón đã nêu.\nPhụ thu phòng đơn 300.000đ/đêm.\nThuê cổ phục, chụp ảnh dịch vụ, đồ uống và chi phí mua hàng tại chợ Đông Ba.",
            new Day[]
            {
                new("Đại Nội – chùa Thiên Mụ – sông Hương", "08:00 Đón tại ga Huế hoặc khách sạn trung tâm; gửi hành lý, bắt đầu tham quan Đại Nội với tuyến Ngọ Môn, sân Đại Triều Nghi và khu cung điện mở cửa.\n11:30 Ăn trưa với món Huế; 14:00 nhận phòng khách sạn.\n15:30 Xe đưa đoàn tới chùa Thiên Mụ, đi bộ ngắm sông Hương trong khuôn viên.\n18:00 Ăn tối; 19:30 lên thuyền nghe ca Huế khoảng một giờ, về khách sạn nghỉ đêm."),
                new("Lăng Tự Đức – làng hương Thủy Xuân – lăng Khải Định", "07:00 Ăn sáng; 08:00 tham quan lăng Tự Đức, tìm hiểu kiến trúc và không gian hồ, đình tạ.\n10:00 Ghé làng hương Thủy Xuân, xem thao tác làm hương và chụp ảnh.\n11:30 Ăn trưa, nghỉ giữa ngày; 14:00 tham quan lăng Khải Định, dành thời gian tìm hiểu trang trí khảm sành.\n16:30 Về khách sạn; 18:30 ăn tối với bánh bèo, nem lụi và món địa phương, nghỉ đêm tại Huế."),
                new("Nhà vườn An Hiên – chợ Đông Ba – tiễn đoàn", "07:00 Ăn sáng. 08:30 Tham quan nhà vườn An Hiên tại Kim Long, nghe giới thiệu nếp nhà và khu vườn truyền thống.\n10:00 Dạo chợ Đông Ba, mua mè xửng, trà và nón lá tự túc.\n11:30 Trả phòng, ăn trưa. 13:30 Đi bộ bờ nam sông Hương và khu vực cầu Trường Tiền.\n16:00–18:00 Xe tiễn tại ga Huế hoặc trả khách sạn trung tâm; kết thúc chương trình.")
            }),
        new(6, "Nha Trang - Thiên đường biển đảo",
            "Chuyến đi 3 ngày 2 đêm tập trung vào vịnh Nha Trang, tháp Bà Ponagar và tắm bùn khoáng. Một ngày riêng dành cho ca nô, ngắm san hô bằng kính lặn nổi và bữa trưa làng chài, tránh ghép thêm khu vui chơi cả ngày vào lịch biển. Tour không bao gồm VinWonders hay lặn bình khí.",
            "Xe du lịch tại Nha Trang; ca nô tham quan vịnh khứ hồi",
            "2 đêm khách sạn 3 sao gần biển Trần Phú; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón và tiễn tại ga Nha Trang hoặc khách sạn trung tâm lúc 08:00.\n2 đêm khách sạn 3 sao; 2 bữa sáng và 5 bữa chính, 150.000đ/khách/bữa chính, gồm bữa trưa làng chài.\nCa nô, áo phao, kính lặn nổi, vé khu tắm biển trong vịnh, tháp Bà Ponagar, Hòn Chồng và gói tắm bùn khoáng tập thể.\nHướng dẫn viên tiếng Việt, nước 500ml/ngày, bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Vé máy bay, vé tàu và xe đưa đón sân bay Cam Ranh.\nPhụ thu phòng đơn 350.000đ/đêm.\nLặn bình khí, đi bộ dưới biển, mô tô nước, vé VinWonders và đồ uống gọi thêm.",
            new Day[]
            {
                new("Tháp Bà Ponagar – tắm bùn khoáng – phố biển", "08:00 Đón tại ga Nha Trang hoặc khách sạn trung tâm, gửi hành lý. 09:00 Tham quan tháp Bà Ponagar, tìm hiểu kiến trúc Chăm.\n11:30 Ăn trưa; 14:00 nhận phòng.\n15:00 Trải nghiệm tắm bùn khoáng bồn tập thể và hồ khoáng trong khoảng hai giờ, mang đồ bơi cá nhân.\n18:30 Ăn tối, tự do đi bộ quảng trường 2/4 và bờ biển Trần Phú; nghỉ đêm Nha Trang."),
                new("Vịnh Nha Trang – lặn nổi – bữa trưa làng chài", "07:00 Ăn sáng; 08:00 ra bến, hướng dẫn mặc áo phao rồi đi ca nô vào vịnh.\n09:00 Tắm biển và ngắm san hô bằng kính lặn nổi tại khu vực được phép; người không bơi ở lại bãi hoặc trên tàu có hướng dẫn viên.\n11:30 Ăn trưa tại làng chài với cá, tôm, rau và cơm; các món gọi thêm tự túc.\n13:00 Nghỉ và tắm biển; 15:00 ca nô về bến, xe về khách sạn. 18:30 Ăn tối, nghỉ đêm tại Nha Trang."),
                new("Hòn Chồng – chợ Đầm – tiễn khách", "07:00 Ăn sáng; 08:00 tham quan Hòn Chồng, chụp ảnh bờ vịnh và tìm hiểu cảnh quan đá ven biển.\n10:00 Dạo chợ Đầm, tự do mua đặc sản và đồ lưu niệm.\n11:30 Trả phòng, ăn trưa với nem nướng và món địa phương.\n13:30 Nghỉ ngơi, dạo biển; 16:00–18:00 xe tiễn ga Nha Trang hoặc trả khách tại trung tâm, kết thúc tour.")
            }),
        new(7, "Đà Lạt - Xứ sở ngàn hoa",
            "Lịch trình nghỉ dưỡng 3 ngày 2 đêm ở Đà Lạt, kết hợp không gian hồ Xuân Hương, làng hoa, đồi chè Cầu Đất và Thung lũng Tình Yêu. Các điểm được chia theo tuyến để hạn chế đi vòng; có thời gian nghỉ buổi trưa và tự do khám phá chợ đêm.",
            "Xe du lịch máy lạnh đón và trả tại trung tâm Đà Lạt",
            "2 đêm khách sạn 4 sao khu trung tâm Đà Lạt; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe tham quan theo lịch trình, đón tại quảng trường Lâm Viên lúc 08:00.\n2 đêm khách sạn 4 sao; 2 bữa sáng và 5 bữa chính, 150.000đ/khách/bữa chính.\nVé Thung lũng Tình Yêu, vườn hoa thành phố, vườn cẩm tú cầu và tham quan đồi chè.\nHướng dẫn viên tiếng Việt, nước 500ml/ngày và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Vé máy bay, xe liên tỉnh và trung chuyển sân bay Liên Khương.\nPhụ thu phòng đơn 450.000đ/đêm.\nĐồ uống tại quán cà phê Cầu Đất, hái dâu mang về, thuê trang phục và mua đặc sản.",
            new Day[]
            {
                new("Hồ Xuân Hương – vườn hoa – quảng trường Lâm Viên", "08:00 Đón tại quảng trường Lâm Viên; gửi hành lý ở khách sạn, đi dạo bờ hồ Xuân Hương.\n09:30 Tham quan vườn hoa thành phố, chụp ảnh và tìm hiểu các giống hoa ôn đới.\n11:30 Ăn trưa; 14:00 nhận phòng và nghỉ. 16:00 Trở lại quảng trường Lâm Viên, ngắm kiến trúc nụ atisô.\n18:00 Ăn tối với lẩu rau Đà Lạt, tự do khám phá chợ đêm; nghỉ tại khách sạn."),
                new("Đồi chè Cầu Đất – cẩm tú cầu – Thung lũng Tình Yêu", "06:30 Ăn sáng; 07:30 đi Cầu Đất, đi bộ trên lối tham quan đồi chè và chụp ảnh. Có thời gian uống cà phê tự túc.\n10:00 Ghé vườn cẩm tú cầu trên tuyến về trung tâm.\n11:30 Ăn trưa, nghỉ tại khách sạn; 14:00 tham quan Thung lũng Tình Yêu với tuyến vườn hoa, hồ và xe điện trong gói vé.\n17:00 Về khách sạn, 18:30 ăn tối với gà nướng và cơm lam; nghỉ đêm tại Đà Lạt."),
                new("Vườn dâu – chợ Đà Lạt – kết thúc tour", "07:00 Ăn sáng; 08:30 ghé vườn dâu, xem cách trồng và chăm sóc; dâu hái mua mang về tính riêng theo cân.\n10:00 Dạo chợ Đà Lạt, mua trà atisô, rau và mứt tự túc.\n11:30 Trả phòng, dùng bữa trưa.\n13:30–16:00 Tự do đi bộ trung tâm, xe trả khách tại quảng trường Lâm Viên hoặc bến xe liên tỉnh Đà Lạt; kết thúc chương trình.")
            }),
        new(8, "Phú Quốc - Đảo ngọc thiên đường",
            "Bốn ngày nghỉ biển Phú Quốc với một ngày tham quan Hòn Thơm bằng cáp treo, một ngày tìm hiểu nam đảo và buổi chiều khám phá Grand World. Các chặng bắc đảo, nam đảo được tách ngày, không ghép tour ca nô nhiều đảo với công viên nước trong cùng một buổi.",
            "Xe du lịch trên đảo, đưa đón sân bay Phú Quốc; cáp treo Hòn Thơm khứ hồi",
            "3 đêm khách sạn 4 sao khu Dương Đông; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón sân bay Phú Quốc lúc 08:00 hoặc khách sạn trung tâm, xe tham quan và tiễn sân bay.\n3 đêm khách sạn 4 sao; 3 bữa sáng và 7 bữa chính, gồm 1 buffet Hòn Thơm; các bữa nhà hàng 170.000đ/khách.\nVé cáp treo Hòn Thơm kèm khu công viên nước, vé Sunset Sanato; tham quan Grand World khu công cộng.\nHướng dẫn viên tiếng Việt, nước 500ml/ngày và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Vé máy bay, tàu cao tốc đến và rời Phú Quốc.\nPhụ thu phòng đơn 550.000đ/đêm.\nVinWonders, Safari, thuyền gondola Grand World, tour ca nô đảo, lặn bình khí và đồ uống ngoài bữa ăn.",
            new Day[]
            {
                new("Dương Đông – nhà thùng nước mắm – hoàng hôn Sunset Sanato", "08:00 Đón tại sân bay hoặc khách sạn Dương Đông, gửi hành lý. 09:00 Ghé nhà thùng nước mắm, tìm hiểu quy trình ủ chượp truyền thống.\n11:30 Ăn trưa; 14:00 nhận phòng và nghỉ ngơi.\n16:00 Đến Sunset Sanato, chụp ảnh các tiểu cảnh và ngắm hoàng hôn trên bãi biển.\n18:30 Ăn tối, tự do dạo chợ đêm Dương Đông, nghỉ tại khách sạn."),
                new("Cáp treo Hòn Thơm – công viên nước", "07:00 Ăn sáng; 08:00 xe đến ga An Thới, đi cáp treo vượt biển ra Hòn Thơm.\n09:30 Chụp ảnh, tắm biển tại khu được phép hoặc vui chơi công viên nước; hướng dẫn viên phổ biến quy định chiều cao, sức khỏe cho từng trò.\n12:00 Ăn buffet trên đảo. 13:30 Nghỉ và tiếp tục vui chơi trong khu vé bao gồm.\n16:00 Đi cáp treo về, xe đưa về Dương Đông; 18:30 ăn tối và nghỉ đêm."),
                new("Bãi Sao – di tích nhà tù – Grand World", "07:00 Ăn sáng; 08:00 đi nam đảo tham quan di tích nhà tù Phú Quốc.\n09:30 Đến Bãi Sao tắm biển và nghỉ trên bãi; 11:30 ăn trưa hải sản tại nhà hàng, thay đồ trước khi lên xe.\n13:00 Về khách sạn nghỉ; 15:00 đi bắc đảo, tham quan khu công cộng Grand World, phố đi bộ và cảnh quan kênh đào.\n18:00 Ăn tối tại khu vực Gành Dầu; 19:30 về khách sạn Dương Đông nghỉ đêm."),
                new("Cơ sở ngọc trai – vườn tiêu – tiễn sân bay", "07:00 Ăn sáng; 08:30 tham quan cơ sở nuôi cấy ngọc trai, xem giới thiệu quy trình; mua hàng hoàn toàn tự nguyện.\n10:00 Ghé vườn tiêu, tìm hiểu cách trồng và thu hoạch hồ tiêu.\n11:30 Trả phòng, ăn trưa. 13:30 Nghỉ tại khu trung tâm, tự do mua đặc sản.\n16:00–18:00 Xe tiễn sân bay Phú Quốc theo khung kết thúc tour; kết thúc chương trình.")
            }),
        new(9, "Miền Tây sông nước - Cần Thơ",
            "Hành trình 2 ngày 1 đêm qua Mỹ Tho, Bến Tre và Cần Thơ, trải nghiệm thuyền trên sông Tiền, nghề làm kẹo dừa, đờn ca tài tử và chợ nổi Cái Răng lúc sáng sớm. Đoàn ngủ tại trung tâm Cần Thơ, thuận tiện đi bến Ninh Kiều và khởi hành ra chợ nổi.",
            "Xe du lịch TP.HCM – miền Tây khứ hồi; tàu sông Tiền, xuồng chèo và thuyền chợ nổi",
            "1 đêm khách sạn 3 sao tại Ninh Kiều, Cần Thơ; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón tại Công viên 23/9, Quận 1, TP.HCM lúc 08:00 và trả tại điểm đón.\nTàu du lịch sông Tiền, xuồng chèo kênh nhỏ, thuyền chợ nổi Cái Răng và áo phao.\n1 đêm khách sạn 3 sao; 1 bữa sáng trên thuyền, 2 bữa trưa và 1 bữa tối, bữa chính 130.000đ/khách.\nVé vườn trái cây, trải nghiệm kẹo dừa và đờn ca tài tử; hướng dẫn viên, nước 500ml/ngày, bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Phụ thu phòng đơn 300.000đ/đêm.\nMua trái cây mang về, quà lưu niệm, đồ uống và trò chơi tự chọn trong khu vườn.\nTiền bồi dưỡng tự nguyện cho người chèo xuồng, tài xế và hướng dẫn viên.",
            new Day[]
            {
                new("TP.HCM – Mỹ Tho – Bến Tre – Cần Thơ", "07:45 Có mặt tại Công viên 23/9; 08:00 khởi hành đi Mỹ Tho.\n10:00 Đi tàu sông Tiền, ghé cù lao, thưởng thức trái cây và nghe đờn ca tài tử; đi xuồng chèo trên kênh nhỏ, xem làm kẹo dừa.\n12:00 Ăn trưa với cá tai tượng chiên, rau và món miền Tây. 13:30 Lên xe đi Cần Thơ, nghỉ giữa chặng.\n17:00 Nhận phòng; 18:30 ăn tối, dạo bến Ninh Kiều và cầu đi bộ, nghỉ đêm tại Cần Thơ."),
                new("Chợ nổi Cái Răng – vườn trái cây – TP.HCM", "05:30 Ra bến, lên thuyền đi chợ nổi Cái Răng khi hoạt động mua bán còn sớm; dùng bữa sáng hủ tiếu trên thuyền.\n08:00 Về khách sạn nghỉ, 09:30 trả phòng và đến vườn trái cây khu Phong Điền, thưởng thức trái cây theo mùa tại vườn.\n11:30 Ăn trưa, 13:00 khởi hành về TP.HCM, dừng nghỉ trên đường.\nDự kiến 18:00 trả khách Công viên 23/9; kết thúc hành trình.")
            }),
        new(10, "Chinh phục đỉnh núi Bà Đen",
            "Tour một ngày từ TP.HCM đến Tây Ninh, lên núi Bà Đen bằng cáp treo và tham quan khu vực Tòa thánh Cao Đài. Chương trình đi bộ trên tuyến tham quan đã làm đường, không phải hành trình trekking; có buffet trưa trên núi và thời gian nghỉ trước chặng về.",
            "Xe du lịch máy lạnh TP.HCM – Tây Ninh; cáp treo tuyến đỉnh núi khứ hồi",
            "Không lưu trú qua đêm; tour đi và về trong ngày",
            "Xe đón tại Công viên 23/9, Quận 1 lúc 08:00, trả khách tại cùng điểm.\nVé vào khu du lịch, cáp treo tuyến đỉnh núi Bà Đen khứ hồi và 1 buffet trưa.\nHướng dẫn viên tiếng Việt; 1 chai nước 500ml và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Bữa sáng trước giờ đón và bữa tối sau khi kết thúc chương trình.\nVé cáp treo các tuyến khác ngoài tuyến đỉnh núi, lễ vật, đồ uống và mua đặc sản.\nChi phí cá nhân, tiền bồi dưỡng tự nguyện; tour không có dịch vụ phòng nghỉ.",
            new Day[]
            {
                new("TP.HCM – núi Bà Đen – Tòa thánh Tây Ninh", "07:45 Tập trung tại Công viên 23/9, ăn sáng tự túc trước giờ đón; 08:00 khởi hành đi Tây Ninh.\n10:30 Đến núi Bà Đen, đi cáp treo tuyến đỉnh núi, tham quan khu tượng Phật và cảnh quan trên tuyến đi bộ.\n12:30 Ăn buffet trưa trên núi; 14:00 xuống cáp treo, xe đến khu vực Tòa thánh Tây Ninh, tham quan với trang phục lịch sự.\n15:30 Ghé cửa hàng bánh tráng, muối tôm tự túc mua sắm, sau đó trở về TP.HCM; dự kiến 18:00–19:00 trả khách tại điểm đón.")
            }),
        new(11, "Tràng An - Bái Đính Ninh Bình",
            "Hai ngày khám phá vùng đất cố đô với đền vua Đinh, vua Lê tại Hoa Lư, thuyền Tràng An và quần thể chùa Bái Đính. Các buổi đi bộ và ngồi thuyền được chia riêng để không quá gấp; một đêm nghỉ tại Ninh Bình và thưởng thức dê núi, cơm cháy trong bữa trưa.",
            "Xe du lịch Hà Nội – Ninh Bình; thuyền chèo Tràng An; xe điện Bái Đính khứ hồi",
            "1 đêm khách sạn 3 sao tại Ninh Bình; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón Nhà hát Lớn Hà Nội lúc 08:00 và trả tại điểm đón.\nVé Hoa Lư, thuyền chèo Tràng An theo tuyến mở và xe điện Bái Đính khứ hồi.\n1 đêm khách sạn 3 sao; 1 bữa sáng, 2 bữa trưa và 1 bữa tối, bữa chính 150.000đ/khách.\nHướng dẫn viên tiếng Việt, áo phao khi đi thuyền, nước 500ml/ngày, bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Phụ thu phòng đơn 350.000đ/đêm.\nVé bảo tháp và các dịch vụ riêng ngoài tuyến tham quan Bái Đính.\nĐồ uống, lễ vật, mua đặc sản và tiền bồi dưỡng tự nguyện cho người chèo thuyền.",
            new Day[]
            {
                new("Hà Nội – cố đô Hoa Lư – thuyền Tràng An", "07:45 Tập trung Nhà hát Lớn; 08:00 đi Ninh Bình. 10:00 Tham quan đền vua Đinh, đền vua Lê tại Hoa Lư, nghe giới thiệu lịch sử cố đô.\n11:30 Ăn trưa với dê núi, cơm cháy và rau địa phương.\n13:00 Mặc áo phao, lên thuyền Tràng An khoảng 2,5–3 giờ, đi qua hang nước và các điểm dừng theo tuyến bến đang mở.\n16:30 Nhận phòng khách sạn; 18:30 ăn tối và nghỉ đêm tại Ninh Bình."),
                new("Chùa Bái Đính – làng quê Ninh Bình – Hà Nội", "07:00 Ăn sáng, trả phòng. 08:00 Đi Bái Đính, dùng xe điện vào khu tham quan, đi bộ qua hành lang La Hán và các điện chính.\n11:30 Ăn trưa tại nhà hàng, nghỉ ngơi.\n13:00 Dừng ngắm cảnh làng quê, chụp ảnh bên cánh đồng và núi đá khu Ninh Xuân, không leo núi.\n14:30 Lên xe về Hà Nội, nghỉ dọc đường; dự kiến 17:00–18:00 trả khách Nhà hát Lớn.")
            }),
        new(12, "Vũng Tàu - Biển xanh gọi mời",
            "Chuyến biển cuối tuần 2 ngày 1 đêm từ TP.HCM với thời gian tắm Bãi Sau, dạo Mũi Nghinh Phong, ngắm thành phố từ ngọn hải đăng và thưởng thức bánh khọt. Lịch trình có giờ nghỉ trưa, phù hợp nhóm gia đình muốn thư giãn, không bố trí leo tượng Chúa vào buổi nắng gắt.",
            "Xe du lịch máy lạnh TP.HCM – Vũng Tàu; xe trung chuyển khu hải đăng",
            "1 đêm khách sạn 3 sao khu Bãi Sau; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón Công viên 23/9, Quận 1 lúc 08:00, xe tham quan và trả tại điểm đón.\n1 đêm khách sạn 3 sao; 1 bữa sáng, 2 bữa trưa và 1 bữa tối, bữa chính 140.000đ/khách.\nXe trung chuyển tham quan ngọn hải đăng, hướng dẫn viên tiếng Việt.\nNước 500ml/ngày và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Phụ thu phòng đơn 350.000đ/đêm.\nThuê ghế, dù, phao và các trò chơi thể thao biển tại Bãi Sau.\nHải sản mua thêm, đồ uống, giặt ủi và dịch vụ ngoài bữa ăn đã bố trí.",
            new Day[]
            {
                new("TP.HCM – Vũng Tàu – Bãi Sau", "07:45 Tập trung tại Công viên 23/9; 08:00 đi Vũng Tàu, dừng nghỉ trên đường.\n11:00 Đến thành phố biển, ăn trưa với cơm hải sản; 14:00 nhận phòng nghỉ.\n16:00 Tắm biển Bãi Sau trong khu vực có cứu hộ, hướng dẫn viên nhắc giờ tập trung và giới hạn an toàn.\n18:30 Ăn tối, tự do đi bộ quảng trường biển hoặc chợ đêm; nghỉ tại khách sạn Bãi Sau."),
                new("Hải đăng – Mũi Nghinh Phong – TP.HCM", "07:00 Ăn sáng. 08:00 Xe trung chuyển đưa đoàn lên khu hải đăng, đi bộ chặng ngắn và ngắm toàn cảnh thành phố.\n09:30 Tham quan Mũi Nghinh Phong, chụp ảnh ở khu vực an toàn; không leo vách đá.\n11:30 Trả phòng, ăn trưa với bánh khọt và các món địa phương.\n13:30 Khởi hành về TP.HCM, dừng mua đặc sản tự túc; dự kiến 17:00–18:00 trả khách điểm đón.")
            }),
        new(13, "Hà Nội - 36 phố phường nghìn năm",
            "Một ngày khám phá Hà Nội qua không gian Ba Đình, Văn Miếu, hồ Hoàn Kiếm và phố cổ. Chuyến đi kết hợp đi bộ, xe đưa đón và một chặng xích lô, có bữa trưa bún chả cùng trải nghiệm cà phê trứng; tham quan bên ngoài Lăng Chủ tịch Hồ Chí Minh, không tổ chức vào viếng lăng.",
            "Xe du lịch nội thành Hà Nội; 30 phút xích lô khu phố cổ; đi bộ các chặng ngắn",
            "Không lưu trú qua đêm; tour nội thành trong ngày",
            "Xe đón tại Nhà hát Lớn Hà Nội lúc 08:00, trả tại điểm đón.\nVé Văn Miếu – Quốc Tử Giám, đền Ngọc Sơn và 30 phút xích lô phố cổ.\n1 bữa trưa bún chả, nem và rau; 1 ly cà phê trứng hoặc đồ uống không cà phê tương đương.\nHướng dẫn viên tiếng Việt, nước 500ml và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Bữa sáng, bữa tối, khách sạn và xe ngoài lịch trình.\nMua sắm tại phố cổ, đồ ăn vặt và đồ uống gọi thêm ngoài suất đã bao gồm.\nVé bảo tàng hoặc điểm tham quan khách tự đi sau khi kết thúc tour.",
            new Day[]
            {
                new("Ba Đình – Văn Miếu – hồ Hoàn Kiếm – ẩm thực phố cổ", "07:45 Tập trung Nhà hát Lớn; 08:00 đi quảng trường Ba Đình, nghe giới thiệu và chụp ảnh bên ngoài lăng, ghé chùa Một Cột.\n10:00 Tham quan Văn Miếu – Quốc Tử Giám; 11:30 dùng bữa trưa bún chả và nem.\n13:00 Đi bộ hồ Hoàn Kiếm, tham quan đền Ngọc Sơn; 14:30 đi xích lô 30 phút qua phố nghề, sau đó thưởng thức cà phê trứng.\n16:00 Tự do dạo phố Hàng Gai, Hàng Đào; 17:00–18:00 trả khách Nhà hát Lớn, kết thúc tour.")
            }),
        new(14, "Khám phá đảo Cù Lao Chàm",
            "Tour biển một ngày từ Đà Nẵng ra Cù Lao Chàm bằng ca nô qua cảng Cửa Đại. Chương trình có đi bộ tại Bãi Làng, tìm hiểu chùa Hải Tạng, tắm biển, ngắm san hô bằng kính lặn nổi và bữa trưa hải sản. Khách mang theo đồ bơi, khăn cá nhân và không mang túi nilon lên đảo.",
            "Xe Đà Nẵng – cảng Cửa Đại; ca nô cao tốc khứ hồi; đi bộ trên đảo",
            "Không lưu trú qua đêm; về đất liền trong ngày",
            "Xe đón tại khách sạn trung tâm Đà Nẵng lúc 08:00 và trả tại cùng khu vực.\nCa nô khứ hồi, vé tham quan đảo, phí bến và khu bảo tồn theo tuyến.\nÁo phao, kính lặn nổi, hướng dẫn tắm biển và 1 bữa trưa hải sản 170.000đ/khách.\nHướng dẫn viên tiếng Việt, nước 500ml và bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Bữa sáng, bữa tối, phòng lưu trú và xe đón ngoài trung tâm Đà Nẵng.\nLặn bình khí, đi bộ dưới biển, thuê đồ bơi và các hoạt động thể thao biển riêng.\nHải sản gọi thêm, đồ uống, thuê ghế nghỉ và mua hàng tại chợ đảo.",
            new Day[]
            {
                new("Đà Nẵng – Cửa Đại – Bãi Làng – ngắm san hô", "08:00 Đón khách trung tâm Đà Nẵng, đi cảng Cửa Đại. 09:15 Hoàn tất thủ tục, mặc áo phao và đi ca nô ra đảo.\n10:00 Đi bộ Bãi Làng, tham quan chùa Hải Tạng và giếng cổ; nghe giới thiệu việc hạn chế rác nhựa trên đảo.\n11:00 Đến khu tắm biển, dùng kính lặn nổi ngắm san hô tại vùng cho phép; không chạm hoặc bẻ san hô.\n12:30 Ăn trưa hải sản, nghỉ trên bãi. 14:30 Ca nô về đất liền, thay đồ và lên xe; 16:00–17:00 trả khách tại Đà Nẵng.")
            }),
        new(15, "Hành trình di sản miền Trung",
            "Hành trình 5 ngày 4 đêm theo tuyến Đà Nẵng – Hội An – Mỹ Sơn – Huế, kết hợp cảnh biển, kiến trúc Chăm và di sản cung đình. Hai đêm đầu nghỉ Đà Nẵng, hai đêm sau nghỉ Huế để giảm việc di chuyển ngược tuyến; kết thúc tại Huế. Tour có một ngày riêng cho Bà Nà, một ngày cho Hội An và Mỹ Sơn.",
            "Xe du lịch máy lạnh suốt tuyến Đà Nẵng – Hội An – Huế; cáp treo Bà Nà; thuyền sông Hương",
            "4 đêm khách sạn 4 sao: 2 đêm Đà Nẵng, 2 đêm Huế; 2 người/phòng, ghép 3 khi lẻ khách",
            "Xe đón sân bay Đà Nẵng lúc 08:00 hoặc khách sạn trung tâm; tiễn ga Huế hoặc sân bay Phú Bài ngày cuối.\n4 đêm khách sạn 4 sao, 4 bữa sáng và 9 bữa chính; gồm buffet Bà Nà, các bữa nhà hàng 170.000đ/khách.\nVé cáp treo Bà Nà, Ngũ Hành Sơn, phố cổ Hội An, Mỹ Sơn, Đại Nội, lăng Khải Định và thuyền nghe ca Huế.\nHướng dẫn viên tiếng Việt, nước 500ml/ngày, bảo hiểm tối đa 20 triệu đồng/khách/vụ.",
            "Vé máy bay, vé tàu đến Đà Nẵng và rời Huế; xe quay lại Đà Nẵng sau khi tour kết thúc.\nPhụ thu phòng đơn 500.000đ/đêm; minibar, giặt ủi và đồ uống gọi thêm.\nThuyền hoa đăng Hội An, thuê cổ phục, bảo tàng tượng sáp và trò chơi trả phí riêng tại Bà Nà.",
            new Day[]
            {
                new("Đà Nẵng – Sơn Trà – Ngũ Hành Sơn", "08:00 Đón tại sân bay Đà Nẵng hoặc khách sạn trung tâm, gửi hành lý. 09:00 Tham quan chùa Linh Ứng trên bán đảo Sơn Trà.\n11:30 Ăn trưa; 14:00 nhận phòng khách sạn 4 sao.\n15:00 Đi Ngũ Hành Sơn, tham quan tuyến chùa và hang động, ghé làng đá Non Nước.\n18:30 Ăn tối, tự do đi bộ bờ sông Hàn; nghỉ đêm đầu tại Đà Nẵng."),
                new("Bà Nà Hills – Cầu Vàng – làng Pháp", "07:00 Ăn sáng, 08:00 khởi hành đi Bà Nà. Đi cáp treo lên núi, tham quan Cầu Vàng và vườn hoa.\n12:00 Dùng buffet trưa trên Bà Nà.\n13:30 Dạo làng Pháp, trải nghiệm khu vui chơi trong gói vé và nghỉ tại quảng trường.\n16:00 Xuống cáp treo, về Đà Nẵng; 18:30 ăn tối, nghỉ đêm thứ hai tại cùng khách sạn."),
                new("Mỹ Sơn – phố cổ Hội An – di chuyển ra Huế", "06:30 Ăn sáng, trả phòng. 07:30 Đi Mỹ Sơn, tham quan các nhóm tháp trên tuyến đi bộ và tìm hiểu văn hóa Chăm.\n11:00 Ăn trưa tại Hội An; 12:00 đi bộ phố cổ, tham quan nhà cổ, hội quán và khu Chùa Cầu theo tuyến vé.\n14:30 Lên xe đi Huế qua hầm Hải Vân, dừng nghỉ ngắm vịnh Lăng Cô trên tuyến đường.\n18:30 Đến Huế, ăn tối và nhận phòng khách sạn 4 sao; nghỉ đêm đầu tại Huế."),
                new("Đại Nội – chùa Thiên Mụ – lăng Khải Định – ca Huế", "07:00 Ăn sáng; 08:00 tham quan Đại Nội với Ngọ Môn, khu điện và sân triều mở cửa cho khách.\n11:30 Ăn trưa món Huế, nghỉ giữa ngày. 13:30 Tham quan lăng Khải Định và nghệ thuật khảm sành.\n15:30 Ghé chùa Thiên Mụ, ngắm sông Hương, sau đó về khách sạn nghỉ ngắn.\n18:00 Ăn tối; 19:30 đi thuyền nghe ca Huế khoảng một giờ, nghỉ đêm thứ hai tại Huế."),
                new("Làng hương Thủy Xuân – chợ Đông Ba – tiễn khách tại Huế", "07:00 Ăn sáng. 08:00 Ghé làng hương Thủy Xuân, xem làm hương và chụp ảnh; 10:00 mua quà tự túc tại chợ Đông Ba.\n11:30 Trả phòng, ăn trưa với các món Huế.\n13:30 Dạo cầu Trường Tiền, nghỉ tại bờ sông; đồ uống gọi thêm tự túc.\n16:00–18:00 Xe tiễn ga Huế hoặc sân bay Phú Bài, kết thúc tour tại Huế; hành lý được bàn giao trước khi đoàn chia tay.")
            })
    };
}
