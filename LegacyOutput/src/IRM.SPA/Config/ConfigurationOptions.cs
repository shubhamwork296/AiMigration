namespace IRM.SPA.Config
{
    public class ConfigurationOptions
    {
       
        public Integrations Integrations { get; set; } = new Integrations();
        public ToggleSettings ToggleSettings { get; set; } = new ToggleSettings();
    }   

    public class ToggleSettings
    {
        public bool DisplayStackTrace { get; set; } = false;
    }
    public class Integrations
    {
        public SystemApi? SystemApi { get; set; }
        public ProductApi? ProductApi { get; set; }
    }
    public class SystemApi : BaseApiSettings
    {
    }
    public class ProductApi : BaseApiSettings
    {
    }
    public abstract class BaseApiSettings
    {
        public string? ApiClient { get; set; }
        public string? ApiSecret { get; set; }
        public string? URL { get; set; }
    }
}
