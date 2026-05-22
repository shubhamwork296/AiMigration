using Q3.MigrationAgent.AI.Prompts;

namespace Q3.MigrationAgent.Tests;

public sealed class PromptLoaderTests
{
    [Fact]
    public void Load_Existing_Prompt_By_Key()
    {
        var loader = new PromptLoader();

        var prompt = loader.Load("angular/angular-package-classification");

        Assert.Contains("Classify every direct Angular package.json dependency", prompt);
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

        Assert.Contains("Preserve third-party Angular-coupled packages by default", prompt);
        Assert.Contains("Do not recommend upgrading a third-party package merely because its major version matches the Angular target major", prompt);
        Assert.Contains("Keep per-hop validation strict", prompt);
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

        Assert.Contains("preserve third-party Angular-coupled packages by default", prompt);
        Assert.Contains("validation-driven remediation candidates", prompt);
        Assert.Contains("ngx-color-picker", prompt);
        Assert.Contains("ngx-slick-carousel", prompt);
        Assert.Contains("ngx-bootstrap", prompt);
        Assert.Contains("angularx-qrcode", prompt);
        Assert.Contains("do not upgrade them merely because their major version matches the Angular target major", prompt);
    }

    [Fact]
    public void Angular_Remediation_Prompt_Requires_Module_Wiring_Analysis_For_ColorPicker_Ng8002()
    {
        var prompt = new PromptLoader().Load("remediation/validation-remediation");

        Assert.Contains("skipLibCheck may be recommended only as a temporary compatibility workaround", prompt);
        Assert.Contains("Do not treat skipLibCheck as successful remediation if Angular template/compiler errors remain", prompt);
        Assert.Contains("Can't bind to 'colorPicker' since it isn't a known property of 'input'", prompt);
        Assert.Contains("ColorPickerModule", prompt);
        Assert.Contains("SharedModule exports", prompt);
        Assert.Contains("Do not edit component business logic", prompt);
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
