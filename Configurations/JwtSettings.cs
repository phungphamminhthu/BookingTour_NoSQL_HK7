namespace Backend_DotNet.Configurations;

public class JwtSettings
{
    public string Secret { get; set; } = "BookingTour_Secret_Key_Super_Secure_2026_DotNet8_JWT_Authentication!";
    public string Issuer { get; set; } = "BookingTourApi";
    public string Audience { get; set; } = "BookingTourClient";
    public int ExpiryMinutes { get; set; } = 1440; // 24 hours
}

