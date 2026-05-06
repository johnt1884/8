        function generateShortcutScript() {
            const selectionsToProcess = Array.from(shortcutSelections.values());
            const summaryActions = {
                edits: [],
                shortcuts_new: [],
                shortcuts_verify: [],
                shortcuts_delete: [],
                moves: [],
                lua: [],
                categories: []
            };

            const displayedProjects = new Map(); // path -> name
            canvases.forEach(c => displayedProjects.set(c.path || "", c.name || ""));

            const selectedProjects = new Map(); // path -> name
            selectionsToProcess.forEach(s => {
                if (s.type !== 'delete-sc' || (s.rotation && s.rotation !== "0") || s.flipped || (s.cuts && s.cuts.length > 0)) {
                    selectedProjects.set(s.projectPath || "", s.projectName || "");
                }
                if (s.targetProject) {
                    selectedProjects.set(s.targetProject, s.targetProject); // Target project name might not be known, use path
                    selectedProjects.set(s.projectPath || "", s.projectName || "");
                }
            });

            const dummyProjects = new Map();
            displayedProjects.forEach((name, path) => {
                if (!selectedProjects.has(path)) {
                    dummyProjects.set(path, name);
                }
            });
            dummyTimestampProjects = new Set(dummyProjects.keys());

            let scriptLines = [
                'if (\$PSScriptRoot) { \$BaseDir = \$PSScriptRoot }',
                'else { \$BaseDir = Split-Path -Parent -Path \$MyInvocation.MyCommand.Definition -ErrorAction SilentlyContinue }',
                'if (-not \$BaseDir) { \$BaseDir = Get-Location }',
                '\$BaseDir = [System.IO.Path]::GetFullPath(\$BaseDir)',
                '\$wshell = New-Object -ComObject WScript.Shell',
                '\$newShortcuts = @()',
                '',
                'function Resolve-PSPath {',
                '    param([string]\$base, [string]\$relPath, [string]\$name, [string]\$sub)',
                '    \$p = \$base',
                '    if (\$relPath) { ',
                '        \$p = (Join-Path -Path \$p -ChildPath \$relPath) ',
                '    } elseif (\$name) {',
                '        \$tryPath = (Join-Path -Path \$p -ChildPath \$name)',
                '        if (Test-Path -LiteralPath \$tryPath) { ',
                '            \$p = \$tryPath ',
                '        } else {',
                '            Write-Host "DEBUG: Project name folder not found: \$tryPath" -ForegroundColor DarkGray',
                '        }',
                '    }',
                '    if (\$sub) { \$p = (Join-Path -Path \$p -ChildPath \$sub) }',
                '    \$final = [System.IO.Path]::GetFullPath(\$p)',
                '    return \$final',
                '}',
                '',
                'function Process-Video {',
                '    param([string]\$sourcePath, [string]\$targetPath, [array]\$cuts, [array]\$markers, [bool]\$flipped)',
                '    Write-Host "--- Processing Video: \$([System.IO.Path]::GetFileName(\$sourcePath)) ---" -ForegroundColor Cyan',
                '    if (-not \$sourcePath -or -not (Test-Path -LiteralPath \$sourcePath)) { ',
                '        Write-Host "Source path empty or invalid: \$sourcePath" -ForegroundColor Red',
                '        Write-Host "BaseDir is: \$BaseDir"',
                '        return ',
                '    }',
                '    \$tempDir = (Join-Path -Path \$env:TEMP -ChildPath ([System.Guid]::NewGuid().ToString()))',
                '    [System.IO.Directory]::CreateDirectory(\$tempDir) | Out-Null',
                '    ',
                '    # Use -noautorotate to get raw dimensions',
                '    \$duration = (ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 -i "\$sourcePath") -as [double]',
                '    Write-Host "Duration: \$duration seconds"',
                '    ',
                '    \$points = New-Object System.Collections.Generic.List[double]',
                '    \$points.Add(0)',
                '    \$points.Add(\$duration)',
                '    if (\$markers) { foreach (\$m in \$markers) { \$points.Add(\$m.time) } }',
                '    if (\$cuts) { foreach (\$c in \$cuts) { \$points.Add(\$c.start); \$points.Add(\$c.end) } }',
                '    ',
                '    \$sortedPoints = \$points | Sort-Object | Select-Object -Unique',
                '    ',
                '    \$segments = @()',
                '    ',
                '    # Probe for initial dimensions (ignoring metadata rotation)',
                '    \$metadata = (ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 -i "\$sourcePath") -split "x"',
                '    \$sw = [int]\$metadata[0]',
                '    \$sh = [int]\$metadata[1]',
                '    Write-Host "Coded Dimensions: \$sw x \$sh"',
                '    ',
                '    for (\$i = 0; \$i -lt \$sortedPoints.Count - 1; \$i++) {',
                '        \$start = \$sortedPoints[\$i]',
                '        \$end = \$sortedPoints[\$i+1]',
                '        if (\$end - \$start -lt 0.001) { continue }',
                '        ',
                '        \$mid = (\$start + \$end) / 2',
                '        \$isCut = \$false',
                '        if (\$cuts) { foreach (\$c in \$cuts) { if (\$mid -ge \$c.start -and \$mid -lt \$c.end) { \$isCut = \$true; break } } }',
                '        if (\$isCut) { continue }',
                '        ',
                '        \$rotation = 0',
                '        if (\$markers) { foreach (\$m in \$markers) { if (\$start -ge \$m.time) { \$rotation = \$m.rotation } } }',
                '        ',
                '        \$segments += @{ start = \$start; end = \$end; rotation = \$rotation }',
                '    }',
                '    ',
                '    if (\$segments.Count -eq 0) { Write-Host "All content cut for \$sourcePath"; return }',
                '    ',
                '    # Determine target dimensions: if any segment is rotated 90/270, use swapped dims as target',
                '    \$hasRotation = \$false',
                '    foreach (\$seg in \$segments) { if (\$seg.rotation -eq 90 -or \$seg.rotation -eq 270) { \$hasRotation = \$true; break } }',
                '    ',
                '    if (\$hasRotation) {',
                '        \$targetW = \$sh; \$targetH = \$sw',
                '    } else {',
                '        \$targetW = \$sw; \$targetH = \$sh',
                '    }',
                '    ',
                '    # Ensure even dimensions for libx264',
                '    \$targetW = [Math]::Ceiling(\$targetW / 2) * 2',
                '    \$targetH = [Math]::Ceiling(\$targetH / 2) * 2',
                '    ',
                '    \$listPath = (Join-Path -Path \$tempDir -ChildPath "list.txt")',
                '    \$segIndex = 0',
                '    foreach (\$seg in \$segments) {',
                '        \$outSeg = (Join-Path -Path \$tempDir -ChildPath ("seg{0:D3}.mp4" -f \$segIndex++))',
                '        \$transpose = ""',
                '        if (\$seg.rotation -eq 90) { \$transpose = "transpose=1" }',
                '        elseif (\$seg.rotation -eq 180) { \$transpose = "transpose=1,transpose=1" }',
                '        elseif (\$seg.rotation -eq 270) { \$transpose = "transpose=2" }',
                '        ',
                '        \$vfArr = @()',
                '        if (\$transpose) { \$vfArr += \$transpose }',
                '        if (\$flipped) { \$vfArr += "hflip" }',
                '        ',
                '        # Current dimensions of this segment AFTER rotation',
                '        if (\$seg.rotation -eq 90 -or \$seg.rotation -eq 270) { \$curW = \$sh; \$curH = \$sw }',
                '        else { \$curW = \$sw; \$curH = \$sh }',
                '        ',
                '        # Apply scale/pad ONLY if rotated dimensions mismatch target',
                '        if (\$curW -ne \$targetW -or \$curH -ne \$targetH) {',
                '            \$vfArr += "scale=w=\$($targetW):h=\$($targetH):force_original_aspect_ratio=decrease,pad=\$($targetW):\$($targetH):(ow-iw)/2:(oh-ih)/2,setsar=1"',
                '        } elseif (\$vfArr.Count -gt 0) {',
                '            \$vfArr += "setsar=1"',
                '        }',
                '        ',
                '        \$vf = \$vfArr -join ","',
                '        \$vfArg = if (\$vf) { @("-vf", \$vf) } else { @() }',
                '        ',
                '        \$dur = (\$seg.end - \$seg.start).ToString("F3")',
                '        Write-Host "  > Encoding segment \$($segIndex): \$($seg.start) to \$($seg.end) (Rot: \$($seg.rotation))"',
                '        ffmpeg -y -noautorotate -i "\$sourcePath" -ss \$(\$seg.start.ToString("F3")) -t "\$dur" @vfArg -c:v libx264 -crf 17 -preset veryslow -c:a copy -avoid_negative_ts make_zero -metadata:s:v:0 rotate=0 -movflags +faststart "\$outSeg"',
                '        [System.IO.File]::AppendAllLines(\$listPath, [string[]](\"file \'\$outSeg\'\"))',
                '    }',
                '    ',
                '    Write-Host "  > Concatenating segments..."',
                '    ffmpeg -y -f concat -safe 0 -i "\$listPath" -c copy -metadata:s:v:0 rotate=0 -movflags +faststart "\$targetPath"',
                '    Remove-Item -LiteralPath "\$tempDir" -Recurse -Force',
                '}',
                '',
                'function Update-MiscData {',
                '    param([string]\$filePath, [hashtable]\$dataUpdates)',
                '    \$data = @{}',
                '    if (Test-Path -LiteralPath "\$filePath") {',
                '        Get-Content -LiteralPath "\$filePath" | ForEach-Object {',
                '            if (\$_ -match "^(.*?):(.*)\$") {',
                '                \$data[\$matches[1]] = \$matches[2]',
                '            }',
                '        }',
                '    }',
                '    foreach (\$key in \$dataUpdates.Keys) {',
                '        \$val = \$dataUpdates[\$key]',
                '        if (\$val -eq \$null) { \$data.Remove(\$key) }',
                '        else { \$data[\$key] = \$val }',
                '    }',
                '    if (\$data.Count -eq 0) {',
                '        if (Test-Path -LiteralPath "\$filePath") { Remove-Item -LiteralPath "\$filePath" }',
                '    } else {',
                '        \$content = @()',
                '        foreach (\$key in \$data.Keys) {',
                '            \$content += ("{0}:{1}" -f \$key, \$data[\$key])',
                '        }',
                '        \$content | Out-File -LiteralPath "\$filePath" -Encoding utf8',
                '    }',
                '}',
                '',
                'function Manage-Shortcut {',
                '    param([string]\$folderPath, [string]\$videoName, [string]\$targetPath, [bool]\$shouldExist)',
                '    if (-not \$folderPath) { return }',
                '    if (-not (Test-Path -LiteralPath \$folderPath)) {',
                '        if (\$shouldExist) { [System.IO.Directory]::CreateDirectory(\$folderPath) | Out-Null }',
                '        else { return }',
                '    }',
                '    \$baseName = [System.IO.Path]::GetFileNameWithoutExtension(\$videoName)',
                '    \$extensions = @(".lnk", ".ink")',
                '    \$pattern = [regex]::Escape(\$baseName) + ".*" + "(\\.lnk|\\.ink)\$"',
                '    \$existing = Get-ChildItem -LiteralPath \$folderPath -File | Where-Object { \$_.Name -match \$pattern }',
                '    ',
                '    if (-not \$shouldExist) {',
                '        foreach (\$file in \$existing) {',
                '            Remove-Item -LiteralPath \$file.FullName -Force',
                '            Write-Host "Removed obsolete shortcut: \$(\$file.Name)" -ForegroundColor Yellow',
                '        }',
                '        return',
                '    }',
                '    ',
                '    \$primaryPath = (Join-Path -Path \$folderPath -ChildPath (\$videoName + ".lnk"))',
                '    \$foundCorrect = \$false',
                '    foreach (\$file in \$existing) {',
                '        try {',
                '            \$sc = \$wshell.CreateShortcut(\$file.FullName)',
                '            if ([System.IO.Path]::GetFullPath(\$sc.TargetPath).TrimEnd(\"\\\") -eq \$targetPath.TrimEnd(\"\\\")) {',
                '                if (-not \$foundCorrect) {',
                '                    if (\$file.FullName -ne \$primaryPath) {',
                '                        if (Test-Path -LiteralPath \$primaryPath) { Remove-Item -LiteralPath \$primaryPath -Force }',
                '                        Move-Item -LiteralPath \$file.FullName -Destination \$primaryPath -Force',
                '                        Write-Host "Standardized shortcut name: \$primaryPath" -ForegroundColor Gray',
                '                    }',
                '                    \$foundCorrect = \$true',
                '                } else {',
                '                    Remove-Item -LiteralPath \$file.FullName -Force',
                '                    Write-Host "Removed duplicate shortcut: \$(\$file.FullName)" -ForegroundColor Gray',
                '                }',
                '            } else {',
                '                Remove-Item -LiteralPath \$file.FullName -Force',
                '                Write-Host "Removed incorrect shortcut: \$(\$file.FullName)" -ForegroundColor Gray',
                '            }',
                '        } catch {',
                '            Remove-Item -LiteralPath \$file.FullName -Force',
                '        }',
                '    }',
                '    if (-not \$foundCorrect) {',
                '        try {',
                '            if (Test-Path -LiteralPath \$primaryPath) { Remove-Item -LiteralPath \$primaryPath -Force }',
                '            \$sc = \$wshell.CreateShortcut(\$primaryPath)',
                '            \$sc.TargetPath = \$targetPath',
                '            \$sc.Save()',
                '            Write-Host "Created shortcut: \$primaryPath" -ForegroundColor Green',
                '        } catch {',
                '            Write-Host "FAILED to create shortcut: \$primaryPath" -ForegroundColor Red',
                '        }',
                '    }',
                '}',
                ''
            ];

            // --- Moving Videos and Thumbnails ---
            const fileMoves = selectionsToProcess.filter(sel => sel.targetProject);
            if (fileMoves.length > 0) {
                scriptLines.push('# --- Moving Videos and Thumbnails ---');
                fileMoves.forEach(sel => {
                    summaryActions.moves.push(`${sel.videoName} -> ${sel.targetProject || '(Root)'}`);
                    const escapedVideoName = escapePSString(sel.videoName);
                    const escapedTargetProjectPath = escapePSString(sel.targetProject);

                    const sourceRes = getPSPathRes('\$BaseDir', sel.projectPath, sel.projectName, sel.subfolder);
                    scriptLines.push(`\$sourceVideoPath = (Join-Path -Path (${sourceRes}) -ChildPath '${escapedVideoName}')`);

                    const targetRes = getPSPathRes('\$BaseDir', sel.targetProject, sel.targetProject, sel.subfolder);
                    scriptLines.push(`\$targetVideoPath = (Join-Path -Path (${targetRes}) -ChildPath '${escapedVideoName}')`);

                    scriptLines.push('if (Test-Path -LiteralPath \"$sourceVideoPath\") {');
                    scriptLines.push('    Move-Item -LiteralPath \"$sourceVideoPath\" -Destination \"$targetVideoPath\" -Force');
                    scriptLines.push(`    Write-Host "Moved video to: ${escapedTargetProjectPath || '(Root)'}\\${escapedVideoName}"`);
                    scriptLines.push('}');

                    const thumbBase = sel.videoName.substring(0, sel.videoName.lastIndexOf('.'));
                    const escapedThumbBase = escapePSString(thumbBase);

                    const sourceProjRes = getPSPathRes('\$BaseDir', sel.projectPath, sel.projectName, '');
                    const targetProjRes = getPSPathRes('\$BaseDir', sel.targetProject, sel.targetProject, '');
                    scriptLines.push(`\$sourceProjectPath = ${sourceProjRes}`);
                    scriptLines.push(`\$targetProjectPath = ${targetProjRes}`);
                    scriptLines.push(`\$thumbDirs = @('Thumbnails', 'Edit Thumbnails')`);
                    scriptLines.push(`foreach (\$dirName in \$thumbDirs) {`);
                    scriptLines.push(`    \$srcDirPath = (Join-Path -Path \"$sourceProjectPath\" -ChildPath \$dirName)`);
                    scriptLines.push(`    \$tgtDirPath = (Join-Path -Path \"$targetProjectPath\" -ChildPath \$dirName)`);
                    scriptLines.push(`    if (-not (Test-Path -LiteralPath \"\$tgtDirPath\")) { [System.IO.Directory]::CreateDirectory(\"\$tgtDirPath\") | Out-Null }`);
                    scriptLines.push(`    if (Test-Path -LiteralPath \"$srcDirPath\") {`);
                    scriptLines.push(`        Get-ChildItem -LiteralPath \"$srcDirPath\" | Where-Object { \$_.Name -like '${escapedThumbBase}_*' } | ForEach-Object { Move-Item -LiteralPath \"\$(\$_.FullName)\" -Destination \"$tgtDirPath\" -Force }`);
                    scriptLines.push(`        Write-Host "Moved thumbnails for ${escapedVideoName} to ${escapedTargetProjectPath}\\$dirName"`);
                    scriptLines.push(`    }`);
                    scriptLines.push(`}`);

                    // Move subfolder shortcuts
                    scriptLines.push(`\$srcScPath = (Join-Path -Path \"$sourceProjectPath\" -ChildPath 'sc')`);
                    scriptLines.push(`\$tgtScPath = (Join-Path -Path \"$targetProjectPath\" -ChildPath 'sc')`);
                    scriptLines.push(`\$scFileName = '${escapedVideoName}.lnk'`);
                    scriptLines.push(`\$srcScFile = (Join-Path -Path \"$srcScPath\" -ChildPath \$scFileName)`);
                    scriptLines.push(`if (Test-Path -LiteralPath \"$srcScFile\") {`);
                    scriptLines.push(`    if (-not (Test-Path -LiteralPath \"\$tgtScPath\")) { [System.IO.Directory]::CreateDirectory(\"\$tgtScPath\") | Out-Null }`);
                    scriptLines.push(`    \$tgtScFile = (Join-Path -Path \"$tgtScPath\" -ChildPath \$scFileName)`);
                    scriptLines.push(`    Move-Item -LiteralPath \"$srcScFile\" -Destination \"$tgtScFile\" -Force`);
                    scriptLines.push(`    \$shortcut = \$wshell.CreateShortcut(\$tgtScFile)`);
                    scriptLines.push(`    \$shortcut.TargetPath = \$targetVideoPath`);
                    scriptLines.push(`    \$shortcut.Save()`);
                    scriptLines.push(`    Write-Host "Moved and updated subfolder shortcut for ${escapedVideoName}"`);
                    scriptLines.push(`}`);

                    // Update root shortcuts if they exist
                    scriptLines.push(`\$rootScPath = (Join-Path -Path \"$BaseDir\" -ChildPath 'sc')`);
                    scriptLines.push(`\$rootScFile = (Join-Path -Path \"$rootScPath\" -ChildPath \$scFileName)`);
                    scriptLines.push(`if (Test-Path -LiteralPath \"$rootScFile\") {`);
                    scriptLines.push(`    \$shortcut = \$wshell.CreateShortcut(\$rootScFile)`);
                    scriptLines.push(`    \$shortcut.TargetPath = \$targetVideoPath`);
                    scriptLines.push(`    \$shortcut.Save()`);
                    scriptLines.push(`    Write-Host "Updated root shortcut target for ${escapedVideoName}"`);
                    scriptLines.push(`}`);

                    scriptLines.push('');
                });
            }

            const hasCreations = selectionsToProcess.some(sel => {
                if (sel.type === 'delete-sc') return false;
                const key = sel.projectPath + '|' + sel.videoName;
                const initial = initialShortcutSelections.get(key);
                return !initial || initial.type !== sel.type || sel.targetProject;
            });

            if (hasCreations) {
                 scriptLines.push('# --- Creating Shortcuts ---');
            }

            let needsRootSc = false;
            const subfolderProjects = new Map(); // path -> name
            selectionsToProcess.forEach(sel => {
                const selectionType = sel.type || 'root-sc';
                if (selectionType === 'root-sc' || selectionType === 'both-sc') {
                    needsRootSc = true;
                }
                if (selectionType === 'subfolder-sc' || selectionType === 'both-sc') {
                    subfolderProjects.set(sel.projectPath || "", sel.projectName || "");
                }
            });

            if (needsRootSc) {
                scriptLines.push('\$rootScFolder = (Join-Path -Path \"$BaseDir\" -ChildPath \'sc\')');
                scriptLines.push('if (-not (Test-Path -LiteralPath \$rootScFolder)) { [System.IO.Directory]::CreateDirectory(\$rootScFolder) | Out-Null }');
                scriptLines.push('');
            }

            subfolderProjects.forEach((projectName, projectPath) => {
                const res = getPSPathRes('\$BaseDir', projectPath, projectName, '');
                scriptLines.push(`\$subfolderScPath = (Join-Path -Path (${res}) -ChildPath 'sc')`);
                scriptLines.push('if (-not (Test-Path -LiteralPath \$subfolderScPath)) { [System.IO.Directory]::CreateDirectory(\$subfolderScPath) | Out-Null }');
            });

            const targetProjects = new Set(selectionsToProcess.filter(sel => sel.targetProject && (sel.type === 'subfolder-sc' || sel.type === 'both-sc')).map(sel => sel.targetProject));
            targetProjects.forEach(projectPath => {
                if (!subfolderProjects.has(projectPath)) {
                    // For target projects, we assume projectPath is the project folder name if it was selected via "Move to"
                    const res = getPSPathRes('\$BaseDir', projectPath, projectPath, '');
                    scriptLines.push(`\$subfolderScPath = (Join-Path -Path (${res}) -ChildPath 'sc')`);
                    scriptLines.push('if (-not (Test-Path -LiteralPath \$subfolderScPath)) { [System.IO.Directory]::CreateDirectory(\$subfolderScPath) | Out-Null }');
                }
            });
            if (subfolderProjects.size > 0 || targetProjects.size > 0) {
                scriptLines.push('');
            }

            selectionsToProcess.forEach(sel => {
                const key = sel.projectPath + '|' + sel.videoName;
                const initial = initialShortcutSelections.get(key);

                const initialRot = (initial && initial.rotation) || "0";
                const initialFlipped = initial ? !!initial.flipped : false;

                const hasCuts = sel.cuts && sel.cuts.length > 0;
                let markersChanged = sel.markers && sel.markers.length > 0;
                if (markersChanged && sel.markers.length === 1 && sel.markers[0].frame === 0) {
                    if (sel.markers[0].rotation.toString() === initialRot) {
                        markersChanged = false;
                    }
                }
                const needsProcessing = hasCuts || markersChanged;

                const rotationChanged = sel.rotation !== initialRot;
                const flippedChanged = !!sel.flipped !== initialFlipped;
                const hasMetadataChanges = rotationChanged || flippedChanged;

                const selectionType = sel.type;
                if (!selectionType && !needsProcessing && !hasMetadataChanges && !sel.targetProject) return;
                if (selectionType === 'delete-sc') return;

                const escapedVideoName = escapePSString(sel.videoName);
                const escapedProjectPath = escapePSString(sel.projectPath);
                const escapedProjectName = escapePSString(sel.projectName);
                const escapedSubfolder = escapePSString(sel.subfolder);

                const isMoved = sel.targetProject && sel.targetProject !== sel.projectPath;

                if (needsProcessing) {
                    let editDesc = `${sel.videoName} (`;
                    if (sel.rotation && sel.rotation !== "0") editDesc += `Rotate ${sel.rotation}°, `;
                    if (sel.flipped) editDesc += "H-Flip, ";
                    if (sel.cuts && sel.cuts.length > 0) editDesc += `${sel.cuts.length} Cuts, `;
                    editDesc = editDesc.replace(/, $/, ")").replace(/\($/, "");
                    summaryActions.edits.push(editDesc);

                    scriptLines.push(`    # Processing edits for: ${sel.projectPath}\\${sel.videoName}`);
                    const projToUse = isMoved ? sel.targetProject : sel.projectPath;
                    const nameToUse = isMoved ? sel.targetProject : sel.projectName;
                    const res = getPSPathRes('\$BaseDir', projToUse, nameToUse, sel.subfolder);
                    scriptLines.push(`    \$sourceVideoPath = (Join-Path -Path (${res}) -ChildPath '${escapedVideoName}')`);

                    scriptLines.push(`    \$cuts = @()`);
                    if (sel.cuts) {
                        sel.cuts.forEach(c => {
                            scriptLines.push(`    \$cuts += @{ start = ${c.start}; end = ${c.end} }`);
                        });
                    }
                    scriptLines.push(`    \$markers = @()`);
                    if (sel.markers) {
                        sel.markers.forEach(m => {
                            // markers in selection use 'frame', we need 'time'
                            const fps = sel.fps || 30;
                            const time = m.frame / fps;
                            scriptLines.push(`    \$markers += @{ time = ${time}; rotation = ${m.rotation} }`);
                        });
                    }
                    if ((!sel.markers || sel.markers.length === 0) && sel.rotation && sel.rotation !== "0") {
                        scriptLines.push(`    \$markers += @{ time = 0; rotation = ${sel.rotation} }`);
                    }

                    scriptLines.push(`    \$processedVideoPath = (Join-Path -Path (Split-Path -Parent \$sourceVideoPath) -ChildPath ('processed_' + '${escapedVideoName}'))`);
                    const isFlipped = sel.flipped ? '\$true' : '\$false';
                    scriptLines.push(`    Process-Video -sourcePath \$sourceVideoPath -targetPath \$processedVideoPath -cuts \$cuts -markers \$markers -flipped ${isFlipped}`);
                    scriptLines.push(`    if (Test-Path -LiteralPath \"$processedVideoPath\") {`);
                    scriptLines.push(`        Move-Item -LiteralPath \"$processedVideoPath\" -Destination \"$sourceVideoPath\" -Force`);
                    scriptLines.push(`        Write-Host "Applied edits to: ${escapedVideoName}"`);

                    // Clear rotation metadata for this file since it's now burnt-in
                    const pToUse = isMoved ? sel.targetProject : sel.projectPath;
                    const nToUse = isMoved ? sel.targetProject : sel.projectName;
                    const projPathVar = `(${getPSPathRes('\$BaseDir', pToUse, nToUse, '')})`;
                    const miscFileVar = `(Join-Path -Path ${projPathVar} -ChildPath 'misc.txt')`;
                    scriptLines.push(`        \$dataUpdates = @{ '${escapePSString(sel.videoName)}' = \$null }`);
                    scriptLines.push(`        Update-MiscData -filePath ${miscFileVar} -dataUpdates \$dataUpdates`);
                    scriptLines.push(`    }`);
                }

                const tpToUse = isMoved ? sel.targetProject : sel.projectPath;
                const tnToUse = isMoved ? sel.targetProject : sel.projectName;
                const targetBaseRes = getPSPathRes('\$BaseDir', tpToUse, tnToUse, sel.subfolder);
                let targetPathConstruction = `(Join-Path -Path (${targetBaseRes}) -ChildPath '${escapedVideoName}')`;

                if (selectionType) {
                    scriptLines.push(`    # Managing shortcuts for: ${sel.projectPath}\\${sel.videoName} (Selection: ${selectionType})`);
                    scriptLines.push(`    \$targetPath = [System.IO.Path]::GetFullPath(${targetPathConstruction})`);

                // Root location
                const initial = initialShortcutSelections.get(key);
                const initiallyInRoot = initial && (initial.type === 'root-sc' || initial.type === 'both-sc');
                const wantRoot = (selectionType === 'root-sc' || selectionType === 'both-sc');

                if (wantRoot) {
                    if (initiallyInRoot) {
                        summaryActions.shortcuts_verify.push(`${sel.videoName} in Root sc/`);
                    } else {
                        summaryActions.shortcuts_new.push(`${sel.videoName} in Root sc/`);
                    }
                } else if (initiallyInRoot) {
                    summaryActions.shortcuts_delete.push(`${sel.videoName} from Root sc/`);
                }
                scriptLines.push(`    Manage-Shortcut -folderPath \$rootScFolder -videoName '${escapedVideoName}' -targetPath \$targetPath -shouldExist ${wantRoot ? '$true' : '$false'}`);

                // Subfolder location
                const initiallyInSub = initial && (initial.type === 'subfolder-sc' || initial.type === 'both-sc');
                const wantSub = (selectionType === 'subfolder-sc' || selectionType === 'both-sc');

                if (wantSub) {
                    if (initiallyInSub) {
                        summaryActions.shortcuts_verify.push(`${sel.videoName} in ${sel.projectPath}/sc/`);
                    } else {
                        summaryActions.shortcuts_new.push(`${sel.videoName} in ${tpToUse}/sc/`);
                    }
                } else if (initiallyInSub) {
                    summaryActions.shortcuts_delete.push(`${sel.videoName} from ${sel.projectPath}/sc/`);
                }
                    const scProjToUse = isMoved ? sel.targetProject : sel.projectPath;
                    const scNameToUse = isMoved ? sel.targetProject : sel.projectName;
                    const scProjRes = getPSPathRes('\$BaseDir', scProjToUse, scNameToUse, '');
                    let scDirPath = `Join-Path -Path (${scProjRes}) -ChildPath 'sc'`;

                    scriptLines.push(`    Manage-Shortcut -folderPath (${scDirPath}) -videoName '${escapedVideoName}' -targetPath \$targetPath -shouldExist ${wantSub ? '$true' : '$false'}`);

                    scriptLines.push('');
                }
            });

            // --- File Deletions (Videos and Thumbnails) ---
            const fileDeletions = selectionsToProcess.filter(sel => sel.type === 'delete-sc');
            if (fileDeletions.length > 0) {
                scriptLines.push('# --- Deleting Videos and Thumbnails ---');
                fileDeletions.forEach(sel => {
                    summaryActions.shortcuts_delete.push(`${sel.videoName} (Permanent Delete)`);
                    const escapedVideoName = escapePSString(sel.videoName);
                    const escapedProjectPath = escapePSString(sel.projectPath);
                    const escapedSubfolder = escapePSString(sel.subfolder);

                    const res = getPSPathRes('\$BaseDir', sel.projectPath, sel.projectName, sel.subfolder);
                    scriptLines.push(`\$videoPath = (Join-Path -Path (${res}) -ChildPath '${escapedVideoName}')`);

                    scriptLines.push('if (Test-Path -LiteralPath \"$videoPath\") {');
                    scriptLines.push('    Remove-Item -LiteralPath \"$videoPath\" -Force');
                    scriptLines.push(`    Write-Host "Deleted video: ${escapedVideoName}"`);
                    scriptLines.push('}');

                    const thumbBase = sel.videoName.substring(0, sel.videoName.lastIndexOf('.'));
                    const escapedThumbBase = escapePSString(thumbBase);

                    const projRes = getPSPathRes('\$BaseDir', sel.projectPath, sel.projectName, '');
                    scriptLines.push(`\$projectPath = ${projRes}`);
                    scriptLines.push(`\$thumbDirs = @('Thumbnails', 'Edit Thumbnails')`);
                    scriptLines.push(`foreach (\$dirName in \$thumbDirs) {`);
                    scriptLines.push(`    \$dirPath = (Join-Path -Path \"$projectPath\" -ChildPath \$dirName)`);
                    scriptLines.push(`    if (Test-Path -LiteralPath \"$dirPath\") {`);
                    scriptLines.push(`        Get-ChildItem -LiteralPath \"$dirPath\" | Where-Object { \$_.Name -like '${escapedThumbBase}_*' } | Remove-Item -Force`);
                    scriptLines.push(`        Write-Host "Deleted thumbnails for ${escapedVideoName} in \$dirName"`);
                    scriptLines.push(`    }`);
                    scriptLines.push(`}`);
                    scriptLines.push('');
                });
            }

            // --- Explicit Shortcut Deletions ---
            const deletions = [];
            const handledInMainLoop = new Set();
            selectionsToProcess.forEach(sel => {
                const key = sel.projectPath + '|' + sel.videoName;
                if (sel.type) handledInMainLoop.add(key);
            });

            initialShortcutSelections.forEach((initial, key) => {
                if (handledInMainLoop.has(key)) return;

                const current = shortcutSelections.get(key);
                if (current && current.type) return;

                const parts = key.split('|');
                const projectPath = parts[0];
                const videoName = parts[1];
                const escapedVideoName = escapePSString(videoName);
                const escapedProjectPath = escapePSString(projectPath);
                const escapedSubfolder = initial.subfolder ? escapePSString(initial.subfolder) : '';

                const initiallyInSubfolder = initial.type === 'subfolder-sc' || initial.type === 'both-sc';
                if (initiallyInSubfolder) {
                    summaryActions.shortcuts_delete.push(`${videoName} from ${initial.projectPath}/sc/`);
                    const subPathRes = getPSPathRes('\$BaseDir', initial.projectPath, initial.projectName, '');
                    let subPath = `Join-Path -Path (${subPathRes}) -ChildPath 'sc'`;
                    const fullScPath = `Join-Path -Path (${subPath}) -ChildPath ('${escapedVideoName}' + '.lnk')`;
                    const logPath = (escapedProjectPath ? escapedProjectPath + '\\' : '') + (escapedSubfolder ? escapedSubfolder + '\\' : '') + escapedVideoName;
                    deletions.push(`if (Test-Path -LiteralPath (${fullScPath})) { Remove-Item -LiteralPath (${fullScPath}); Write-Host "Deleted subfolder shortcut: ${logPath}" }`);
                }

                const initiallyInRoot = initial.type === 'root-sc' || initial.type === 'both-sc';
                if (initiallyInRoot) {
                    summaryActions.shortcuts_delete.push(`${videoName} from Root sc/`);
                    const rootScFolder = `Join-Path -Path \"$BaseDir\" -ChildPath 'sc'`;
                    const fullScPath = `Join-Path -Path (${rootScFolder}) -ChildPath ('${escapedVideoName}' + '.lnk')`;
                    deletions.push(`if (Test-Path -LiteralPath (${fullScPath})) { Remove-Item -LiteralPath (${fullScPath}); Write-Host "Deleted root shortcut: ${escapedVideoName}" }`);
                }
            });

            if (deletions.length > 0) {
                scriptLines.push('# --- Deleting Shortcuts ---');
                scriptLines.push(...deletions);
                scriptLines.push('');
            }

            // --- Rotation Data ---
            const rotationUpdates = new Map(); // projectPath -> { toAdd: {}, toRemove: [] }

            const getUpdate = (proj) => {
                if (!rotationUpdates.has(proj)) {
                    rotationUpdates.set(proj, { toAdd: {}, toRemove: [] });
                }
                return rotationUpdates.get(proj);
            };

            shortcutSelections.forEach((sel, key) => {
                const initial = initialShortcutSelections.get(key);
                const isMoved = sel.targetProject && sel.targetProject !== sel.projectPath;

                const currentRot = sel.rotation || "0";
                const initialRot = (initial && initial.rotation) || "0";
                const currentFlipped = !!sel.flipped;
                const initialFlipped = initial ? !!initial.flipped : false;

                const getVal = (r, f) => (f ? `${r}:flip` : r);

                if (isMoved) {
                    // Remove from source
                    getUpdate(sel.projectPath).toRemove.push(sel.videoName);
                    // Add/Update in destination
                    const rotationVal = getVal(currentRot, currentFlipped);
                    if (rotationVal !== "0") {
                        getUpdate(sel.targetProject).toAdd[sel.videoName] = rotationVal;
                    }
                } else {
                    // Not moved, check if rotation or flip changed
                    if (currentRot !== initialRot || currentFlipped !== initialFlipped) {
                        const rotationVal = getVal(currentRot, currentFlipped);
                        if (rotationVal === "0") {
                            getUpdate(sel.projectPath).toRemove.push(sel.videoName);
                        } else {
                            getUpdate(sel.projectPath).toAdd[sel.videoName] = rotationVal;
                        }
                    }
                }
            });

            // --- Misc Data (Categories & Rotations) ---
            const miscUpdates = new Map(); // projectPath -> { videoName: dataString }

            const getMiscUpdate = (proj) => {
                if (!miscUpdates.has(proj)) miscUpdates.set(proj, {});
                return miscUpdates.get(proj);
            };

            // Process categories into misc data
            const allCatKeys = new Set([...videoCategories.keys(), ...initialVideoCategories.keys()]);
            allCatKeys.forEach(key => {
                const current = videoCategories.get(key) || new Set();
                const initial = initialVideoCategories.get(key) || new Set();
                const [proj, video] = key.split('|');

                const added = Array.from(current).filter(c => !initial.has(c));
                const removed = Array.from(initial).filter(c => !current.has(c));

                if (added.length > 0 || removed.length > 0) {
                    let msg = `${video}: `;
                    if (added.length > 0) msg += `Added [${added.join(', ')}] `;
                    if (removed.length > 0) msg += `Removed [${removed.join(', ')}]`;
                    summaryActions.categories.push(msg);
                }
            });

            // Process rotations/flips and combine with categories
            const allRelevantVideos = new Set([
                ...videoCategories.keys(),
                ...shortcutSelections.keys(),
                ...initialShortcutSelections.keys()
            ]);

            allRelevantVideos.forEach(key => {
                const parts = key.split('|');
                if (parts.length < 2) return;
                const [projectPath, videoName] = parts;

                const cats = videoCategories.get(key);
                const sel = shortcutSelections.get(key);
                const initial = initialShortcutSelections.get(key);

                const currentRot = sel ? (sel.rotation || "0") : (initial ? initial.rotation : "0");
                const currentFlipped = sel ? !!sel.flipped : (initial ? !!initial.flipped : false);

                let dataParts = [];
                if (cats && cats.size > 0) dataParts.push(`categories=${Array.from(cats).join(',')}`);
                if (currentRot !== "0") dataParts.push(`rotation=${currentRot}`);
                if (currentFlipped) dataParts.push(`flipped=true`);

                const updateObj = getMiscUpdate(projectPath);
                if (dataParts.length > 0) {
                    updateObj[videoName] = dataParts.join(';');
                } else {
                    updateObj[videoName] = null; // Mark for removal
                }
            });

            if (miscUpdates.size > 0) {
                scriptLines.push('# --- Updating Misc Data (Categories & Rotations) ---');
                miscUpdates.forEach((updates, projectPath) => {
                    const escapedProjectPath = escapePSString(projectPath);
                    const projectPathVar = escapedProjectPath ? `(Join-Path -Path \"$BaseDir\" -ChildPath '${escapedProjectPath}')` : '\$BaseDir';
                    const miscFileVar = `(Join-Path -Path ${projectPathVar} -ChildPath 'misc.txt')`;

                    scriptLines.push(`\$dataUpdates = @{`);
                    for (const [vName, data] of Object.entries(updates)) {
                        const val = data === null ? '$null' : `'${escapePSString(data)}'`;
                        scriptLines.push(`    '${escapePSString(vName)}' = ${val}`);
                    }
                    scriptLines.push(`}`);
                    scriptLines.push(`Update-MiscData -filePath ${miscFileVar} -dataUpdates \$dataUpdates`);
                    scriptLines.push(`Write-Host "Updated misc.txt for ${escapedProjectPath || '(Root)'}"`);
                });
                scriptLines.push('');
            }

                scriptLines.push('# --- Update Central LUA Rotation File ---');
                scriptLines.push("\$luaPath = 'C:\\Bridge\\misc\\tools\\mpv-x86_64-v3-20260418-git-4377cce\\portable_config\\scripts\\autorotate.lua'");
                scriptLines.push('\$script:rotatedFiles = @{}');

                shortcutSelections.forEach((sel, key) => {
                        const initial = initialShortcutSelections.get(key);
                        const initialRot = (initial && initial.rotation) || "0";
                        const currentRot = sel.rotation || "0";
                        if (currentRot !== initialRot) {
                            summaryActions.lua.push(`${sel.videoName}: Rotate ${initialRot}° -> ${currentRot}°`);
                        }
                        if (currentRot !== "0") {
                            scriptLines.push(`\$script:rotatedFiles['${escapePSString(sel.videoName)}'] = ${currentRot}`);
                    }
                });

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
                scriptLines.push('');

            // --- Update Central LUA Flip File ---
                const hasFlipChanges = Array.from(shortcutSelections.entries()).some(([key, sel]) => {
                    const initial = initialShortcutSelections.get(key);
                    const initialFlipped = initial ? !!initial.flipped : false;
                    return !!sel.flipped !== initialFlipped;
                });

                if (hasFlipChanges || Array.from(shortcutSelections.values()).some(sel => sel.flipped)) {
                scriptLines.push('# --- Update Central LUA Flip File ---');
                scriptLines.push("\$flipLuaPath = 'C:\\Bridge\\misc\\tools\\mpv-x86_64-v3-20260418-git-4377cce\\portable_config\\scripts\\flip.lua'");
                scriptLines.push('\$script:flippedFiles = @{}');

                    shortcutSelections.forEach((sel, key) => {
                        const initial = initialShortcutSelections.get(key);
                        const initialFlipped = initial ? !!initial.flipped : false;
                        if (!!sel.flipped !== initialFlipped) {
                            summaryActions.lua.push(`${sel.videoName}: H-Flip ${initialFlipped ? 'ON' : 'OFF'} -> ${sel.flipped ? 'ON' : 'OFF'}`);
                        }
                        if (sel.flipped) {
                            scriptLines.push(`\$script:flippedFiles['${escapePSString(sel.videoName)}'] = 'hflip'`);
                        }
                });

                scriptLines.push('\$allFlips = @{}');
                scriptLines.push('if (Test-Path -LiteralPath \"$flipLuaPath\") {');
                scriptLines.push('    \$existingFlipContent = Get-Content -LiteralPath \"$flipLuaPath\" -Raw');
                scriptLines.push('    if (\$existingFlipContent -match \'(?s)local flips = \\{(.*?)\\}\') {');
                scriptLines.push('        \$innerFlip = \$matches[1]');
                scriptLines.push('        \$flipEntries = \$innerFlip -split \',\'');
                scriptLines.push('        foreach (\$fEntry in \$flipEntries) {');
                scriptLines.push('            if (\$fEntry -match "\\[[\'\\"\" ]*(.*?)[\'\\"\" ]*\\]\\s*=\\s*[\'\\"\" ]*(.*?)[\'\\"\" ]*") {');
                scriptLines.push('                \$allFlips[\$matches[1]] = \$matches[2]');
                scriptLines.push('            }');
                scriptLines.push('        }');
                scriptLines.push('    }');
                scriptLines.push('}');
                scriptLines.push('foreach (\$fFile in \$script:flippedFiles.Keys) { \$allFlips[\$fFile] = \$script:flippedFiles[\$fFile] }');
                scriptLines.push('if (\$allFlips.Count -gt 0) {');
                scriptLines.push('    \$flipLuaDir = Split-Path -Parent \$flipLuaPath');
                scriptLines.push('    if (-not (Test-Path -LiteralPath \$flipLuaDir)) { [System.IO.Directory]::CreateDirectory(\$flipLuaDir) | Out-Null }');
                scriptLines.push('    \$flipLuaContent = @()');
                scriptLines.push("    \$flipLuaContent += 'local flips = {'");
                scriptLines.push('    foreach (\$fFile in \$allFlips.Keys) {');
                scriptLines.push('        \$filter = \$allFlips[\$fFile]');
                scriptLines.push("        \$escapedFFile = \$fFile.Replace(\"'\", \"\\\\'\")");
                scriptLines.push("        \$flipLuaContent += \"    ['\$escapedFFile'] = '\$filter',\"");
                scriptLines.push("    }");
                scriptLines.push("    \$flipLuaContent += '}'");
                scriptLines.push("    \$flipLuaContent += ''");
                scriptLines.push("    \$flipLuaContent += 'mp.register_event(\"file-loaded\", function()'");
                scriptLines.push("    \$flipLuaContent += '    local path = mp.get_property(\"path\")'");
                scriptLines.push("    \$flipLuaContent += '    local filename = path:match(\"^.+[\\\\\\\\/](.+)\$\") or path'");
                scriptLines.push("    \$flipLuaContent += ''");
                scriptLines.push("    \$flipLuaContent += '    mp.command(\"vf remove @flip\")'");
                scriptLines.push("    \$flipLuaContent += ''");
                scriptLines.push("    \$flipLuaContent += '    if flips[filename] then'");
                scriptLines.push("    \$flipLuaContent += '        local filter = flips[filename]'");
                scriptLines.push("    \$flipLuaContent += '        mp.commandv(\"vf\", \"add\", \"@flip:\" .. filter)'");
                scriptLines.push("    \$flipLuaContent += '    end'");
                scriptLines.push("    \$flipLuaContent += 'end)'");
                scriptLines.push('    \$flipLuaContent | Out-File -LiteralPath \"$flipLuaPath\" -Encoding utf8');
                scriptLines.push('    Write-Host "Updated MPV flip script at: \$flipLuaPath"');
                scriptLines.push('}');
                scriptLines.push('');

            const timestamp = new Date().toISOString();

            if (selectedProjects.size > 0) {
                scriptLines.push('# --- Placing Genuine Timestamps ---');

                selectedProjects.forEach((projectName, projectPath) => {
                    const projectPathVar = `(${getPSPathRes('\$BaseDir', projectPath, projectName, '')})`;

                    scriptLines.push(`Write-Host "Placing genuine timestamp for project: ${projectPath || projectName || '(Root)'}"`);
                    scriptLines.push(`\$projectFolder = ${projectPathVar}`);
                    scriptLines.push(`\$scDateFile = (Join-Path -Path \"$projectFolder\" -ChildPath 'scdate.txt')`);
                    scriptLines.push(`Set-Content -LiteralPath \"$scDateFile\" -Value "${timestamp}"`);
                    scriptLines.push('');
                });
            }

            if (dummyProjects.size > 0) {
                scriptLines.push('# --- Placing Dummy Timestamps ---');

                dummyProjects.forEach((projectName, projectPath) => {
                    const projectPathVar = `(${getPSPathRes('\$BaseDir', projectPath, projectName, '')})`;

                    scriptLines.push(`Write-Host "Placing dummy timestamp for project: ${projectPath || projectName || '(Root)'}"`);
                    scriptLines.push(`\$projectFolder = ${projectPathVar}`);
                    scriptLines.push(`\$scDateFile = (Join-Path -Path \"$projectFolder\" -ChildPath 'scdate.txt')`);
                    scriptLines.push(`Set-Content -LiteralPath \"$scDateFile\" -Value "dummy:${timestamp}"`);
                    scriptLines.push('');
                });
            }


            scriptLines.push('Write-Host "Script execution complete."');
            scriptLines.push('Read-Host -Prompt "Press Enter to exit"');

            renderActionSummary(summaryActions);
            const scriptStr = scriptLines.join('\r\n');
            batchScriptTextArea.value = scriptStr;
            const blob = new Blob(['\ufeff', scriptStr], { type: 'application/octet-stream' });
            downloadScriptLink.href = URL.createObjectURL(blob);
            downloadScriptLink.download = 'create_shortcuts.ps1';
        }


        function getNextCanvasId() {
