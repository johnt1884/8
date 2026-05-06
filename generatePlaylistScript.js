        function generatePlaylistScript() {
            const isPlaylistRootMode = (currentMode === 'playlist-root' || currentMode === 'update-playlist-root');
            const summaryActions = {
                edits: [],
                shortcuts_new: [],
                shortcuts_verify: [],
                shortcuts_delete: [],
                moves: [],
                lua: [],
                categories: []
            };

            let scriptLines = [
                'if (\$PSScriptRoot) { \$BaseDir = \$PSScriptRoot }',
                'else { \$BaseDir = Split-Path -Parent -Path \$MyInvocation.MyCommand.Definition -ErrorAction SilentlyContinue }',
                'if (-not \$BaseDir) { \$BaseDir = Get-Location }',
                '\$BaseDir = [System.IO.Path]::GetFullPath(\$BaseDir)',
                '\$script:playlistContent = New-Object System.Collections.Generic.List[string]',
                '\$script:playlistContent.Add("#EXTM3U")',
                '\$script:addedTargets = New-Object System.Collections.Generic.HashSet[string]([System.StringComparer]::OrdinalIgnoreCase)',
                '\$script:rotatedFiles = @{}',
                '\$wshell = New-Object -ComObject WScript.Shell',
                '\$newShortcuts = @()',
                '\$rootScFolder = [System.IO.Path]::GetFullPath((Join-Path -Path \$BaseDir -ChildPath \'sc\'))',
                '',
                'function Add-PlaylistEntry {',
                '    param([string]\$path, [string]\$rotation, [int]\$multiplier, [string]\$rotationKey)',
                '    \$fullPath = [System.IO.Path]::GetFullPath((Join-Path -Path \$BaseDir -ChildPath \$path))',
                '    \$key = if (\$rotationKey) { \$rotationKey } else { [System.IO.Path]::GetFileName(\$fullPath) }',
                '    if (\$script:addedTargets.Add(\$fullPath)) {',
                '        if (\$rotation -and \$rotation -ne "0") {',
                '            \$script:rotatedFiles[\$key] = \$rotation',
                '        }',
                '        for (\$i = 0; \$i -lt \$multiplier; \$i++) {',
                '            \$script:playlistContent.Add(\$path)',
                '        }',
                '    } elseif (\$rotation -and \$rotation -ne "0") {',
                '        \$rotationVal = if (\$rotation -match "^(\\d+)") { \$matches[1] } else { "0" }',
                '        \$script:rotatedFiles[\$key] = \$rotationVal',
                '    }',
                '}',
                '',
                'function Get-RotationDataMap {',
                '    param([string]\$projectPath)',
                '    \$map = @{}',
                '    \$rotFile = (Join-Path -Path "\$projectPath" -ChildPath "rotation_data.txt")',
                '    if (Test-Path -LiteralPath "\$rotFile") {',
                '        Get-Content -LiteralPath "\$rotFile" | ForEach-Object {',
                '            if (\$_ -match "^(.*?):(.*)\$") {',
                '                \$map[\$matches[1].ToLower()] = \$matches[2]',
                '            }',
                '        }',
                '    }',
                '    return \$map',
                '}',
                '',
                'function Verify-Shortcuts {',
                '    param([array]\$shortcutPaths)',
                '    if (-not \$shortcutPaths) { return }',
                '    Write-Host "`n--- Verifying Touched Shortcuts ---" -ForegroundColor Cyan',
                '    foreach (\$path in \$shortcutPaths) {',
                '        if (Test-Path -LiteralPath \$path) {',
                '            try {',
                '                \$target = \$wshell.CreateShortcut(\$path).TargetPath',
                '                if (-not (Test-Path -LiteralPath \$target)) {',
                '                    Write-Host "BROKEN: \$path -> \$target" -ForegroundColor Red',
                '                } else {',
                '                    Write-Host "VALID:  \$([System.IO.Path]::GetFileName(\$path))" -ForegroundColor Green',
                '                }',
                '            } catch {',
                '                Write-Host "ERROR verifying \$([System.IO.Path]::GetFileName(\$path)): \$(\$_.Exception.Message)" -ForegroundColor Yellow',
                '            }',
                '        } else {',
                '            Write-Host "MISSING: \$path" -ForegroundColor Red',
                '        }',
                '    }',
                '}',
                ''
            ];

            if (currentMode === 'update-playlist-root' && originalPlaylistShortcuts.length > 0) {
                scriptLines.push('# --- Adding Original Playlist Shortcuts ---');
                originalPlaylistShortcuts.forEach(scPath => {
                    const scFileName = scPath.split(/[\\/]/).pop();
                    const videoName = scFileName.replace(/\.(lnk|ink)$/i, '');
                    scriptLines.push(`Add-PlaylistEntry -path '${escapePSString(scPath)}' -rotation '0' -multiplier 1 -rotationKey '${escapePSString(videoName)}'`);
                });
                scriptLines.push('');
            }

            if (!isPlaylistRootMode) {
                scriptLines.push(
                    'function Get-ShortcutTarget {',
                    '    param([string]\$path)',
                    '    try {',
                    '        \$shortcut = \$wshell.CreateShortcut(\$path)',
                    '        \$target = \$shortcut.TargetPath',
                    '        if (-not [System.IO.Path]::IsPathRooted(\$target)) {',
                    '            \$target = [System.IO.Path]::GetFullPath((Join-Path -Path (Split-Path -Parent \$path) -ChildPath \$target))',
                    '        } else {',
                    '            \$target = [System.IO.Path]::GetFullPath(\$target)',
                    '        }',
                    '        return \$target',
                    '    } catch {',
                    '        return \$null',
                    '    }',
                    '}',
                    ''
                );
            }


            const selections = Array.from(shortcutSelections.values());

            const rootScSelections = isPlaylistRootMode ? [] : selections.filter(s => s.type === 'root-sc' || s.type === 'both-sc');
            const subfolderScSelections = isPlaylistRootMode ? [] : selections.filter(s => s.type === 'subfolder-sc' || s.type === 'both-sc');
            const playlistScSelections = selections.filter(s => s.type === 'playlist-sc');

            if (playlistScSelections.length > 0) {
                scriptLines.push("# --- Processing Specific Video Selections ---");
                playlistScSelections.forEach(sel => {
                    const escapedVideoName = escapePSString(sel.videoName);
                    const escapedProjectPath = escapePSString(sel.projectPath);
                    const escapedSubfolder = escapePSString(sel.subfolder);
                    const multiplier = sel.multiplier || 1;
                    const rotation = sel.rotation || "0";

                    if (currentMode === 'update-playlist-root') {
                        summaryActions.shortcuts_verify.push(`${sel.videoName} (for Playlist)`);
                        scriptLines.push(`\$targetPath = [System.IO.Path]::GetFullPath((Join-Path -Path \"$rootScFolder\" -ChildPath ('${escapedVideoName}' + '.lnk')))`);
                        scriptLines.push(`Add-PlaylistEntry -path \$targetPath -rotation '${rotation}' -multiplier ${multiplier} -rotationKey '${escapedVideoName}'`);
                        scriptLines.push(`Write-Host "Added to playlist (shortcut): ${escapedVideoName} (${multiplier}x)"`);
                    } else {
                        summaryActions.shortcuts_verify.push(`${sel.videoName} (for Playlist)`);
                        let targetPathConstruction = '\$BaseDir';
                        if (sel.projectPath) {
                            targetPathConstruction = `(Join-Path -Path ${targetPathConstruction} -ChildPath '${escapedProjectPath}')`;
                        }
                        if (sel.subfolder) {
                            targetPathConstruction = `(Join-Path -Path ${targetPathConstruction} -ChildPath '${escapedSubfolder}')`;
                        }
                        targetPathConstruction = `Join-Path -Path ${targetPathConstruction} -ChildPath '${escapedVideoName}'`;

                        scriptLines.push(`\$targetPath = [System.IO.Path]::GetFullPath((${targetPathConstruction}))`);
                        scriptLines.push(`Add-PlaylistEntry -path \$targetPath -rotation '${rotation}' -multiplier ${multiplier} -rotationKey '${escapedVideoName}'`);
                        scriptLines.push(`Write-Host "Added to playlist (video): ${escapedVideoName} (${multiplier}x)"`);
                    }
                });
                scriptLines.push('');
            }

            if (rootScSelections.length > 0) {
                scriptLines.push('# --- Processing Root SC Selections ---');
                scriptLines.push('\$rootSelections = @{}');
                rootScSelections.forEach(sel => {
                    const escapedProjectPath = escapePSString(sel.projectPath);
                    const multiplier = sel.multiplier || 1;
                    scriptLines.push(`\$rootSelections['' + [System.IO.Path]::GetFullPath((Join-Path -Path \"$BaseDir\" -ChildPath '${escapedProjectPath}'))] = ${multiplier}`);
                });

                scriptLines.push('if (Test-Path -LiteralPath \"$rootScFolder\") {');
                scriptLines.push('    \$rotationCache = @{}');
                scriptLines.push('    \$shortcuts = Get-ChildItem -LiteralPath \"$rootScFolder\" -File | Where-Object { \$_.Extension -match \'^\\.(lnk|ink)\$\' }');
                scriptLines.push('    foreach (\$shortcutFile in \$shortcuts) {');
                scriptLines.push('        \$targetPath = Get-ShortcutTarget \$shortcutFile.FullName');
                scriptLines.push('        if (-not \$targetPath) { continue }');
                scriptLines.push('        foreach (\$projPath in \$rootSelections.Keys) {');
                scriptLines.push('            if (\$targetPath.StartsWith(\$projPath + [IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or \$targetPath -eq \$projPath) {');
                scriptLines.push('                if (-not \$rotationCache.ContainsKey(\$projPath)) { \$rotationCache[\$projPath] = Get-RotationDataMap \$projPath }');
                scriptLines.push('                \$rotationMap = \$rotationCache[\$projPath]');
                scriptLines.push('                \$videoName = [System.IO.Path]::GetFileName(\$targetPath).ToLower()');
                scriptLines.push('                \$rotation = if (\$rotationMap.ContainsKey(\$videoName)) { \$rotationMap[\$videoName] } else { "0" }');
                scriptLines.push('                \$multiplier = \$rootSelections[\$projPath]');
                scriptLines.push('                Add-PlaylistEntry -path \$targetPath -rotation \$rotation -multiplier \$multiplier');
                scriptLines.push('                Write-Host "Added to playlist (root): \$(\$shortcutFile.Name) (\$multiplier x, Rotation: \$rotation)"');
                scriptLines.push('                break');
                scriptLines.push('            }');
                scriptLines.push('        }');
                scriptLines.push('    }');
                scriptLines.push('}');
                scriptLines.push('');
            }

            if (subfolderScSelections.length > 0) {
                scriptLines.push('# --- Processing Subfolder SC Selections ---');
                scriptLines.push('\$subfolderSelections = @{}');
                subfolderScSelections.forEach(sel => {
                    const escapedProjectPath = escapePSString(sel.projectPath);
                    const multiplier = sel.multiplier || 1;
                    let projectPathVar = '\$BaseDir';
                    if (sel.projectPath) {
                        projectPathVar = `Join-Path -Path \"$BaseDir\" -ChildPath '${escapedProjectPath}'`;
                    }
                    scriptLines.push(`\$subfolderSelections['' + [System.IO.Path]::GetFullPath((${projectPathVar}))] = ${multiplier}`);
                });

                scriptLines.push('foreach (\$projPath in \$subfolderSelections.Keys) {');
                scriptLines.push('    if (Test-Path -LiteralPath \"$projPath\") {');
                scriptLines.push('        \$multiplier = \$subfolderSelections[\$projPath]');
                scriptLines.push('        \$rotationMap = Get-RotationDataMap \$projPath');
                scriptLines.push('        \$projectShortcuts = Get-ChildItem -LiteralPath \"$projPath\" -Recurse -File | Where-Object { \$_.Extension -match \'^\\.(lnk|ink)\$\' -and -not \$_.FullName.StartsWith(\$rootScFolder + [IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) }');
                scriptLines.push('        foreach (\$shortcutFile in \$projectShortcuts) {');
                scriptLines.push('            \$targetPath = Get-ShortcutTarget \$shortcutFile.FullName');
                scriptLines.push('            if (-not \$targetPath) { continue }');
                scriptLines.push('            \$videoName = [System.IO.Path]::GetFileName(\$targetPath).ToLower()');
                scriptLines.push('            \$rotation = if (\$rotationMap.ContainsKey(\$videoName)) { \$rotationMap[\$videoName] } else { "0" }');
                scriptLines.push('            Add-PlaylistEntry -path \$targetPath -rotation \$rotation -multiplier \$multiplier');
                scriptLines.push('            Write-Host "Added to playlist (subfolder): \$(\$shortcutFile.Name) (\$multiplier x, Rotation: \$rotation)"');
                scriptLines.push('        }');
                scriptLines.push('    }');
                scriptLines.push('}');
                scriptLines.push('');
            }

            scriptLines.push('\$playlistPath = (Join-Path -Path \"$BaseDir\" -ChildPath "playlist.m3u")');
            scriptLines.push('\$script:playlistContent | Out-File -LiteralPath \"$playlistPath\" -Encoding utf8');
            scriptLines.push('Write-Host "Playlist created at: \$playlistPath"');

            scriptLines.push("\$luaPath = 'C:\\Bridge\\misc\\tools\\mpv-x86_64-v3-20260418-git-4377cce\\portable_config\\scripts\\autorotate.lua'");
            scriptLines.push('\$allRotations = @{}');
            scriptLines.push('if (Test-Path -LiteralPath \"$luaPath\") {');
            scriptLines.push('    \$existingContent = Get-Content -LiteralPath \"$luaPath\" -Raw');
            scriptLines.push('    if (\$existingContent -match \'(?s)local rotations = \\{(.*?)\\}\') {');
            scriptLines.push('        \$inner = \$matches[1]');
            scriptLines.push('        \$entries = \$inner -split \',\'');
            scriptLines.push('        foreach (\$entry in \$entries) {');
            scriptLines.push('            if (\$entry -match "\\[[\'\\"\" ]*(.*?)[\'\\"\" ]*\\]\\s*=\\s*[\'\\"\" ]?(\\d+)[\'\\"\" ]?") {');
            scriptLines.push('                \$allRotations[\$matches[1]] = \$matches[2]');
            scriptLines.push('            }');
            scriptLines.push('        }');
            scriptLines.push('    }');
            scriptLines.push('}');
            scriptLines.push('foreach (\$file in \$script:rotatedFiles.Keys) { \$allRotations[\$file] = \$script:rotatedFiles[\$file] }');
            scriptLines.push('if (\$allRotations.Count -gt 0) {');
            scriptLines.push('    \$luaDir = Split-Path -Parent \$luaPath');
            scriptLines.push('    if (-not (Test-Path -LiteralPath \$luaDir)) { [System.IO.Directory]::CreateDirectory(\$luaDir) | Out-Null }');
            scriptLines.push('    \$luaContent = @()');
            scriptLines.push("    \$luaContent += 'local rotations = {'");
            scriptLines.push('    foreach (\$file in \$allRotations.Keys) {');
            scriptLines.push('        \$rot = \$allRotations[\$file]');
            scriptLines.push("        \$escapedFile = \$file.Replace(\"'\", \"\\\\'\")");
            scriptLines.push("        \$luaContent += \"    ['\$escapedFile'] = \$rot,\"");
            scriptLines.push("    }");
            scriptLines.push("    \$luaContent += '}'");
            scriptLines.push("    \$luaContent += ''");
            scriptLines.push("    \$luaContent += 'mp.register_event(\"file-loaded\", function()'");
            scriptLines.push("    \$luaContent += '    local path = mp.get_property(\"path\")'");
            scriptLines.push("    \$luaContent += '    if not path then return end'");
            scriptLines.push("    \$luaContent += ''");
            scriptLines.push("    \$luaContent += '    mp.set_property(\"video-rotate\", 0)'");
            scriptLines.push("    \$luaContent += ''");
            scriptLines.push("    \$luaContent += '    local filename = path:match(\"([^/\\\\\\\\]+)\$\") or path'");
            scriptLines.push("    \$luaContent += ''");
            scriptLines.push("    \$luaContent += '    if rotations[filename] then'");
            scriptLines.push("    \$luaContent += '        mp.set_property(\"video-rotate\", rotations[filename])'");
            scriptLines.push("    \$luaContent += '    end'");
            scriptLines.push("    \$luaContent += 'end)'");
            scriptLines.push('    \$luaContent | Out-File -LiteralPath \"$luaPath\" -Encoding utf8');
            scriptLines.push('    Write-Host "Updated MPV autorotate script at: \$luaPath"');
            scriptLines.push('}');


            scriptLines.push('Write-Host "Total items in playlist: \$(\$script:playlistContent.Count - 1)"');
            scriptLines.push('Read-Host -Prompt "Press Enter to exit"');

            renderActionSummary(summaryActions);
            const scriptStrP = scriptLines.join('\r\n');
            batchScriptTextArea.value = scriptStrP;
            const blobP = new Blob(['\ufeff', scriptStrP], { type: 'application/octet-stream' });
            downloadScriptLink.href = URL.createObjectURL(blobP);
            downloadScriptLink.download = 'create_playlist.ps1';

            document.getElementById('script-modal-title').textContent = "Create Playlist PowerShell Script";
            document.getElementById('script-modal-desc').textContent = "This script will create a playlist and update rotations. Run it in your main video directory.";
        }



        function parseRootScData(scdataText) {
            const lines = scdataText.split('\n').map(line => line.trim()).filter(line => line);
            const data = new Map();
            let currentSubfolder = ""; // Use empty string for flat/ungrouped shortcuts

            for (let line of lines) {
                // In root scdata.txt/rootdata.txt, project headers are often quoted.
                const isQuoted = (line.startsWith('"') && line.endsWith('"')) || (line.startsWith("'") && line.endsWith("'"));
                const cleanLine = line.replace(/^["']|["']$/g, '').trim();

                let entry = cleanLine;
                let tag = "";
                if (cleanLine.endsWith('[BOTH]')) {
                    tag = "BOTH";
                    entry = cleanLine.substring(0, cleanLine.length - 6).trim();
                } else if (cleanLine.endsWith('[ROOT]')) {
                    tag = "ROOT";
                    entry = cleanLine.substring(0, cleanLine.length - 6).trim();
