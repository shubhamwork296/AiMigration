using Q3.MigrationAgent.AI.Prompts;

namespace Q3.MigrationAgent.Tests;

public sealed class PromptLoaderTests
{
    [Fact]
    public void Load_Existing_Prompt_By_Key()
    {
        var loader = new PromptLoader();

        var prompt = loader.Load("angular/angular-package-classification");

        Assert.Contains("classify every direct package.json dependency", prompt, StringComparison.OrdinalIgnoreCase);
        Assert.False(prompt.EndsWith('\n'));
    }

    [Fact]
    public void Load_Missing_Prompt_Throws_Clear_Error()
    {
        var loader = new PromptLoader();

        var ex = Assert.Throws<FileNotFoundException>(() => loader.Load("missing/not-here"));

        Assert.Contains("Prompt file not found: missing/not-here.prompt.txt", ex.Message);
    }

    [Fact]
    public void All_Prompt_Files_Are_Not_Empty()
    {
        var root = LocatePromptRoot();
        var files = Directory.GetFiles(root, "*.prompt.txt", SearchOption.AllDirectories);

        Assert.NotEmpty(files);
        Assert.All(files, file => Assert.False(string.IsNullOrWhiteSpace(File.ReadAllText(file)), file));
    }

    [Fact]
    public void Angular_Package_Planning_Prompt_Preserves_Third_Party_Angular_Packages_By_Default()
    {
        var prompt = new PromptLoader().Load("angular/angular-package-version-recommendation");

        Assert.Contains("preserving third-party packages unless validation proves they block the migration", prompt, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Do not blindly align its major version with the Angular target major", prompt, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Keep validation strict per hop", prompt, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ngx-color-picker", prompt);
        Assert.Contains("ngx-slick-carousel", prompt);
        Assert.Contains("ngx-bootstrap", prompt);
        Assert.Contains("angularx-qrcode", prompt);
        Assert.Contains("thirdPartyPackageUpgradeStrategy", prompt);
    }

    [Fact]
    public void Angular_Package_Classification_Prompt_Treats_Known_Third_Party_Packages_As_Validation_Driven()
    {
        var prompt = new PromptLoader().Load("angular/angular-package-classification");

        Assert.Contains("Preserve third-party Angular-coupled packages by default", prompt, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("validation-driven remediation candidates", prompt, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ngx-color-picker", prompt);
        Assert.Contains("ngx-slick-carousel", prompt);
        Assert.Contains("ngx-bootstrap", prompt);
        Assert.Contains("angularx-qrcode", prompt);
        Assert.Contains("A third-party Angular-coupled package is proven to block install/build", prompt, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Angular_Remediation_Prompt_Uses_Risk_Based_Validation_Remediation_Contract()
    {
        var prompt = new PromptLoader().Load("remediation/validation-remediation");

        Assert.Contains("Return only strict JSON", prompt);
        Assert.Contains("third_party_angular_incompatibility", prompt);
        Assert.Contains("project-owned .d.ts compatibility shims", prompt);
        Assert.Contains("--prod -> --configuration production", prompt);
        Assert.Contains("NG6002", prompt);
        Assert.Contains("minimal_module_or_import_wiring", prompt);
        Assert.Contains("Do not use skipLibCheck to hide Angular template, compiler, module", prompt);
    }

    private static string LocatePromptRoot()
    {
        var current = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "src", "Q3.MigrationAgent.AI", "Prompts");
            if (Directory.Exists(candidate)) return candidate;
            candidate = Path.Combine(current.FullName, "Prompts");
            if (Directory.Exists(candidate)) return candidate;
            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Prompt root could not be located.");
    }
}
