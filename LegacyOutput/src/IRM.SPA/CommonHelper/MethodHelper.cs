namespace IRM.SPA.CommonHelper
{
    public static class MethodHelper
    {
        public static string FormatException(Exception ex, string errorSource = "Q3 Error", string correlationId = "")
        {
            if (ex != null)
            {
                return $"|ErrorSource: {errorSource} | CorrelationId: {correlationId} |Message: {ex.Message}|Exception: {ex}|Stack Trace: {ex.StackTrace}";
            }
            return string.Empty;
        }
    }
}
