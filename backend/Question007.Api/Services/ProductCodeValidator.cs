using System.Text.RegularExpressions;

namespace Example.Com.InterviewQuestion007.Services;

public static class ProductCodeValidator
{
    private static readonly Regex CodePattern = new(@"\A[A-Z0-9]{5}(?:-[A-Z0-9]{5}){5}\z", RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static bool IsValid(string? code) => !string.IsNullOrWhiteSpace(code) && CodePattern.IsMatch(code);
}
