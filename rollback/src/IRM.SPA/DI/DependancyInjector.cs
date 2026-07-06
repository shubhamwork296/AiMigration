
using FluentValidation;

using IRM.SPA.CommonHelper;
using IRM.SPA.Components.Models.Controls;
using IRM.SPA.Config;
using IRM.SPA.Services;
using IRM.SPA.Validators;

using Refit;

namespace IRM.SPA.DI
{
    public static class DependancyInjector
    {
        public static void RegisterServices(IServiceCollection services, ConfigurationOptions config)
        {
           

            RegisterApiClients(services, config);           
            RegisterModelValidators(services);
        }
       
        private static void RegisterModelValidators(IServiceCollection services)
        {
            services.AddScoped<IValidator<Control>, ControlValidator>();
        }
        private static void RegisterApiClients(IServiceCollection services, ConfigurationOptions config)
        {
            RegisterRefit<IProductApi>(config.Integrations.ProductApi, services);
        }
        private static void RegisterRefit<T>(BaseApiSettings? apiSettings, IServiceCollection services) where T : class
        {
            if (apiSettings != null && !string.IsNullOrEmpty(apiSettings.URL))
            {
                services.AddRefitClient<T>().ConfigureHttpClient(c =>
                {
                    c.BaseAddress = new Uri(apiSettings.URL);
                    c.DefaultRequestHeaders.Add(AppConstants.ApiHeaders.ApiKey, apiSettings.ApiSecret);
                    c.DefaultRequestHeaders.Add(AppConstants.ApiHeaders.ApiClient, apiSettings.ApiClient);
                });
            }
        }
    }
}
