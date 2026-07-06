using IRM.SPA.Components;
using IRM.SPA.Config;
using IRM.SPA.DI;
using IRM.SPA.Middleware;
using IRM.SPA.Middlewares;

namespace IRM.SPA
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            AppDomain.CurrentDomain.SetData("DataDirectory", Path.Combine(builder.Environment.ContentRootPath, "App_Data"));
            ConfigurationOptions config = builder.Configuration.Get<ConfigurationOptions>() ?? new ConfigurationOptions();
            // Add services to the container.
            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents();           
            DependancyInjector.RegisterServices(builder.Services, config);
            builder.Services.AddSingleton(config);
            var app = builder.Build();
            
            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }
            app.UseMiddleware<SecurityHeadersMiddleware>();
            app.UseMiddleware<ExceptionMiddleware>();
            app.UseHttpsRedirection();

            app.UseStaticFiles();
            app.UseAntiforgery();

            app.MapRazorComponents<App>()
                .AddInteractiveServerRenderMode();
            
            app.Run();
        }
    }
}
