# Copies files reported by `git status --porcelain` into a sibling folder
# while preserving the repository-relative directory structure.

$destRoot = Join-Path (Get-Location) '..\dir_with_changed_files'

# Counter for copied items
$copiedCount = 0

git status --porcelain=v1 | ForEach-Object {
    # Each line begins with a two-character status and a space, e.g. " M path/to/file"
    $file = $_.Substring(3).Trim()
    if ([string]::IsNullOrWhiteSpace($file)) { return }

    # Normalize paths so Copy-Item handles them correctly
    $srcPath = Resolve-Path -LiteralPath $file -ErrorAction SilentlyContinue

    # Destination full path that preserves the relative layout
    $destPath = Join-Path $destRoot $file
    $destDir = Split-Path $destPath -Parent

    # Ensure destination directory exists
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    # If the source is a directory, copy recursively into the destination directory.
    try {
        if ($srcPath -and (Test-Path $srcPath -PathType Container)) {
            Copy-Item -Path $file -Destination $destDir -Recurse -Force -ErrorAction Stop
        }
        else {
            # For files, copy to the exact destination path
            Copy-Item -Path $file -Destination $destPath -Force -ErrorAction Stop
        }

        # Increment counter on successful copy and print progress
        $copiedCount++
        Write-Host "Copied: $file"
    }
    catch {
        Write-Warning "Failed to copy $file : $_"
    }
}

# Summary
Write-Host "`nCopied $copiedCount files"
