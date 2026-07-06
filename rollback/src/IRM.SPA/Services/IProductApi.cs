using Refit;

namespace IRM.SPA.Services
{
    public interface IProductApi
    {
        [Get("/productdetailbyid")]
        Task<List<bool>> GetProductDetailById();
    }
}
