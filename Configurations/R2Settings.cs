namespace Backend_DotNet.Configurations;

public class R2Settings
{
    public const string SectionName = "R2Settings";

    public string BucketName { get; set; } = "bookingtour-images";
    public string ServiceUrl { get; set; } = "https://c687e110776a7067d15b5ca29e4ccd60.r2.cloudflarestorage.com";
    public string PublicBaseUrl { get; set; } = "https://pub-2198db5444f34bb593fc9eade3a65a70.r2.dev";
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
}

