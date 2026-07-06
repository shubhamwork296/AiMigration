
using IRM.SPA.CommonHelper;
using IRM.SPA.Config;

using System.Net;

namespace IRM.SPA.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;        

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, ConfigurationOptions configurationOptions)
        {
            _logger = logger;
            _next = next;            
        }


        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (AggregateException aex)
            {
                foreach (var innerException in aex.InnerExceptions)
                {
                    HandleExceptionAsync(httpContext, innerException);
                }

                ReturnFailureResponse(httpContext);
            }
            catch (Exception ex)
            {
                HandleExceptionAsync(httpContext, ex);

                ReturnFailureResponse(httpContext);
            }
        }

        private void HandleExceptionAsync(HttpContext context, Exception exception)
        {
            string url = string.Empty;

            if (context != null)
            {
                url = context.Request.Path;

                _logger.LogError(exception, "Error Occured in IRM.SPA.Component  {Component} {Exception} |UserEmail:{Email}", url,  MethodHelper.FormatException(exception), "userEmail");
            }
            else
            {
                _logger.LogError(exception, "Error Occured in IRM.SPA.Controllers.{ControllerName} {Exception} |UserEmail:{Email}", url, MethodHelper.FormatException(exception), "userEmail");
            }
        }

        private void ReturnFailureResponse(HttpContext context)
        {
             context.Response.Redirect("/Error");
        }
    }
}
