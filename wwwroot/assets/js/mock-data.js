/**
 * Centralized Relational Mock Database Engine
 * Vietnam Expeditions BookingTour System
 * Persists dynamically in localStorage ('bookingtour_mock_db')
 * Supports full CRUD, reactive mutations, and analytical stats.
 */
(() => {
  const STORAGE_KEY = 'bookingtour_mock_db';
  const CURRENT_USER_KEY = 'bookingtour_user';

  const DEFAULT_DATA = {
  "categories": [
    {
      "id": "cat_1",
      "name": "Du lịch Biển đảo",
      "slug": "bien-dao",
      "icon": "beach_access",
      "description": "Tận hưởng làn nước trong xanh và những bãi cát trắng mịn màng tuyệt đẹp.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1544644181-1484b3fdfc62_w600.jpg"
    },
    {
      "id": "cat_2",
      "name": "Khám phá Tây Bắc",
      "slug": "tay-bac",
      "icon": "terrain",
      "description": "Chinh phục những cung đèo hùng vĩ, ruộng bậc thang tráng lệ và bản làng bình yên.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg"
    },
    {
      "id": "cat_3",
      "name": "Di sản Văn hóa",
      "slug": "di-san",
      "icon": "museum",
      "description": "Hành trình tìm về cội nguồn và khám phá các di sản văn hóa thế giới UNESCO.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1559592413-7cec4d0cae2b_w600.jpg"
    },
    {
      "id": "cat_4",
      "name": "Nghỉ dưỡng Sinh thái",
      "slug": "sinh-thai",
      "icon": "forest",
      "description": "Hòa mình cùng thiên nhiên xanh mát, tái tạo năng lượng thể chất và tinh thần.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1506744038136-46273834b3fb_w600.jpg"
    },
    {
      "id": "cat_5",
      "name": "Du lịch Mạo hiểm & Trekking",
      "slug": "mao-hiem",
      "icon": "hiking",
      "description": "Thử thách giới hạn bản thân với các hành trình leo núi, thám hiểm hang động kỳ vĩ.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1501555088652-021faa106b9b_w600.jpg"
    },
    {
      "id": "cat_6",
      "name": "Nghỉ dưỡng Cao cấp",
      "slug": "cao-cap",
      "icon": "hotel_class",
      "description": "Trải nghiệm dịch vụ 5 sao, du thuyền sang trọng và tiện ích đẳng cấp quốc tế.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1571896349842-33c89424de2d_w600.jpg"
    },
    {
      "id": "cat_7",
      "name": "Ẩm thực & Phố cổ",
      "slug": "am-thuc",
      "icon": "restaurant",
      "description": "Thưởng thức tinh hoa ẩm thực bản địa đậm đà hương sắc ba miền Bắc - Trung - Nam.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1555396273-367ea4eb4db5_w600.jpg"
    },
    {
      "id": "cat_8",
      "name": "Sông nước Miền Tây",
      "slug": "song-nuoc",
      "icon": "kayaking",
      "description": "Khám phá chợ nổi nhộn nhịp, miệt vườn trĩu quả và nét đẹp đôn hậu người phương Nam.",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1596401057633-54a8fe8ef647_w600.jpg"
    }
  ],
  "provinces": [
    {
      "id": "prov_1",
      "name": "Quảng Ninh",
      "region": "Miền Bắc",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg",
      "description": "Kỳ quan thiên nhiên thế giới Vịnh Hạ Long và đảo ngọc Cô Tô."
    },
    {
      "id": "prov_2",
      "name": "Lào Cai",
      "region": "Miền Bắc",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1544644181-1484b3fdfc62_w600.jpg",
      "description": "Thị trấn sương mù Sapa, đỉnh Fansipan nóc nhà Đông Dương."
    },
    {
      "id": "prov_3",
      "name": "Hà Nội",
      "region": "Miền Bắc",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1509042239860-f550ce710b93_w600.jpg",
      "description": "Thủ đô ngàn năm văn hiến, 36 phố phường rêu phong cổ kính."
    },
    {
      "id": "prov_4",
      "name": "Ninh Bình",
      "region": "Miền Bắc",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1578632767115-351597cf2477_w600.jpg",
      "description": "Quần thể danh thắng Tràng An di sản kép văn hóa và thiên nhiên."
    },
    {
      "id": "prov_5",
      "name": "Hà Giang",
      "region": "Miền Bắc",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1580837119756-563d608dd119_w600.jpg",
      "description": "Cao nguyên đá Đồng Văn hùng vĩ và đèo Mã Pí Lèng huyền thoại."
    },
    {
      "id": "prov_6",
      "name": "Đà Nẵng",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1559592413-7cec4d0cae2b_w600.jpg",
      "description": "Thành phố đáng sống với biển Mỹ Khê, Bà Nà Hills và Cầu Vàng rực rỡ."
    },
    {
      "id": "prov_7",
      "name": "Quảng Nam",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1555396273-367ea4eb4db5_w600.jpg",
      "description": "Phố cổ Hội An lung linh đèn lồng và thánh địa Mỹ Sơn cổ kính."
    },
    {
      "id": "prov_8",
      "name": "Thừa Thiên Huế",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1584448141569-69f342da535c_w600.jpg",
      "description": "Cố đô trầm mặc bên dòng sông Hương thơ mộng và lăng tẩm hoàng gia."
    },
    {
      "id": "prov_9",
      "name": "Quảng Bình",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1506744038136-46273834b3fb_w600.jpg",
      "description": "Vương quốc hang động thế giới với Phong Nha - Kẻ Bàng, Sơn Đoòng."
    },
    {
      "id": "prov_10",
      "name": "Khánh Hòa",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1540555700478-4be289fbecef_w600.jpg",
      "description": "Vịnh biển Nha Trang tuyệt mỹ, thiên đường nghỉ dưỡng nhiệt đới."
    },
    {
      "id": "prov_11",
      "name": "Lâm Đồng",
      "region": "Tây Nguyên",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1501555088652-021faa106b9b_w600.jpg",
      "description": "Đà Lạt ngàn hoa, thành phố mộng mơ trong làn sương sớm."
    },
    {
      "id": "prov_12",
      "name": "Kiên Giang",
      "region": "Miền Nam",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1571896349842-33c89424de2d_w600.jpg",
      "description": "Đảo ngọc Phú Quốc với bãi Sao, hoàng hôn tuyệt mỹ và resort cao cấp."
    },
    {
      "id": "prov_13",
      "name": "TP. Hồ Chí Minh",
      "region": "Miền Nam",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1583417319070-4a69db38a482_w600.jpg",
      "description": "Đô thị sôi động, trung tâm kinh tế và văn hóa rực rỡ ánh đèn đêm."
    },
    {
      "id": "prov_14",
      "name": "Bình Định",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1507525428034-b723cf961d3e_w600.jpg",
      "description": "Quy Nhơn hoang sơ với Kỳ Co, Eo Gió - Maldives phiên bản Việt."
    },
    {
      "id": "prov_15",
      "name": "Bà Rịa - Vũng Tàu",
      "region": "Miền Nam",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1519046904884-53103b34b206_w600.jpg",
      "description": "Côn Đảo linh thiêng và biển Vũng Tàu tràn ngập nắng ấm."
    },
    {
      "id": "prov_16",
      "name": "Cần Thơ",
      "region": "Miền Nam",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1596401057633-54a8fe8ef647_w600.jpg",
      "description": "Thủ phủ Tây Đô với chợ nổi Cái Răng và miệt vườn phù sa trù phú."
    },
    {
      "id": "prov_17",
      "name": "Phú Yên",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1469854523086-cc02fe5d8800_w600.jpg",
      "description": "Xứ sở hoa vàng trên cỏ xanh, Gành Đá Đĩa kỳ quan đá bazan độc nhất."
    },
    {
      "id": "prov_18",
      "name": "Ninh Thuận",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1509316975850-ff9c5deb0cd9_w600.jpg",
      "description": "Vịnh Vĩnh Hy xanh ngắt, đồi cát Nam Cương và vườn nho Ba Mọi."
    },
    {
      "id": "prov_19",
      "name": "Bình Thuận",
      "region": "Miền Trung",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1476514525535-07fb3b4ae5f1_w600.jpg",
      "description": "Mũi Né thủ phủ resort với đồi cát bay và làng chài tấp nập."
    },
    {
      "id": "prov_20",
      "name": "An Giang",
      "region": "Miền Nam",
      "image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/locations/location_1534447677768-be436bb09401_w600.jpg",
      "description": "Rừng tràm Trà Sư xanh mướt và Miếu Bà Chúa Xứ Núi Sam linh thiêng."
    }
  ],
  "employees": [
    {
      "id": "emp_1",
      "full_name": "Trần Quản Trị",
      "email": "admin@bookingtour.vn",
      "phone": "0903123456",
      "role": "Admin",
      "status": "active",
      "join_date": "2023-01-10"
    },
    {
      "id": "emp_2",
      "full_name": "Lê Thị Thảo (Sale)",
      "email": "thao.le@bookingtour.vn",
      "phone": "0912345678",
      "role": "Sale",
      "status": "active",
      "join_date": "2023-03-15"
    },
    {
      "id": "emp_3",
      "full_name": "Phạm Quốc Hùng (Sale)",
      "email": "hung.pham@bookingtour.vn",
      "phone": "0987654321",
      "role": "Sale",
      "status": "active",
      "join_date": "2023-05-20"
    },
    {
      "id": "emp_4",
      "full_name": "Nguyễn Hoàng Nam (HDV)",
      "email": "nam.nguyen@bookingtour.vn",
      "phone": "0934567890",
      "role": "Guide",
      "status": "active",
      "join_date": "2023-02-01"
    },
    {
      "id": "emp_5",
      "full_name": "Vũ Đình Tuấn (HDV)",
      "email": "tuan.vu@bookingtour.vn",
      "phone": "0945678901",
      "role": "Guide",
      "status": "active",
      "join_date": "2023-04-12"
    },
    {
      "id": "emp_6",
      "full_name": "Đặng Mai Chi (HDV)",
      "email": "chi.dang@bookingtour.vn",
      "phone": "0956789012",
      "role": "Guide",
      "status": "active",
      "join_date": "2023-06-18"
    },
    {
      "id": "emp_7",
      "full_name": "Bùi Văn Hậu (HDV)",
      "email": "hau.bui@bookingtour.vn",
      "phone": "0967890123",
      "role": "Guide",
      "status": "active",
      "join_date": "2023-08-25"
    },
    {
      "id": "emp_8",
      "full_name": "Hoàng Thu Thủy (Sale)",
      "email": "thuy.hoang@bookingtour.vn",
      "phone": "0978901234",
      "role": "Sale",
      "status": "active",
      "join_date": "2023-09-10"
    },
    {
      "id": "emp_9",
      "full_name": "Đỗ Minh Đức (HDV)",
      "email": "duc.do@bookingtour.vn",
      "phone": "0989012345",
      "role": "Guide",
      "status": "active",
      "join_date": "2023-11-05"
    },
    {
      "id": "emp_10",
      "full_name": "Ngô Kim Ngân (Admin)",
      "email": "ngan.ngo@bookingtour.vn",
      "phone": "0990123456",
      "role": "Admin",
      "status": "active",
      "join_date": "2024-01-08"
    }
  ],
  "customers": [
    {
      "id": "cust_1",
      "full_name": "Nguyễn Văn An",
      "email": "an.nguyen@gmail.com",
      "phone": "0901234001",
      "address": "Số 15 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
      "created_at": "2024-01-15",
      "total_spent": 14250000,
      "booking_count": 3,
      "reward_points": 450
    },
    {
      "id": "cust_2",
      "full_name": "Trần Thị Bích",
      "email": "bich.tran@gmail.com",
      "phone": "0901234002",
      "address": "28 Hàng Bài, Hoàn Kiếm, Hà Nội",
      "created_at": "2024-02-10",
      "total_spent": 9800000,
      "booking_count": 2,
      "reward_points": 320
    },
    {
      "id": "cust_3",
      "full_name": "Lê Văn Cường",
      "email": "cuong.le@gmail.com",
      "phone": "0901234003",
      "address": "105 Nguyễn Văn Linh, Hải Châu, Đà Nẵng",
      "created_at": "2024-02-18",
      "total_spent": 18500000,
      "booking_count": 4,
      "reward_points": 600
    },
    {
      "id": "cust_4",
      "full_name": "Phạm Thu Dung",
      "email": "dung.pham@gmail.com",
      "phone": "0901234004",
      "address": "74 Trần Phú, Nha Trang, Khánh Hòa",
      "created_at": "2024-03-01",
      "total_spent": 6500000,
      "booking_count": 1,
      "reward_points": 180
    },
    {
      "id": "cust_5",
      "full_name": "Hoàng Đức Em",
      "email": "em.hoang@gmail.com",
      "phone": "0901234005",
      "address": "33 Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ",
      "created_at": "2024-03-12",
      "total_spent": 12800000,
      "booking_count": 2,
      "reward_points": 390
    },
    {
      "id": "cust_6",
      "full_name": "Vũ Kim Giang",
      "email": "giang.vu@gmail.com",
      "phone": "0901234006",
      "address": "82 Quang Trung, TP. Huế, TT-Huế",
      "created_at": "2024-03-25",
      "total_spent": 5200000,
      "booking_count": 1,
      "reward_points": 150
    },
    {
      "id": "cust_7",
      "full_name": "Đặng Quang Huy",
      "email": "huy.dang@gmail.com",
      "phone": "0901234007",
      "address": "45 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      "created_at": "2024-04-05",
      "total_spent": 21000000,
      "booking_count": 5,
      "reward_points": 720
    },
    {
      "id": "cust_8",
      "full_name": "Bùi Thùy Linh",
      "email": "linh.bui@gmail.com",
      "phone": "0901234008",
      "address": "90 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TPHCM",
      "created_at": "2024-04-14",
      "total_spent": 8900000,
      "booking_count": 2,
      "reward_points": 280
    },
    {
      "id": "cust_9",
      "full_name": "Đỗ Tuấn Minh",
      "email": "minh.do@gmail.com",
      "phone": "0901234009",
      "address": "12 Phan Chu Trinh, Vũng Tàu",
      "created_at": "2024-04-20",
      "total_spent": 15600000,
      "booking_count": 3,
      "reward_points": 500
    },
    {
      "id": "cust_10",
      "full_name": "Ngô Mai Nga",
      "email": "nga.ngo@gmail.com",
      "phone": "0901234010",
      "address": "56 Hùng Vương, Buôn Ma Thuột, Đắk Lắk",
      "created_at": "2024-05-02",
      "total_spent": 7400000,
      "booking_count": 1,
      "reward_points": 210
    },
    {
      "id": "cust_11",
      "full_name": "Dương Bảo Phúc",
      "email": "phuc.duong@gmail.com",
      "phone": "0901234011",
      "address": "19 Bạch Đằng, TP. Hạ Long, Quảng Ninh",
      "created_at": "2024-05-11",
      "total_spent": 11200000,
      "booking_count": 2,
      "reward_points": 340
    },
    {
      "id": "cust_12",
      "full_name": "Lý Ngọc Quyên",
      "email": "quyen.ly@gmail.com",
      "phone": "0901234012",
      "address": "67 Lý Tự Trọng, Quận Ninh Kiều, Cần Thơ",
      "created_at": "2024-05-22",
      "total_spent": 4500000,
      "booking_count": 1,
      "reward_points": 130
    },
    {
      "id": "cust_13",
      "full_name": "Phan Hữu Sang",
      "email": "sang.phan@gmail.com",
      "phone": "0901234013",
      "address": "88 Pasteur, Quận 3, TP. Hồ Chí Minh",
      "created_at": "2024-06-01",
      "total_spent": 17800000,
      "booking_count": 3,
      "reward_points": 560
    },
    {
      "id": "cust_14",
      "full_name": "Tạ Phương Thảo",
      "email": "thao.ta@gmail.com",
      "phone": "0901234014",
      "address": "23 Nguyễn Thị Minh Khai, TP. Vinh, Nghệ An",
      "created_at": "2024-06-15",
      "total_spent": 9900000,
      "booking_count": 2,
      "reward_points": 300
    },
    {
      "id": "cust_15",
      "full_name": "Võ Thành Trung",
      "email": "trung.vo@gmail.com",
      "phone": "0901234015",
      "address": "14 Hoàng Diệu, Ba Đình, Hà Nội",
      "created_at": "2024-06-28",
      "total_spent": 24500000,
      "booking_count": 4,
      "reward_points": 780
    },
    {
      "id": "cust_16",
      "full_name": "Hồ Khánh Uyên",
      "email": "uyen.ho@gmail.com",
      "phone": "0901234016",
      "address": "52 Yersin, TP. Đà Lạt, Lâm Đồng",
      "created_at": "2024-07-04",
      "total_spent": 6200000,
      "booking_count": 1,
      "reward_points": 190
    },
    {
      "id": "cust_17",
      "full_name": "Mai Gia Vũ",
      "email": "vu.mai@gmail.com",
      "phone": "0901234017",
      "address": "38 Lê Duẩn, Hải Châu, Đà Nẵng",
      "created_at": "2024-07-16",
      "total_spent": 13400000,
      "booking_count": 2,
      "reward_points": 410
    },
    {
      "id": "cust_18",
      "full_name": "Đinh Như Ý",
      "email": "y.dinh@gmail.com",
      "phone": "0901234018",
      "address": "71 Trường Chinh, Đống Đa, Hà Nội",
      "created_at": "2024-07-29",
      "total_spent": 8500000,
      "booking_count": 2,
      "reward_points": 260
    },
    {
      "id": "cust_19",
      "full_name": "Trịnh Hoàng Long",
      "email": "long.trinh@gmail.com",
      "phone": "0901234019",
      "address": "60 Điện Biên Phủ, Quận Bình Thạnh, TPHCM",
      "created_at": "2024-08-10",
      "total_spent": 16900000,
      "booking_count": 3,
      "reward_points": 530
    },
    {
      "id": "cust_20",
      "full_name": "Chu Kim Yến",
      "email": "yen.chu@gmail.com",
      "phone": "0901234020",
      "address": "15 Trần Hưng Đạo, Dương Đông, Phú Quốc",
      "created_at": "2024-08-25",
      "total_spent": 10500000,
      "booking_count": 2,
      "reward_points": 330
    }
  ],
  "tours": [
    {
      "id": "tour_1",
      "title": "Du Thuyền 5 Sao Vịnh Hạ Long - Vịnh Lan Hạ Đẳng Cấp",
      "category_id": "cat_6",
      "province_id": "prov_1",
      "duration_days": 2,
      "duration_nights": 1,
      "adult_price": 3250000,
      "child_price": 2275000,
      "departure_location": "Hà Nội / Cảng Quốc Tế Tuần Châu",
      "featured": true,
      "recommended": true,
      "rating": 4.9,
      "review_count": 128,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1506744038136-46273834b3fb_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg"
      ],
      "description": "Chiêm ngưỡng kỳ quan thiên nhiên thế giới Vịnh Hạ Long và Vịnh Lan Hạ trên hải trình sang trọng của du thuyền 5 sao chuẩn quốc tế. Thưởng thức tiệc hải sản tươi sống, chèo kayak qua hang Sáng Tối, tắm biển Ba Trái Đào và tận hưởng hoàng hôn tuyệt mỹ trên boong tàu.",
      "inclusions": [
        "01 đêm nghỉ phòng Suite sang trọng có ban công riêng nhìn ra vịnh",
        "Đầy đủ 04 bữa ăn thượng hạng theo chương trình (01 trưa, 01 tối tiệc, 01 sáng nhẹ, 01 trưa buffet)",
        "Nước uống chào mừng và trái cây tươi trong phòng",
        "Vé tham quan, chèo thuyền kayak và thuyền nan thăm hang động",
        "Lớp học nấu ăn truyền thống, câu mực đêm, tập Thái Cực Quyền đón bình minh",
        "Bảo hiểm du lịch trọn tour và hướng dẫn viên song ngữ chuyên nghiệp"
      ],
      "exclusions": [
        "Xe đưa đón khứ hồi Hà Nội - Tuần Châu (phụ thu limousine nếu yêu cầu)",
        "Đồ uống gọi thêm trong các bữa ăn và dịch vụ spa massage",
        "Tiền tip cho thủy thủ đoàn và chi phí cá nhân ngoài chương trình",
        "Thuế VAT 8%"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Hà Nội - Vịnh Hạ Long - Vịnh Lan Hạ - Hang Sáng Tối",
          "content": "08:30 Xe đón quý khách tại khu phố cổ Hà Nội khởi hành đi Tuần Châu. 11:30 Làm thủ tục check-in lên du thuyền, thưởng thức nước uống chào mừng. 13:00 Dùng bữa trưa buffet hải sản trong khi du thuyền lướt qua hàng nghìn hòn đảo đá vôi kỳ vĩ. Buổi chiều chèo kayak khám phá Hang Sáng Tối, tắm biển tại bãi Ba Trái Đào. 18:00 Tham gia tiệc trà hoàng hôn Sunset Party và lớp học cuốn nem truyền thống. 19:30 Thưởng thức bữa tối ẩm thực Á-Âu lãng mạn. Buổi tối tự do câu mực đêm hoặc thư giãn tại Sky Bar."
        },
        {
          "day": 2,
          "title": "Vịnh Lan Hạ - Làng Chài Trà Báu - Tuần Châu - Hà Nội",
          "content": "06:15 Đón bình minh với bài tập Thái Cực Quyền trên sundeck. Dùng bữa sáng nhẹ với cà phê, bánh ngọt và ngũ cốc. 07:30 Tham quan khu vực Trà Báu hoặc bãi tắm hoang sơ. 09:30 Làm thủ tục trả phòng, du thuyền quay về bờ trong khi quý khách thưởng thức bữa trưa sớm buffet thịnh soạn. 11:30 Tàu cập bến Tuần Châu, xe đón đoàn về lại Hà Nội. 15:00 Về đến điểm hẹn ban đầu, kết thúc chuyến hải trình đáng nhớ."
        }
      ]
    },
    {
      "id": "tour_2",
      "title": "Đà Nẵng - Bán Đảo Sơn Trà - Phố Cổ Hội An Lung Linh",
      "category_id": "cat_3",
      "province_id": "prov_6",
      "duration_days": 3,
      "duration_nights": 2,
      "adult_price": 4590000,
      "child_price": 3213000,
      "departure_location": "Sân bay Đà Nẵng",
      "featured": true,
      "recommended": true,
      "rating": 4.8,
      "review_count": 96,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1559592413-7cec4d0cae2b_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1555396273-367ea4eb4db5_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1507525428034-b723cf961d3e_w1200.jpg"
      ],
      "description": "Hành trình di sản kết nối nét hiện đại sôi động của Đà Nẵng và nét trầm mặc rực rỡ sắc màu của phố cổ Hội An. Check-in Cầu Vàng Bà Nà Hills, dạo thuyền hoa đăng trên sông Hoài và khám phá chùa Cầu trăm năm tuổi.",
      "inclusions": [
        "Khách sạn 4 sao trung tâm Đà Nẵng và resort Hội An (2 khách/phòng)",
        "Xe ô tô du lịch đời mới máy lạnh suốt tuyến",
        "Vé cáp treo Bà Nà Hills khứ hồi và vé Cầu Vàng",
        "Các bữa ăn đặc sản địa phương: Mì Quảng, bánh xèo, cơm gà Hội An, hải sản biển Mỹ Khê",
        "Thuyền thả hoa đăng trên sông Hoài phố cổ Hội An",
        "Hướng dẫn viên am hiểu lịch sử văn hóa phục vụ chu đáo",
        "Bảo hiểm du lịch mức bồi thường tối đa 100.000.000 đ/vụ"
      ],
      "exclusions": [
        "Vé máy bay khứ hồi đến Đà Nẵng",
        "Vé bảo tàng sáp Bà Nà Hills và trò chơi có thưởng Fantasy Park",
        "Chi phí giặt ủi, minibar khách sạn và nước uống ngoài thực đơn"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay Đà Nẵng - Bán đảo Sơn Trà - Biển Mỹ Khê",
          "content": "Sáng xe đón tại sân bay Đà Nẵng về khách sạn nhận phòng nghỉ ngơi. Chiều viếng chùa Linh Ứng Bãi Bụt ngắm tượng Phật Bà Quan Âm cao nhất Việt Nam. Dạo chơi bãi biển Mỹ Khê - một trong sáu bãi biển quyến rũ nhất hành tinh. Tối ngắm Cầu Rồng phun lửa, phun nước."
        },
        {
          "day": 2,
          "title": "Bà Nà Hills - Cầu Vàng Bàn Tay - Làng Cổ Hội An",
          "content": "Buổi sáng chinh phục đỉnh Bà Nà bằng hệ thống cáp treo đạt nhiều kỷ lục Guinness. Check-in Cầu Vàng lừng danh thế giới. Chiều di chuyển về Hội An, bách bộ khám phá Chùa Cầu, hội quán Phúc Kiến, nhà cổ Tấn Ký. Thả đèn hoa đăng cầu bình an trên dòng sông Hoài."
        },
        {
          "day": 3,
          "title": "Ngũ Hành Sơn - Làng Đá Mỹ Nghệ Non Nước - Tiễn sân bay",
          "content": "Thăm quần thể danh thắng Ngũ Hành Sơn, khám phá Động Huyền Không kỳ bí. Mua sắm quà lưu niệm tại làng điêu khắc đá Non Nước. Dùng bữa trưa đặc sản bánh tráng cuốn thịt heo hai đầu da. Xe tiễn khách ra sân bay Đà Nẵng."
        }
      ]
    },
    {
      "id": "tour_3",
      "title": "Sapa Tuyệt Tác Ruộng Bậc Thang - Đỉnh Fansipan Hùng Vĩ",
      "category_id": "cat_2",
      "province_id": "prov_2",
      "duration_days": 3,
      "duration_nights": 2,
      "adult_price": 3890000,
      "child_price": 2723000,
      "departure_location": "Hà Nội (Nhà Hát Lớn)",
      "featured": true,
      "recommended": false,
      "rating": 4.9,
      "review_count": 84,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1501555088652-021faa106b9b_w1200.jpg"
      ],
      "description": "Khám phá nét đẹp huyền ảo của xứ sở sương mù Sapa, ngắm nhìn thung lũng Mường Hoa với những thửa ruộng bậc thang tuyệt tác và chinh phục Nóc nhà Đông Dương Fansipan cao 3.143m trên dãy Hoàng Liên Sơn hùng vĩ.",
      "inclusions": [
        "Xe giường nằm Cabin đôi cao cấp khứ hồi Hà Nội - Sapa",
        "Khách sạn 4 sao trung tâm thị trấn Sapa có view núi thung lũng Mường Hoa",
        "Vé cáp treo Sun World Fansipan Legend khứ hồi",
        "Vé tàu hỏa leo núi Mường Hoa và vé tham quan bản Cát Cát",
        "Các bữa ăn đậm đà hương vị Tây Bắc: Lẩu cá hồi, gà bản nướng than, lợn cắp nách, thắng cố",
        "Hướng dẫn viên địa phương nhiệt tình dẫn tour",
        "Nước suối và bảo hiểm du lịch tiêu chuẩn"
      ],
      "exclusions": [
        "Vé tàu hỏa leo núi lên đỉnh Fansipan chặng cuối",
        "Tiền thuê trang phục dân tộc chụp ảnh tại bản Cát Cát",
        "Chi phí đồ uống cá nhân và tiền tip HDV"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Hà Nội - Cao Tốc Nội Bài Lào Cai - Bản Cát Cát Thơ Mộng",
          "content": "06:30 Khởi hành từ Hà Nội trên cao tốc hiện đại. 12:30 Đến Sapa dùng bữa trưa và nhận phòng nghỉ ngơi. Chiều bách bộ khám phá bản Cát Cát của đồng bào người Mông, xem biểu diễn múa khèn, check-in thác Tiên Sa và guồng nước khổng lồ. Tối dạo chợ đêm Sapa, thưởng thức đồ nướng bên bờ hồ."
        },
        {
          "day": 2,
          "title": "Chinh Phục Fansipan Nóc Nhà Đông Dương - Đèo Ô Quy Hồ",
          "content": "Sáng trải nghiệm tàu hỏa leo núi Mường Hoa và cáp treo Fansipan ngắm toàn cảnh thung lũng bồng bềnh trong biển mây. Chạm tay vào cột mốc 3.143m linh thiêng. Chiều check-in cổng trời đèo Ô Quy Hồ - một trong tứ đại đỉnh đèo miền Bắc, ngắm hoàng hôn đỏ rực. Tối thưởng thức lẩu cá hồi Sapa đặc sản."
        },
        {
          "day": 3,
          "title": "Nhà Thờ Đá Cổ Sapa - Núi Hàm Rồng - Hà Nội",
          "content": "Sáng leo núi Hàm Rồng chiêm ngưỡng vườn lan, vườn đào và ngắm trọn vẹn thị trấn Sapa từ sân mây. Thăm Nhà thờ Đá cổ biểu tượng Sapa. 13:30 Lên xe cabin trở về Hà Nội. 19:30 Về đến Hà Nội, chia tay đoàn."
        }
      ]
    },
    {
      "id": "tour_4",
      "title": "Phú Quốc Đảo Ngọc - Trải Nghiệm Cáp Treo Hòn Thơm & Sunset Sanato",
      "category_id": "cat_1",
      "province_id": "prov_12",
      "duration_days": 4,
      "duration_nights": 3,
      "adult_price": 5990000,
      "child_price": 4193000,
      "departure_location": "Sân bay Phú Quốc",
      "featured": true,
      "recommended": true,
      "rating": 4.9,
      "review_count": 150,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1571896349842-33c89424de2d_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1507525428034-b723cf961d3e_w1200.jpg"
      ],
      "description": "Nghỉ dưỡng đẳng cấp tại thiên đường biển đảo Phú Quốc. Trải nghiệm cáp treo 3 dây vượt biển dài nhất thế giới sang Hòn Thơm, cano lướt sóng 4 đảo ngắm san hô tự nhiên, ngắm hoàng hôn nghệ thuật tại Sunset Sanato và check-in thành phố không ngủ Grand World.",
      "inclusions": [
        "03 đêm nghỉ tại resort 4 sao sát biển có hồ bơi vô cực (2 khách/phòng)",
        "Xe ô tô du lịch cao cấp đưa đón sân bay và tham quan theo lịch trình",
        "Vé cáp treo Hòn Thơm khứ hồi và vé công viên nước Aquatopia",
        "Tour cano cao tốc tham quan 4 đảo (Hòn Mây Rút, Hòn Gầm Ghì, Hòn Móng Tay)",
        "Kính lặn, ống thở ngắm san hô và flycam chụp ảnh tặng kèm",
        "06 bữa ăn chính với hải sản phong phú và buffet sáng hằng ngày",
        "Bảo hiểm du lịch và nước uống suốt tuyến"
      ],
      "exclusions": [
        "Vé máy bay khứ hồi tới đảo Phú Quốc",
        "Vé vào cổng VinWonders và Vinpearl Safari",
        "Trò chơi lặn bình khí hoặc đi bộ dưới đáy biển Sea Walker"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay Phú Quốc - Check-in Resort - Hoàng hôn Sunset Sanato",
          "content": "Xe đón tại sân bay Phú Quốc về resort nhận phòng. Chiều check-in Sunset Sanato ngắm đàn voi chân dài sải bước trên bãi biển dưới ánh hoàng hôn rực rỡ. Tối thưởng thức bún quậy Kiến Xây và khám phá chợ đêm Dinh Cậu nhộn nhịp."
        },
        {
          "day": 2,
          "title": "Cáp Treo Vượt Biển Hòn Thơm - Aquatopia - Sunset Town",
          "content": "Sáng đi cáp treo vượt biển ngắm nhìn toàn cảnh quần đảo An Thới. Vui chơi thỏa thích tại công viên nước Aquatopia. Chiều khám phá thị trấn Địa Trung Hải Sunset Town với Tháp đồng hồ Venice và Cầu Hôn Kiss Bridge tráng lệ. Tối xem show nhạc nước và pháo hoa đỉnh cao."
        },
        {
          "day": 3,
          "title": "Hành Trình Cano 4 Đảo - Ngắm San Hô Hòn Gầm Ghì - Bãi Sao",
          "content": "Lên cano cao tốc lướt sóng đến Hòn Móng Tay, tắm biển nước xanh ngọc bích tại Hòn Mây Rút Trong. Lặn ngắm rạn san hô tự nhiên tại Hòn Gầm Ghì với thiết bị chuyên dụng và chụp ảnh SUP từ flycam. Chiều thư giãn bên bờ cát trắng mịn Bãi Sao."
        },
        {
          "day": 4,
          "title": "Vườn Tiêu Suối Đá - Nhà Thùng Nước Mắm - Tiễn sân bay",
          "content": "Thăm nhà thùng làm nước mắm truyền thống Phú Quốc, trang trại nuôi cấy ngọc trai và vườn tiêu hữu cơ. Mua đặc sản rượu sim rừng và hải sản khô làm quà. Xe đưa đoàn ra sân bay Phú Quốc, kết thúc kỳ nghỉ đáng nhớ."
        }
      ]
    },
    {
      "id": "tour_5",
      "title": "Ninh Bình Cố Đô Tràng An - Hang Múa - Bái Đính Thiêng Liêng",
      "category_id": "cat_3",
      "province_id": "prov_4",
      "duration_days": 2,
      "duration_nights": 1,
      "adult_price": 2450000,
      "child_price": 1715000,
      "departure_location": "Hà Nội",
      "featured": false,
      "recommended": true,
      "rating": 4.8,
      "review_count": 78,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1578632767115-351597cf2477_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1506744038136-46273834b3fb_w1200.jpg"
      ],
      "description": "Hành trình đưa quý khách xuôi dòng sông Ngô Đồng qua các hang động kỳ thú của Tràng An, leo 500 bậc đá đỉnh Ngọa Long ngắm toàn cảnh Tam Cốc từ Hang Múa và chiêm bái chùa Bái Đính giữ nhiều kỷ lục châu Á.",
      "inclusions": [
        "Xe ô tô Limousine đón tiễn Hà Nội - Ninh Bình",
        "Nghỉ 1 đêm tại resort sinh thái có hồ bơi view đồng lúa",
        "Thuyền nan tham quan danh thắng Tràng An di sản kép UNESCO",
        "Vé tham quan Hang Múa và xe điện chùa Bái Đính 2 chiều",
        "Các bữa ăn chính với đặc sản thịt dê núi, cơm cháy Ninh Bình",
        "Bảo hiểm và hướng dẫn viên suốt tuyến"
      ],
      "exclusions": [
        "Chi phí cá nhân",
        "Đồ uống phát sinh",
        "Thuế VAT"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Hà Nội - Bái Đính Đại Tự - Quần Thể Tràng An",
          "content": "Khởi hành từ Hà Nội lúc 07:30. Thăm chùa Bái Đính với bảo tháp cao nhất Đông Nam Á và hành lang 500 tượng La Hán. Chiều ngồi thuyền nan xuôi dòng Tràng An xuyên qua Hang Tối, Hang Sáng, Hang Nấu Rượu và phim trường Kong Skull Island. Tối thưởng thức dê núi nướng tảng tại nhà hàng địa phương."
        },
        {
          "day": 2,
          "title": "Đỉnh Hang Múa - Cố Đô Hoa Lư - Hà Nội",
          "content": "Sáng sớm chinh phục 500 bậc thang đá đỉnh Hang Múa đón ánh bình minh tuyệt đẹp trên dòng sông Ngô Đồng. Tiếp tục thăm Cố đô Hoa Lư - đền vua Đinh Tiên Hoàng và vua Lê Đại Hành. Dùng bữa trưa và khởi hành về lại Hà Nội vào buổi chiều."
        }
      ]
    },
    {
      "id": "tour_6",
      "title": "Thám Hiểm Động Phong Nha & Động Thiên Đường - Quảng Bình",
      "category_id": "cat_5",
      "province_id": "prov_9",
      "duration_days": 3,
      "duration_nights": 2,
      "adult_price": 4200000,
      "child_price": 2940000,
      "departure_location": "Đồng Hới, Quảng Bình",
      "featured": true,
      "recommended": false,
      "rating": 4.9,
      "review_count": 64,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1506744038136-46273834b3fb_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1501555088652-021faa106b9b_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg"
      ],
      "description": "Khám phá 'Hoàng cung trong lòng đất' tại Động Thiên Đường - hang động khô dài nhất châu Á và du thuyền trên dòng sông Son êm ả tiến vào lòng Động Phong Nha huyền bí. Vui chơi chèo kayak tại Suối Nước Moọc trong vắt như ngọc bích.",
      "inclusions": [
        "Khách sạn 4 sao tại Đồng Hới bên dòng sông Nhật Lệ thơ mộng",
        "Xe du lịch đời mới vận chuyển theo lịch trình",
        "Thuyền rồng sông Son thăm Động Phong Nha",
        "Xe điện và vé tham quan Động Thiên Đường",
        "Vé tham quan, áo phao và trò chơi tại Suối Nước Moọc",
        "Các bữa ăn tiêu chuẩn với đặc sản cá chình suối, gà nướng lu",
        "Hướng dẫn viên chuyên nghiệp và bảo hiểm du lịch trọn gói"
      ],
      "exclusions": [
        "Vé máy bay/tàu hỏa tới Đồng Hới",
        "Tắm bùn hang Tối (nếu chọn)",
        "Đồ uống tự gọi"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay/ga Đồng Hới - Đồi Cát Quang Phú - Biển Nhật Lệ",
          "content": "Xe đón khách tại sân bay hoặc ga Đồng Hới. Nhận phòng khách sạn và nghỉ ngơi. Chiều check-in đồi cát trắng Quang Phú trải nghiệm trượt cát mạo hiểm. Dạo biển Nhật Lệ và thưởng thức bánh xèo tôm nhảy, đẻn biển."
        },
        {
          "day": 2,
          "title": "Động Thiên Đường Tráng Lệ - Suối Nước Moọc Sinh Thái",
          "content": "Khám phá Động Thiên Đường với hệ thống nhũ đá lung linh kỳ vĩ hàng triệu năm tuổi. Buổi chiều ghé suối Nước Moọc tắm suối mát lạnh, chèo thuyền kayak và nhảy cầu gỗ giữa rừng nguyên sinh đại ngàn."
        },
        {
          "day": 3,
          "title": "Du Thuyền Sông Son - Động Phong Nha Huyền Ảo - Tiễn khách",
          "content": "Ngồi thuyền trên sông Son êm ả ngắm làng quê thanh bình, chiêm ngưỡng 7 điều kỳ tích tại Động Phong Nha: Sông ngầm dài nhất, cửa hang cao và rộng nhất, bãi cát trong hang đẹp nhất. Chiều xe tiễn ga/sân bay Đồng Hới."
        }
      ]
    },
    {
      "id": "tour_7",
      "title": "Đà Lạt Mộng Mơ - Săn Mây Cầu Đất & Đồi Chè Xanh Ngát",
      "category_id": "cat_4",
      "province_id": "prov_11",
      "duration_days": 3,
      "duration_nights": 2,
      "adult_price": 3150000,
      "child_price": 2205000,
      "departure_location": "Sân bay Liên Khương / TP. Hồ Chí Minh",
      "featured": true,
      "recommended": true,
      "rating": 4.8,
      "review_count": 112,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1501555088652-021faa106b9b_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1506744038136-46273834b3fb_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg"
      ],
      "description": "Tận hưởng không khí se lạnh cao nguyên ngàn hoa Đà Lạt. Thức dậy sớm săn biển mây bồng bềnh tại đồi chè Cầu Đất, ngắm thác Datanla hùng vĩ bằng máng trượt xuyên rừng thông, dạo quanh hồ Xuân Hương và ghé thăm dinh Bảo Đại cổ kính.",
      "inclusions": [
        "Khách sạn 3-4 sao trung tâm gần hồ Xuân Hương",
        "Xe ô tô du lịch chất lượng cao đưa đón tham quan",
        "Vé máng trượt thác Datanla khứ hồi trải nghiệm cảm giác mạnh",
        "Vé tham quan Đồi chè Cầu Đất, Cổng Trời Bali, Làng Cổ Tích",
        "04 bữa ăn chính với lẩu gà lá é, lẩu bò Ba Toa, tiệc BBQ nướng",
        "Hướng dẫn viên vui vẻ nhiệt tình",
        "Bảo hiểm du lịch 50.000.000 đ"
      ],
      "exclusions": [
        "Vé máy bay đi/về Đà Lạt",
        "Hái dâu tây mua mang về",
        "Chi phí quán cafe sống ảo cá nhân"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay Liên Khương - Dinh Bảo Đại - Hồ Xuân Hương",
          "content": "Xe đón quý khách từ sân bay Liên Khương về Đà Lạt. Tham quan Dinh 3 Bảo Đại nghe chuyện lịch sử vị hoàng đế cuối cùng triều Nguyễn. Chiều thưởng thức cafe ngắm hồ Tuyền Lâm thơ mộng. Tối dạo chợ đêm Âm Phủ ăn bánh tráng nướng, uống sữa đậu nành nóng."
        },
        {
          "day": 2,
          "title": "Săn Mây Cầu Đất - Máng Trượt Thác Datanla - Ga Xe Lửa Cổ",
          "content": "04:30 Khởi hành đi Cầu Đất đón bình minh và săn biển mây phiêu bồng giữa thảm gỗ panorama. Check-in tua bin gió khổng lồ. Chiều thử thách máng trượt rừng thông tại thác Datanla. Thăm Ga xe lửa cổ Đà Lạt phong cách kiến trúc Pháp độc đáo."
        },
        {
          "day": 3,
          "title": "Vườn Hoa Thành Phố - Chợ Đà Lạt Mua Đặc Sản - Tiễn sân bay",
          "content": "Thăm Vườn Hoa Thành Phố ngắm hàng trăm loài hoa khoe sắc. Ghé chợ Đà Lạt mua đặc sản atiso, mứt dâu, hồng treo gió làm quà biếu. Xe tiễn khách ra sân bay Liên Khương."
        }
      ]
    },
    {
      "id": "tour_8",
      "title": "Quy Nhơn - Phú Yên: Xứ Sở Hoa Vàng Trên Cỏ Xanh & Kỳ Co Eo Gió",
      "category_id": "cat_1",
      "province_id": "prov_14",
      "duration_days": 4,
      "duration_nights": 3,
      "adult_price": 5450000,
      "child_price": 3815000,
      "departure_location": "Sân bay Phù Cát (Quy Nhơn)",
      "featured": false,
      "recommended": true,
      "rating": 4.9,
      "review_count": 89,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1507525428034-b723cf961d3e_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1469854523086-cc02fe5d8800_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1559592413-7cec4d0cae2b_w1200.jpg"
      ],
      "description": "Hành trình duyên hải Nam Trung Bộ hoang sơ và đẹp tựa tranh vẽ. Chiêm ngưỡng bãi biển Kỳ Co trong vắt màu ngọc bích, cung đường Eo Gió lộng gió biển khơi và ghé thăm Gành Đá Đĩa - kiệt tác đá bazan độc nhất vô nhị tại Phú Yên.",
      "inclusions": [
        "Khách sạn 4 sao sát biển Quy Nhơn và Tuy Hòa",
        "Cano cao tốc sang bãi biển Kỳ Co và lặn ngắm san hô Bãi Dứa",
        "Vé tham quan Eo Gió, Gành Đá Đĩa, Bãi Xép Ghềnh Ông, Hải Đăng Mũi Điện",
        "Bữa ăn hải sản 8 món tươi sống tại làng chài Nhơn Lý và mắt cá ngừ đại dương Phú Yên",
        "Xe du lịch đời mới suốt hành trình",
        "Bảo hiểm du lịch và nước uống"
      ],
      "exclusions": [
        "Vé máy bay khứ hồi",
        "Mô tô nước và dù lượn tại Kỳ Co",
        "Chi tiêu cá nhân"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay Phù Cát - Tháp Đôi Chăm Pa - Ghềnh Ráng Tiên Sa",
          "content": "Xe đón tại sân bay Phù Cát về Quy Nhơn. Chiều thăm khu du lịch Ghềnh Ráng Tiên Sa viếng mộ thi sĩ Hàn Mặc Tử, ngắm bãi tắm Hoàng Hậu với những hòn đá tròn như trứng chim. Thăm tháp Đôi cổ kính."
        },
        {
          "day": 2,
          "title": "Cano Đảo Kỳ Co - Lặn Ngắm San Hô - Eo Gió Lộng Gió",
          "content": "Cano cao tốc đưa đoàn đến bãi tắm Kỳ Co tuyệt đẹp được ví như Maldives của Việt Nam. Lặn ngắm san hô Bãi Dứa. Chiều dạo bước trên con đường ven vách đá tuyệt mỹ tại Eo Gió. Tối thưởng thức bánh xèo tôm nhảy Gia Vỹ."
        },
        {
          "day": 3,
          "title": "Quy Nhơn - Phú Yên - Gành Đá Đĩa - Bãi Xép Hoa Vàng Cỏ Xanh",
          "content": "Khởi hành đi Phú Yên thăm nhà thờ Mằng Lăng cổ xưa lưu giữ cuốn sách chữ Quốc ngữ đầu tiên. Khám phá Gành Đá Đĩa độc đáo với hàng nghìn cột đá bazan hình lục giác xếp lớp. Check-in Bãi Xép ngắm biển xanh ngắt từ triền cỏ xương rồng."
        },
        {
          "day": 4,
          "title": "Mũi Điện Cực Đông Đất Liền - Vịnh Vũng Rô - Tiễn sân bay Tuy Hòa",
          "content": "Đón bình minh tại ngọn hải đăng Mũi Điện - nơi đón ánh mặt trời đầu tiên trên đất liền Việt Nam. Chiêm ngưỡng vịnh Vũng Rô di tích Tàu Không Số. Dùng bữa trưa cá ngừ đại dương và tiễn khách ra sân bay Tuy Hòa."
        }
      ]
    },
    {
      "id": "tour_9",
      "title": "Hà Giang Mùa Hoa Tam Giác Mạch - Cột Cờ Lũng Cú & Đèo Mã Pí Lèng",
      "category_id": "cat_2",
      "province_id": "prov_5",
      "duration_days": 3,
      "duration_nights": 2,
      "adult_price": 3650000,
      "child_price": 2555000,
      "departure_location": "Hà Nội",
      "featured": true,
      "recommended": true,
      "rating": 4.9,
      "review_count": 105,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1580837119756-563d608dd119_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1501555088652-021faa106b9b_w1200.jpg"
      ],
      "description": "Chinh phục miền đá nở hoa nơi địa đầu Tổ quốc. Đi thuyền trên dòng sông Nho Quế màu xanh ngọc bích len lỏi dưới Hẻm Tu Sản sâu nhất Đông Nam Á, đứng chào cờ dưới chân Cột Cờ Quốc Gia Lũng Cú và vượt đèo Mã Pí Lèng kỳ vĩ.",
      "inclusions": [
        "Xe du lịch đời mới ghế ngả cao cấp khứ hồi Hà Nội - Hà Giang",
        "Nghỉ 1 đêm khách sạn Đồng Văn và 1 đêm resort P'apiu/H'Mong Village sinh thái",
        "Thuyền du ngoạn hẻm Tu Sản trên dòng sông Nho Quế",
        "Vé tham quan Dinh Thự Vua Mèo, Cột cờ Lũng Cú, Nhà của Pao",
        "Các bữa ăn chính phong vị núi rừng: Thắng dền, bánh tam giác mạch, lẩu gà đen",
        "Hướng dẫn viên am hiểu bản địa và bảo hiểm đầy đủ"
      ],
      "exclusions": [
        "Chi phí thuê xe máy riêng",
        "Đồ uống cá nhân",
        "Thuế VAT"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Hà Nội - Cột Mốc Km0 - Dốc Thẩm Mã - Phố Cổ Đồng Văn",
          "content": "Xuất phát từ Hà Nội, check-in cột mốc số 0 tại TP. Hà Giang. Vượt dốc Thẩm Mã uốn lượn, thăm Nhà của Pao tại thung lũng Sủng Là rực rỡ sắc hoa. Chiêm ngưỡng kiến trúc Dinh Thự Họ Vương (Vua Mèo). Tối dạo phố cổ Đồng Văn uống cà phê cực Bắc."
        },
        {
          "day": 2,
          "title": "Cột Cờ Lũng Cú - Đèo Mã Pí Lèng - Du Thuyền Sông Nho Quế",
          "content": "Chạm tay vào lá cờ đỏ sao vàng 54m2 trên đỉnh núi Rồng Lũng Cú. Chinh phục đèo Mã Pí Lèng - một trong tứ đại đỉnh đèo hiểm trở nhất. Xuống bến thuyền sông Nho Quế ngắm nhìn Hẻm Tu Sản sừng sững giữa trời mây."
        },
        {
          "day": 3,
          "title": "Chợ Phiên Vùng Cao - Rừng Thông Yên Minh - Núi Đôi Quản Bạ - Hà Nội",
          "content": "Tham gia chợ phiên rực rỡ sắc màu thổ cẩm của người H'Mông, người Dao. Ghé rừng thông Yên Minh xanh ngát và ngắm Núi Đôi Cô Tiên tại thị trấn Tam Sơn Quản Bạ. Chiều lên xe trở về Hà Nội, kết thúc chuyến đi."
        }
      ]
    },
    {
      "id": "tour_10",
      "title": "Côn Đảo Tâm Linh & Nghỉ Dưỡng Thiên Đường Hoang Sơ",
      "category_id": "cat_6",
      "province_id": "prov_15",
      "duration_days": 3,
      "duration_nights": 2,
      "adult_price": 6800000,
      "child_price": 4760000,
      "departure_location": "Sân bay Côn Đảo",
      "featured": false,
      "recommended": true,
      "rating": 5.0,
      "review_count": 92,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1519046904884-53103b34b206_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1571896349842-33c89424de2d_w1200.jpg"
      ],
      "description": "Hành trình linh thiêng tìm về trang sử hào hùng dân tộc và hòa mình vào thiên nhiên biển đảo hoang sơ tuyệt mỹ. Viếng nghĩa trang Hàng Dương và mộ nữ anh hùng Võ Thị Sáu vào ban đêm, tắm biển bãi Đầm Trầu ngắm máy bay hạ cánh sát mặt nước.",
      "inclusions": [
        "Resort 4 sao Côn Đảo sát biển có bãi tắm riêng biệt",
        "Xe du lịch đón tiễn sân bay và phục vụ suốt tuyến",
        "Lễ vật và hướng dẫn viếng mộ Cô Sáu ban đêm trang nghiêm",
        "Vé tham quan Hệ thống Nhà tù Côn Đảo, Chuồng Cọp Pháp - Mỹ, Dinh Chúa Đảo",
        "Các bữa ăn hải sản đặc sản tươi sống: Ốc vú nàng, mực một nắng nướng, cá thu một nắng",
        "Bảo hiểm du lịch mức 100 triệu đồng"
      ],
      "exclusions": [
        "Vé máy bay khứ hồi đi Côn Đảo",
        "Chi phí sắm lễ riêng cá nhân",
        "Đồ uống minibar"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay Cỏ Ống - Bãi Đầm Trầu - Viếng Mộ Cô Sáu Đêm",
          "content": "Xe đón tại sân bay Côn Đảo ngắm cung đường ven biển tuyệt đẹp. Tắm biển bãi Đầm Trầu cát vàng mịn màng và check-in máy bay hạ cánh độc đáo. 22:30 Đoàn chuẩn bị lễ phục vào Nghĩa trang Hàng Dương viếng mộ chị Võ Thị Sáu linh thiêng."
        },
        {
          "day": 2,
          "title": "Di Tích Lịch Sử Nhà Tù Côn Đảo - Chuồng Cọp - Miếu Bà Phi Yến",
          "content": "Thăm Dinh Chúa Đảo, Nhà tù Côn Đảo, trại giam Phú Hải, khu Chuồng Cọp Pháp và Mỹ với những câu chuyện kiên trung bất khuất của các chiến sĩ cách mạng. Chiều viếng chùa Núi Một (Vân Sơn Tự) và Miếu Bà Phi Yến."
        },
        {
          "day": 3,
          "title": "Cảng Bến Đầm - Mua Sắm Đặc Sản Hạt Bàng - Tiễn sân bay",
          "content": "Thăm cảng Bến Đầm ngắm toàn cảnh hòn Bà. Ghé chợ Côn Đảo mua hạt bàng rang muối, mứt hạt bàng và cá thu một nắng. Xe tiễn khách ra sân bay Cỏ Ống trở về."
        }
      ]
    },
    {
      "id": "tour_11",
      "title": "Miền Tây Sông Nước: Cần Thơ - Chợ Nổi Cái Răng - Rừng Tràm Trà Sư",
      "category_id": "cat_8",
      "province_id": "prov_16",
      "duration_days": 2,
      "duration_nights": 1,
      "adult_price": 2190000,
      "child_price": 1533000,
      "departure_location": "TP. Hồ Chí Minh",
      "featured": false,
      "recommended": false,
      "rating": 4.7,
      "review_count": 68,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1596401057633-54a8fe8ef647_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1534447677768-be436bb09401_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1555396273-367ea4eb4db5_w1200.jpg"
      ],
      "description": "Xuôi về miền đồng bằng sông Cửu Long đôn hậu và trù phú. Trải nghiệm cảm giác bồng bềnh trên ghe thuyền khám phá chợ nổi Cái Răng buổi sớm, len lỏi tắc ráng xuyên qua thảm bèo xanh mướt của rừng tràm Trà Sư và thưởng thức lẩu mắm cá linh bông điên điển.",
      "inclusions": [
        "Xe du lịch đời mới cao cấp đón trả tại TP. Hồ Chí Minh",
        "Khách sạn 4 sao trung tâm Cần Thơ bên bờ sông Hậu",
        "Thuyền du ngoạn chợ nổi Cái Răng và ghe chèo xuyên rừng Tràm Trà Sư",
        "Thưởng thức buffet bánh dân gian Nam Bộ và các món miệt vườn",
        "Vé tham quan nhà cổ Bình Thủy và vườn cây ăn trái thưởng thức hoa quả theo mùa",
        "Hướng dẫn viên chuyên nghiệp miền Tây"
      ],
      "exclusions": [
        "Chi phí cá nhân",
        "Tiền tip cho lái tàu/ghe chèo"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "TP.HCM - Mỹ Tho - Cồn Thới Sơn - Cần Thơ Đô Thị Ánh Đèn",
          "content": "Khởi hành từ Sài Gòn đi Tiền Giang. Ngồi xuồng ba lá len lỏi rạch dừa nước Cồn Phụng, uống trà mật ong phấn hoa, nghe đờn ca tài tử. Chiều về Cần Thơ nhận phòng. Tối lên du thuyền sông Hậu thưởng thức bữa tối và ngắm Cầu Cần Thơ lung linh."
        },
        {
          "day": 2,
          "title": "Chợ Nổi Cái Răng Sớm - Rừng Tràm Trà Sư An Giang - TP.HCM",
          "content": "05:30 Sáng đi thuyền khám phá Chợ Nổi Cái Răng, ăn tô hủ tiếu nóng hổi ngay trên ghe. Tiếp tục đến rừng tràm Trà Sư, ngồi tắc ráng lướt trên thảm bèo hoa dâu xanh biếc ngắm các loài chim nước quý hiếm. Chiều khởi hành về lại TP.HCM."
        }
      ]
    },
    {
      "id": "tour_12",
      "title": "Huế Cố Đô Ngàn Năm - Lăng Tẩm Hoàng Gia & Ca Huế Sông Hương",
      "category_id": "cat_3",
      "province_id": "prov_8",
      "duration_days": 2,
      "duration_nights": 1,
      "adult_price": 2750000,
      "child_price": 1925000,
      "departure_location": "TP. Huế / Sân bay Phú Bài",
      "featured": false,
      "recommended": true,
      "rating": 4.8,
      "review_count": 55,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1584448141569-69f342da535c_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1559592413-7cec4d0cae2b_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1555396273-367ea4eb4db5_w1200.jpg"
      ],
      "description": "Lắng đọng cùng vẻ đẹp trầm mặc và quý phái của Kinh thành Huế triều Nguyễn. Viếng Đại Nội uy nghiêm, chiêm ngưỡng kiến trúc đỉnh cao Lăng Khải Định và Lăng Tự Đức, ngồi thuyền rồng nghe ca Huế trên sông Hương và thưởng thức cơm cung đình thượng hạng.",
      "inclusions": [
        "Khách sạn 4 sao cổ điển bên dòng sông Hương thơ mộng",
        "Vé tham quan Quần thể Di tích Cố đô Huế (Đại Nội, Lăng Khải Định, Lăng Tự Đức)",
        "Thuyền rồng sông Hương và vé thưởng thức Ca Huế thính phòng",
        "Các bữa ăn chính với ẩm thực cung đình Huế và bánh bèo, nậm, lọc",
        "Xe ô tô đưa đón tham quan và hướng dẫn viên thuyết minh lịch sử",
        "Bảo hiểm du lịch trọn gói"
      ],
      "exclusions": [
        "Vé máy bay/tàu hỏa tới Huế",
        "Thuê trang phục hoàng cung chụp ảnh",
        "Đồ uống tự gọi"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay Phú Bài - Đại Nội Huế - Chùa Thiên Mụ - Ca Huế",
          "content": "Xe đón tại Huế. Thăm Đại Nội kinh đô của 13 vị vua triều Nguyễn: Ngọ Môn, Điện Thái Hòa, Tử Cấm Thành. Chiều viếng Chùa Thiên Mụ cổ kính bên bờ sông Hương. 19:30 Lên thuyền rồng du ngoạn sông Hương, nghe ca Huế thính phòng và thả đèn hoa đăng."
        },
        {
          "day": 2,
          "title": "Lăng Khải Định Đỉnh Cao Kiến Trúc - Lăng Tự Đức Thơ Mộng - Làng Hương Thủy Xuân",
          "content": "Thăm Lăng Khải Định kiệt tác giao thoa kiến trúc Đông Tây tinh xảo. Thăm Lăng Tự Đức thi vị hữu tình. Ghé làng hương Thủy Xuân check-in chụp hình với những bó hương đủ màu sắc rực rỡ. Chiều xe tiễn sân bay Phú Bài."
        }
      ]
    },
    {
      "id": "tour_13",
      "title": "Nha Trang Vịnh Ngọc - Lặn Biển Hòn Mun & VinWonders Đỉnh Cao",
      "category_id": "cat_1",
      "province_id": "prov_10",
      "duration_days": 3,
      "duration_nights": 2,
      "adult_price": 4350000,
      "child_price": 3045000,
      "departure_location": "Sân bay Cam Ranh",
      "featured": true,
      "recommended": false,
      "rating": 4.8,
      "review_count": 82,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1540555700478-4be289fbecef_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1571896349842-33c89424de2d_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1507525428034-b723cf961d3e_w1200.jpg"
      ],
      "description": "Hòa mình vào thiên đường biển đảo Nha Trang. Lặn biển ngắm hàng trăm loài san hô quý tại khu bảo tồn Hòn Mun, tắm bùn khoáng nóng thư giãn I-Resort và vui chơi không giới hạn tại công viên giải trí biển VinWonders Hòn Tre.",
      "inclusions": [
        "Khách sạn 4 sao mặt biển đường Trần Phú Nha Trang",
        "Cano cao tốc tham quan tour 3 đảo vịnh Nha Trang",
        "Vé vào cổng VinWonders Hòn Tre trọn gói gồm cáp treo biển",
        "Vé ngâm tắm bùn khoáng nóng phục hồi sức khỏe",
        "04 bữa ăn chính với hải sản tươi sống và nem nướng Ninh Hòa",
        "Hướng dẫn viên và bảo hiểm du lịch đầy đủ"
      ],
      "exclusions": [
        "Vé máy bay tới Cam Ranh",
        "Lặn bình khí scuba diving",
        "Chi phí trò chơi cảm giác mạnh trên biển"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "Đón sân bay Cam Ranh - Tháp Bà Ponagar - Tắm Bùn Khoáng",
          "content": "Xe đón tại sân bay Cam Ranh. Thăm Tháp Bà Ponagar kiến trúc Chăm cổ kính và nghe truyền thuyết Nữ Thần Mẹ Xứ Sở. Chiều thư giãn ngâm bùn khoáng nóng I-Resort giải tỏa mệt mỏi. Tối dạo chợ đêm Nha Trang."
        },
        {
          "day": 2,
          "title": "Cano Khám Phá Hòn Mun - Bãi Tranh - Làng Chài",
          "content": "Lên cano đến khu bảo tồn biển Hòn Mun lặn ngắm san hô rực rỡ dưới làn nước trong veo. Dùng bữa trưa hải sản trên bè nổi Làng Chài. Chiều tắm biển và chơi thể thao nước tại Bãi Tranh. Tối thưởng thức bún chả cá Nha Trang trứ danh."
        },
        {
          "day": 3,
          "title": "Khám Phá VinWonders Hòn Tre - Tiễn sân bay Cam Ranh",
          "content": "Đi cáp treo vượt biển sang đảo Hòn Tre. Thử thách tàu lượn siêu tốc, bánh xe bầu trời Sky Wheel top 10 thế giới, xem show nhạc nước triệu đô Tata Show. Xe đưa đoàn về sân bay Cam Ranh."
        }
      ]
    },
    {
      "id": "tour_14",
      "title": "Mũi Né - Phan Thiết: Trượt Cát Đỏ & Khám Phá Bàu Trắng Mộng Mơ",
      "category_id": "cat_1",
      "province_id": "prov_19",
      "duration_days": 2,
      "duration_nights": 1,
      "adult_price": 2350000,
      "child_price": 1645000,
      "departure_location": "TP. Hồ Chí Minh",
      "featured": false,
      "recommended": false,
      "rating": 4.7,
      "review_count": 48,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1476514525535-07fb3b4ae5f1_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1509316975850-ff9c5deb0cd9_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1540555700478-4be289fbecef_w1200.jpg"
      ],
      "description": "Trải nghiệm tiểu sa mạc Sahara của Việt Nam tại Bàu Trắng với trải nghiệm xe Jeep địa hình lao vun vút trên đồi cát trắng xóa bên hồ sen tĩnh lặng, dạo bước Suối Tiên dòng nước cam đỏ huyền ảo và ghé làng chài Mũi Né nhộn nhịp.",
      "inclusions": [
        "Xe ô tô máy lạnh chất lượng cao khứ hồi TP.HCM - Mũi Né",
        "Resort 4 sao view biển bãi tắm Mũi Né",
        "Xe Jeep địa hình tham quan đồi cát Bàu Trắng và đồi cát Bay",
        "Vé tham quan Suối Tiên, Lâu đài Rượu Vang RD",
        "03 bữa ăn chất lượng với hải sản nướng và lẩu thả Phan Thiết",
        "Bảo hiểm và hướng dẫn viên tận tâm"
      ],
      "exclusions": [
        "Chi phí thuê mô tô cát tự lái",
        "Rượu vang mua thêm",
        "Chi tiêu cá nhân"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "TP.HCM - Cao Tốc Dầu Giây Phan Thiết - Lâu Đài Rượu Vang - Đồi Cát Bay",
          "content": "Khởi hành từ Sài Gòn trên cao tốc mới chỉ mất 2 tiếng rưỡi. Thăm Lâu Đài Rượu Vang thưởng thức các dòng vang California thượng hạng. Chiều nhận phòng resort nghỉ ngơi. 16:30 Đi đồi Cát Bay ngắm hoàng hôn rực rỡ và trượt cát. Tối ăn lẩu thả Mũi Né."
        },
        {
          "day": 2,
          "title": "Bình Minh Đồi Cát Trắng Bàu Trắng - Làng Chài - Suối Tiên - Về Sài Gòn",
          "content": "05:00 Đi xe Jeep ngắm bình minh trên đồi cát Bàu Trắng hùng vĩ. Thăm làng chài Mũi Né xem cảnh tấp nập thuyền thúng cập bờ với đầy ắp cá tôm tươi sống. Lội chân trần mát rượi trên lòng Suối Tiên. Dùng bữa trưa và khởi hành về lại TP.HCM."
        }
      ]
    },
    {
      "id": "tour_15",
      "title": "Tây Ninh Nắng Cháy - Chinh Phục Đỉnh Núi Bà Đen & Tòa Thánh",
      "category_id": "cat_4",
      "province_id": "prov_3",
      "duration_days": 1,
      "duration_nights": 0,
      "adult_price": 1490000,
      "child_price": 1043000,
      "departure_location": "TP. Hồ Chí Minh",
      "featured": false,
      "recommended": true,
      "rating": 4.8,
      "review_count": 62,
      "status": "active",
      "images": [
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1509042239860-f550ce710b93_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1559592413-7cec4d0cae2b_w1200.jpg",
        "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1578632767115-351597cf2477_w1200.jpg"
      ],
      "description": "Hành trình tâm linh về với Núi Bà Đen nóc nhà Nam Bộ cao 986m. Đi tuyến cáp treo hiện đại lên đỉnh chiêm bái tượng Phật Bà Tây Bổ Đà Sơn bằng đồng cao nhất châu Á tọa lạc uy nghiêm trên đỉnh núi mây ngàn và ghé Tòa Thánh Cao Đài tráng lệ.",
      "inclusions": [
        "Xe du lịch máy lạnh đời mới khứ hồi TP.HCM - Tây Ninh",
        "Vé cáp treo khứ hồi lên đỉnh Núi Bà Đen và Chùa Bà",
        "Bữa trưa buffet thịnh soạn tại nhà hàng Vân Sơn trên đỉnh núi với hơn 80 món",
        "Vé tham quan Tòa Thánh Tây Ninh",
        "Nước suối, khăn lạnh và bảo hiểm du lịch trọn gói",
        "Hướng dẫn viên chuyên nghiệp thuyết minh nhiệt tình"
      ],
      "exclusions": [
        "Chi phí mua sắm bánh tráng phơi sương, muối tôm",
        "Đồ uống ngoài thực đơn",
        "Tiền tip"
      ],
      "itinerary": [
        {
          "day": 1,
          "title": "TP. Hồ Chí Minh - Tòa Thánh Tây Ninh - Đỉnh Núi Bà Đen - Về Lại Sài Gòn",
          "content": "06:00 Đón khách tại TP.HCM. Thăm Tòa Thánh Tây Ninh chiêm ngưỡng kiến trúc độc đáo của đạo Cao Đài và dự buổi lễ cúng Ngọ trưa trang nghiêm. Trưa lên tuyến cáp treo Vân Sơn chinh phục đỉnh Núi Bà Đen. Dùng buffet ẩm thực trên đỉnh núi và chiêm bái Tượng Phật Bà bằng đồng nguyên khối cao 72m. Chiều ghé lò mua bánh tráng Trảng Bàng, muối tôm Tây Ninh. 18:30 Về đến Sài Gòn."
        }
      ]
    }
  ],
  "departures": [
    {
      "id": "dep_1",
      "tour_id": "tour_1",
      "start_date": "2026-11-20",
      "end_date": "2026-11-21",
      "total_seats": 24,
      "available_seats": 8,
      "adult_price": 3250000,
      "child_price": 2275000,
      "status": "open",
      "guide_id": "emp_4",
      "guide_name": "Nguyễn Hoàng Nam (HDV)"
    },
    {
      "id": "dep_2",
      "tour_id": "tour_1",
      "start_date": "2026-11-28",
      "end_date": "2026-11-29",
      "total_seats": 24,
      "available_seats": 14,
      "adult_price": 3250000,
      "child_price": 2275000,
      "status": "open",
      "guide_id": "emp_5",
      "guide_name": "Vũ Đình Tuấn (HDV)"
    },
    {
      "id": "dep_3",
      "tour_id": "tour_1",
      "start_date": "2026-12-05",
      "end_date": "2026-12-06",
      "total_seats": 24,
      "available_seats": 20,
      "adult_price": 3250000,
      "child_price": 2275000,
      "status": "open",
      "guide_id": "emp_4",
      "guide_name": "Nguyễn Hoàng Nam (HDV)"
    },
    {
      "id": "dep_4",
      "tour_id": "tour_2",
      "start_date": "2026-11-22",
      "end_date": "2026-11-24",
      "total_seats": 30,
      "available_seats": 6,
      "adult_price": 4590000,
      "child_price": 3213000,
      "status": "open",
      "guide_id": "emp_6",
      "guide_name": "Đặng Mai Chi (HDV)"
    },
    {
      "id": "dep_5",
      "tour_id": "tour_2",
      "start_date": "2026-12-01",
      "end_date": "2026-12-03",
      "total_seats": 30,
      "available_seats": 18,
      "adult_price": 4590000,
      "child_price": 3213000,
      "status": "open",
      "guide_id": "emp_7",
      "guide_name": "Bùi Văn Hậu (HDV)"
    },
    {
      "id": "dep_6",
      "tour_id": "tour_2",
      "start_date": "2026-12-10",
      "end_date": "2026-12-12",
      "total_seats": 30,
      "available_seats": 25,
      "adult_price": 4590000,
      "child_price": 3213000,
      "status": "open",
      "guide_id": "emp_6",
      "guide_name": "Đặng Mai Chi (HDV)"
    },
    {
      "id": "dep_7",
      "tour_id": "tour_3",
      "start_date": "2026-11-25",
      "end_date": "2026-11-27",
      "total_seats": 28,
      "available_seats": 10,
      "adult_price": 3890000,
      "child_price": 2723000,
      "status": "open",
      "guide_id": "emp_9",
      "guide_name": "Đỗ Minh Đức (HDV)"
    },
    {
      "id": "dep_8",
      "tour_id": "tour_3",
      "start_date": "2026-12-08",
      "end_date": "2026-12-10",
      "total_seats": 28,
      "available_seats": 22,
      "adult_price": 3890000,
      "child_price": 2723000,
      "status": "open",
      "guide_id": "emp_9",
      "guide_name": "Đỗ Minh Đức (HDV)"
    },
    {
      "id": "dep_9",
      "tour_id": "tour_4",
      "start_date": "2026-11-26",
      "end_date": "2026-11-29",
      "total_seats": 32,
      "available_seats": 5,
      "adult_price": 5990000,
      "child_price": 4193000,
      "status": "open",
      "guide_id": "emp_4",
      "guide_name": "Nguyễn Hoàng Nam (HDV)"
    },
    {
      "id": "dep_10",
      "tour_id": "tour_4",
      "start_date": "2026-12-04",
      "end_date": "2026-12-07",
      "total_seats": 32,
      "available_seats": 19,
      "adult_price": 5990000,
      "child_price": 4193000,
      "status": "open",
      "guide_id": "emp_5",
      "guide_name": "Vũ Đình Tuấn (HDV)"
    },
    {
      "id": "dep_11",
      "tour_id": "tour_5",
      "start_date": "2026-11-21",
      "end_date": "2026-11-22",
      "total_seats": 20,
      "available_seats": 7,
      "adult_price": 2450000,
      "child_price": 1715000,
      "status": "open",
      "guide_id": "emp_7",
      "guide_name": "Bùi Văn Hậu (HDV)"
    },
    {
      "id": "dep_12",
      "tour_id": "tour_5",
      "start_date": "2026-12-05",
      "end_date": "2026-12-06",
      "total_seats": 20,
      "available_seats": 16,
      "adult_price": 2450000,
      "child_price": 1715000,
      "status": "open",
      "guide_id": "emp_7",
      "guide_name": "Bùi Văn Hậu (HDV)"
    },
    {
      "id": "dep_13",
      "tour_id": "tour_6",
      "start_date": "2026-11-27",
      "end_date": "2026-11-29",
      "total_seats": 25,
      "available_seats": 8,
      "adult_price": 4200000,
      "child_price": 2940000,
      "status": "open",
      "guide_id": "emp_6",
      "guide_name": "Đặng Mai Chi (HDV)"
    },
    {
      "id": "dep_14",
      "tour_id": "tour_6",
      "start_date": "2026-12-11",
      "end_date": "2026-12-13",
      "total_seats": 25,
      "available_seats": 21,
      "adult_price": 4200000,
      "child_price": 2940000,
      "status": "open",
      "guide_id": "emp_6",
      "guide_name": "Đặng Mai Chi (HDV)"
    },
    {
      "id": "dep_15",
      "tour_id": "tour_7",
      "start_date": "2026-11-23",
      "end_date": "2026-11-25",
      "total_seats": 30,
      "available_seats": 12,
      "adult_price": 3150000,
      "child_price": 2205000,
      "status": "open",
      "guide_id": "emp_5",
      "guide_name": "Vũ Đình Tuấn (HDV)"
    },
    {
      "id": "dep_16",
      "tour_id": "tour_7",
      "start_date": "2026-12-07",
      "end_date": "2026-12-09",
      "total_seats": 30,
      "available_seats": 24,
      "adult_price": 3150000,
      "child_price": 2205000,
      "status": "open",
      "guide_id": "emp_9",
      "guide_name": "Đỗ Minh Đức (HDV)"
    },
    {
      "id": "dep_17",
      "tour_id": "tour_8",
      "start_date": "2026-11-29",
      "end_date": "2026-12-02",
      "total_seats": 26,
      "available_seats": 9,
      "adult_price": 5450000,
      "child_price": 3815000,
      "status": "open",
      "guide_id": "emp_4",
      "guide_name": "Nguyễn Hoàng Nam (HDV)"
    },
    {
      "id": "dep_18",
      "tour_id": "tour_8",
      "start_date": "2026-12-14",
      "end_date": "2026-12-17",
      "total_seats": 26,
      "available_seats": 20,
      "adult_price": 5450000,
      "child_price": 3815000,
      "status": "open",
      "guide_id": "emp_4",
      "guide_name": "Nguyễn Hoàng Nam (HDV)"
    },
    {
      "id": "dep_19",
      "tour_id": "tour_9",
      "start_date": "2026-11-24",
      "end_date": "2026-11-26",
      "total_seats": 24,
      "available_seats": 4,
      "adult_price": 3650000,
      "child_price": 2555000,
      "status": "open",
      "guide_id": "emp_9",
      "guide_name": "Đỗ Minh Đức (HDV)"
    },
    {
      "id": "dep_20",
      "tour_id": "tour_9",
      "start_date": "2026-12-08",
      "end_date": "2026-12-10",
      "total_seats": 24,
      "available_seats": 17,
      "adult_price": 3650000,
      "child_price": 2555000,
      "status": "open",
      "guide_id": "emp_9",
      "guide_name": "Đỗ Minh Đức (HDV)"
    },
    {
      "id": "dep_21",
      "tour_id": "tour_10",
      "start_date": "2026-11-30",
      "end_date": "2026-12-02",
      "total_seats": 20,
      "available_seats": 6,
      "adult_price": 6800000,
      "child_price": 4760000,
      "status": "open",
      "guide_id": "emp_7",
      "guide_name": "Bùi Văn Hậu (HDV)"
    },
    {
      "id": "dep_22",
      "tour_id": "tour_10",
      "start_date": "2026-12-15",
      "end_date": "2026-12-17",
      "total_seats": 20,
      "available_seats": 15,
      "adult_price": 6800000,
      "child_price": 4760000,
      "status": "open",
      "guide_id": "emp_7",
      "guide_name": "Bùi Văn Hậu (HDV)"
    },
    {
      "id": "dep_23",
      "tour_id": "tour_11",
      "start_date": "2026-11-21",
      "end_date": "2026-11-22",
      "total_seats": 35,
      "available_seats": 11,
      "adult_price": 2190000,
      "child_price": 1533000,
      "status": "open",
      "guide_id": "emp_5",
      "guide_name": "Vũ Đình Tuấn (HDV)"
    },
    {
      "id": "dep_24",
      "tour_id": "tour_11",
      "start_date": "2026-12-05",
      "end_date": "2026-12-06",
      "total_seats": 35,
      "available_seats": 28,
      "adult_price": 2190000,
      "child_price": 1533000,
      "status": "open",
      "guide_id": "emp_5",
      "guide_name": "Vũ Đình Tuấn (HDV)"
    },
    {
      "id": "dep_25",
      "tour_id": "tour_12",
      "start_date": "2026-11-28",
      "end_date": "2026-11-29",
      "total_seats": 25,
      "available_seats": 10,
      "adult_price": 2750000,
      "child_price": 1925000,
      "status": "open",
      "guide_id": "emp_6",
      "guide_name": "Đặng Mai Chi (HDV)"
    },
    {
      "id": "dep_26",
      "tour_id": "tour_12",
      "start_date": "2026-12-12",
      "end_date": "2026-12-13",
      "total_seats": 25,
      "available_seats": 20,
      "adult_price": 2750000,
      "child_price": 1925000,
      "status": "open",
      "guide_id": "emp_6",
      "guide_name": "Đặng Mai Chi (HDV)"
    },
    {
      "id": "dep_27",
      "tour_id": "tour_13",
      "start_date": "2026-11-27",
      "end_date": "2026-11-29",
      "total_seats": 30,
      "available_seats": 8,
      "adult_price": 4350000,
      "child_price": 3045000,
      "status": "open",
      "guide_id": "emp_4",
      "guide_name": "Nguyễn Hoàng Nam (HDV)"
    },
    {
      "id": "dep_28",
      "tour_id": "tour_13",
      "start_date": "2026-12-10",
      "end_date": "2026-12-12",
      "total_seats": 30,
      "available_seats": 22,
      "adult_price": 4350000,
      "child_price": 3045000,
      "status": "open",
      "guide_id": "emp_4",
      "guide_name": "Nguyễn Hoàng Nam (HDV)"
    },
    {
      "id": "dep_29",
      "tour_id": "tour_14",
      "start_date": "2026-11-21",
      "end_date": "2026-11-22",
      "total_seats": 28,
      "available_seats": 14,
      "adult_price": 2350000,
      "child_price": 1645000,
      "status": "open",
      "guide_id": "emp_5",
      "guide_name": "Vũ Đình Tuấn (HDV)"
    },
    {
      "id": "dep_30",
      "tour_id": "tour_15",
      "start_date": "2026-11-22",
      "end_date": "2026-11-22",
      "total_seats": 40,
      "available_seats": 15,
      "adult_price": 1490000,
      "child_price": 1043000,
      "status": "open",
      "guide_id": "emp_7",
      "guide_name": "Bùi Văn Hậu (HDV)"
    }
  ],
  "bookings": [
    {
      "id": "bk_1",
      "booking_code": "BK-2026-001",
      "customer_id": "cust_1",
      "customer_name": "Nguyễn Văn An",
      "customer_email": "an.nguyen@gmail.com",
      "customer_phone": "0901234001",
      "tour_id": "tour_1",
      "tour_title": "Du Thuyền 5 Sao Vịnh Hạ Long - Vịnh Lan Hạ Đẳng Cấp",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg",
      "departure_id": "dep_1",
      "departure_date": "2026-10-15",
      "return_date": "2026-10-16",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 6500000,
      "booking_status": "completed",
      "payment_status": "paid",
      "payment_method": "MOMO",
      "passengers": [
        {
          "name": "Nguyễn Văn An",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234001",
          "id_card": "00109000011"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000012"
        }
      ],
      "created_at": "2026-11-02 10:02:00"
    },
    {
      "id": "bk_2",
      "booking_code": "BK-2026-002",
      "customer_id": "cust_2",
      "customer_name": "Trần Thị Bích",
      "customer_email": "bich.tran@gmail.com",
      "customer_phone": "0901234002",
      "tour_id": "tour_1",
      "tour_title": "Du Thuyền 5 Sao Vịnh Hạ Long - Vịnh Lan Hạ Đẳng Cấp",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg",
      "departure_id": "dep_2",
      "departure_date": "2026-11-28",
      "return_date": "2026-11-29",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 6500000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Chuyển khoản QR",
      "passengers": [
        {
          "name": "Trần Thị Bích",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234002",
          "id_card": "00109000021"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000022"
        }
      ],
      "created_at": "2026-11-03 10:04:00"
    },
    {
      "id": "bk_3",
      "booking_code": "BK-2026-003",
      "customer_id": "cust_3",
      "customer_name": "Lê Văn Cường",
      "customer_email": "cuong.le@gmail.com",
      "customer_phone": "0901234003",
      "tour_id": "tour_1",
      "tour_title": "Du Thuyền 5 Sao Vịnh Hạ Long - Vịnh Lan Hạ Đẳng Cấp",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg",
      "departure_id": "dep_3",
      "departure_date": "2026-12-05",
      "return_date": "2026-12-06",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 3250000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Tiền mặt",
      "passengers": [
        {
          "name": "Lê Văn Cường",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234003",
          "id_card": "00109000031"
        }
      ],
      "created_at": "2026-11-04 10:06:00"
    },
    {
      "id": "bk_4",
      "booking_code": "BK-2026-004",
      "customer_id": "cust_4",
      "customer_name": "Phạm Thu Dung",
      "customer_email": "dung.pham@gmail.com",
      "customer_phone": "0901234004",
      "tour_id": "tour_2",
      "tour_title": "Đà Nẵng - Bán Đảo Sơn Trà - Phố Cổ Hội An Lung Linh",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1559592413-7cec4d0cae2b_w1200.jpg",
      "departure_id": "dep_4",
      "departure_date": "2026-11-22",
      "return_date": "2026-11-24",
      "adults_count": 2,
      "children_count": 1,
      "total_amount": 12393000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Thẻ tín dụng",
      "passengers": [
        {
          "name": "Phạm Thu Dung",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234004",
          "id_card": "00109000041"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000042"
        },
        {
          "name": "Bé Dung 1",
          "gender": "Nam",
          "birth_date": "2018-08-10",
          "type": "child",
          "phone": "",
          "id_card": ""
        }
      ],
      "created_at": "2026-11-05 10:08:00"
    },
    {
      "id": "bk_5",
      "booking_code": "BK-2026-005",
      "customer_id": "cust_5",
      "customer_name": "Hoàng Đức Em",
      "customer_email": "em.hoang@gmail.com",
      "customer_phone": "0901234005",
      "tour_id": "tour_2",
      "tour_title": "Đà Nẵng - Bán Đảo Sơn Trà - Phố Cổ Hội An Lung Linh",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1559592413-7cec4d0cae2b_w1200.jpg",
      "departure_id": "dep_5",
      "departure_date": "2026-12-01",
      "return_date": "2026-12-03",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 9180000,
      "booking_status": "pending",
      "payment_status": "pending",
      "payment_method": "VNPAY",
      "passengers": [
        {
          "name": "Hoàng Đức Em",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234005",
          "id_card": "00109000051"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000052"
        }
      ],
      "created_at": "2026-11-06 10:10:00"
    },
    {
      "id": "bk_6",
      "booking_code": "BK-2026-006",
      "customer_id": "cust_6",
      "customer_name": "Vũ Kim Giang",
      "customer_email": "giang.vu@gmail.com",
      "customer_phone": "0901234006",
      "tour_id": "tour_2",
      "tour_title": "Đà Nẵng - Bán Đảo Sơn Trà - Phố Cổ Hội An Lung Linh",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1559592413-7cec4d0cae2b_w1200.jpg",
      "departure_id": "dep_6",
      "departure_date": "2026-12-10",
      "return_date": "2026-12-12",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 4590000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "MOMO",
      "passengers": [
        {
          "name": "Vũ Kim Giang",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234006",
          "id_card": "00109000061"
        }
      ],
      "created_at": "2026-11-07 10:12:00"
    },
    {
      "id": "bk_7",
      "booking_code": "BK-2026-007",
      "customer_id": "cust_7",
      "customer_name": "Đặng Quang Huy",
      "customer_email": "huy.dang@gmail.com",
      "customer_phone": "0901234007",
      "tour_id": "tour_3",
      "tour_title": "Sapa Tuyệt Tác Ruộng Bậc Thang - Đỉnh Fansipan Hùng Vĩ",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg",
      "departure_id": "dep_7",
      "departure_date": "2026-11-25",
      "return_date": "2026-11-27",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 7780000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Chuyển khoản QR",
      "passengers": [
        {
          "name": "Đặng Quang Huy",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234007",
          "id_card": "00109000071"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000072"
        }
      ],
      "created_at": "2026-11-08 10:14:00"
    },
    {
      "id": "bk_8",
      "booking_code": "BK-2026-008",
      "customer_id": "cust_8",
      "customer_name": "Bùi Thùy Linh",
      "customer_email": "linh.bui@gmail.com",
      "customer_phone": "0901234008",
      "tour_id": "tour_3",
      "tour_title": "Sapa Tuyệt Tác Ruộng Bậc Thang - Đỉnh Fansipan Hùng Vĩ",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1544644181-1484b3fdfc62_w1200.jpg",
      "departure_id": "dep_8",
      "departure_date": "2026-12-08",
      "return_date": "2026-12-10",
      "adults_count": 2,
      "children_count": 1,
      "total_amount": 10503000,
      "booking_status": "cancelled",
      "payment_status": "refunded",
      "payment_method": "Tiền mặt",
      "passengers": [
        {
          "name": "Bùi Thùy Linh",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234008",
          "id_card": "00109000081"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000082"
        },
        {
          "name": "Bé Linh 1",
          "gender": "Nam",
          "birth_date": "2018-08-10",
          "type": "child",
          "phone": "",
          "id_card": ""
        }
      ],
      "created_at": "2026-11-09 10:16:00"
    },
    {
      "id": "bk_9",
      "booking_code": "BK-2026-009",
      "customer_id": "cust_9",
      "customer_name": "Đỗ Tuấn Minh",
      "customer_email": "minh.do@gmail.com",
      "customer_phone": "0901234009",
      "tour_id": "tour_4",
      "tour_title": "Phú Quốc Đảo Ngọc - Trải Nghiệm Cáp Treo Hòn Thơm & Sunset Sanato",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1571896349842-33c89424de2d_w1200.jpg",
      "departure_id": "dep_9",
      "departure_date": "2026-11-26",
      "return_date": "2026-11-29",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 5990000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Thẻ tín dụng",
      "passengers": [
        {
          "name": "Đỗ Tuấn Minh",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234009",
          "id_card": "00109000091"
        }
      ],
      "created_at": "2026-11-10 10:18:00"
    },
    {
      "id": "bk_10",
      "booking_code": "BK-2026-010",
      "customer_id": "cust_10",
      "customer_name": "Ngô Mai Nga",
      "customer_email": "nga.ngo@gmail.com",
      "customer_phone": "0901234010",
      "tour_id": "tour_4",
      "tour_title": "Phú Quốc Đảo Ngọc - Trải Nghiệm Cáp Treo Hòn Thơm & Sunset Sanato",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1571896349842-33c89424de2d_w1200.jpg",
      "departure_id": "dep_10",
      "departure_date": "2026-12-04",
      "return_date": "2026-12-07",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 11980000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "VNPAY",
      "passengers": [
        {
          "name": "Ngô Mai Nga",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234010",
          "id_card": "00109000101"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000102"
        }
      ],
      "created_at": "2026-11-11 10:20:00"
    },
    {
      "id": "bk_11",
      "booking_code": "BK-2026-011",
      "customer_id": "cust_11",
      "customer_name": "Dương Bảo Phúc",
      "customer_email": "phuc.duong@gmail.com",
      "customer_phone": "0901234011",
      "tour_id": "tour_5",
      "tour_title": "Ninh Bình Cố Đô Tràng An - Hang Múa - Bái Đính Thiêng Liêng",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1578632767115-351597cf2477_w1200.jpg",
      "departure_id": "dep_11",
      "departure_date": "2026-11-21",
      "return_date": "2026-11-22",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 4900000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "MOMO",
      "passengers": [
        {
          "name": "Dương Bảo Phúc",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234011",
          "id_card": "00109000111"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000112"
        }
      ],
      "created_at": "2026-11-12 10:22:00"
    },
    {
      "id": "bk_12",
      "booking_code": "BK-2026-012",
      "customer_id": "cust_12",
      "customer_name": "Lý Ngọc Quyên",
      "customer_email": "quyen.ly@gmail.com",
      "customer_phone": "0901234012",
      "tour_id": "tour_5",
      "tour_title": "Ninh Bình Cố Đô Tràng An - Hang Múa - Bái Đính Thiêng Liêng",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1578632767115-351597cf2477_w1200.jpg",
      "departure_id": "dep_12",
      "departure_date": "2026-12-05",
      "return_date": "2026-12-06",
      "adults_count": 1,
      "children_count": 1,
      "total_amount": 4165000,
      "booking_status": "pending",
      "payment_status": "pending",
      "payment_method": "Chuyển khoản QR",
      "passengers": [
        {
          "name": "Lý Ngọc Quyên",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234012",
          "id_card": "00109000121"
        },
        {
          "name": "Bé Quyên 1",
          "gender": "Nam",
          "birth_date": "2018-08-10",
          "type": "child",
          "phone": "",
          "id_card": ""
        }
      ],
      "created_at": "2026-11-13 10:24:00"
    },
    {
      "id": "bk_13",
      "booking_code": "BK-2026-013",
      "customer_id": "cust_13",
      "customer_name": "Phan Hữu Sang",
      "customer_email": "sang.phan@gmail.com",
      "customer_phone": "0901234013",
      "tour_id": "tour_6",
      "tour_title": "Thám Hiểm Động Phong Nha & Động Thiên Đường - Quảng Bình",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1506744038136-46273834b3fb_w1200.jpg",
      "departure_id": "dep_13",
      "departure_date": "2026-11-27",
      "return_date": "2026-11-29",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 8400000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Tiền mặt",
      "passengers": [
        {
          "name": "Phan Hữu Sang",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234013",
          "id_card": "00109000131"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000132"
        }
      ],
      "created_at": "2026-11-14 10:26:00"
    },
    {
      "id": "bk_14",
      "booking_code": "BK-2026-014",
      "customer_id": "cust_14",
      "customer_name": "Tạ Phương Thảo",
      "customer_email": "thao.ta@gmail.com",
      "customer_phone": "0901234014",
      "tour_id": "tour_6",
      "tour_title": "Thám Hiểm Động Phong Nha & Động Thiên Đường - Quảng Bình",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1506744038136-46273834b3fb_w1200.jpg",
      "departure_id": "dep_14",
      "departure_date": "2026-12-11",
      "return_date": "2026-12-13",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 8400000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Thẻ tín dụng",
      "passengers": [
        {
          "name": "Tạ Phương Thảo",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234014",
          "id_card": "00109000141"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000142"
        }
      ],
      "created_at": "2026-11-01 10:28:00"
    },
    {
      "id": "bk_15",
      "booking_code": "BK-2026-015",
      "customer_id": "cust_15",
      "customer_name": "Võ Thành Trung",
      "customer_email": "trung.vo@gmail.com",
      "customer_phone": "0901234015",
      "tour_id": "tour_7",
      "tour_title": "Đà Lạt Mộng Mơ - Săn Mây Cầu Đất & Đồi Chè Xanh Ngát",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1501555088652-021faa106b9b_w1200.jpg",
      "departure_id": "dep_15",
      "departure_date": "2026-11-23",
      "return_date": "2026-11-25",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 3150000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "VNPAY",
      "passengers": [
        {
          "name": "Võ Thành Trung",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234015",
          "id_card": "00109000151"
        }
      ],
      "created_at": "2026-11-02 10:30:00"
    },
    {
      "id": "bk_16",
      "booking_code": "BK-2026-016",
      "customer_id": "cust_16",
      "customer_name": "Hồ Khánh Uyên",
      "customer_email": "uyen.ho@gmail.com",
      "customer_phone": "0901234016",
      "tour_id": "tour_7",
      "tour_title": "Đà Lạt Mộng Mơ - Săn Mây Cầu Đất & Đồi Chè Xanh Ngát",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1501555088652-021faa106b9b_w1200.jpg",
      "departure_id": "dep_16",
      "departure_date": "2026-12-07",
      "return_date": "2026-12-09",
      "adults_count": 2,
      "children_count": 1,
      "total_amount": 8505000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "MOMO",
      "passengers": [
        {
          "name": "Hồ Khánh Uyên",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234016",
          "id_card": "00109000161"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000162"
        },
        {
          "name": "Bé Uyên 1",
          "gender": "Nam",
          "birth_date": "2018-08-10",
          "type": "child",
          "phone": "",
          "id_card": ""
        }
      ],
      "created_at": "2026-11-03 10:32:00"
    },
    {
      "id": "bk_17",
      "booking_code": "BK-2026-017",
      "customer_id": "cust_17",
      "customer_name": "Mai Gia Vũ",
      "customer_email": "vu.mai@gmail.com",
      "customer_phone": "0901234017",
      "tour_id": "tour_8",
      "tour_title": "Quy Nhơn - Phú Yên: Xứ Sở Hoa Vàng Trên Cỏ Xanh & Kỳ Co Eo Gió",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1507525428034-b723cf961d3e_w1200.jpg",
      "departure_id": "dep_17",
      "departure_date": "2026-11-29",
      "return_date": "2026-12-02",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 10900000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Chuyển khoản QR",
      "passengers": [
        {
          "name": "Mai Gia Vũ",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234017",
          "id_card": "00109000171"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000172"
        }
      ],
      "created_at": "2026-11-04 10:34:00"
    },
    {
      "id": "bk_18",
      "booking_code": "BK-2026-018",
      "customer_id": "cust_18",
      "customer_name": "Đinh Như Ý",
      "customer_email": "y.dinh@gmail.com",
      "customer_phone": "0901234018",
      "tour_id": "tour_8",
      "tour_title": "Quy Nhơn - Phú Yên: Xứ Sở Hoa Vàng Trên Cỏ Xanh & Kỳ Co Eo Gió",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1507525428034-b723cf961d3e_w1200.jpg",
      "departure_id": "dep_18",
      "departure_date": "2026-12-14",
      "return_date": "2026-12-17",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 5450000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Tiền mặt",
      "passengers": [
        {
          "name": "Đinh Như Ý",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234018",
          "id_card": "00109000181"
        }
      ],
      "created_at": "2026-11-05 10:36:00"
    },
    {
      "id": "bk_19",
      "booking_code": "BK-2026-019",
      "customer_id": "cust_19",
      "customer_name": "Trịnh Hoàng Long",
      "customer_email": "long.trinh@gmail.com",
      "customer_phone": "0901234019",
      "tour_id": "tour_9",
      "tour_title": "Hà Giang Mùa Hoa Tam Giác Mạch - Cột Cờ Lũng Cú & Đèo Mã Pí Lèng",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1580837119756-563d608dd119_w1200.jpg",
      "departure_id": "dep_19",
      "departure_date": "2026-11-24",
      "return_date": "2026-11-26",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 7300000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Thẻ tín dụng",
      "passengers": [
        {
          "name": "Trịnh Hoàng Long",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234019",
          "id_card": "00109000191"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000192"
        }
      ],
      "created_at": "2026-11-06 10:38:00"
    },
    {
      "id": "bk_20",
      "booking_code": "BK-2026-020",
      "customer_id": "cust_20",
      "customer_name": "Chu Kim Yến",
      "customer_email": "yen.chu@gmail.com",
      "customer_phone": "0901234020",
      "tour_id": "tour_9",
      "tour_title": "Hà Giang Mùa Hoa Tam Giác Mạch - Cột Cờ Lũng Cú & Đèo Mã Pí Lèng",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1580837119756-563d608dd119_w1200.jpg",
      "departure_id": "dep_20",
      "departure_date": "2026-12-08",
      "return_date": "2026-12-10",
      "adults_count": 2,
      "children_count": 1,
      "total_amount": 9855000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "VNPAY",
      "passengers": [
        {
          "name": "Chu Kim Yến",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234020",
          "id_card": "00109000201"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000202"
        },
        {
          "name": "Bé Yến 1",
          "gender": "Nam",
          "birth_date": "2018-08-10",
          "type": "child",
          "phone": "",
          "id_card": ""
        }
      ],
      "created_at": "2026-11-07 10:40:00"
    },
    {
      "id": "bk_21",
      "booking_code": "BK-2026-021",
      "customer_id": "cust_1",
      "customer_name": "Nguyễn Văn An",
      "customer_email": "an.nguyen@gmail.com",
      "customer_phone": "0901234001",
      "tour_id": "tour_10",
      "tour_title": "Côn Đảo Tâm Linh & Nghỉ Dưỡng Thiên Đường Hoang Sơ",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1519046904884-53103b34b206_w1200.jpg",
      "departure_id": "dep_21",
      "departure_date": "2026-11-30",
      "return_date": "2026-12-02",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 6800000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "MOMO",
      "passengers": [
        {
          "name": "Nguyễn Văn An",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234001",
          "id_card": "00109000211"
        }
      ],
      "created_at": "2026-11-08 10:42:00"
    },
    {
      "id": "bk_22",
      "booking_code": "BK-2026-022",
      "customer_id": "cust_2",
      "customer_name": "Trần Thị Bích",
      "customer_email": "bich.tran@gmail.com",
      "customer_phone": "0901234002",
      "tour_id": "tour_10",
      "tour_title": "Côn Đảo Tâm Linh & Nghỉ Dưỡng Thiên Đường Hoang Sơ",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1519046904884-53103b34b206_w1200.jpg",
      "departure_id": "dep_22",
      "departure_date": "2026-12-15",
      "return_date": "2026-12-17",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 13600000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Chuyển khoản QR",
      "passengers": [
        {
          "name": "Trần Thị Bích",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234002",
          "id_card": "00109000221"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000222"
        }
      ],
      "created_at": "2026-11-09 10:44:00"
    },
    {
      "id": "bk_23",
      "booking_code": "BK-2026-023",
      "customer_id": "cust_3",
      "customer_name": "Lê Văn Cường",
      "customer_email": "cuong.le@gmail.com",
      "customer_phone": "0901234003",
      "tour_id": "tour_11",
      "tour_title": "Miền Tây Sông Nước: Cần Thơ - Chợ Nổi Cái Răng - Rừng Tràm Trà Sư",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1596401057633-54a8fe8ef647_w1200.jpg",
      "departure_id": "dep_23",
      "departure_date": "2026-11-21",
      "return_date": "2026-11-22",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 4380000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Tiền mặt",
      "passengers": [
        {
          "name": "Lê Văn Cường",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234003",
          "id_card": "00109000231"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000232"
        }
      ],
      "created_at": "2026-11-10 10:46:00"
    },
    {
      "id": "bk_24",
      "booking_code": "BK-2026-024",
      "customer_id": "cust_4",
      "customer_name": "Phạm Thu Dung",
      "customer_email": "dung.pham@gmail.com",
      "customer_phone": "0901234004",
      "tour_id": "tour_11",
      "tour_title": "Miền Tây Sông Nước: Cần Thơ - Chợ Nổi Cái Răng - Rừng Tràm Trà Sư",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1596401057633-54a8fe8ef647_w1200.jpg",
      "departure_id": "dep_24",
      "departure_date": "2026-12-05",
      "return_date": "2026-12-06",
      "adults_count": 1,
      "children_count": 1,
      "total_amount": 3723000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Thẻ tín dụng",
      "passengers": [
        {
          "name": "Phạm Thu Dung",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234004",
          "id_card": "00109000241"
        },
        {
          "name": "Bé Dung 1",
          "gender": "Nam",
          "birth_date": "2018-08-10",
          "type": "child",
          "phone": "",
          "id_card": ""
        }
      ],
      "created_at": "2026-11-11 10:48:00"
    },
    {
      "id": "bk_25",
      "booking_code": "BK-2026-025",
      "customer_id": "cust_5",
      "customer_name": "Hoàng Đức Em",
      "customer_email": "em.hoang@gmail.com",
      "customer_phone": "0901234005",
      "tour_id": "tour_12",
      "tour_title": "Huế Cố Đô Ngàn Năm - Lăng Tẩm Hoàng Gia & Ca Huế Sông Hương",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1584448141569-69f342da535c_w1200.jpg",
      "departure_id": "dep_25",
      "departure_date": "2026-11-28",
      "return_date": "2026-11-29",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 5500000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "VNPAY",
      "passengers": [
        {
          "name": "Hoàng Đức Em",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234005",
          "id_card": "00109000251"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000252"
        }
      ],
      "created_at": "2026-11-12 10:50:00"
    },
    {
      "id": "bk_26",
      "booking_code": "BK-2026-026",
      "customer_id": "cust_6",
      "customer_name": "Vũ Kim Giang",
      "customer_email": "giang.vu@gmail.com",
      "customer_phone": "0901234006",
      "tour_id": "tour_12",
      "tour_title": "Huế Cố Đô Ngàn Năm - Lăng Tẩm Hoàng Gia & Ca Huế Sông Hương",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1584448141569-69f342da535c_w1200.jpg",
      "departure_id": "dep_26",
      "departure_date": "2026-12-12",
      "return_date": "2026-12-13",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 5500000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "MOMO",
      "passengers": [
        {
          "name": "Vũ Kim Giang",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234006",
          "id_card": "00109000261"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000262"
        }
      ],
      "created_at": "2026-11-13 10:52:00"
    },
    {
      "id": "bk_27",
      "booking_code": "BK-2026-027",
      "customer_id": "cust_7",
      "customer_name": "Đặng Quang Huy",
      "customer_email": "huy.dang@gmail.com",
      "customer_phone": "0901234007",
      "tour_id": "tour_13",
      "tour_title": "Nha Trang Vịnh Ngọc - Lặn Biển Hòn Mun & VinWonders Đỉnh Cao",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1540555700478-4be289fbecef_w1200.jpg",
      "departure_id": "dep_27",
      "departure_date": "2026-11-27",
      "return_date": "2026-11-29",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 4350000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Chuyển khoản QR",
      "passengers": [
        {
          "name": "Đặng Quang Huy",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234007",
          "id_card": "00109000271"
        }
      ],
      "created_at": "2026-11-14 10:54:00"
    },
    {
      "id": "bk_28",
      "booking_code": "BK-2026-028",
      "customer_id": "cust_8",
      "customer_name": "Bùi Thùy Linh",
      "customer_email": "linh.bui@gmail.com",
      "customer_phone": "0901234008",
      "tour_id": "tour_13",
      "tour_title": "Nha Trang Vịnh Ngọc - Lặn Biển Hòn Mun & VinWonders Đỉnh Cao",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1540555700478-4be289fbecef_w1200.jpg",
      "departure_id": "dep_28",
      "departure_date": "2026-12-10",
      "return_date": "2026-12-12",
      "adults_count": 2,
      "children_count": 1,
      "total_amount": 11745000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Tiền mặt",
      "passengers": [
        {
          "name": "Bùi Thùy Linh",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234008",
          "id_card": "00109000281"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000282"
        },
        {
          "name": "Bé Linh 1",
          "gender": "Nam",
          "birth_date": "2018-08-10",
          "type": "child",
          "phone": "",
          "id_card": ""
        }
      ],
      "created_at": "2026-11-01 10:56:00"
    },
    {
      "id": "bk_29",
      "booking_code": "BK-2026-029",
      "customer_id": "cust_9",
      "customer_name": "Đỗ Tuấn Minh",
      "customer_email": "minh.do@gmail.com",
      "customer_phone": "0901234009",
      "tour_id": "tour_14",
      "tour_title": "Mũi Né - Phan Thiết: Trượt Cát Đỏ & Khám Phá Bàu Trắng Mộng Mơ",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1476514525535-07fb3b4ae5f1_w1200.jpg",
      "departure_id": "dep_29",
      "departure_date": "2026-11-21",
      "return_date": "2026-11-22",
      "adults_count": 2,
      "children_count": 0,
      "total_amount": 4700000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "Thẻ tín dụng",
      "passengers": [
        {
          "name": "Đỗ Tuấn Minh",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234009",
          "id_card": "00109000291"
        },
        {
          "name": "Hành khách 2",
          "gender": "Nữ",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0900000000",
          "id_card": "00109000292"
        }
      ],
      "created_at": "2026-11-02 10:58:00"
    },
    {
      "id": "bk_30",
      "booking_code": "BK-2026-030",
      "customer_id": "cust_10",
      "customer_name": "Ngô Mai Nga",
      "customer_email": "nga.ngo@gmail.com",
      "customer_phone": "0901234010",
      "tour_id": "tour_15",
      "tour_title": "Tây Ninh Nắng Cháy - Chinh Phục Đỉnh Núi Bà Đen & Tòa Thánh",
      "tour_image": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1509042239860-f550ce710b93_w1200.jpg",
      "departure_id": "dep_30",
      "departure_date": "2026-11-22",
      "return_date": "2026-11-22",
      "adults_count": 1,
      "children_count": 0,
      "total_amount": 1490000,
      "booking_status": "confirmed",
      "payment_status": "paid",
      "payment_method": "VNPAY",
      "passengers": [
        {
          "name": "Ngô Mai Nga",
          "gender": "Nam",
          "birth_date": "1990-05-15",
          "type": "adult",
          "phone": "0901234010",
          "id_card": "00109000301"
        }
      ],
      "created_at": "2026-11-03 10:00:00"
    }
  ],
  "transactions": [
    {
      "id": "tx_1",
      "transaction_code": "TXN-2026-001",
      "booking_id": "bk_1",
      "booking_code": "BK-2026-001",
      "customer_id": "cust_1",
      "customer_name": "Nguyễn Văn An",
      "amount": 6500000,
      "payment_method": "MOMO",
      "status": "success",
      "created_at": "2026-11-02 10:02:00"
    },
    {
      "id": "tx_2",
      "transaction_code": "TXN-2026-002",
      "booking_id": "bk_2",
      "booking_code": "BK-2026-002",
      "customer_id": "cust_2",
      "customer_name": "Trần Thị Bích",
      "amount": 6500000,
      "payment_method": "Chuyển khoản QR",
      "status": "success",
      "created_at": "2026-11-03 10:04:00"
    },
    {
      "id": "tx_3",
      "transaction_code": "TXN-2026-003",
      "booking_id": "bk_3",
      "booking_code": "BK-2026-003",
      "customer_id": "cust_3",
      "customer_name": "Lê Văn Cường",
      "amount": 3250000,
      "payment_method": "Tiền mặt",
      "status": "success",
      "created_at": "2026-11-04 10:06:00"
    },
    {
      "id": "tx_4",
      "transaction_code": "TXN-2026-004",
      "booking_id": "bk_4",
      "booking_code": "BK-2026-004",
      "customer_id": "cust_4",
      "customer_name": "Phạm Thu Dung",
      "amount": 12393000,
      "payment_method": "Thẻ tín dụng",
      "status": "success",
      "created_at": "2026-11-05 10:08:00"
    },
    {
      "id": "tx_5",
      "transaction_code": "TXN-2026-005",
      "booking_id": "bk_5",
      "booking_code": "BK-2026-005",
      "customer_id": "cust_5",
      "customer_name": "Hoàng Đức Em",
      "amount": 9180000,
      "payment_method": "VNPAY",
      "status": "pending",
      "created_at": "2026-11-06 10:10:00"
    },
    {
      "id": "tx_6",
      "transaction_code": "TXN-2026-006",
      "booking_id": "bk_6",
      "booking_code": "BK-2026-006",
      "customer_id": "cust_6",
      "customer_name": "Vũ Kim Giang",
      "amount": 4590000,
      "payment_method": "MOMO",
      "status": "success",
      "created_at": "2026-11-07 10:12:00"
    },
    {
      "id": "tx_7",
      "transaction_code": "TXN-2026-007",
      "booking_id": "bk_7",
      "booking_code": "BK-2026-007",
      "customer_id": "cust_7",
      "customer_name": "Đặng Quang Huy",
      "amount": 7780000,
      "payment_method": "Chuyển khoản QR",
      "status": "success",
      "created_at": "2026-11-08 10:14:00"
    },
    {
      "id": "tx_8",
      "transaction_code": "TXN-2026-008",
      "booking_id": "bk_8",
      "booking_code": "BK-2026-008",
      "customer_id": "cust_8",
      "customer_name": "Bùi Thùy Linh",
      "amount": 10503000,
      "payment_method": "Tiền mặt",
      "status": "refunded",
      "created_at": "2026-11-09 10:16:00"
    },
    {
      "id": "tx_9",
      "transaction_code": "TXN-2026-009",
      "booking_id": "bk_9",
      "booking_code": "BK-2026-009",
      "customer_id": "cust_9",
      "customer_name": "Đỗ Tuấn Minh",
      "amount": 5990000,
      "payment_method": "Thẻ tín dụng",
      "status": "success",
      "created_at": "2026-11-10 10:18:00"
    },
    {
      "id": "tx_10",
      "transaction_code": "TXN-2026-010",
      "booking_id": "bk_10",
      "booking_code": "BK-2026-010",
      "customer_id": "cust_10",
      "customer_name": "Ngô Mai Nga",
      "amount": 11980000,
      "payment_method": "VNPAY",
      "status": "success",
      "created_at": "2026-11-11 10:20:00"
    },
    {
      "id": "tx_11",
      "transaction_code": "TXN-2026-011",
      "booking_id": "bk_11",
      "booking_code": "BK-2026-011",
      "customer_id": "cust_11",
      "customer_name": "Dương Bảo Phúc",
      "amount": 4900000,
      "payment_method": "MOMO",
      "status": "success",
      "created_at": "2026-11-12 10:22:00"
    },
    {
      "id": "tx_12",
      "transaction_code": "TXN-2026-012",
      "booking_id": "bk_12",
      "booking_code": "BK-2026-012",
      "customer_id": "cust_12",
      "customer_name": "Lý Ngọc Quyên",
      "amount": 4165000,
      "payment_method": "Chuyển khoản QR",
      "status": "pending",
      "created_at": "2026-11-13 10:24:00"
    },
    {
      "id": "tx_13",
      "transaction_code": "TXN-2026-013",
      "booking_id": "bk_13",
      "booking_code": "BK-2026-013",
      "customer_id": "cust_13",
      "customer_name": "Phan Hữu Sang",
      "amount": 8400000,
      "payment_method": "Tiền mặt",
      "status": "success",
      "created_at": "2026-11-14 10:26:00"
    },
    {
      "id": "tx_14",
      "transaction_code": "TXN-2026-014",
      "booking_id": "bk_14",
      "booking_code": "BK-2026-014",
      "customer_id": "cust_14",
      "customer_name": "Tạ Phương Thảo",
      "amount": 8400000,
      "payment_method": "Thẻ tín dụng",
      "status": "success",
      "created_at": "2026-11-01 10:28:00"
    },
    {
      "id": "tx_15",
      "transaction_code": "TXN-2026-015",
      "booking_id": "bk_15",
      "booking_code": "BK-2026-015",
      "customer_id": "cust_15",
      "customer_name": "Võ Thành Trung",
      "amount": 3150000,
      "payment_method": "VNPAY",
      "status": "success",
      "created_at": "2026-11-02 10:30:00"
    },
    {
      "id": "tx_16",
      "transaction_code": "TXN-2026-016",
      "booking_id": "bk_16",
      "booking_code": "BK-2026-016",
      "customer_id": "cust_16",
      "customer_name": "Hồ Khánh Uyên",
      "amount": 8505000,
      "payment_method": "MOMO",
      "status": "success",
      "created_at": "2026-11-03 10:32:00"
    },
    {
      "id": "tx_17",
      "transaction_code": "TXN-2026-017",
      "booking_id": "bk_17",
      "booking_code": "BK-2026-017",
      "customer_id": "cust_17",
      "customer_name": "Mai Gia Vũ",
      "amount": 10900000,
      "payment_method": "Chuyển khoản QR",
      "status": "success",
      "created_at": "2026-11-04 10:34:00"
    },
    {
      "id": "tx_18",
      "transaction_code": "TXN-2026-018",
      "booking_id": "bk_18",
      "booking_code": "BK-2026-018",
      "customer_id": "cust_18",
      "customer_name": "Đinh Như Ý",
      "amount": 5450000,
      "payment_method": "Tiền mặt",
      "status": "success",
      "created_at": "2026-11-05 10:36:00"
    },
    {
      "id": "tx_19",
      "transaction_code": "TXN-2026-019",
      "booking_id": "bk_19",
      "booking_code": "BK-2026-019",
      "customer_id": "cust_19",
      "customer_name": "Trịnh Hoàng Long",
      "amount": 7300000,
      "payment_method": "Thẻ tín dụng",
      "status": "success",
      "created_at": "2026-11-06 10:38:00"
    },
    {
      "id": "tx_20",
      "transaction_code": "TXN-2026-020",
      "booking_id": "bk_20",
      "booking_code": "BK-2026-020",
      "customer_id": "cust_20",
      "customer_name": "Chu Kim Yến",
      "amount": 9855000,
      "payment_method": "VNPAY",
      "status": "success",
      "created_at": "2026-11-07 10:40:00"
    },
    {
      "id": "tx_21",
      "transaction_code": "TXN-2026-021",
      "booking_id": "bk_21",
      "booking_code": "BK-2026-021",
      "customer_id": "cust_1",
      "customer_name": "Nguyễn Văn An",
      "amount": 6800000,
      "payment_method": "MOMO",
      "status": "success",
      "created_at": "2026-11-08 10:42:00"
    },
    {
      "id": "tx_22",
      "transaction_code": "TXN-2026-022",
      "booking_id": "bk_22",
      "booking_code": "BK-2026-022",
      "customer_id": "cust_2",
      "customer_name": "Trần Thị Bích",
      "amount": 13600000,
      "payment_method": "Chuyển khoản QR",
      "status": "success",
      "created_at": "2026-11-09 10:44:00"
    },
    {
      "id": "tx_23",
      "transaction_code": "TXN-2026-023",
      "booking_id": "bk_23",
      "booking_code": "BK-2026-023",
      "customer_id": "cust_3",
      "customer_name": "Lê Văn Cường",
      "amount": 4380000,
      "payment_method": "Tiền mặt",
      "status": "success",
      "created_at": "2026-11-10 10:46:00"
    },
    {
      "id": "tx_24",
      "transaction_code": "TXN-2026-024",
      "booking_id": "bk_24",
      "booking_code": "BK-2026-024",
      "customer_id": "cust_4",
      "customer_name": "Phạm Thu Dung",
      "amount": 3723000,
      "payment_method": "Thẻ tín dụng",
      "status": "success",
      "created_at": "2026-11-11 10:48:00"
    },
    {
      "id": "tx_25",
      "transaction_code": "TXN-2026-025",
      "booking_id": "bk_25",
      "booking_code": "BK-2026-025",
      "customer_id": "cust_5",
      "customer_name": "Hoàng Đức Em",
      "amount": 5500000,
      "payment_method": "VNPAY",
      "status": "success",
      "created_at": "2026-11-12 10:50:00"
    },
    {
      "id": "tx_26",
      "transaction_code": "TXN-2026-026",
      "booking_id": "bk_26",
      "booking_code": "BK-2026-026",
      "customer_id": "cust_6",
      "customer_name": "Vũ Kim Giang",
      "amount": 5500000,
      "payment_method": "MOMO",
      "status": "success",
      "created_at": "2026-11-13 10:52:00"
    },
    {
      "id": "tx_27",
      "transaction_code": "TXN-2026-027",
      "booking_id": "bk_27",
      "booking_code": "BK-2026-027",
      "customer_id": "cust_7",
      "customer_name": "Đặng Quang Huy",
      "amount": 4350000,
      "payment_method": "Chuyển khoản QR",
      "status": "success",
      "created_at": "2026-11-14 10:54:00"
    },
    {
      "id": "tx_28",
      "transaction_code": "TXN-2026-028",
      "booking_id": "bk_28",
      "booking_code": "BK-2026-028",
      "customer_id": "cust_8",
      "customer_name": "Bùi Thùy Linh",
      "amount": 11745000,
      "payment_method": "Tiền mặt",
      "status": "success",
      "created_at": "2026-11-01 10:56:00"
    },
    {
      "id": "tx_29",
      "transaction_code": "TXN-2026-029",
      "booking_id": "bk_29",
      "booking_code": "BK-2026-029",
      "customer_id": "cust_9",
      "customer_name": "Đỗ Tuấn Minh",
      "amount": 4700000,
      "payment_method": "Thẻ tín dụng",
      "status": "success",
      "created_at": "2026-11-02 10:58:00"
    },
    {
      "id": "tx_30",
      "transaction_code": "TXN-2026-030",
      "booking_id": "bk_30",
      "booking_code": "BK-2026-030",
      "customer_id": "cust_10",
      "customer_name": "Ngô Mai Nga",
      "amount": 1490000,
      "payment_method": "VNPAY",
      "status": "success",
      "created_at": "2026-11-03 10:00:00"
    }
  ],
  "reviews": [
    {
      "id": "rev_1",
      "tour_id": "tour_1",
      "customer_name": "Nguyễn Văn An",
      "rating": 5,
      "comment": "Chuyến đi tuyệt vời trên du thuyền Hạ Long! Phòng Suite view biển rất đẹp, đồ ăn ngon và dịch vụ nhân viên rất chu đáo.",
      "created_at": "2026-11-02",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_nguyen-van-an_003f87.png"
    },
    {
      "id": "rev_2",
      "tour_id": "tour_1",
      "customer_name": "Trần Thị Bích",
      "rating": 5,
      "comment": "Trải nghiệm chèo kayak qua hang Sáng Tối cực kỳ thích. Hoàng hôn trên vịnh Lan Hạ đẹp mê hồn.",
      "created_at": "2026-11-04",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_tran-thi-bich_fe7e4f.png"
    },
    {
      "id": "rev_3",
      "tour_id": "tour_2",
      "customer_name": "Lê Văn Cường",
      "rating": 5,
      "comment": "Đà Nẵng và Hội An quá đẹp! Cầu Vàng Bà Nà Hills đi vào sáng sớm ít người chụp ảnh rất ưng ý.",
      "created_at": "2026-11-05",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_le-van-cuong_0056b3.png"
    },
    {
      "id": "rev_4",
      "tour_id": "tour_2",
      "customer_name": "Phạm Thu Dung",
      "rating": 4,
      "comment": "Khách sạn trung tâm tiện đi lại, hướng dẫn viên nhiệt tình vui tính. Đồ ăn Hội An rất hợp khẩu vị.",
      "created_at": "2026-11-06",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_pham-thu-dung_a43c12.png"
    },
    {
      "id": "rev_5",
      "tour_id": "tour_3",
      "customer_name": "Hoàng Đức Em",
      "rating": 5,
      "comment": "Chạm tay vào đỉnh Fansipan là trải nghiệm đáng nhớ nhất đời mình! Sapa se lạnh ăn lẩu cá hồi tuyệt đỉnh.",
      "created_at": "2026-11-07",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_hoang-duc-em_115cb9.png"
    },
    {
      "id": "rev_6",
      "tour_id": "tour_4",
      "customer_name": "Vũ Kim Giang",
      "rating": 5,
      "comment": "Phú Quốc biển xanh cát trắng nắng vàng. Đi cano lướt sóng và ngắm san hô Hòn Gầm Ghì cực kỳ đáng tiền.",
      "created_at": "2026-11-08",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_vu-kim-giang_722b00.png"
    },
    {
      "id": "rev_7",
      "tour_id": "tour_4",
      "customer_name": "Đặng Quang Huy",
      "rating": 5,
      "comment": "Sunset Sanato ngắm hoàng hôn đỉnh cao nghệ thuật. Các bạn HDV quay flycam tặng ảnh rất có tâm.",
      "created_at": "2026-11-09",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_dang-quang-huy_003f87.png"
    },
    {
      "id": "rev_8",
      "tour_id": "tour_5",
      "customer_name": "Bùi Thùy Linh",
      "rating": 5,
      "comment": "Tràng An Ninh Bình đẹp như tranh thủy mặc. Leo lên đỉnh Hang Múa ngắm trọn thung lũng Tam Cốc.",
      "created_at": "2026-11-10",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_bui-thuy-linh_fe7e4f.png"
    },
    {
      "id": "rev_9",
      "tour_id": "tour_6",
      "customer_name": "Đỗ Tuấn Minh",
      "rating": 5,
      "comment": "Động Thiên Đường thật sự làm mình choáng ngợp trước sự kỳ vĩ của thiên nhiên. Suối Nước Moọc tắm cực đã.",
      "created_at": "2026-11-10",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_do-tuan-minh_0056b3.png"
    },
    {
      "id": "rev_10",
      "tour_id": "tour_7",
      "customer_name": "Ngô Mai Nga",
      "rating": 4,
      "comment": "Đà Lạt không khí trong lành dễ chịu, săn mây Cầu Đất chụp được cả album sống ảo.",
      "created_at": "2026-11-11",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_ngo-mai-nga_a43c12.png"
    },
    {
      "id": "rev_11",
      "tour_id": "tour_8",
      "customer_name": "Dương Bảo Phúc",
      "rating": 5,
      "comment": "Kỳ Co nước xanh ngọc bích, Eo Gió lộng gió hoang sơ. Hải sản Quy Nhơn tươi rói giá cả phải chăng.",
      "created_at": "2026-11-11",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_duong-bao-phuc_115cb9.png"
    },
    {
      "id": "rev_12",
      "tour_id": "tour_9",
      "customer_name": "Lý Ngọc Quyên",
      "rating": 5,
      "comment": "Sông Nho Quế và Hẻm Tu Sản đẹp không từ ngữ nào diễn tả xiết. Chuyến đi Hà Giang tuyệt vời nhất!",
      "created_at": "2026-11-12",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_ly-ngoc-quyen_722b00.png"
    },
    {
      "id": "rev_13",
      "tour_id": "tour_10",
      "customer_name": "Phan Hữu Sang",
      "rating": 5,
      "comment": "Côn Đảo rất linh thiêng và bình yên. Viếng mộ Cô Sáu đêm để lại cảm xúc thiêng liêng khó quên.",
      "created_at": "2026-11-12",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_phan-huu-sang_003f87.png"
    },
    {
      "id": "rev_14",
      "tour_id": "tour_11",
      "customer_name": "Tạ Phương Thảo",
      "rating": 4,
      "comment": "Chợ nổi Cái Răng nhộn nhịp, người miền Tây thân thiện mến khách. Rừng tràm Trà Sư xanh mát mắt.",
      "created_at": "2026-11-13",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_ta-phuong-thao_fe7e4f.png"
    },
    {
      "id": "rev_15",
      "tour_id": "tour_12",
      "customer_name": "Võ Thành Trung",
      "rating": 5,
      "comment": "Cố đô Huế trầm mặc sâu lắng. Ca Huế trên sông Hương về đêm rất thơ mộng.",
      "created_at": "2026-11-13",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_vo-thanh-trung_0056b3.png"
    },
    {
      "id": "rev_16",
      "tour_id": "tour_13",
      "customer_name": "Hồ Khánh Uyên",
      "rating": 5,
      "comment": "Vịnh Nha Trang biển êm, Hòn Mun ngắm san hô rõ mồn một. VinWonders chơi cả ngày không chán.",
      "created_at": "2026-11-13",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_ho-khanh-uyen_a43c12.png"
    },
    {
      "id": "rev_17",
      "tour_id": "tour_14",
      "customer_name": "Mai Gia Vũ",
      "rating": 4,
      "comment": "Bàu Trắng đi xe Jeep bao phê! Cảnh sắc đồi cát và hồ sen rất tương phản độc đáo.",
      "created_at": "2026-11-13",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_mai-gia-vu_115cb9.png"
    },
    {
      "id": "rev_18",
      "tour_id": "tour_15",
      "customer_name": "Đinh Như Ý",
      "rating": 5,
      "comment": "Cáp treo Núi Bà Đen rất hiện đại, tượng Phật Bà Tây Bổ Đà Sơn nguy nga tráng lệ trên đỉnh mây.",
      "created_at": "2026-11-13",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_dinh-nhu-y_722b00.png"
    },
    {
      "id": "rev_19",
      "tour_id": "tour_1",
      "customer_name": "Trịnh Hoàng Long",
      "rating": 5,
      "comment": "Đã đi du thuyền nhiều lần nhưng tour này chuẩn chỉ từ ẩm thực đến sự chu đáo của nhân viên.",
      "created_at": "2026-11-13",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_trinh-hoang-long_003f87.png"
    },
    {
      "id": "rev_20",
      "tour_id": "tour_2",
      "customer_name": "Chu Kim Yến",
      "rating": 5,
      "comment": "Tour ghép nhưng phục vụ chuẩn như tour VIP riêng. Sẽ tiếp tục đồng hành cùng công ty trong các chuyến tới!",
      "created_at": "2026-11-13",
      "avatar": "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_chu-kim-yen_fe7e4f.png"
    }
  ],
  "version": "2.0.0-r2"
};

  class MockDB {
    constructor() {
      this.data = this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.tours) && parsed.tours.length >= 15 && parsed.version === DEFAULT_DATA.version) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to parse existing mock DB, resetting...', e);
      }
      this.save(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }

    save(dataToSave = null) {
      if (dataToSave) this.data = dataToSave;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to save mock DB to localStorage', e);
      }
    }

    resetToDefault() {
      localStorage.removeItem(STORAGE_KEY);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.save();
      return this.data;
    }

    // Current Customer / User Helpers
    getCurrentUser() {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bookingtour_logged_out') === 'true') {
        return null;
      }
      if (typeof localStorage !== 'undefined' && localStorage.getItem('bookingtour_logged_out') === 'true') {
        return null;
      }
      try {
        const raw = localStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem(CURRENT_USER_KEY);
        if (raw) return JSON.parse(raw);
      } catch (_) {}
      return null;
    }

    setCurrentUser(user) {
      if (!user) {
        try { localStorage.removeItem(CURRENT_USER_KEY); } catch (_) {}
        try { sessionStorage.removeItem(CURRENT_USER_KEY); } catch (_) {}
        try { sessionStorage.setItem('bookingtour_logged_out', 'true'); } catch (_) {}
        try { localStorage.setItem('bookingtour_logged_out', 'true'); } catch (_) {}
      } else {
        try { sessionStorage.removeItem('bookingtour_logged_out'); } catch (_) {}
        try { localStorage.removeItem('bookingtour_logged_out'); } catch (_) {}
        try { localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user)); } catch (_) {}
      }
    }

    // Categories CRUD
    getCategories() {
      return this.data.categories.map(cat => ({
        ...cat,
        tour_count: this.data.tours.filter(t => t.category_id === cat.id).length
      }));
    }

    getCategoryById(id) {
      return this.data.categories.find(c => c.id === id) || null;
    }

    createCategory(data) {
      const id = 'cat_' + Date.now();
      const newCat = { id, ...data };
      this.data.categories.push(newCat);
      this.save();
      return newCat;
    }

    updateCategory(id, data) {
      const idx = this.data.categories.findIndex(c => c.id === id);
      if (idx !== -1) {
        this.data.categories[idx] = { ...this.data.categories[idx], ...data };
        this.save();
        return this.data.categories[idx];
      }
      return null;
    }

    deleteCategory(id) {
      this.data.categories = this.data.categories.filter(c => c.id !== id);
      this.save();
      return true;
    }

    // Provinces CRUD
    getProvinces() {
      return this.data.provinces.map(p => ({
        ...p,
        tour_count: this.data.tours.filter(t => t.province_id === p.id).length
      }));
    }

    getProvinceById(id) {
      return this.data.provinces.find(p => p.id === id) || null;
    }

    createProvince(data) {
      const id = 'prov_' + Date.now();
      const newProv = { id, ...data };
      this.data.provinces.push(newProv);
      this.save();
      return newProv;
    }

    updateProvince(id, data) {
      const idx = this.data.provinces.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.data.provinces[idx] = { ...this.data.provinces[idx], ...data };
        this.save();
        return this.data.provinces[idx];
      }
      return null;
    }

    deleteProvince(id) {
      this.data.provinces = this.data.provinces.filter(p => p.id !== id);
      this.save();
      return true;
    }

    // Tours CRUD
    getTours(filter = {}) {
      let list = [...this.data.tours];

      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(t => 
          t.title.toLowerCase().includes(q) || 
          (t.description && t.description.toLowerCase().includes(q))
        );
      }

      if (filter.category_id && filter.category_id !== '') {
        if (Array.isArray(filter.category_id)) {
          list = list.filter(t => filter.category_id.includes(t.category_id));
        } else {
          list = list.filter(t => t.category_id === filter.category_id);
        }
      }

      if (filter.province_id && filter.province_id !== '') {
        list = list.filter(t => t.province_id === filter.province_id);
      }

      if (filter.region && filter.region !== '') {
        const provsInRegion = this.data.provinces.filter(p => p.region === filter.region).map(p => p.id);
        list = list.filter(t => provsInRegion.includes(t.province_id));
      }

      if (filter.max_price) {
        list = list.filter(t => t.adult_price <= Number(filter.max_price));
      }

      if (filter.max_days) {
        list = list.filter(t => t.duration_days <= Number(filter.max_days));
      }

      if (filter.featured === true) {
        list = list.filter(t => t.featured);
      }

      if (filter.recommended === true) {
        list = list.filter(t => t.recommended);
      }

      // Populate relations
      list = list.map(t => ({
        ...t,
        category: this.getCategoryById(t.category_id),
        province: this.getProvinceById(t.province_id),
        departures_count: this.data.departures.filter(d => d.tour_id === t.id && d.status === 'open').length
      }));

      // Sorting
      if (filter.sort === 'asc') {
        list.sort((a, b) => a.adult_price - b.adult_price);
      } else if (filter.sort === 'desc') {
        list.sort((a, b) => b.adult_price - a.adult_price);
      } else if (filter.sort === 'rating') {
        list.sort((a, b) => b.rating - a.rating);
      }

      return list;
    }

    getTourById(id) {
      const tour = this.data.tours.find(t => t.id === id);
      if (!tour) return null;
      return {
        ...tour,
        category: this.getCategoryById(tour.category_id),
        province: this.getProvinceById(tour.province_id),
        departures: this.getDepartures({ tour_id: tour.id }),
        reviews: this.getReviews(tour.id)
      };
    }

    createTour(data) {
      const id = 'tour_' + Date.now();
      const newTour = {
        id,
        title: data.title || 'Tour du lịch mới',
        category_id: data.category_id || 'cat_1',
        province_id: data.province_id || 'prov_1',
        duration_days: Number(data.duration_days) || 3,
        duration_nights: Number(data.duration_nights) || (Number(data.duration_days) > 1 ? Number(data.duration_days) - 1 : 0),
        adult_price: Number(data.adult_price) || 2500000,
        child_price: Number(data.child_price) || Math.round((Number(data.adult_price) || 2500000) * 0.7),
        departure_location: data.departure_location || 'Hà Nội',
        featured: data.featured === true || data.featured === 'true',
        recommended: data.recommended === true || data.recommended === 'true',
        rating: 5.0,
        review_count: 0,
        status: data.status || 'active',
        images: Array.isArray(data.images) && data.images.length > 0 ? data.images : [
          'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/tours/tour_1528127269322-539801943592_w1200.jpg'
        ],
        description: data.description || 'Chuyến hành trình khám phá phong cảnh kỳ vĩ và văn hóa bản địa độc đáo.',
        inclusions: Array.isArray(data.inclusions) ? data.inclusions : [
          'Khách sạn tiêu chuẩn sang trọng tiện nghi',
          'Xe du lịch đời mới máy lạnh đưa đón',
          'Các bữa ăn theo tiêu chuẩn chương trình',
          'Hướng dẫn viên chuyên nghiệp và bảo hiểm du lịch'
        ],
        exclusions: Array.isArray(data.exclusions) ? data.exclusions : [
          'Vé máy bay/phương tiện cá nhân đến điểm tập trung',
          'Chi phí cá nhân ngoài thực đơn',
          'Thuế VAT'
        ],
        itinerary: Array.isArray(data.itinerary) && data.itinerary.length > 0 ? data.itinerary : [
          { day: 1, title: 'Ngày 1: Khởi hành - Khám phá điểm đến', content: 'Xe đón đoàn tại điểm hẹn, bắt đầu hành trình tham quan các địa danh nổi tiếng và thưởng thức ẩm thực đặc sắc.' },
          { day: 2, title: 'Ngày 2: Trải nghiệm văn hóa - Mua sắm đặc sản - Tiễn đoàn', content: 'Đón bình minh, tham quan làng nghề truyền thống và mua sắm quà lưu niệm trước khi chia tay.' }
        ]
      };
      this.data.tours.unshift(newTour);
      this.save();
      return newTour;
    }

    updateTour(id, data) {
      const idx = this.data.tours.findIndex(t => t.id === id);
      if (idx !== -1) {
        this.data.tours[idx] = { ...this.data.tours[idx], ...data };
        this.save();
        return this.data.tours[idx];
      }
      return null;
    }

    deleteTour(id) {
      this.data.tours = this.data.tours.filter(t => t.id !== id);
      // Clean up linked departures
      this.data.departures = this.data.departures.filter(d => d.tour_id !== id);
      this.save();
      return true;
    }

    // Departures CRUD
    getDepartures(filter = {}) {
      let list = [...this.data.departures];
      if (filter.tour_id) {
        list = list.filter(d => d.tour_id === filter.tour_id);
      }
      if (filter.status) {
        list = list.filter(d => d.status === filter.status);
      }
      if (filter.guide_id) {
        list = list.filter(d => d.guide_id === filter.guide_id);
      }
      return list.map(d => ({
        ...d,
        tour: this.data.tours.find(t => t.id === d.tour_id) || null
      }));
    }

    getDepartureById(id) {
      const dep = this.data.departures.find(d => d.id === id);
      if (!dep) return null;
      return {
        ...dep,
        tour: this.data.tours.find(t => t.id === dep.tour_id) || null
      };
    }

    createDeparture(data) {
      const id = 'dep_' + Date.now();
      const newDep = {
        id,
        tour_id: data.tour_id,
        start_date: data.start_date,
        end_date: data.end_date,
        total_seats: Number(data.total_seats) || 30,
        available_seats: Number(data.available_seats) || Number(data.total_seats) || 30,
        adult_price: Number(data.adult_price) || 3000000,
        child_price: Number(data.child_price) || Math.round((Number(data.adult_price) || 3000000) * 0.7),
        status: data.status || 'open',
        guide_id: data.guide_id || '',
        guide_name: data.guide_name || 'Chưa phân công'
      };
      this.data.departures.push(newDep);
      this.save();
      return newDep;
    }

    updateDeparture(id, data) {
      const idx = this.data.departures.findIndex(d => d.id === id);
      if (idx !== -1) {
        this.data.departures[idx] = { ...this.data.departures[idx], ...data };
        this.save();
        return this.data.departures[idx];
      }
      return null;
    }

    assignGuide(depId, guideId) {
      const dep = this.getDepartureById(depId);
      const guide = this.getEmployeeById(guideId);
      if (dep && guide) {
        dep.guide_id = guide.id;
        dep.guide_name = `${guide.full_name} (${guide.role})`;
        this.updateDeparture(depId, dep);
        return true;
      }
      return false;
    }

    deleteDeparture(id) {
      this.data.departures = this.data.departures.filter(d => d.id !== id);
      this.save();
      return true;
    }

    // Customers CRUD
    getCustomers(filter = {}) {
      let list = [...this.data.customers];
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(c => 
          c.full_name.toLowerCase().includes(q) || 
          c.email.toLowerCase().includes(q) || 
          c.phone.includes(q)
        );
      }
      return list;
    }

    getCustomerById(id) {
      const customer = this.data.customers.find(c => c.id === id);
      if (!customer) return null;
      return {
        ...customer,
        bookings: this.getBookings({ customer_id: customer.id })
      };
    }

    createCustomer(data) {
      const id = 'cust_' + Date.now();
      const newCust = {
        id,
        full_name: data.full_name || 'Khách hàng mới',
        email: data.email || 'customer@example.com',
        phone: data.phone || '0901234567',
        address: data.address || 'Việt Nam',
        created_at: new Date().toISOString().split('T')[0],
        total_spent: 0,
        booking_count: 0,
        reward_points: 0
      };
      this.data.customers.unshift(newCust);
      this.save();
      return newCust;
    }

    updateCustomer(id, data) {
      const idx = this.data.customers.findIndex(c => c.id === id);
      if (idx !== -1) {
        this.data.customers[idx] = { ...this.data.customers[idx], ...data };
        this.save();
        return this.data.customers[idx];
      }
      return null;
    }

    deleteCustomer(id) {
      this.data.customers = this.data.customers.filter(c => c.id !== id);
      this.save();
      return true;
    }

    // Employees CRUD
    getEmployees(filter = {}) {
      let list = [...this.data.employees];
      if (filter.role) {
        list = list.filter(e => e.role === filter.role);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(e => 
          e.full_name.toLowerCase().includes(q) || 
          e.email.toLowerCase().includes(q) || 
          e.phone.includes(q)
        );
      }
      return list;
    }

    getEmployeeById(id) {
      return this.data.employees.find(e => e.id === id) || null;
    }

    createEmployee(data) {
      const id = 'emp_' + Date.now();
      const newEmp = {
        id,
        full_name: data.full_name || 'Nhân viên mới',
        email: data.email || 'staff@bookingtour.vn',
        phone: data.phone || '0900000000',
        role: data.role || 'Sale',
        status: data.status || 'active',
        join_date: new Date().toISOString().split('T')[0]
      };
      this.data.employees.push(newEmp);
      this.save();
      return newEmp;
    }

    updateEmployee(id, data) {
      const idx = this.data.employees.findIndex(e => e.id === id);
      if (idx !== -1) {
        this.data.employees[idx] = { ...this.data.employees[idx], ...data };
        this.save();
        return this.data.employees[idx];
      }
      return null;
    }

    deleteEmployee(id) {
      this.data.employees = this.data.employees.filter(e => e.id !== id);
      this.save();
      return true;
    }

    // Bookings CRUD & Creation Workflow
    getBookings(filter = {}) {
      let list = [...this.data.bookings];
      if (filter.customer_id) {
        list = list.filter(b => b.customer_id === filter.customer_id);
      }
      if (filter.tour_id) {
        list = list.filter(b => b.tour_id === filter.tour_id);
      }
      if (filter.status) {
        list = list.filter(b => b.booking_status === filter.status);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(b => 
          b.booking_code.toLowerCase().includes(q) || 
          b.customer_name.toLowerCase().includes(q) || 
          b.tour_title.toLowerCase().includes(q)
        );
      }
      // Return newest first
      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    getBookingById(id) {
      return this.data.bookings.find(b => b.id === id || b.booking_code === id) || null;
    }

    createBooking(bookingData) {
      const count = this.data.bookings.length + 1;
      const id = 'bk_' + Date.now();
      const booking_code = `BK-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
      const created_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const newBooking = {
        id,
        booking_code,
        customer_id: bookingData.customer_id || 'cust_1',
        customer_name: bookingData.customer_name || 'Khách hàng',
        customer_email: bookingData.customer_email || 'khach@gmail.com',
        customer_phone: bookingData.customer_phone || '0901234567',
        tour_id: bookingData.tour_id,
        tour_title: bookingData.tour_title,
        tour_image: bookingData.tour_image || 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/categories/category_1528127269322-539801943592_w600.jpg',
        departure_id: bookingData.departure_id,
        departure_date: bookingData.departure_date,
        return_date: bookingData.return_date,
        adults_count: Number(bookingData.adults_count) || 1,
        children_count: Number(bookingData.children_count) || 0,
        total_amount: Number(bookingData.total_amount) || 0,
        booking_status: 'confirmed',
        payment_status: 'paid',
        payment_method: bookingData.payment_method || 'VNPAY',
        passengers: bookingData.passengers || [],
        created_at
      };

      this.data.bookings.unshift(newBooking);

      // Decrement available seats
      const dep = this.getDepartureById(bookingData.departure_id);
      if (dep) {
        const totalPax = (Number(bookingData.adults_count) || 1) + (Number(bookingData.children_count) || 0);
        dep.available_seats = Math.max(0, dep.available_seats - totalPax);
        if (dep.available_seats === 0) dep.status = 'sold_out';
        this.updateDeparture(dep.id, dep);
      }

      // Automatically generate Transaction record
      const txCount = this.data.transactions.length + 1;
      const txId = 'tx_' + Date.now();
      const txCode = `TXN-${new Date().getFullYear()}-${String(txCount).padStart(3, '0')}`;
      const newTx = {
        id: txId,
        transaction_code: txCode,
        booking_id: id,
        booking_code: booking_code,
        customer_id: newBooking.customer_id,
        customer_name: newBooking.customer_name,
        amount: newBooking.total_amount,
        payment_method: newBooking.payment_method,
        status: 'success',
        created_at
      };
      this.data.transactions.unshift(newTx);

      // Update customer stats
      const cust = this.getCustomerById(newBooking.customer_id);
      if (cust) {
        cust.total_spent = (cust.total_spent || 0) + newBooking.total_amount;
        cust.booking_count = (cust.booking_count || 0) + 1;
        cust.reward_points = (cust.reward_points || 0) + Math.floor(newBooking.total_amount / 50000);
        this.updateCustomer(cust.id, cust);
      }

      this.save();
      return newBooking;
    }

    cancelBooking(id, reason = 'Khách yêu cầu hủy') {
      const booking = this.getBookingById(id);
      if (!booking) return false;
      booking.booking_status = 'cancelled';
      booking.cancel_reason = reason;

      // Restore seats
      const dep = this.getDepartureById(booking.departure_id);
      if (dep) {
        const totalPax = (Number(booking.adults_count) || 1) + (Number(booking.children_count) || 0);
        dep.available_seats = Math.min(dep.total_seats, dep.available_seats + totalPax);
        if (dep.status === 'sold_out' && dep.available_seats > 0) dep.status = 'open';
        this.updateDeparture(dep.id, dep);
      }

      // Mark transaction refunded if applicable
      const tx = this.data.transactions.find(t => t.booking_id === booking.id);
      if (tx) tx.status = 'refunded';

      this.save();
      return true;
    }

    // Transactions CRUD
    getTransactions(filter = {}) {
      let list = [...this.data.transactions];
      if (filter.status) {
        list = list.filter(t => t.status === filter.status);
      }
      if (filter.method) {
        list = list.filter(t => t.payment_method === filter.method);
      }
      if (filter.customer_id) {
        list = list.filter(t => t.customer_id === filter.customer_id);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(t => 
          t.transaction_code.toLowerCase().includes(q) || 
          t.booking_code.toLowerCase().includes(q) || 
          t.customer_name.toLowerCase().includes(q)
        );
      }
      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    getTransactionById(id) {
      return this.data.transactions.find(t => t.id === id || t.transaction_code === id) || null;
    }

    // Reviews CRUD
    getReviews(tourId = null) {
      if (tourId) {
        return this.data.reviews.filter(r => r.tour_id === tourId);
      }
      return [...this.data.reviews];
    }

    addReview(data) {
      const id = 'rev_' + Date.now();
      const newRev = {
        id,
        tour_id: data.tour_id,
        customer_name: data.customer_name || 'Khách hàng',
        rating: Number(data.rating) || 5,
        comment: data.comment || '',
        created_at: new Date().toISOString().split('T')[0],
        avatar: 'https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev/avatars/avatar_kh_003f87.png'
      };
      this.data.reviews.unshift(newRev);

      // Recalculate tour average rating
      const tour = this.data.tours.find(t => t.id === data.tour_id);
      if (tour) {
        const tourReviews = this.getReviews(tour.id);
        const avg = tourReviews.reduce((sum, r) => sum + r.rating, 0) / tourReviews.length;
        tour.rating = Number(avg.toFixed(1));
        tour.review_count = tourReviews.length;
        this.updateTour(tour.id, tour);
      }

      this.save();
      return newRev;
    }

    // Analytical Statistics for Admin Dashboard
    getStats() {
      const totalTours = this.data.tours.length;
      const totalCustomers = this.data.customers.length;
      const totalBookings = this.data.bookings.length;

      const confirmedBookings = this.data.bookings.filter(b => b.booking_status === 'confirmed').length;
      const pendingBookings = this.data.bookings.filter(b => b.booking_status === 'pending').length;
      const cancelledBookings = this.data.bookings.filter(b => b.booking_status === 'cancelled').length;

      const totalRevenue = this.data.transactions
        .filter(t => t.status === 'success')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const cancelRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0;

      // Top Tours
      const tourCounts = {};
      this.data.bookings.forEach(b => {
        tourCounts[b.tour_id] = (tourCounts[b.tour_id] || 0) + 1;
      });

      const topTours = Object.keys(tourCounts)
        .map(tId => {
          const tour = this.data.tours.find(t => t.id === tId);
          return {
            tour,
            booking_count: tourCounts[tId]
          };
        })
        .filter(item => item.tour)
        .sort((a, b) => b.booking_count - a.booking_count)
        .slice(0, 5);

      // Recent 5 Transactions
      const recentTransactions = this.getTransactions().slice(0, 5);

      return {
        totalTours,
        totalCustomers,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
        cancelRate,
        topTours,
        recentTransactions
      };
    }
  }

  // Global Singleton Instance
  window.BookingTourDB = new MockDB();
  console.log('✅ BookingTourDB initialized successfully with relational Mock Data.');
})();
