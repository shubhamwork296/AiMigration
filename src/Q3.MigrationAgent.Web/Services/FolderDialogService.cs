using System.Windows.Forms;

namespace Q3.MigrationAgent.Web.Services;

public sealed class FolderDialogService
{
    public Task<string?> BrowseAsync(string? initialPath, CancellationToken cancellationToken)
    {
        var completion = new TaskCompletionSource<string?>(TaskCreationOptions.RunContinuationsAsynchronously);

        var thread = new Thread(() =>
        {
            try
            {
                using var dialog = new FolderBrowserDialog
                {
                    Description = "Select folder",
                    UseDescriptionForTitle = true,
                    ShowNewFolderButton = true
                };

                var selectedPath = NormalizeInitialPath(initialPath);
                if (selectedPath is not null)
                {
                    dialog.SelectedPath = selectedPath;
                }

                var result = dialog.ShowDialog();
                completion.TrySetResult(result == DialogResult.OK ? dialog.SelectedPath : null);
            }
            catch (Exception ex)
            {
                completion.TrySetException(ex);
            }
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.IsBackground = true;
        thread.Start();

        cancellationToken.Register(() => completion.TrySetCanceled(cancellationToken));
        return completion.Task;
    }

    public Task<string?> BrowseFileAsync(string? initialPath, CancellationToken cancellationToken)
    {
        var completion = new TaskCompletionSource<string?>(TaskCreationOptions.RunContinuationsAsynchronously);

        var thread = new Thread(() =>
        {
            try
            {
                using var dialog = new OpenFileDialog
                {
                    Title = "Select context file",
                    CheckFileExists = true,
                    Filter = "Markdown and text files (*.md;*.txt)|*.md;*.txt|All files (*.*)|*.*"
                };

                var selectedPath = NormalizeInitialFilePath(initialPath);
                if (selectedPath is not null)
                {
                    dialog.InitialDirectory = Path.GetDirectoryName(selectedPath);
                    dialog.FileName = Path.GetFileName(selectedPath);
                }

                var result = dialog.ShowDialog();
                completion.TrySetResult(result == DialogResult.OK ? dialog.FileName : null);
            }
            catch (Exception ex)
            {
                completion.TrySetException(ex);
            }
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.IsBackground = true;
        thread.Start();

        cancellationToken.Register(() => completion.TrySetCanceled(cancellationToken));
        return completion.Task;
    }

    private static string? NormalizeInitialPath(string? initialPath)
    {
        if (string.IsNullOrWhiteSpace(initialPath))
        {
            return null;
        }

        var trimmed = initialPath.Trim();
        return Path.IsPathRooted(trimmed) && Directory.Exists(trimmed)
            ? trimmed
            : null;
    }

    private static string? NormalizeInitialFilePath(string? initialPath)
    {
        if (string.IsNullOrWhiteSpace(initialPath))
        {
            return null;
        }

        var trimmed = initialPath.Trim();
        if (Path.IsPathRooted(trimmed) && File.Exists(trimmed))
        {
            return trimmed;
        }

        return null;
    }
}
