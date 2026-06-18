        const thumbnailContainer = document.getElementById('thumbnail-container');
        thumbnailContainer.addEventListener('scroll', () => {
            if (enableCategoriesPanelCheckbox.checked) {
                panelContent.scrollTop = thumbnailContainer.scrollTop;
            }
        });
        const scriptModal = document.getElementById('script-modal');
        const batchScriptTextArea = document.getElementById('batch-script');
        const copyScriptBtn = document.getElementById('copy-script-btn');
        const downloadScriptLink = document.getElementById('download-script-link');
        const sizeSelector = document.getElementById('size-selector');
        const customSizeInput = document.getElementById('custom-size-input');
        const sortSelector = document.getElementById('sort-selector');
        const loadButton = document.getElementById('load-directory-btn');
        const loadScButton = document.getElementById('load-sc-btn');
        const loadLatestVideosButton = document.getElementById('load-latest-videos-btn');
        const loadRootScButton = document.getElementById('load-root-sc-btn');
        const createPlaylistLoadBtn = document.getElementById('create-playlist-load-btn');
        const createPlaylistRootLoadBtn = document.getElementById('create-playlist-root-load-btn');
        const updatePlaylistRootLoadBtn = document.getElementById('update-playlist-root-load-btn');
        const shortcutScriptBtn = document.getElementById('shortcut-script-btn');
        const createPlaylistBtn = document.getElementById('create-playlist-btn');
        const deleteShortcutsBtn = document.getElementById('delete-shortcuts-btn');
        const xShortcutBtn = document.getElementById('x-shortcut-btn');
        const contentSpacer = document.getElementById('content-spacer');
        const canvasSelect = document.getElementById('canvas-select');
        const groupSelector = document.getElementById('group-selector');
        const rootScBtn = null;
        const subfolderScBtn = null;
        const bothScBtn = null;
        const deleteScBtn = null;
        const playlistScBtn = null;
        const rotateScBtn = null;
        const playBtn = null;
        const videoModal = document.getElementById('video-modal');
        const player = document.getElementById('player');
        const closeVideoModal = document.getElementById('close-video-modal');
        const editorModal = document.getElementById('editor-modal');
        const closeEditorModal = document.getElementById('close-editor-modal');
        const editorMainVideo = document.getElementById('editor-mainVideo');
        const editorTimeline = document.getElementById('editor-timeline');
        const editorProgress = document.getElementById('editor-progress');
        const editorScrubber = document.getElementById('editor-scrubber');
        const editorPlayPauseBtn = document.getElementById('editor-playPause');
        const editorTimeDisplay = document.getElementById('editor-timeDisplay');
        const editorMarkStartBtn = document.getElementById('editor-markStartBtn');
        const editorMarkEndBtn = document.getElementById('editor-markEndBtn');
        const editorCutSegmentBtn = document.getElementById('editor-cutSegmentBtn');
        const editorCutsListContainer = document.getElementById('editor-cutsListContainer');
        const editorCommitBtn = document.getElementById('editor-commitBtn');
        const editorFrameBackBtn = document.getElementById('editor-frameBackBtn');
        const editorFrameForwardBtn = document.getElementById('editor-frameForwardBtn');
        const editorRotLeftBtn = document.getElementById('editor-rotLeft');
        const editorRot180Btn = document.getElementById('editor-rot180');
        const editorRotRightBtn = document.getElementById('editor-rotRight');
        const editorVideoOverlay = document.getElementById('editor-videoOverlay');
        const editorFileInfo = document.getElementById('editor-fileInfo');
        const categoriesModal = document.getElementById('categories-modal');
        const closeCategoriesModal = document.getElementById('close-categories-modal');
        const categoriesList = document.getElementById('categories-list');
        const newCategoryInput = document.getElementById('new-category-input');
        const addCategoryBtn = document.getElementById('add-category-btn');
        const globalCategoriesContainer = document.getElementById('global-categories-container');
        const globalCategoriesDropdown = document.getElementById('global-categories-dropdown');
        const addGlobalCategoryBtn = document.getElementById('add-global-category-btn');

        const prevCanvasBtn = document.getElementById('prev-canvas-btn');
        const nextCanvasBtn = document.getElementById('next-canvas-btn');
        const loadMenuBtn = document.getElementById('load-menu-btn');
        const loadDropdown = document.getElementById('load-dropdown');
        const optionsMenuBtn = document.getElementById('options-menu-btn');
        const optionsDropdown = document.getElementById('options-dropdown');
        const topCategoriesMenuBtn = document.getElementById('top-categories-menu-btn');
        const topCategoriesDropdown = document.getElementById('top-categories-dropdown');
        const revertDefaultsBtn = document.getElementById('revert-defaults-btn');
        const rotationControls = null;
        const rotationSelector = null;
        const deleteRotationBtn = null;

        let allVideoFiles = [];
        let allProjectFolders = [];
        const skipDirs = new Set(['edit thumbnails', 'thumbnails', 'sc', '.git', 'node_modules', 'recovery', '$recycle.bin', 'system volume information']);
        let shortcutSelections = new Map(); // Key: projectPath + '|' + videoName, Value: { videoName, projectPath, subfolder, type, rotation }
        let initialShortcutSelections = new Map(); // Key: projectPath + '|' + videoName, Value: { type, rotation }
        let currentDirHandle;
        let g_rootHandle;
        let currentMode = '';
        let canvases = new Map();
        let activeCanvasId = 0;
        let createdObjectUrls = [];
        let dummyTimestampProjects = new Set();
        let currentSelectionType = 'root-sc';
        let originalPlaylistShortcuts = [];
        let playlistCreationTime = null;
        let currentVideoUrl = null;
        let editorCurrentVideo = null;
        let editorCurrentCuts = [];
        let editorPendingCutStart = null;
        let editorPendingCutEnd = null;
        let editorMarkers = [];
        let editorEstimatedFPS = 30;
        let editorFrameOffset = 1 / 30;
        let editorMediaStartTime = null;
        let editorMediaFrameCount = 0;
        let editorScrubbingMouseDown = false;
        let editorCurrentAppliedRotation = 0;
        let editorCurrentAppliedFlip = false;

        let videoCategories = new Map(); // Key: projectPath + '|' + videoName, Value: Set of category names
        let initialVideoCategories = new Map(); // Key: projectPath + '|' + videoName, Value: Set of category names
        let projectCategories = new Map(); // Key: projectPath, Value: Set of category names
        let globalSavedCategories = new Set(JSON.parse(localStorage.getItem('globalSavedCategories') || '[]'));
        let categoryCurrentVideo = null;

        const mainContainer = document.querySelector('.main-container');
        const showDatesCheckbox = document.getElementById('show-dates-checkbox');
        const showNumbersCheckbox = document.getElementById('show-numbers-checkbox');
        const enableCategoriesPanelCheckbox = document.getElementById('enable-categories-panel-checkbox');
        const categoriesPanel = document.getElementById('categories-panel');
        const panelResizer = document.getElementById('panel-resizer');
        const panelContent = document.getElementById('panel-content');

        function updateRowNumbers() {
            const showNumbers = showNumbersCheckbox.checked;
            mainContainer.classList.toggle('show-numbers', showNumbers);
            const containers = document.querySelectorAll('.thumbnails-container');

            // First, remove any existing numbers to avoid duplicates
            document.querySelectorAll('.row-number').forEach(num => num.remove());

            if (showNumbers) {
                containers.forEach((container, index) => {
                    const numberSpan = document.createElement('span');
                    numberSpan.className = 'row-number';
                    numberSpan.textContent = index + 1;
                    container.insertBefore(numberSpan, container.firstChild);
                });
            }
        }

        // Categories Panel Logic
        let isResizingPanel = false;
        panelResizer.addEventListener('mousedown', (e) => {
            isResizingPanel = true;
            document.body.style.cursor = 'col-resize';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isResizingPanel) return;
            const contentArea = document.getElementById('content-area');
            const rect = contentArea.getBoundingClientRect();
            let newWidth = rect.right - e.clientX;
            newWidth = Math.max(100, Math.min(600, newWidth));
            categoriesPanel.style.width = newWidth + 'px';
            layoutLandscapeThumbnails();
        });

        window.addEventListener('mouseup', () => {
            if (isResizingPanel) {
                isResizingPanel = false;
                document.body.style.cursor = '';
                localStorage.setItem('categoriesPanelWidth', categoriesPanel.style.width);
            }
        });

        enableCategoriesPanelCheckbox.addEventListener('change', () => {
            const enabled = enableCategoriesPanelCheckbox.checked;
            categoriesPanel.style.display = enabled ? 'block' : 'none';
            panelResizer.style.display = enabled ? 'block' : 'none';
            localStorage.setItem('enableCategoriesPanel', enabled);
            if (enabled) {
                const savedWidth = localStorage.getItem('categoriesPanelWidth');
                if (savedWidth) categoriesPanel.style.width = savedWidth;
                renderCategoriesPanel();
            }
            layoutLandscapeThumbnails();
        });

        function renderCategoriesPanel() {
            if (!enableCategoriesPanelCheckbox.checked) return;
            panelContent.innerHTML = '';

            if (!canvases.has(activeCanvasId)) return;
            const canvas = canvases.get(activeCanvasId);
            const projectPath = canvas.path;

            // Get all in-play categories for this directory
            const inPlayCats = new Set();
            const projectVideos = allVideoFiles.filter(v => v.projectPath === projectPath);
            projectVideos.forEach(v => {
                const cats = videoCategories.get(projectPath + '|' + v.name);
                if (cats) cats.forEach(c => inPlayCats.add(c));
            });
            const sortedInPlay = Array.from(inPlayCats).sort();

            const elements = thumbnailContainer.children;
            for (let el of elements) {
                if (el.classList.contains('project-header')) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'panel-header-placeholder';
                    placeholder.style.height = el.offsetHeight + 'px';
                    placeholder.textContent = 'Project Header';
                    panelContent.appendChild(placeholder);
                } else if (el.tagName === 'HR') {
                    const hrPlaceholder = document.createElement('div');
                    hrPlaceholder.style.height = el.offsetHeight + 'px';
                    hrPlaceholder.style.borderBottom = '1px solid #444';
                    panelContent.appendChild(hrPlaceholder);
                } else if (el.classList.contains('landscape-row')) {
                    const row = el;
                    const videoName = row.dataset.videoName;
                    const projPath = row.dataset.projectPath;
                    const videoKey = projPath + '|' + videoName;
                    const videoCats = videoCategories.get(videoKey) || new Set();

                    const panelRow = document.createElement('div');
                    panelRow.className = 'panel-row';

                    // Align with row
                    panelRow.style.height = row.offsetHeight + 'px';

                    const catListDiv = document.createElement('div');
                catListDiv.className = 'panel-video-cats';

                if (sortedInPlay.length === 0) {
                    const none = document.createElement('div');
                    none.style.color = '#888';
                    none.style.fontStyle = 'italic';
                    none.textContent = 'No active categories';
                    catListDiv.appendChild(none);
                } else {
                    sortedInPlay.forEach(cat => {
                        const item = document.createElement('div');
                        item.className = 'panel-cat-item';

                        const cb = document.createElement('input');
                        cb.type = 'checkbox';
                        cb.checked = videoCats.has(cat);
                        cb.onchange = (e) => {
                            e.stopPropagation();
                            toggleVideoCategory(cat, cb.checked, videoKey, projPath);
                        };

                        const label = document.createElement('label');
                        label.textContent = cat;
                        label.style.cursor = 'pointer';
                        label.onclick = (e) => {
                            e.stopPropagation();
                            cb.click();
                        };

                        item.appendChild(cb);
                        item.appendChild(label);
                        catListDiv.appendChild(item);
                    });
                }

                panelRow.appendChild(catListDiv);
                panelContent.appendChild(panelRow);
                }
            }
        }

        // Editor Helper Functions
        function editorTimeToFrame(time) {
            return Math.round(time * editorEstimatedFPS);
        }
        function editorFrameToTime(frame) {
            return frame / editorEstimatedFPS;
        }
        function editorFmtTime(s) {
            if (!isFinite(s)) s = 0;
            const ms = Math.floor((s - Math.floor(s)) * 1000);
            const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
            return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
        }
        function editorApplyRotationToViewer(d, flipped = editorCurrentAppliedFlip) {
            editorCurrentAppliedRotation = (d + 360) % 360;
            editorCurrentAppliedFlip = flipped;
            let transform = `rotate(${editorCurrentAppliedRotation}deg) translate3d(0,0,0)`;
            if (flipped) {
                transform += ' scaleX(-1)';
            }
            editorMainVideo.style.transform = transform;
        }
        function editorGetRotationAt(time) {
            if (!editorMarkers || !editorMarkers.length) return 0;
            const currentFrame = editorTimeToFrame(time);
            let rot = 0;
            for (const m of editorMarkers) {
                if (currentFrame >= m.frame) {
                    rot = m.rotation;
                } else {
                    break;
                }
            }
            return rot;
        }
        function editorRenderMarkers() {
            editorTimeline.querySelectorAll('.editor-marker, .editor-delete-x, .editor-cut-region, .editor-pending-marker').forEach(x => x.remove());
            if (!editorMainVideo.duration) return;
            const w = editorTimeline.clientWidth;

            editorCurrentCuts.forEach(cut => {
                const startX = (cut.start / editorMainVideo.duration) * w;
                const endX = (cut.end / editorMainVideo.duration) * w;
                const region = document.createElement('div');
                region.className = 'editor-cut-region';
                region.style.left = `${startX}px`;
                region.style.width = `${endX - startX}px`;
                editorTimeline.appendChild(region);
            });

            if (editorPendingCutStart !== null) {
                const x = (editorPendingCutStart / editorMainVideo.duration) * w;
                const marker = document.createElement('div');
                marker.className = 'editor-pending-marker';
                marker.style.left = `${x}px`;
                editorTimeline.appendChild(marker);
            }
            if (editorPendingCutEnd !== null) {
                const x = (editorPendingCutEnd / editorMainVideo.duration) * w;
                const marker = document.createElement('div');
                marker.className = 'editor-pending-marker';
                marker.style.left = `${x}px`;
                editorTimeline.appendChild(marker);
            }

            (editorMarkers || []).forEach((m, idx) => {
                const t = editorFrameToTime(m.frame);
                const x = (t / editorMainVideo.duration) * w;
                const mark = document.createElement('div');
                mark.className = 'editor-marker';
                mark.dataset.rot = m.rotation;
                mark.style.left = x + 'px';
                mark.onclick = (e) => {
                    e.stopPropagation();
                    editorMainVideo.currentTime = t;
                    editorApplyRotationToViewer(m.rotation);
                };
                editorTimeline.appendChild(mark);

                const del = document.createElement('div');
                del.className = 'editor-delete-x';
                del.style.left = x + 'px';
                del.textContent = '❌';
                del.onclick = e => {
                    e.stopPropagation();
                    editorMarkers.splice(idx, 1);
                    editorRenderMarkers();
                };
                editorTimeline.appendChild(del);
            });
        }
        function editorRenderLoop(now, metadata) {
            if (!editorMainVideo.duration) return;
            const currentTime = metadata.mediaTime;
            if (!editorMainVideo.paused && editorMediaStartTime === null) {
                editorMediaStartTime = currentTime;
                editorMediaFrameCount = 1;
            } else if (!editorMainVideo.paused) {
                editorMediaFrameCount++;
            }
            if (editorMediaStartTime !== null && currentTime - editorMediaStartTime >= 2) {
                editorEstimatedFPS = editorMediaFrameCount / (currentTime - editorMediaStartTime);
                editorFrameOffset = 1 / editorEstimatedFPS;
                editorMediaStartTime = null;
                editorMediaFrameCount = 0;
            }
            if (!editorScrubbingMouseDown) {
                const p = (currentTime / editorMainVideo.duration) * 100;
                editorProgress.style.width = p + '%';
                editorScrubber.style.left = p + '%';
            }
            editorTimeDisplay.textContent = `${editorFmtTime(currentTime)} / ${editorFmtTime(editorMainVideo.duration)}`;
            const rot = editorGetRotationAt(currentTime);
            editorApplyRotationToViewer(rot);
            const isCut = editorCurrentCuts.some(cut => currentTime >= cut.start && currentTime < cut.end);
            editorVideoOverlay.style.display = isCut ? 'block' : 'none';
            editorMainVideo.requestVideoFrameCallback(editorRenderLoop);
        }
        function editorRenderCutsList() {
            editorCutsListContainer.innerHTML = '';
            if (editorCurrentCuts.length === 0) {
                editorCutsListContainer.innerHTML = '<div style="text-align:center;color:#888;font-size:12px;">No cuts defined.</div>';
                return;
            }
            editorCurrentCuts.sort((a,b) => a.start - b.start).forEach((cut, index) => {
                const item = document.createElement('div');
                item.className = 'editor-cut-item';
                item.innerHTML = `<span>Cut ${index + 1}: ${editorFmtTime(cut.start)} – ${editorFmtTime(cut.end)}</span><span class="editor-delete-cut-btn">❌</span>`;
                item.querySelector('.editor-delete-cut-btn').onclick = () => {
                    editorCurrentCuts.splice(index, 1);
                    editorUpdateUI();
                };
                editorCutsListContainer.appendChild(item);
            });
        }
        function editorUpdateUI() {
            editorRenderCutsList();
            editorCutSegmentBtn.disabled = !(editorPendingCutStart !== null && editorPendingCutEnd !== null);
            editorRenderMarkers();
        }
        function editorScrubToPosition(clientX) {
            const r = editorTimeline.getBoundingClientRect();
            let p = (clientX - r.left) / r.width;
            p = Math.max(0, Math.min(1, p));
            const newTime = p * editorMainVideo.duration;
            editorMainVideo.currentTime = newTime;
            editorProgress.style.width = (p * 100) + '%';
            editorScrubber.style.left = (p * 100) + '%';
        }

        function renderCategories() {
            categoriesList.innerHTML = '';
            const projCats = projectCategories.get(categoryCurrentVideo.projectPath) || new Set();
            const videoCats = videoCategories.get(categoryCurrentVideo.projectPath + '|' + categoryCurrentVideo.videoName) || new Set();

            if (projCats.size === 0) {
                categoriesList.innerHTML = '<div style="color: #888;">No categories yet.</div>';
            } else {
                Array.from(projCats).sort().forEach(cat => {
                    const div = document.createElement('div');
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.gap = '5px';
                    div.style.padding = '2px 0';

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.id = `cat-cb-${cat}`;
                    cb.checked = videoCats.has(cat);
                    cb.onchange = () => {
                        toggleVideoCategory(cat, cb.checked);
                    };

                    const lbl = document.createElement('label');
                    lbl.htmlFor = `cat-cb-${cat}`;
                    lbl.textContent = cat;
                    lbl.style.cursor = 'pointer';

                    div.appendChild(cb);
                    div.appendChild(lbl);
                    categoriesList.appendChild(div);
                });
            }

            // Global categories dropdown
            globalCategoriesDropdown.innerHTML = '<option value="">Select a saved category...</option>';
            let hasNewGlobal = false;
            Array.from(globalSavedCategories).sort().forEach(cat => {
                if (!projCats.has(cat)) {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    opt.textContent = cat;
                    globalCategoriesDropdown.appendChild(opt);
                    hasNewGlobal = true;
                }
            });
            globalCategoriesContainer.style.display = hasNewGlobal ? 'flex' : 'none';
        }

        function toggleVideoCategory(catName, isAdded, videoKey = null, projectPath = null) {
            const key = videoKey || (categoryCurrentVideo.projectPath + '|' + categoryCurrentVideo.videoName);
            const projPath = projectPath || categoryCurrentVideo.projectPath;

            if (!videoCategories.has(key)) videoCategories.set(key, new Set());
            const cats = videoCategories.get(key);
            if (isAdded) {
                cats.add(catName);
                if (!projectCategories.has(projPath)) projectCategories.set(projPath, new Set());
                projectCategories.get(projPath).add(catName);
                globalSavedCategories.add(catName);
                localStorage.setItem('globalSavedCategories', JSON.stringify(Array.from(globalSavedCategories)));
            } else {
                cats.delete(catName);
            }
            if (enableCategoriesPanelCheckbox.checked) {
                renderCategoriesPanel();
            }
        }

        function bulkToggleCategory(catName, isAdd) {
            if (!canvases.has(activeCanvasId)) return;
            const canvas = canvases.get(activeCanvasId);
            const projectPath = canvas.path;

            // Get all videos in this canvas
            const videos = allVideoFiles.filter(f => f.projectPath === projectPath);

            videos.forEach(video => {
                const key = projectPath + '|' + video.name;
                if (!videoCategories.has(key)) videoCategories.set(key, new Set());
                const cats = videoCategories.get(key);

                if (isAdd) {
                    cats.add(catName);
                    if (!projectCategories.has(projectPath)) projectCategories.set(projectPath, new Set());
                    projectCategories.get(projectPath).add(catName);
                    globalSavedCategories.add(catName);
                } else {
                    cats.delete(catName);
                }
            });

            if (isAdd) {
                localStorage.setItem('globalSavedCategories', JSON.stringify(Array.from(globalSavedCategories)));
            }

            topCategoriesDropdown.style.display = 'none';
            if (enableCategoriesPanelCheckbox.checked) {
                renderCategoriesPanel();
            }
        }

        function updateTopCategoriesMenu() {
            topCategoriesDropdown.innerHTML = '';
            if (!canvases.has(activeCanvasId)) return;
            const canvas = canvases.get(activeCanvasId);
            const projectPath = canvas.path;
            const projCats = projectCategories.get(projectPath) || new Set();

            const allAvailableCats = new Set([...projCats, ...globalSavedCategories]);
            if (allAvailableCats.size === 0) {
                topCategoriesDropdown.innerHTML = '<div style="padding: 16px; color: #888;">No categories available.</div>';
                return;
            }

            const container = document.createElement('div');
            container.style.padding = '12px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';

            const label = document.createElement('div');
            label.textContent = 'Select Category to apply to ALL videos in this project:';
            label.style.fontSize = '12px';
            label.style.color = '#ccc';
            container.appendChild(label);

            const select = document.createElement('select');
            select.style.width = '100%';
            select.style.height = '36px';
            select.style.marginBottom = '5px';
            select.style.color = 'black';
            select.style.backgroundColor = 'white';

            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '-- Select Category --';
            select.appendChild(defaultOpt);

            Array.from(allAvailableCats).sort().forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                select.appendChild(opt);
            });
            container.appendChild(select);

            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '10px';

            const addAllBtn = document.createElement('button');
            addAllBtn.className = 'bar-button';
            addAllBtn.style.flex = '1';
            addAllBtn.style.height = '36px';
            addAllBtn.style.backgroundColor = '#43a047';
            addAllBtn.textContent = 'Add All';
            addAllBtn.onclick = (e) => {
                e.stopPropagation();
                if (select.value) {
                    bulkToggleCategory(select.value, true);
                    topCategoriesDropdown.style.display = 'none';
                } else {
                    alert('Please select a category first.');
                }
            };

            const remAllBtn = document.createElement('button');
            remAllBtn.className = 'bar-button';
            remAllBtn.style.flex = '1';
            remAllBtn.style.height = '36px';
            remAllBtn.style.backgroundColor = '#d32f2f';
            remAllBtn.textContent = 'Remove All';
            remAllBtn.onclick = (e) => {
                e.stopPropagation();
                if (select.value) {
                    bulkToggleCategory(select.value, false);
                    topCategoriesDropdown.style.display = 'none';
                } else {
                    alert('Please select a category first.');
                }
            };

            btnRow.appendChild(addAllBtn);
            btnRow.appendChild(remAllBtn);
            container.appendChild(btnRow);

            topCategoriesDropdown.appendChild(container);
            topCategoriesDropdown.style.minWidth = '300px';
        }

        function openCategoriesModal(videoName, projectPath, subfolder, projectName) {
            categoryCurrentVideo = { videoName, projectPath, subfolder, projectName };
            newCategoryInput.value = '';
            renderCategories();
            categoriesModal.style.display = 'flex';
        }

        async function openVideoEditor(videoName, projectPath, subfolder, projectName) {
            const key = projectPath + '|' + videoName;
            editorCurrentVideo = { videoName, projectPath, subfolder, projectName };
            editorFileInfo.textContent = `${videoName} (${projectPath})`;

            const selection = shortcutSelections.get(key) || {};
            editorCurrentCuts = selection.cuts ? JSON.parse(JSON.stringify(selection.cuts)) : [];
            editorMarkers = selection.markers ? JSON.parse(JSON.stringify(selection.markers)) : [];
            editorCurrentAppliedFlip = !!selection.flipped;

            if (editorMarkers.length === 0 && selection.rotation && selection.rotation !== "0") {
                editorMarkers = [{ frame: 0, rotation: parseInt(selection.rotation) }];
            }
            editorPendingCutStart = null;
            editorPendingCutEnd = null;
            editorEstimatedFPS = 30;
            editorFrameOffset = 1 / 30;
            editorMediaStartTime = null;
            editorMediaFrameCount = 0;

            // Find video file
            let videoFile = null;
            const project = allProjectFolders.find(p => p.path === projectPath);
            if (project) {
                async function scanForFile(dirHandle, sub) {
                    for await (const entry of dirHandle.values()) {
                        if (entry.kind === 'file' && entry.name === videoName) {
                            return await entry.getFile();
                        } else if (entry.kind === 'directory' && !skipDirs.has(entry.name.toLowerCase())) {
                            const res = await scanForFile(entry, sub);
                            if (res) return res;
                        }
                    }
                    return null;
                }
                videoFile = await scanForFile(project.handle, subfolder);
            }

            if (!videoFile) {
                alert('Could not find video file.');
                return;
            }

            if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl);
            currentVideoUrl = URL.createObjectURL(videoFile);
            editorMainVideo.src = currentVideoUrl;
            editorModal.style.display = 'flex';
        }

        function init() {
            closeCategoriesModal.onclick = () => {
                categoriesModal.style.display = 'none';
            };

            addCategoryBtn.onclick = () => {
                const catName = newCategoryInput.value.trim();
                if (catName) {
                    toggleVideoCategory(catName, true);
                    newCategoryInput.value = '';
                    renderCategories();
                }
            };

            addGlobalCategoryBtn.onclick = () => {
                const catName = globalCategoriesDropdown.value;
                if (catName) {
                    toggleVideoCategory(catName, true);
                    renderCategories();
                }
            };

            closeEditorModal.addEventListener('click', () => {
                editorModal.style.display = 'none';
                editorMainVideo.pause();
                editorMainVideo.src = '';
            });

            editorPlayPauseBtn.addEventListener('click', () => {
                if (editorMainVideo.paused) {
                    editorMainVideo.play();
                    editorPlayPauseBtn.textContent = '⏸ Pause';
                } else {
                    editorMainVideo.pause();
                    editorPlayPauseBtn.textContent = '▶️ Play';
                }
            });

            editorMarkStartBtn.onclick = () => {
                editorPendingCutStart = editorMainVideo.currentTime;
                if (editorPendingCutEnd !== null && editorPendingCutEnd < editorPendingCutStart) {
                    [editorPendingCutStart, editorPendingCutEnd] = [editorPendingCutEnd, editorPendingCutStart];
                }
                editorUpdateUI();
            };
            editorMarkEndBtn.onclick = () => {
                editorPendingCutEnd = editorMainVideo.currentTime;
                if (editorPendingCutStart !== null && editorPendingCutEnd < editorPendingCutStart) {
                    [editorPendingCutStart, editorPendingCutEnd] = [editorPendingCutEnd, editorPendingCutStart];
                }
                editorUpdateUI();
            };
            editorCutSegmentBtn.onclick = () => {
                if (editorPendingCutStart !== null && editorPendingCutEnd !== null) {
                    editorCurrentCuts.push({ start: editorPendingCutStart, end: editorPendingCutEnd });
                    editorPendingCutStart = null;
                    editorPendingCutEnd = null;
                    editorUpdateUI();
                }
            };

            editorFrameBackBtn.onclick = () => editorMainVideo.currentTime -= editorFrameOffset;
            editorFrameForwardBtn.onclick = () => editorMainVideo.currentTime += editorFrameOffset;

            [editorRotLeftBtn, editorRot180Btn, editorRotRightBtn].forEach(b => {
                b.onclick = () => {
                    const d = b.id === 'editor-rotLeft' ? 270 : b.id === 'editor-rot180' ? 180 : 90;
                    const nr = (editorCurrentAppliedRotation + d) % 360;
                    editorApplyRotationToViewer(nr);
                    const currentFrame = editorTimeToFrame(editorMainVideo.currentTime);
                    editorMarkers.push({ frame: currentFrame, rotation: nr });
                    editorMarkers.sort((a, b) => a.frame - b.frame);
                    editorRenderMarkers();
                };
            });

            editorTimeline.onmousedown = e => {
                editorScrubbingMouseDown = true;
                editorScrubToPosition(e.clientX);
            };
            window.addEventListener('mousemove', e => {
                if (editorScrubbingMouseDown) editorScrubToPosition(e.clientX);
            });
            window.addEventListener('mouseup', () => {
                editorScrubbingMouseDown = false;
            });

            editorMainVideo.onloadedmetadata = () => {
                editorUpdateUI();
                editorMainVideo.requestVideoFrameCallback(editorRenderLoop);
            };

            editorCommitBtn.onclick = () => {
                const key = editorCurrentVideo.projectPath + '|' + editorCurrentVideo.videoName;
                const initial = initialShortcutSelections.get(key);
                const initialRot = (initial && initial.rotation) || "0";
                const initialFlipped = initial ? !!initial.flipped : false;

                let selection = shortcutSelections.get(key);

                const hasCuts = editorCurrentCuts.length > 0;
                let markersChanged = editorMarkers.length > 0;
                let finalRotation = initialRot;
                let finalFlipped = editorCurrentAppliedFlip;

                if (markersChanged) {
                    const lastMarker = editorMarkers[editorMarkers.length - 1];
                    finalRotation = lastMarker.rotation.toString();
                    if (editorMarkers.length === 1 && editorMarkers[0].frame === 0) {
                        if (finalRotation === initialRot) {
                            markersChanged = false;
                        }
                    }
                }

                const isReverted = !hasCuts && !markersChanged && finalRotation === initialRot && finalFlipped === initialFlipped;

                if (isReverted) {
                    if (selection) {
                        if (!selection.type && !selection.targetProject) {
                            shortcutSelections.delete(key);
                        } else {
                            selection.cuts = [];
                            selection.markers = [];
                            selection.rotation = initialRot;
                            selection.flipped = initialFlipped;
                        }
                    }
                } else {
                    if (!selection) {
                        selection = {
                            videoName: editorCurrentVideo.videoName,
                            projectPath: editorCurrentVideo.projectPath,
                            subfolder: editorCurrentVideo.subfolder,
                            projectName: editorCurrentVideo.projectName,
                            type: '', rotation: finalRotation, flipped: finalFlipped
                        };
                        shortcutSelections.set(key, selection);
                    }
                    selection.cuts = JSON.parse(JSON.stringify(editorCurrentCuts));
                    selection.markers = JSON.parse(JSON.stringify(editorMarkers));
                    selection.rotation = finalRotation;
                    selection.flipped = finalFlipped;
                    selection.fps = editorEstimatedFPS;
                }

                // Close editor
                editorModal.style.display = 'none';
                editorMainVideo.pause();
                editorMainVideo.src = '';

                // Update UI in main view
                const row = document.querySelector(`.landscape-row[data-video-name="${editorCurrentVideo.videoName}"][data-project-path="${editorCurrentVideo.projectPath}"]`);
                if (row) {
                    updateRowUI(row, editorCurrentVideo.videoName, editorCurrentVideo.projectPath);
                }
            };

            loadMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                optionsDropdown.style.display = 'none';
                loadDropdown.style.display = loadDropdown.style.display === 'block' ? 'none' : 'block';
            });

            optionsMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadDropdown.style.display = 'none';
                topCategoriesDropdown.style.display = 'none';
                optionsDropdown.style.display = optionsDropdown.style.display === 'block' ? 'none' : 'block';
            });

            topCategoriesMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                loadDropdown.style.display = 'none';
                optionsDropdown.style.display = 'none';
                if (topCategoriesDropdown.style.display === 'block') {
                    topCategoriesDropdown.style.display = 'none';
                } else {
                    updateTopCategoriesMenu();
                    topCategoriesDropdown.style.display = 'block';
                }
            });

            window.addEventListener('click', () => {
                loadDropdown.style.display = 'none';
                optionsDropdown.style.display = 'none';
                topCategoriesDropdown.style.display = 'none';
            });

            optionsDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            topCategoriesDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            const colorPickers = {
                'bg-color': document.getElementById('bg-color-picker'),
                'top-bar-color': document.getElementById('top-bar-color-picker'),
                'toolbar-color': document.getElementById('toolbar-color-picker'),
                'root-sc-color': document.getElementById('root-sc-color-picker'),
                'subfolder-sc-color': document.getElementById('subfolder-sc-color-picker'),
                'both-sc-color': document.getElementById('both-sc-color-picker'),
                'delete-sc-color': document.getElementById('delete-sc-color-picker'),
                'header-text-color': document.getElementById('header-text-color-picker'),
                'row-number-color': document.getElementById('row-number-color-picker'),
                'date-text-color': document.getElementById('date-text-color-picker'),
                'playlist-sc-color': document.getElementById('playlist-sc-color-picker')
            };

            // Load saved colors
            Object.keys(colorPickers).forEach(id => {
                const picker = colorPickers[id];
                if (!picker) return;
                const saved = localStorage.getItem(`sc-color-${id}`);
                if (saved) {
                    document.documentElement.style.setProperty(`--${id}`, saved);
                    picker.value = saved;
                }
            });

            // Handle color changes
            Object.keys(colorPickers).forEach(id => {
                const picker = colorPickers[id];
                if (!picker) return;
                picker.addEventListener('input', (e) => {
                    const color = e.target.value;
                    document.documentElement.style.setProperty(`--${id}`, color);
                    localStorage.setItem(`sc-color-${id}`, color);
                    if (id.includes('sc-color')) {
                        updateCircleColors();
                    }
                });
            });

            if (revertDefaultsBtn) {
                revertDefaultsBtn.addEventListener('click', () => {
                    const defaults = {
                        'bg-color': '#3d0021',
                        'top-bar-color': '#1c1c1c',
                        'toolbar-color': '#1c1c1c',
                        'root-sc-color': '#ffe11f',
                        'subfolder-sc-color': '#00ff1e',
                        'both-sc-color': '#009dff',
                        'delete-sc-color': '#ff0101',
                        'header-text-color': '#01ff01',
                        'row-number-color': '#fcfc01',
                        'date-text-color': '#01ffff',
                        'playlist-sc-color': '#ff00ff'
                    };
                    Object.keys(defaults).forEach(id => {
                        const color = defaults[id];
                        document.documentElement.style.setProperty(`--${id}`, color);
                        if (colorPickers[id]) {
                            colorPickers[id].value = color;
                        }
                        localStorage.removeItem(`sc-color-${id}`);
                    });
                    updateCircleColors();
                });
            }

            updateCircleColors();

            // Load panel state
            const panelEnabled = localStorage.getItem('enableCategoriesPanel') === 'true';
            enableCategoriesPanelCheckbox.checked = panelEnabled;
            if (panelEnabled) {
                categoriesPanel.style.display = 'block';
                panelResizer.style.display = 'block';
                const savedWidth = localStorage.getItem('categoriesPanelWidth');
                if (savedWidth) categoriesPanel.style.width = savedWidth;
            }

            loadButton.addEventListener('click', async () => {
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    currentDirHandle = dirHandle;
                    g_rootHandle = null;
                    currentMode = 'directory';
                    setVisibilityForMode(currentMode);
                    await renderDirectoryMode();
                } catch (err) {
                    if (err.name !== 'AbortError') console.error('Failed to open directory:', err);
                }
            });

            loadScButton.addEventListener('click', async () => {
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    currentDirHandle = dirHandle;
                    g_rootHandle = null;
                    currentMode = 'sc';
                    setVisibilityForMode(currentMode);
                    await renderVideosInternal(false, sortSelector.value, true);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Failed to open directory or render SC mode:', err);
                    }
                }
            });

            updatePlaylistRootLoadBtn.addEventListener('click', async () => {
                try {
                    const [fileHandle] = await window.showOpenFilePicker({
                        types: [{
                            description: 'Playlist files',
                            accept: {
                                'text/plain': ['.m3u'],
                                'audio/x-mpegurl': ['.m3u'],
                                'application/vnd.apple.mpegurl': ['.m3u']
                            }
                        }]
                    });
                    const file = await fileHandle.getFile();
                    playlistCreationTime = file.lastModified;
                    let text = await file.text();
                    // Remove UTF-8 BOM if present
                    if (text.charCodeAt(0) === 0xFEFF) {
                        text = text.substring(1);
                    }
                    // Basic M3U parsing, skipping comments
                    originalPlaylistShortcuts = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));

                    const dirHandle = await window.showDirectoryPicker();
                    currentDirHandle = dirHandle;
                    currentMode = 'update-playlist-root';
                    setSelectionType('playlist-sc');
                    setVisibilityForMode(currentMode);
                    await renderVideosInternal(false, sortSelector.value, true);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Failed to open playlist or directory:', err);
                    }
                }
            });


            loadLatestVideosButton.addEventListener('click', async () => {
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    currentDirHandle = dirHandle;
                    g_rootHandle = null;
                    currentMode = 'latest-videos';
                    setVisibilityForMode(currentMode);
                    await renderLatestVideosMode();
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Failed to open directory or render latest videos mode:', err);
                    }
                }
            });

            scriptModal.querySelector('.close').addEventListener('click', () => scriptModal.style.display = 'none');

            copyScriptBtn.addEventListener('click', () => {
                 batchScriptTextArea.select();
                 navigator.clipboard.writeText(batchScriptTextArea.value).then(() => {
                    alert('Script copied to clipboard!');
                });
            });

            shortcutScriptBtn.addEventListener('click', () => {
                if (!hasChanges()) {
                    alert('No changes to save.');
                    return;
                }
                generateShortcutScript();
                scriptModal.style.display = 'block';
            });

            sizeSelector.addEventListener('change', () => {
                if (sizeSelector.value === 'custom') {
                    customSizeInput.style.display = 'inline-block';
                    if (!customSizeInput.value) customSizeInput.value = 100;
                } else {
                    customSizeInput.style.display = 'none';
                }
                saveCurrentSizeForProject();
                layoutLandscapeThumbnails();
            });
            customSizeInput.addEventListener('input', () => {
                saveCurrentSizeForProject();
                layoutLandscapeThumbnails();
            });
            window.addEventListener('resize', debouncedLayout);

            sortSelector.addEventListener('change', (e) => {
                if(currentDirHandle) {
                    if (currentMode === 'directory') {
                        renderDirectoryMode(e.target.value);
                    } else if (currentMode === 'latest-videos') {
                        renderLatestVideosMode(e.target.value);
                    } else if (currentMode === 'sc' || currentMode === 'root-sc') {
                        renderVideosInternal(false, e.target.value, true);
                    }
                }
            });

            loadRootScButton.addEventListener('click', async () => {
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    currentDirHandle = dirHandle;
                    g_rootHandle = null;
                    currentMode = 'root-sc';
                    setVisibilityForMode(currentMode);
                    await renderVideosInternal(false, sortSelector.value, true);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Failed to open directory or render Root SC mode:', err);
                    }
                }
            });

            createPlaylistLoadBtn.addEventListener('click', async () => {
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    currentDirHandle = dirHandle;
                    currentMode = 'playlist';
                    setSelectionType('both-sc');
                    setVisibilityForMode(currentMode);
                    await renderPlaylistMode();
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Failed to open directory or render playlist mode:', err);
                    }
                }
            });

            createPlaylistRootLoadBtn.addEventListener('click', async () => {
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    currentDirHandle = dirHandle;
                    currentMode = 'playlist-root';
                    setSelectionType('playlist-sc');
                    setVisibilityForMode(currentMode);
                    await renderVideosInternal(false, sortSelector.value, true);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Failed to open directory or render playlist root mode:', err);
                    }
                }
            });

            createPlaylistBtn.addEventListener('click', () => {
                if (shortcutSelections.size === 0) {
                    alert('Please select one or more items to include in the playlist.');
                    return;
                }
                generatePlaylistScript();
                scriptModal.style.display = 'block';
            });

            if (deleteScBtn) deleteScBtn.addEventListener('click', () => setSelectionType('delete-sc'));
            if (playlistScBtn) playlistScBtn.addEventListener('click', () => setSelectionType('playlist-sc'));
            if (rotateScBtn) rotateScBtn.addEventListener('click', () => setSelectionType('rotate-sc'));
            if (playBtn) playBtn.addEventListener('click', () => setSelectionType('play'));

            const closeModal = () => {
                videoModal.style.display = 'none';
                player.pause();
                player.src = "";
                player.load();
                if (currentVideoUrl) {
                    URL.revokeObjectURL(currentVideoUrl);
                    currentVideoUrl = null;
                }
            };

            closeVideoModal.addEventListener('click', closeModal);
            player.addEventListener('click', closeModal);

            deleteShortcutsBtn.addEventListener('click', () => {
                if (!hasChanges()) {
                    alert('No changes to save.');
                    return;
                }
                generateShortcutScript();
                scriptModal.style.display = 'block';
            });

            if (rootScBtn) rootScBtn.addEventListener('click', () => setSelectionType('root-sc'));
            if (subfolderScBtn) subfolderScBtn.addEventListener('click', () => setSelectionType('subfolder-sc'));
            if (bothScBtn) bothScBtn.addEventListener('click', () => setSelectionType('both-sc'));

            prevCanvasBtn.addEventListener('click', () => navigateCanvas(-1));
            nextCanvasBtn.addEventListener('click', () => navigateCanvas(1));

            if (deleteRotationBtn) {
                deleteRotationBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const selectedRows = document.querySelectorAll('.landscape-row:has(.selected-root-sc), .landscape-row:has(.selected-subfolder-sc), .landscape-row:has(.selected-both-sc), .landscape-row:has(.selected-delete-sc), .landscape-row:has(.selected-playlist-sc)');

                    selectedRows.forEach(row => {
                        const videoName = row.dataset.videoName;
                        const projectPath = row.dataset.projectPath;
                        const key = projectPath + '|' + videoName;
                        const selection = shortcutSelections.get(key);
                        if (selection) {
                            selection.rotation = "0";
                            row.querySelectorAll('.thumbnail').forEach(t => {
                                t.classList.remove('rotate-90', 'rotate-180', 'rotate-270');
                            });
                        }
                    });
                    deleteRotationBtn.style.display = 'none';
                });
            }
        }

        function updateRotationUI(key) {
            const selection = shortcutSelections.get(key);
            if (deleteRotationBtn) {
                if (selection && selection.rotation && selection.rotation !== "0") {
                    deleteRotationBtn.style.display = 'inline-block';
                } else {
                    deleteRotationBtn.style.display = 'none';
                }
            }
        }

        function navigateCanvas(direction) {
            const canvasIds = Array.from(canvases.keys());
            if (canvasIds.length <= 1) return;

            const currentIndex = canvasIds.indexOf(activeCanvasId);
            let nextIndex = currentIndex + direction;

            if (nextIndex < 0) {
                nextIndex = canvasIds.length - 1;
            } else if (nextIndex >= canvasIds.length) {
                nextIndex = 0;
            }

            const nextCanvasId = canvasIds[nextIndex];
            renderCanvas(nextCanvasId);
        }

        function setSelectionType(type) {
            currentSelectionType = type;
            updateSelectionTypeButtons();
        }

        function updateCircleColors() {
            const getCircle = (btn) => btn ? btn.querySelector('.color-circle') : null;

            const rootCircle = getCircle(rootScBtn);
            const subfolderCircle = getCircle(subfolderScBtn);
            const bothCircle = getCircle(bothScBtn);
            const deleteCircle = getCircle(deleteScBtn);
            const playlistCircle = getCircle(playlistScBtn);
            const rotateCircle = getCircle(rotateScBtn);
            const playCircle = getCircle(playBtn);

            if (rootCircle) rootCircle.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--root-sc-color');
            if (subfolderCircle) subfolderCircle.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--subfolder-sc-color');
            if (bothCircle) bothCircle.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--both-sc-color');
            if (deleteCircle) deleteCircle.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--delete-sc-color');
            if (playlistCircle) playlistCircle.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--playlist-sc-color');
            if (rotateCircle) rotateCircle.style.backgroundColor = '#ff8800';
            if (playCircle) playCircle.style.backgroundColor = '#888';
        }

        function updateSelectionTypeButtons() {
            // Deprecated - row action bars handle their own active states
        }

        function playVideo(file, rotation, flipped = false) {
            if (currentVideoUrl) {
                URL.revokeObjectURL(currentVideoUrl);
            }
            currentVideoUrl = URL.createObjectURL(file);
            player.src = currentVideoUrl;
            player.classList.remove('rotate-90', 'rotate-180', 'rotate-270');

            // Reset scaling and transforms
            player.style.transform = '';
            player.style.maxWidth = '90vw';
            player.style.maxHeight = '90vh';

            let transform = '';
            if (rotation !== "0") {
                transform += `rotate(${rotation}deg) `;
                if (rotation === "90" || rotation === "270") {
                    player.style.maxWidth = '90vh';
                    player.style.maxHeight = '90vw';
                }
            }
            if (flipped) {
                transform += 'scaleX(-1) ';
            }
            player.style.transform = transform.trim();
            videoModal.style.display = 'flex';
            player.play();
        }

        function saveCurrentSizeForProject() {
            if (!canvases.has(activeCanvasId)) return;
            const canvas = canvases.get(activeCanvasId);
            if (canvas.path !== undefined) {
                const config = {
                    size: sizeSelector.value,
                    custom: sizeSelector.value === 'custom' ? customSizeInput.value : null
                };
                localStorage.setItem(`proj-size-${canvas.path}`, JSON.stringify(config));
            }
        }

        function renderCanvas(canvasId) {
            if (!canvases.has(canvasId)) return;

            activeCanvasId = canvasId;
            thumbnailContainer.innerHTML = ''; // Clear container

            const canvas = canvases.get(canvasId);
            if (canvas && canvas.elements) {
                canvas.elements.forEach(el => {
                    thumbnailContainer.appendChild(el);
                });
            }

            // Load saved size for this project
            if (canvas.path !== undefined) {
                const saved = localStorage.getItem(`proj-size-${canvas.path}`);
                if (saved) {
                    const config = JSON.parse(saved);
                    sizeSelector.value = config.size;
                    if (config.size === 'custom') {
                        customSizeInput.style.display = 'inline-block';
                        customSizeInput.value = config.custom;
                    } else {
                        customSizeInput.style.display = 'none';
                    }
                } else {
                    // Default for projects not yet customized
                    sizeSelector.value = "1";
                    customSizeInput.style.display = 'none';
                }
            }

            populateCanvasDropdown();
            layoutLandscapeThumbnails(); // Re-layout after switching canvas
            updateRowNumbers(); // Ensure numbers are shown if enabled
            if (enableCategoriesPanelCheckbox.checked) {
                renderCategoriesPanel();
            }
        }

        function populateCanvasDropdown() {
            canvasSelect.innerHTML = '';
            for (const canvas of canvases.values()) {
                const option = document.createElement('option');
                option.value = canvas.id;
                option.textContent = canvas.name;
                canvasSelect.appendChild(option);
            }
            if (canvases.has(activeCanvasId)) {
                canvasSelect.value = activeCanvasId;
                document.getElementById('top-categories-menu-container').style.display = 'block';
            }
        }

        canvasSelect.addEventListener('change', (e) => {
            const newCanvasId = parseInt(e.target.value, 10);
            if (newCanvasId !== activeCanvasId) {
                renderCanvas(newCanvasId);
            }
        });

        function updateRowUI(rowDiv, videoName, projectPath) {
            const key = projectPath + '|' + videoName;
            const selection = shortcutSelections.get(key);
            const type = selection ? selection.type : '';
            const rotation = selection ? selection.rotation : "0";
            const flipped = selection ? !!selection.flipped : false;

            rowDiv.querySelectorAll('.thumbnail').forEach(t => {
                t.classList.remove('selected-root-sc', 'selected-subfolder-sc', 'selected-both-sc', 'selected-delete-sc', 'selected-playlist-sc', 'selected-shortcut', 'flipped');
                t.classList.remove('rotate-90', 'rotate-180', 'rotate-270');
                if (type) {
                    t.classList.add('selected-' + type);
                }
                if (rotation !== "0") {
                    t.classList.add('rotate-' + rotation);
                }
                if (flipped) {
                    t.classList.add('flipped');
                }
            });

            const deleteCross = rowDiv.querySelector('.delete-cross');
            if (deleteCross) {
                deleteCross.classList.toggle('active', type === 'delete-sc');
                if (type === 'delete-sc') {
                    deleteCross.style.opacity = '1';
                } else {
                    deleteCross.style.opacity = '';
                }
            }

            rowDiv.querySelectorAll('.row-bar-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.type && btn.dataset.type === type) {
                    btn.classList.add('active');
                }
            });

            debouncedLayout();
        }

        function createRowActionBar(videoName, projectPath, subfolder, rowDiv, projectName) {
            const bar = document.createElement('div');
            bar.className = 'row-action-bar';

            const leftGroup = document.createElement('div');
            leftGroup.className = 'row-action-group-left';

            const createBtn = (text, onClick, type = null, color = null) => {
                const btn = document.createElement('button');
                btn.className = 'bar-button row-bar-btn';

                if (color) {
                    const circle = document.createElement('span');
                    circle.className = 'color-circle';
                    if (color.startsWith('--')) {
                        circle.style.backgroundColor = 'var(' + color + ')';
                    } else {
                        circle.style.backgroundColor = color;
                    }
                    btn.appendChild(circle);
                }
                btn.appendChild(document.createTextNode(text));

                if (type) btn.dataset.type = type;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    onClick();
                };
                return btn;
            };

            const key = projectPath + '|' + videoName;

            const rotate = (delta) => {
                let selection = shortcutSelections.get(key);
                if (!selection) {
                    selection = { videoName, projectPath, subfolder, projectName, type: '', rotation: "0" };
                    shortcutSelections.set(key, selection);
                }
                let currentRot = parseInt(selection.rotation || "0");
                let newRot = (currentRot + delta + 360) % 360;
                selection.rotation = newRot.toString();
                updateRowUI(rowDiv, videoName, projectPath);
            };

            const setType = (type) => {
                let selection = shortcutSelections.get(key);
                if (selection && selection.type === type) {
                    selection.type = '';
                } else {
                    if (!selection) {
                        selection = { videoName, projectPath, subfolder, projectName, type: type, rotation: "0" };
                        shortcutSelections.set(key, selection);
                    } else {
                        selection.type = type;
                    }
                }
                updateRowUI(rowDiv, videoName, projectPath);
            };

            leftGroup.appendChild(createDeleteCross(videoName, projectPath, subfolder, rowDiv));
            leftGroup.appendChild(createBtn('Rotate Left', () => rotate(-90)));
            leftGroup.appendChild(createBtn('Rotate Right', () => rotate(90)));
            leftGroup.appendChild(createBtn('Both', () => setType('both-sc'), 'both-sc', '--both-sc-color'));
            leftGroup.appendChild(createBtn('Subfolder', () => setType('subfolder-sc'), 'subfolder-sc', '--subfolder-sc-color'));
            leftGroup.appendChild(createBtn('Root', () => setType('root-sc'), 'root-sc', '--root-sc-color'));
            leftGroup.appendChild(createBtn('Rotate 180°', () => rotate(180)));

            const toggleFlip = () => {
                let selection = shortcutSelections.get(key);
                if (!selection) {
                    selection = { videoName, projectPath, subfolder, projectName, type: '', rotation: "0", flipped: false };
                    shortcutSelections.set(key, selection);
                }
                selection.flipped = !selection.flipped;
                updateRowUI(rowDiv, videoName, projectPath);
            };
            leftGroup.appendChild(createBtn('H Flip', toggleFlip));

            const moveSelect = document.createElement('select');
            moveSelect.className = 'move-to-selector';
            moveSelect.style.marginLeft = '10px';
            moveSelect.style.height = '28px';
            moveSelect.style.fontSize = '12px';

            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Move to...';
            moveSelect.appendChild(defaultOpt);

            moveSelect.addEventListener('mousedown', () => {
                if (moveSelect.options.length > 1) return;
                allProjectFolders.forEach(proj => {
                    if (proj.path !== projectPath) {
                        const opt = document.createElement('option');
                        opt.value = proj.path;
                        opt.textContent = proj.name;
                        moveSelect.appendChild(opt);
                    }
                });
            });

            moveSelect.onclick = (e) => e.stopPropagation();
            moveSelect.onchange = (e) => {
                const targetPath = e.target.value;
                let selection = shortcutSelections.get(key);
                if (!selection) {
                    selection = { videoName, projectPath, subfolder, projectName, type: '', rotation: "0" };
                    shortcutSelections.set(key, selection);
                }
                selection.targetProject = targetPath;
            };

            leftGroup.appendChild(moveSelect);

            const editBtn = document.createElement('button');
            editBtn.className = 'bar-button row-bar-btn';
            editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
            editBtn.title = 'Edit video';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                openVideoEditor(videoName, projectPath, subfolder, projectName);
            };
            leftGroup.appendChild(editBtn);

            const catBtn = document.createElement('button');
            catBtn.className = 'bar-button row-bar-btn';
            catBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>';
            catBtn.title = 'Categories';
            catBtn.onclick = (e) => {
                e.stopPropagation();
                openCategoriesModal(videoName, projectPath, subfolder, projectName);
            };
            leftGroup.appendChild(catBtn);

            bar.appendChild(leftGroup);

            const rightGroup = document.createElement('div');
            rightGroup.className = 'row-action-group-right';

            // Check for hard rotation/flip in misc data
            const vKey = projectPath + '|' + videoName;
            const initial = initialShortcutSelections.get(vKey);
            if (initial && (initial.rotation !== "0" || initial.flipped)) {
                const rotIcon = document.createElement('span');
                rotIcon.innerHTML = '&#8635;'; // Rotation arrow symbol
                rotIcon.style.color = '#00ff00';
                rotIcon.style.marginRight = '5px';
                rotIcon.style.fontWeight = 'bold';
                rotIcon.title = `Hard Rotation: ${initial.rotation}°, Flipped: ${initial.flipped}`;
                rightGroup.appendChild(rotIcon);
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'row-video-name';
            nameSpan.textContent = videoName;
            rightGroup.appendChild(nameSpan);
            bar.appendChild(rightGroup);

            return bar;
        }

        function createDeleteCross(videoName, projectPath, subfolder, rowDiv) {
            const cross = document.createElement('div');
            cross.className = 'delete-cross';
            cross.innerHTML = '&times;';
            cross.title = 'Delete video';
            cross.onclick = (e) => {
                e.stopPropagation();
                const key = projectPath + '|' + videoName;
                let selection = shortcutSelections.get(key);
                if (selection && selection.type === 'delete-sc') {
                    selection.type = '';
                } else {
                    if (!selection) {
                        const row = cross.closest('.landscape-row');
                        const projectName = row ? row.dataset.projectName : '';
                        selection = { videoName, projectPath, subfolder, projectName, type: 'delete-sc', rotation: "0" };
                        shortcutSelections.set(key, selection);
                    } else {
                        selection.type = 'delete-sc';
                    }
                }
                updateRowUI(rowDiv, videoName, projectPath);
            };
            return cross;
        }

        async function findDirectoryHandleByName(dirHandle, name) {
            try {
                return await dirHandle.getDirectoryHandle(name);
            } catch (e) {
                const lowerCaseName = name.toLowerCase();
                for await (const entry of dirHandle.values()) {
                    if (entry.kind === 'directory' && entry.name.toLowerCase() === lowerCaseName) {
                        return entry;
                    }
                }
            }
            throw new Error(`Directory '${name}' not found.`);
        }

        function setVisibilityForMode(mode) {
            const checkboxContainers = document.querySelectorAll('.checkbox-container');

            const isDirectory = mode === 'directory';
            const isSc = mode === 'sc';
            const isRootSc = mode === 'root-sc';
            const isScNew = mode === 'sc-new';
            const isLatestVideos = mode === 'latest-videos';
            const isPlaylist = mode === 'playlist';
            const isPlaylistRoot = mode === 'playlist-root' || mode === 'update-playlist-root';

            if (deleteShortcutsBtn) deleteShortcutsBtn.style.display = 'none';
            if (shortcutScriptBtn) shortcutScriptBtn.style.display = (isPlaylist || isPlaylistRoot) ? 'none' : 'inline-block';
            if (createPlaylistBtn) createPlaylistBtn.style.display = (isPlaylist || isPlaylistRoot) ? 'inline-block' : 'none';

            checkboxContainers.forEach(el => el.style.display = 'flex');
            canvasSelect.style.display = (isDirectory || isSc || isRootSc || isScNew || isLatestVideos || isPlaylist || isPlaylistRoot) ? 'inline-block' : 'none';
            groupSelector.style.display = 'none';
        }

        showDatesCheckbox.addEventListener('change', () => {
            mainContainer.classList.toggle('show-dates', showDatesCheckbox.checked);
        });


        showNumbersCheckbox.addEventListener('change', updateRowNumbers);

        function updateContentSpacer() {
            const elements = document.querySelectorAll('.landscape-row, .project-header, hr');
            if (elements.length === 0) {
                contentSpacer.style.height = '0px';
                return;
            }
            let maxBottom = 0;
            elements.forEach(el => {
                const bottom = el.offsetTop + el.offsetHeight;
                if (bottom > maxBottom) maxBottom = bottom;
            });
            contentSpacer.style.height = (maxBottom + 20) + 'px';
        }

        let layoutTimeout;
        function debouncedLayout() {
            clearTimeout(layoutTimeout);
            layoutTimeout = setTimeout(layoutLandscapeThumbnails, 100);
        }

        function layoutLandscapeThumbnails() {
            const elements = document.querySelectorAll('.landscape-row, .project-header, hr');
            const showNumbers = showNumbersCheckbox.checked;
            const paddingLR = showNumbers ? 50 : 20;
            let containerWidth = window.innerWidth;
            if (enableCategoriesPanelCheckbox.checked && categoriesPanel.style.display !== 'none') {
                containerWidth -= categoriesPanel.offsetWidth;
            }
            const isAuto = sizeSelector.value === 'auto';
            const isCustom = sizeSelector.value === 'custom';
            let globalScale = 1.0;

            if (isCustom) {
                globalScale = (parseFloat(customSizeInput.value) || 100) / 100;
            } else if (!isAuto) {
                globalScale = parseFloat(sizeSelector.value);
            }

            if (isAuto) {
                const firstThumb = document.querySelector('.thumbnail[data-original-width]');
                const ow = firstThumb ? parseFloat(firstThumb.dataset.originalWidth) : 320;
                const oh = firstThumb ? parseFloat(firstThumb.dataset.originalHeight) : 180;
                const isRot90 = firstThumb ? (firstThumb.classList.contains('rotate-90') || firstThumb.classList.contains('rotate-270')) : false;
                const refW = isRot90 ? oh : ow;

                // Available width for content inside thumbnails-container
                // Thumbnails are inside landscape-row which is 100% width.
                // thumbnails-container has padding: 10px 20px
                const availableW = containerWidth - (paddingLR * 2) - 10;

                // Target: 10 items per row, but min 210px each.
                let numToFit = 10;
                let targetScaledW = (availableW - (9 * 10)) / 10;

                if (targetScaledW < 210) {
                    // Fit as many as possible at 210px
                    numToFit = Math.floor((availableW + 10) / (210 + 10));
                    if (numToFit < 1) numToFit = 1;
                    targetScaledW = (availableW - ((numToFit - 1) * 10)) / numToFit;
                }

                globalScale = targetScaledW / refW;
            }

            elements.forEach(element => {
                if (element.classList.contains('landscape-row')) {
                    const wrappers = element.querySelectorAll('.thumbnail-wrapper');
                    wrappers.forEach(wrapper => {
                        const thumb = wrapper.querySelector('.thumbnail');
                        if (!thumb.dataset.originalWidth) return;

                        const originalWidth = parseFloat(thumb.dataset.originalWidth);
                        const originalHeight = parseFloat(thumb.dataset.originalHeight);
                        const scaledWidth = originalWidth * globalScale;
                        const scaledHeight = originalHeight * globalScale;

                        const isRotated90 = thumb.classList.contains('rotate-90') || thumb.classList.contains('rotate-270');

                        if (isRotated90) {
                            wrapper.style.width = scaledHeight + 'px';
                            wrapper.style.height = scaledWidth + 'px';
                        } else {
                            wrapper.style.width = scaledWidth + 'px';
                            wrapper.style.height = scaledHeight + 'px';
                        }

                        thumb.style.width = scaledWidth + 'px';
                        thumb.style.height = scaledHeight + 'px';
                    });

                }
            });
            updateRowNumbers();
            if (enableCategoriesPanelCheckbox.checked) {
                renderCategoriesPanel();
            }
            requestAnimationFrame(updateContentSpacer);
        }

        function escapePSString(str) {
            if (typeof str !== 'string') return '';
            // For PowerShell, we double single quotes.
            // For FFmpeg filter strings (vf), we might need more but let's stick to this for file paths.
            return str.replace(/'/g, "''");
        }

        function getPSPathRes(baseVar, relPath, name, sub) {
            const eRel = escapePSString(relPath || '');
            const eName = escapePSString(name || '');
            const eSub = escapePSString(sub || '');
            return `(Resolve-PSPath -base ${baseVar} -relPath '${eRel}' -name '${eName}' -sub '${eSub}')`;
        }

        function hasChanges() {
            const selectionsToProcess = Array.from(shortcutSelections.values());

            const hasEditsGlobal = selectionsToProcess.some(sel => {
                const key = sel.projectPath + '|' + sel.videoName;
                const initial = initialShortcutSelections.get(key);
                const initialRot = (initial && initial.rotation) || "0";
                const initialFlipped = initial ? !!initial.flipped : false;

                return (sel.cuts && sel.cuts.length > 0) ||
                       (sel.markers && sel.markers.length > 0) ||
                       (sel.rotation !== initialRot) ||
                       (!!sel.flipped !== initialFlipped);
            });

            const hasNewSelections = Array.from(shortcutSelections.entries()).some(([key, sel]) => {
                const initial = initialShortcutSelections.get(key);
                return (!initial && sel.type) || (initial && !initial.type && sel.type);
            });

            const hasDeletions = Array.from(initialShortcutSelections.keys()).some(key => {
                const initial = initialShortcutSelections.get(key);
                const current = shortcutSelections.get(key);
                // If it was initially something, and now it's either gone or something else
                return initial.type && (!current || current.type !== initial.type);
            });

            const hasModifiedType = Array.from(shortcutSelections.entries()).some(([key, sel]) => {
                const initial = initialShortcutSelections.get(key);
                return initial && (initial.type !== sel.type);
            });

            const hasMoves = selectionsToProcess.some(sel => sel.targetProject);
            const hasDummyTimestamp = dummyTimestampProjects.size > 0;

            // Check for category changes
            const allCatKeys = new Set([...videoCategories.keys(), ...initialVideoCategories.keys()]);
            let hasCatChanges = false;
            for (let key of allCatKeys) {
                const current = videoCategories.get(key) || new Set();
                const initial = initialVideoCategories.get(key) || new Set();
                if (current.size !== initial.size) {
                    hasCatChanges = true;
                    break;
                }
                for (let cat of current) {
                    if (!initial.has(cat)) {
                        hasCatChanges = true;
                        break;
                    }
                }
                if (hasCatChanges) break;
            }

            return hasNewSelections || hasDeletions || hasModifiedType || hasDummyTimestamp || hasEditsGlobal || hasMoves || hasCatChanges;
        }

        function renderActionSummary(actions) {
            const container = document.getElementById('action-summary-content');
            container.innerHTML = '';

            const categories = [
                { id: 'edits', title: 'Video Edits (Rotations, Flips, Cuts)' },
                { id: 'shortcuts_new', title: 'New Shortcuts' },
                { id: 'shortcuts_verify', title: 'Verify Existing Shortcuts' },
                { id: 'shortcuts_delete', title: 'Delete Shortcuts' },
                { id: 'moves', title: 'File Moves' },
                { id: 'lua', title: 'LUA Script Updates (Rotations, Flips)' },
                { id: 'categories', title: 'Category Updates' }
            ];

            categories.forEach(cat => {
                if (actions[cat.id] && actions[cat.id].length > 0) {
                    const details = document.createElement('details');
                    const summary = document.createElement('summary');
                    summary.textContent = `${cat.title} (${actions[cat.id].length})`;
                    details.appendChild(summary);

                    const ul = document.createElement('ul');
                    ul.className = 'action-list';
                    actions[cat.id].forEach(text => {
                        const li = document.createElement('li');
                        li.textContent = text;
                        ul.appendChild(li);
                    });
                    details.appendChild(ul);
                    container.appendChild(details);
                }
            });

            if (container.innerHTML === '') {
                container.innerHTML = '<p>No actions to perform.</p>';
            }
        }

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
            let i = 1;
            while (canvases.has(i)) {
                i++;
            }
            return i;
        }

        function normalizeLine(line) {
            return line.trim().replace(/^["']|["']$/g, '').toLowerCase();
        }

        function normalizeProjectKey(key) {
            return key.trim().replace(/^[\\/"'\[\]]+|[\\/"'\[\]]+$/g, '').replace(/\\/g, '/').toLowerCase();
        }

        async function getMiscData(projectHandle, projectPath) {
            const rotationMap = new Map();
            try {
                const handle = await projectHandle.getFileHandle('misc.txt');
                const file = await handle.getFile();
                const text = await file.text();
                text.split('\n').forEach(line => {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx === -1) return;
                    const videoName = line.substring(0, colonIdx).trim();
                    const dataPart = line.substring(colonIdx + 1).trim();

                    const sections = dataPart.split(';');
                    let rot = "0", flip = false;

                    sections.forEach(sec => {
                        const [key, val] = sec.split('=');
                        if (!key || !val) return;
                        if (key === 'categories') {
                            const cats = val.split(',').map(c => c.trim()).filter(c => c);
                            if (cats.length > 0) {
                                const vKey = projectPath + '|' + videoName;
                                if (!videoCategories.has(vKey)) videoCategories.set(vKey, new Set());
                                const videoSet = videoCategories.get(vKey);
                                if (!projectCategories.has(projectPath)) projectCategories.set(projectPath, new Set());
                                const projectSet = projectCategories.get(projectPath);
                                cats.forEach(c => {
                                    videoSet.add(c);
                                    projectSet.add(c);
                                    globalSavedCategories.add(c);
                                });
                                initialVideoCategories.set(vKey, new Set(cats));
                            }
                        } else if (key === 'rotation') {
                            rot = val;
                        } else if (key === 'flipped') {
                            flip = (val === 'true');
                        }
                    });
                    rotationMap.set(videoName.toLowerCase(), { rotation: rot, flipped: flip });
                });
                localStorage.setItem('globalSavedCategories', JSON.stringify(Array.from(globalSavedCategories)));
            } catch (e) {}
            return rotationMap;
        }

        async function getScDataForProject(projectHandle) {
            const allShortcuts = new Set();

            async function scanDir(dirHandle) {
                try {
                    const handle = await dirHandle.getFileHandle('scdata.txt');
                    const file = await handle.getFile();
                    const text = await file.text();
                    text.split('\n').map(normalizeLine).filter(l => l).forEach(s => allShortcuts.add(s));
                } catch (e) {}

                for await (const entry of dirHandle.values()) {
                    if (entry.kind === 'directory' && !skipDirs.has(entry.name.toLowerCase())) {
                        await scanDir(entry);
                    }
                }
            }

            await scanDir(projectHandle);
            console.log(`Loaded ${allShortcuts.size} shortcuts from project (recursive): ${projectHandle.name}`);
            return allShortcuts;
        }

        async function getRootScData(rootHandle) {
            try {
                let handle;
                try {
                    handle = await rootHandle.getFileHandle('rootdata.txt');
                } catch (e) {
                    handle = await rootHandle.getFileHandle('scdata.txt');
                }
                const file = await handle.getFile();
                const text = await file.text();
                const data = parseRootScData(text);
                console.log(`Loaded root data from ${rootHandle.name}. Projects found: ${data.size}`);
                return data;
            } catch (e) {
                return new Map();
            }
        }

        function checkShortcut(videoName, scDataSet) {
            const baseName = videoName.substring(0, videoName.lastIndexOf('.'));
            const namesToCheck = [
                videoName.toLowerCase() + ".lnk",
                videoName.toLowerCase() + ".ink",
                videoName.toLowerCase() + " - shortcut.lnk",
                videoName.toLowerCase()
            ];
            if (baseName) {
                namesToCheck.push(baseName.toLowerCase() + ".lnk");
                namesToCheck.push(baseName.toLowerCase() + ".ink");
                namesToCheck.push(baseName.toLowerCase() + " - shortcut.lnk");
                namesToCheck.push(baseName.toLowerCase());
            }
            if (scDataSet instanceof Set) {
                return namesToCheck.some(n => scDataSet.has(n));
            } else if (scDataSet instanceof Map) {
                for (const n of namesToCheck) {
                    if (scDataSet.has(n)) return scDataSet.get(n);
                }
            }
            return false;
        }

        function getShortcutDate(videoName, dateMap) {
            const baseName = videoName.substring(0, videoName.lastIndexOf('.'));
            const namesToCheck = [
                videoName.toLowerCase() + ".lnk",
                videoName.toLowerCase() + ".ink",
                videoName.toLowerCase() + " - shortcut.lnk",
                videoName.toLowerCase()
            ];
            if (baseName) {
                namesToCheck.push(baseName.toLowerCase() + ".lnk");
                namesToCheck.push(baseName.toLowerCase() + ".ink");
                namesToCheck.push(baseName.toLowerCase() + " - shortcut.lnk");
                namesToCheck.push(baseName.toLowerCase());
            }
            for (const n of namesToCheck) {
                if (dateMap.has(n)) return dateMap.get(n);
            }
            return null;
        }

        // Function to safely read and parse scdate.txt
        // Returns null if the file is missing or invalid
        async function getTimestamp(dirHandle) {
            try {
                const scDateHandle = await dirHandle.getFileHandle('scdate.txt');
                const file = await scDateHandle.getFile();
                let text = await file.text();
                if (text.startsWith('dummy:')) {
                    text = text.substring(6);
                }
                const raw = text.trim();
                if (!raw) return null;
                const date = raw.endsWith('Z') ? new Date(raw) : new Date(raw + 'Z');
                if (!isNaN(date)) {
                    return date.getTime();
                }
            } catch (e) {
                // scdate.txt doesn't exist or is invalid
            }
            return null;
        }

        async function renderDirectoryMode(sortBy = 'name-asc') {
            await renderVideosInternal(false, sortBy, false);
        }

        async function renderLatestVideosMode(sortBy = 'name-asc') {
            await renderVideosInternal(true, sortBy, false);
        }

        async function renderVideosInternal(isNewOnly = false, sortBy = 'name-asc', isShortcutsOnly = false) {
            console.log(`Starting renderVideosInternal (isNewOnly=${isNewOnly}, isShortcutsOnly=${isShortcutsOnly}, currentMode=${currentMode})`);
            if (currentMode === 'root-sc' || currentMode === 'update-playlist-root') {
                g_rootHandle = currentDirHandle;
            }
            createdObjectUrls.forEach(URL.revokeObjectURL);
            createdObjectUrls = [];
            canvases.clear();
            shortcutSelections.clear();
            initialShortcutSelections.clear();
            videoCategories.clear();
            initialVideoCategories.clear();
            projectCategories.clear();
            thumbnailContainer.innerHTML = '';
            allVideoFiles = [];

            const projectFolders = [];

            async function findProjectFolders(dirHandle, currentPath = '') {
                 for await (const entry of dirHandle.values()) {
                    if (entry.kind === 'directory' && !skipDirs.has(entry.name.toLowerCase())) {
                        const newPath = currentPath ? `${currentPath}\\${entry.name}` : entry.name;
                        try {
                            await findDirectoryHandleByName(entry, 'Edit Thumbnails');

                            let timestamp = 0;
                            if (isNewOnly) {
                                timestamp = (await getTimestamp(entry)) || 0;
                            }

                            projectFolders.push({
                                handle: entry,
                                path: newPath,
                                name: entry.name,
                                timestamp: timestamp
                            });
                        } catch (e) {
                           await findProjectFolders(entry, newPath);
                        }
                    }
                }
            }

            try {
                await findDirectoryHandleByName(currentDirHandle, 'Edit Thumbnails');
                let timestamp = 0;
                if (isNewOnly) {
                    timestamp = (await getTimestamp(currentDirHandle)) || 0;
                }
                projectFolders.push({
                    handle: currentDirHandle,
                    path: '',
                    name: currentDirHandle.name,
                    timestamp: timestamp
                });
            } catch (e) {
                await findProjectFolders(currentDirHandle, '');
            }

            projectFolders.sort((a, b) => a.name.localeCompare(b.name));

            let isProject = false;
            try {
                await findDirectoryHandleByName(currentDirHandle, 'Edit Thumbnails');
                isProject = true;
            } catch (e) {}

            let rootScData = new Map();
            let currentDirScData = new Map();
            if (!isProject) {
                currentDirScData = await getRootScData(currentDirHandle);
            }

            const hasProjectHeaders = Array.from(currentDirScData.keys()).some(k => k !== "");
            if (hasProjectHeaders || (currentDirScData.size > 0 && !isProject)) {
                // currentDirHandle looks like a root directory
                g_rootHandle = currentDirHandle;
                rootScData = currentDirScData;
            } else if (g_rootHandle) {
                // already have root handle
                rootScData = await getRootScData(g_rootHandle);
            } else if (!isNewOnly && (isProject || projectFolders.length > 0)) {
                if (confirm("Would you like to select the root folder to enable root shortcut detection?")) {
                    try {
                        const rootHandle = await window.showDirectoryPicker();
                        g_rootHandle = rootHandle;
                        rootScData = await getRootScData(g_rootHandle);
                    } catch (e) {}
                }
            }

            if (projectFolders.length === 0) {
                let msg = 'No "Edit Thumbnails" folders found in the selected directory or its subdirectories.';
                if (currentMode === 'update-playlist-root') {
                    msg += '\n\nIMPORTANT: For "Update Playlist Root", please select the PARENT directory of the "sc" folder, as this is where the video projects are located.';
                }
                alert(msg);
                return;
            }

            // Pre-calculate sets/maps for root shortcuts for performance
            const rootScDataSets = new Map();
            for (const [key, val] of rootScData.entries()) {
                rootScDataSets.set(key, val);
            }

            let rootShortcutDates = new Map(); // For update-playlist-root mode
            if (currentMode === 'update-playlist-root' && g_rootHandle) {
                try {
                    let scDir = null;
                    if (g_rootHandle.name.toLowerCase() === 'sc') {
                        scDir = g_rootHandle;
                    } else {
                        // Try to find 'sc' folder case-insensitively
                        for await (const entry of g_rootHandle.values()) {
                            if (entry.kind === 'directory' && entry.name.toLowerCase() === 'sc') {
                                scDir = entry;
                                break;
                            }
                        }
                    }

                    if (scDir) {
                        for await (const entry of scDir.values()) {
                        if (entry.kind === 'file') {
                            const file = await entry.getFile();
                            rootShortcutDates.set(entry.name.toLowerCase(), file.lastModified);
                        }
                    }
                        console.log(`Loaded ${rootShortcutDates.size} shortcut dates for filtering.`);
                    } else {
                        console.warn("'sc' directory not found in the selected root.");
                    }
                } catch (e) {
                    console.warn("Could not read sc directory for dates:", e);
                }
            }

            if (g_rootHandle) {
                for (const project of projectFolders) {
                    try {
                        const relativePathParts = await g_rootHandle.resolve(project.handle);
                        if (relativePathParts) {
                            project.path = relativePathParts.join('\\');
                        }
                    } catch (e) {
                        console.warn(`Could not resolve path for ${project.name} relative to root.`);
                    }
                }
            }

            allProjectFolders = [...projectFolders];
            if (g_rootHandle && g_rootHandle !== currentDirHandle) {
                const rootProjectFolders = [];
                async function findRootProjectFolders(dirHandle, currentPath = '') {
                    for await (const entry of dirHandle.values()) {
                        if (entry.kind === 'directory' && !skipDirs.has(entry.name.toLowerCase())) {
                            const newPath = currentPath ? `${currentPath}\\${entry.name}` : entry.name;
                            try {
                                await findDirectoryHandleByName(entry, 'Edit Thumbnails');
                                rootProjectFolders.push({ handle: entry, path: newPath, name: entry.name });
                            } catch (e) {
                                await findRootProjectFolders(entry, newPath);
                            }
                        }
                    }
                }
                await findRootProjectFolders(g_rootHandle, '');
                const existingPaths = new Set(allProjectFolders.map(p => p.path));
                rootProjectFolders.forEach(p => {
                    if (!existingPaths.has(p.path)) allProjectFolders.push(p);
                });
                allProjectFolders.sort((a, b) => a.name.localeCompare(b.name));
            }
            console.log(`Starting to process ${projectFolders.length} project folders...`);
            const allImageLoadPromises = [];
            let processedProjects = 0;
            let firstCanvasRendered = false;
            for (const project of projectFolders) {
                try {
                    console.log(`Processing project: ${project.name} (Path: ${project.path})`);
                    const projectRotationData = await getMiscData(project.handle, project.path);
                    const projectScData = await getScDataForProject(project.handle);

                    const normalizedProjectName = normalizeProjectKey(project.name);
                    const normalizedProjectPath = normalizeProjectKey(project.path);

                    let rootProjectShortcutsSet = rootScDataSets.get(normalizedProjectName) || new Set();
                    if (rootProjectShortcutsSet.size === 0 && normalizedProjectPath && normalizedProjectPath !== normalizedProjectName) {
                        rootProjectShortcutsSet = rootScDataSets.get(normalizedProjectPath) || new Set();
                    }

                    const canvasId = getNextCanvasId();
                    const canvasElements = [];
                    let mostRecentShortcutTime = project.timestamp || 0;

                    const projectVideoFiles = [];
                    // Recursively find videos in subfolders
                    async function findVideos(dirHandle, subfolder = '') {
                        for await (const entry of dirHandle.values()) {
                            if (entry.kind === 'file' && entry.name.match(/\.(mp4|avi|mov|mkv)$/i)) {
                                try {
                                    const file = await entry.getFile();
                                    if (!isNewOnly || file.lastModified > mostRecentShortcutTime) {
                                        // Store additional path info on the file object
                                        file.subfolder = subfolder;
                                        file.projectPath = project.path;
                                        projectVideoFiles.push(file);
                                    }
                                } catch (fileErr) {
                                    console.warn(`Could not get file for ${entry.name}:`, fileErr);
                                }
                            } else if (entry.kind === 'directory' && !skipDirs.has(entry.name.toLowerCase())) {
                                await findVideos(entry, subfolder ? `${subfolder}\\${entry.name}` : entry.name);
                            }
                        }
                    }
                    await findVideos(project.handle);
                    allVideoFiles.push(...projectVideoFiles);

                    const editDirHandle = await findDirectoryHandleByName(project.handle, 'Edit Thumbnails');
                    const landscapeFiles = [];
                     for await (const entry of editDirHandle.values()) {
                        if (entry.kind === 'file' && entry.name.match(/\.(jpe?g|png|gif|webp)$/i)) {
                            landscapeFiles.push(await entry.getFile());
                        }
                    }

                    const groupedFiles = landscapeFiles.reduce((acc, file) => {
                        const match = file.name.match(/^(.*?)_(\d+)\.[^.]+$/);
                        if (match) {
                            const videoName = match[1];
                            if (!acc[videoName]) acc[videoName] = [];
                            acc[videoName].push(file);
                        }
                        return acc;
                    }, {});

                    const videoFileMap = new Map(projectVideoFiles.map(f => [f.name.substring(0, f.name.lastIndexOf('.')), f]));

                    let videoNames = Object.keys(groupedFiles);
                    videoNames.sort((a, b) => {
                        if (sortBy === 'name-asc') return a.localeCompare(b);
                        if (sortBy === 'name-desc') return b.localeCompare(a);
                        const fileA = videoFileMap.get(a);
                        const fileB = videoFileMap.get(b);
                        const dateA = fileA ? fileA.lastModified : 0;
                        const dateB = fileB ? fileB.lastModified : 0;
                        if (sortBy === 'date-new') return dateB - dateA;
                        if (sortBy === 'date-old') return dateA - dateB;
                        return 0;
                    });

                    const projectRows = [];
                    const hasAnyShortcuts = projectScData.size > 0 || rootProjectShortcutsSet.size > 0;

                    for (const videoName of videoNames) {
                        const videoFile = videoFileMap.get(videoName);
                        if (!videoFile) continue;

                        const hasProjectSc = checkShortcut(videoFile.name, projectScData);
                        let rootScEntry = checkShortcut(videoFile.name, rootProjectShortcutsSet);

                        // If not found in project-specific group, check if it's in a group named after the subfolder (for nested videos)
                        if (!rootScEntry && videoFile.subfolder) {
                            const subfolderLeaf = videoFile.subfolder.split(/[\\/]/).pop();
                            if (subfolderLeaf) {
                                const normalizedSubfolderLeaf = normalizeProjectKey(subfolderLeaf);
                                const subfolderRootScSet = rootScDataSets.get(normalizedSubfolderLeaf);
                                if (subfolderRootScSet) {
                                    rootScEntry = checkShortcut(videoFile.name, subfolderRootScSet);
                                }
                            }
                        }

                        // Also check the global/ungrouped shortcuts if still not found
                        if (!rootScEntry) {
                            const globalRootScSet = rootScDataSets.get("");
                            if (globalRootScSet) {
                                rootScEntry = checkShortcut(videoFile.name, globalRootScSet);
                            }
                        }

                        let hasRootSc = rootScEntry !== false;

                        // In update-playlist-root mode, we ALSO check if the shortcut file exists directly in sc/
                        let scDate = null;
                        if (currentMode === 'update-playlist-root') {
                            scDate = getShortcutDate(videoFile.name, rootShortcutDates);
                            if (scDate !== null) {
                                hasRootSc = true;
                            }
                        }

                        if (isShortcutsOnly) {
                            if (currentMode === 'root-sc' || currentMode === 'playlist-root') {
                                if (!hasRootSc) continue;
                            } else if (currentMode === 'update-playlist-root') {
                                if (!hasRootSc) continue;
                                const effectiveDate = scDate || videoFile.lastModified;
                                if (playlistCreationTime && effectiveDate <= (playlistCreationTime + 1000)) continue;
                            } else if (hasAnyShortcuts) {
                                if (!hasProjectSc && !hasRootSc) continue;
                            }
                        }

                        if (isNewOnly && mostRecentShortcutTime && videoFile.lastModified <= mostRecentShortcutTime) {
                            continue;
                        }

                        const files = groupedFiles[videoName].sort((a, b) => {
                            const aNum = parseInt(a.name.substring(a.name.lastIndexOf('_') + 1));
                            const bNum = parseInt(b.name.substring(b.name.lastIndexOf('_') + 1));
                            return aNum - bNum;
                        });

                        const rowDiv = document.createElement('div');
                        rowDiv.className = 'landscape-row';
                        rowDiv.dataset.videoName = videoName;
                        rowDiv.dataset.projectPath = project.path;
                        rowDiv.dataset.projectName = project.name;

                        projectRows.push({ rowDiv, videoFile, files, initialShortcutType: '', hasProjectSc, hasRootSc, rootScEntry });
                    }

                    if (projectRows.length === 0) continue;

                    const groupHeader = document.createElement('h2');
                    groupHeader.className = 'project-header';
                    const groupHeaderText = document.createElement('span');
                    const projectPrefix = (currentMode === 'root-sc' || currentMode === 'sc') ? 'Root Shortcuts: ' : '';
                    groupHeaderText.textContent = `${projectPrefix}${project.name} (${projectRows.length} ${projectRows.length === 1 ? 'video' : 'videos'})`;
                    groupHeader.appendChild(groupHeaderText);

                    if (isNewOnly) {
                        const headerDateInfo = document.createElement('span');
                        headerDateInfo.className = 'date-info';
                        headerDateInfo.textContent = `Last Shortcut: ${new Date(mostRecentShortcutTime).toLocaleString()}`;
                        groupHeader.appendChild(headerDateInfo);
                    } else if (currentMode === 'update-playlist-root' && playlistCreationTime) {
                        const headerDateInfo = document.createElement('span');
                        headerDateInfo.className = 'date-info';
                        headerDateInfo.textContent = `Playlist Cutoff: ${new Date(playlistCreationTime).toLocaleString()}`;
                        groupHeader.appendChild(headerDateInfo);
                    }
                    canvasElements.push(groupHeader);

                    for (const rowData of projectRows) {
                        const { rowDiv, videoFile, files, hasProjectSc, hasRootSc, rootScEntry } = rowData;

                        rowDiv.appendChild(createRowActionBar(videoFile.name, project.path, videoFile.subfolder, rowDiv, project.name));
                        const dateInfo = document.createElement('div');
                        dateInfo.className = 'date-info';
                        dateInfo.textContent = `Created: ${new Date(videoFile.lastModified).toLocaleString()}`;
                        rowDiv.appendChild(dateInfo);

                        let multiplierInput;
                        if (currentMode === 'playlist-root') {
                            const navContainer = document.createElement('div');
                            navContainer.className = 'playlist-nav-container';
                            rowDiv.appendChild(navContainer);
                            multiplierInput = document.createElement('input');
                            multiplierInput.type = 'number';
                            multiplierInput.className = 'multiplier-input';
                            multiplierInput.value = 1;
                            multiplierInput.min = 1;
                            multiplierInput.title = 'Add to playlist multiple times';
                            navContainer.appendChild(multiplierInput);
                            multiplierInput.addEventListener('change', () => {
                                const key = project.path + '|' + videoFile.name;
                                const existingSelection = shortcutSelections.get(key);
                                if (existingSelection) existingSelection.multiplier = parseInt(multiplierInput.value) || 1;
                            });
                            multiplierInput.addEventListener('click', (e) => e.stopPropagation());
                        }

                        const thumbnailsContainer = document.createElement('div');
                        thumbnailsContainer.className = 'thumbnails-container';
                        rowDiv.appendChild(thumbnailsContainer);

                        let initialShortcutType = '';
                        if (rootScEntry && typeof rootScEntry === 'string') {
                            if (rootScEntry === 'BOTH') initialShortcutType = 'both-sc';
                            else if (rootScEntry === 'ROOT') initialShortcutType = 'root-sc';
                        }
                        if (!initialShortcutType) {
                            if (hasProjectSc && hasRootSc) initialShortcutType = 'both-sc';
                            else if (hasProjectSc) initialShortcutType = 'subfolder-sc';
                            else if (hasRootSc) initialShortcutType = 'root-sc';
                        }

                        const rotData = projectRotationData.get(videoFile.name.toLowerCase()) || { rotation: "0", flipped: false };
                        const rotation = rotData.rotation;
                        const flipped = rotData.flipped;

                        if ((initialShortcutType || rotation !== "0" || flipped) && currentMode !== 'playlist-root' && currentMode !== 'update-playlist-root') {
                            const key = project.path + '|' + videoFile.name;
                            const selectionData = {
                                videoName: videoFile.name, projectPath: project.path, subfolder: videoFile.subfolder,
                                projectName: project.name,
                                type: initialShortcutType || '', rotation: rotation, flipped: flipped
                            };
                            shortcutSelections.set(key, selectionData);
                            initialShortcutSelections.set(key, {
                                type: initialShortcutType, rotation: rotation, flipped: flipped,
                                subfolder: videoFile.subfolder, projectName: project.name
                            });
                        }

                        canvasElements.push(rowDiv);
                        updateRowUI(rowDiv, videoFile.name, project.path);

                        files.forEach(file => {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'thumbnail-wrapper';
                            const img = new Image();
                            img.className = 'thumbnail';
                            img.dataset.fileName = file.name;
                            if (initialShortcutType && currentMode !== 'playlist-root' && currentMode !== 'update-playlist-root') img.classList.add('selected-' + initialShortcutType);
                            if (rotation !== "0") img.classList.add('rotate-' + rotation);
                            if (flipped) img.classList.add('flipped');
                            wrapper.appendChild(img);
                            thumbnailsContainer.appendChild(wrapper);

                            const promise = new Promise((resolve, reject) => {
                                img.onload = () => {
                                    img.dataset.originalWidth = img.width;
                                    img.dataset.originalHeight = img.height;
                                    debouncedLayout();
                                    resolve();
                                };
                                img.onerror = reject;
                            });

                        img.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const key = project.path + '|' + videoFile.name;
                            const selection = shortcutSelections.get(key);
                            const activeRotation = (selection && selection.rotation) ? selection.rotation : rotation;
                            const activeFlipped = (selection && selection.flipped) ? selection.flipped : false;
                            playVideo(videoFile, activeRotation, activeFlipped);
                        });

                            const url = URL.createObjectURL(file);
                            createdObjectUrls.push(url);
                            img.src = url;
                            allImageLoadPromises.push(promise);
                        });
                    }
                    if (projectRows.length > 0) {
                        const hr = document.createElement('hr');
                    hr.style.margin = "0";
                    hr.style.border = "none";
                    hr.style.borderBottom = "1px solid #444";
                        canvasElements.push(hr);
                        canvases.set(canvasId, { id: canvasId, name: project.name, elements: canvasElements, path: project.path });
                    }
                    processedProjects++;
                    if (!firstCanvasRendered && canvases.size > 0) {
                        renderCanvas(canvases.keys().next().value);
                        firstCanvasRendered = true;
                    }
                    if (processedProjects % 5 === 0 || processedProjects === projectFolders.length) {
                        console.log(`Processed ${processedProjects}/${projectFolders.length} projects...`);
                        populateCanvasDropdown();
                        await new Promise(r => setTimeout(r, 0)); // Yield to main thread
                    }
                } catch (err) {
                    console.error(`Error processing project ${project.name}:`, err);
                }
            }
            // Final render check in case no canvas was rendered yet
            if (canvases.size > 0 && !firstCanvasRendered) {
                renderCanvas(canvases.keys().next().value);
            } else if (canvases.size === 0) {
                thumbnailContainer.innerHTML = ''; // Clear display area
            }
            populateCanvasDropdown(); // Ensure all loaded projects are in the dropdown
        }


        async function renderScNewMode() {
            console.log("--- Starting renderScNewMode (v2) ---");
            thumbnailContainer.innerHTML = '';
            canvases.clear();
            shortcutSelections.clear();
            createdObjectUrls.forEach(URL.revokeObjectURL);
            createdObjectUrls = [];

            try {
                const scnewHandle = await currentDirHandle.getFileHandle('scnew.txt');
                const scnewFile = await scnewHandle.getFile();
                const scnewText = await scnewFile.text();
                const shortcutPaths = scnewText.split('\n').map(line => line.trim()).filter(line => line);

                if (shortcutPaths.length === 0) {
                    thumbnailContainer.innerHTML = '<p style="color: black;">scnew.txt is empty. No new shortcuts to display.</p>';
                    return;
                }

                const groupedBySubfolder = new Map();
                for (const path of shortcutPaths) {
                    const parts = path.split('\\');
                    if (parts.length >= 3) {
                        const subfolderName = parts[parts.length - 3];
                        const shortcutFileName = parts[parts.length - 1];

                        if (!groupedBySubfolder.has(subfolderName)) {
                            groupedBySubfolder.set(subfolderName, []);
                        }
                        groupedBySubfolder.get(subfolderName).push(shortcutFileName);
                    }
                }

                const allImageLoadPromises = [];
                for (const [subfolderName, shortcutFileNames] of groupedBySubfolder.entries()) {
                    console.log(`Processing subfolder: ${subfolderName}`);
                    const subfolderHandle = await currentDirHandle.getDirectoryHandle(subfolderName);
                    const projectRotationData = await getMiscData(subfolderHandle, subfolderName);
                    const editDirHandle = await findDirectoryHandleByName(subfolderHandle, 'Edit Thumbnails');

                    const canvasId = getNextCanvasId();
                    const canvasElements = [];
                    const header = document.createElement('h2');
                    header.className = 'project-header';
                    header.textContent = subfolderName;
                    canvasElements.push(header);

                    let projectVideoCount = 0;

                    for (const shortcutFileName of shortcutFileNames) {
                        const videoBaseName = shortcutFileName.slice(0, -4);
                        const videoNameWithoutExt = videoBaseName.substring(0, videoBaseName.lastIndexOf('.'));

                        const landscapeFiles = [];
                        for await (const entry of editDirHandle.values()) {
                            if (entry.kind === 'file' && entry.name.startsWith(videoNameWithoutExt)) {
                                landscapeFiles.push(await entry.getFile());
                            }
                        }

                        if (landscapeFiles.length > 0) {
                             landscapeFiles.sort((a, b) => {
                                const aNum = parseInt(a.name.substring(a.name.lastIndexOf('_') + 1));
                                const bNum = parseInt(b.name.substring(b.name.lastIndexOf('_') + 1));
                                return aNum - bNum;
                            });

                            let videoDate = 'Unknown';
                            try {
                                for await (const entry of subfolderHandle.values()) {
                                    if (entry.kind === 'file' && entry.name.startsWith(videoBaseName)) {
                                        const file = await entry.getFile();
                                        videoDate = new Date(file.lastModified).toLocaleString();
                                        break;
                                    }
                                }
                            } catch (e) {}

                            const rowDiv = document.createElement('div');
                            rowDiv.className = 'landscape-row';
                            rowDiv.dataset.videoName = videoBaseName;
                            rowDiv.dataset.projectPath = subfolderName;
                            rowDiv.dataset.projectName = subfolderName;

                            const dateInfo = document.createElement('div');
                            dateInfo.className = 'date-info';
                            dateInfo.textContent = `Created: ${videoDate}`;
                            rowDiv.appendChild(dateInfo);

                            const rotData = projectRotationData.get(videoBaseName.toLowerCase()) || { rotation: "0", flipped: false };
                            const rotation = rotData.rotation;
                            const flipped = rotData.flipped;

                            if (rotation !== "0" || flipped) {
                                const key = subfolderName + '|' + videoBaseName;
                                if (!shortcutSelections.has(key)) {
                                    shortcutSelections.set(key, {
                                        videoName: videoBaseName,
                                        projectPath: subfolderName,
                                        projectName: subfolderName,
                                        type: 'subfolder-sc', // default for sc-new
                                        rotation: rotation,
                                        flipped: flipped
                                    });
                                    initialShortcutSelections.set(key, {
                                        type: 'subfolder-sc', rotation: rotation, flipped: flipped,
                                        subfolder: '', projectName: subfolderName
                                    });
                                }
                            }

                            rowDiv.appendChild(createRowActionBar(videoBaseName, subfolderName, '', rowDiv, subfolderName));
                            const thumbnailsContainer = document.createElement('div');
                            thumbnailsContainer.className = 'thumbnails-container';
                            rowDiv.appendChild(thumbnailsContainer);

                            canvasElements.push(rowDiv);
                            updateRowUI(rowDiv, videoBaseName, subfolderName);

                             let videoFile;
                             projectVideoCount++;
                             landscapeFiles.forEach(file => {
                                const wrapper = document.createElement('div');
                                wrapper.className = 'thumbnail-wrapper';
                                const img = new Image();
                                img.className = 'thumbnail';
                                img.dataset.fileName = file.name;
                                if (rotation !== "0") {
                                    img.classList.add('rotate-' + rotation);
                                }
                                if (flipped) {
                                    img.classList.add('flipped');
                                }
                                wrapper.appendChild(img);
                                thumbnailsContainer.appendChild(wrapper);
                                const promise = new Promise((resolve, reject) => {
                                    img.onload = () => {
                                        img.dataset.originalWidth = img.width;
                                        img.dataset.originalHeight = img.height;
                                        resolve();
                                    };
                                    img.onerror = reject;
                                });

                                img.addEventListener('click', async (e) => {
                                    e.stopPropagation();
                                    if (!videoFile) {
                                        for await (const entry of subfolderHandle.values()) {
                                            if (entry.kind === 'file' && entry.name.startsWith(videoBaseName)) {
                                                videoFile = await entry.getFile();
                                                break;
                                            }
                                        }
                                    }
                                    if (videoFile) {
                                        const key = subfolderName + '|' + videoBaseName;
                                        const selection = shortcutSelections.get(key);
                                        const activeRotation = (selection && selection.rotation) ? selection.rotation : rotation;
                                        const activeFlipped = (selection && selection.flipped) ? selection.flipped : false;
                                        playVideo(videoFile, activeRotation, activeFlipped);
                                    }
                                });

                                const url = URL.createObjectURL(file);
                                createdObjectUrls.push(url);
                                img.src = url;
                                allImageLoadPromises.push(promise);
                            });
                        }
                    }
                    header.textContent = `${subfolderName} (${projectVideoCount} ${projectVideoCount === 1 ? 'video' : 'videos'})`;
                     if (canvasElements.length > 1) { // Only add if there are more than just the header
                        canvases.set(canvasId, { id: canvasId, name: subfolderName, elements: canvasElements, path: subfolderName });
                    }
                }

                await Promise.all(allImageLoadPromises);

                if (canvases.size > 0) {
                    renderCanvas(canvases.keys().next().value);
                } else {
                    populateCanvasDropdown();
                    thumbnailContainer.innerHTML = '<p style="color: black;">No new shortcuts found to display.</p>';
                }

            } catch (err) {
                console.error("Caught error in renderScNewMode:", err);
                thumbnailContainer.innerHTML = `<p style="color: red;">Error: Could not read or process scnew.txt. Please ensure the file exists and is correctly formatted.</p><p style="color: red; font-size: 0.8em;">${err.message}</p>`;
            }
        }


        async function renderPlaylistMode() {
            thumbnailContainer.innerHTML = '';
            canvases.clear();
            shortcutSelections.clear();
            createdObjectUrls.forEach(URL.revokeObjectURL);
            createdObjectUrls = [];

            if (!g_rootHandle) {
                if (confirm("Would you like to select the root folder to enable root shortcut detection?")) {
                    try {
                        const rootHandle = await window.showDirectoryPicker();
                        g_rootHandle = rootHandle;
                    } catch (e) {}
                }
            }

            let rootScData = new Map();
            if (g_rootHandle) {
                rootScData = await getRootScData(g_rootHandle);
            }

            const projectFolders = [];
            async function findProjectFolders(dirHandle, currentPath = '') {
                for await (const entry of dirHandle.values()) {
                    if (entry.kind === 'directory' && !skipDirs.has(entry.name.toLowerCase())) {
                        const newPath = currentPath ? `${currentPath}\\${entry.name}` : entry.name;
                        try {
                            await findDirectoryHandleByName(entry, 'Edit Thumbnails');
                            projectFolders.push({
                                handle: entry,
                                path: newPath,
                                name: entry.name
                            });
                        } catch (e) {
                            await findProjectFolders(entry, newPath);
                        }
                    }
                }
            }

            try {
                await findDirectoryHandleByName(currentDirHandle, 'Edit Thumbnails');
                projectFolders.push({
                    handle: currentDirHandle,
                    path: '',
                    name: currentDirHandle.name
                });
            } catch (e) {
                await findProjectFolders(currentDirHandle, '');
            }

            if (g_rootHandle) {
                for (const project of projectFolders) {
                    try {
                        const relativePathParts = await g_rootHandle.resolve(project.handle);
                        if (relativePathParts) {
                            project.path = relativePathParts.join('\\');
                        }
                    } catch (e) {
                        console.warn(`Could not resolve path for ${project.name} relative to root.`);
                    }
                }
            }

            projectFolders.sort((a, b) => a.name.localeCompare(b.name));

            if (projectFolders.length === 0) {
                alert('No "Edit Thumbnails" folders found.');
                return;
            }

            const allImageLoadPromises = [];
            const canvasId = getNextCanvasId();
            const canvasElements = [];

            for (const project of projectFolders) {
                try {
                    const projectShortcuts = await getScDataForProject(project.handle);
                    const subfolderScCount = projectShortcuts.size;

                    const normalizedProjectName = normalizeProjectKey(project.name);
                    const normalizedProjectPath = normalizeProjectKey(project.path);

                    // Search in rootScData for a matching key
                    let rootProjectShortcutsMap = new Map();
                    for (let [key, val] of rootScData.entries()) {
                        const normalizedKey = normalizeProjectKey(key);
                        if (normalizedKey === normalizedProjectName || normalizedKey === normalizedProjectPath) {
                            rootProjectShortcutsMap = val;
                            break;
                        }
                    }
                    const rootScCount = rootProjectShortcutsMap.size;

                    const videoFiles = [];
                    async function findVideos(dirHandle, subfolder = '') {
                        for await (const entry of dirHandle.values()) {
                            if (entry.kind === 'file' && entry.name.match(/\.(mp4|avi|mov|mkv)$/i)) {
                                entry.subfolder = subfolder;
                                videoFiles.push(entry);
                            } else if (entry.kind === 'directory' && !skipDirs.has(entry.name.toLowerCase())) {
                                await findVideos(entry, subfolder ? `${subfolder}\\${entry.name}` : entry.name);
                            }
                        }
                    }
                    await findVideos(project.handle);

                    if (videoFiles.length === 0) continue;

                    videoFiles.sort((a, b) => a.name.localeCompare(b.name));

                    let candidateVideos = [];
                    const shortcutNames = new Set();
                    try {
                        const scDirHandle = await project.handle.getDirectoryHandle('sc');
                        for await (const entry of scDirHandle.values()) {
                            if (entry.kind === 'file') {
                                shortcutNames.add(entry.name.toLowerCase());
                            }
                        }
                    } catch (e) {}

                    // Priority 1: Videos with shortcuts
                    for (const v of videoFiles) {
                        if (checkShortcut(v.name, shortcutNames)) {
                            candidateVideos.push(v);
                        }
                    }
                    if (candidateVideos.length > 5) {
                        candidateVideos = candidateVideos.slice(0, 5);
                    }

                    // Priority 2: Other videos (alphabetical)
                    if (candidateVideos.length < 5) {
                        for (const v of videoFiles) {
                            if (!checkShortcut(v.name, shortcutNames)) {
                                if (!candidateVideos.includes(v)) {
                                    candidateVideos.push(v);
                                    if (candidateVideos.length >= 5) break;
                                }
                            }
                        }
                    }

                    const header = document.createElement('h2');
                    header.className = 'project-header';
                    header.textContent = `${project.name} (${rootScCount} root shortcuts | ${subfolderScCount} subfolder shortcuts)`;
                    canvasElements.push(header);

                    const rowDiv = document.createElement('div');
                    rowDiv.className = 'landscape-row';
                    rowDiv.dataset.projectPath = project.path;
                    rowDiv.dataset.projectName = project.name;

                    rowDiv.appendChild(createRowActionBar('Playlist Item', project.path, candidateVideos[currentIndex].subfolder, rowDiv, project.name));

                    const navContainer = document.createElement('div');
                    navContainer.className = 'playlist-nav-container';
                    rowDiv.appendChild(navContainer);

                    const prevBtn = document.createElement('button');
                    prevBtn.className = 'playlist-nav-btn';
                    prevBtn.textContent = '◀';
                    navContainer.appendChild(prevBtn);

                    const nextBtn = document.createElement('button');
                    nextBtn.className = 'playlist-nav-btn';
                    nextBtn.textContent = '▶';
                    navContainer.appendChild(nextBtn);

                    const multiplierInput = document.createElement('input');
                    multiplierInput.type = 'number';
                    multiplierInput.className = 'multiplier-input';
                    multiplierInput.value = 1;
                    multiplierInput.min = 1;
                    multiplierInput.title = 'Add to playlist multiple times';
                    navContainer.appendChild(multiplierInput);

                    if (candidateVideos.length <= 1) {
                        navContainer.style.display = 'none';
                    }

                    const dateInfo = document.createElement('div');
                    dateInfo.className = 'date-info';
                    rowDiv.appendChild(dateInfo);

                    const thumbnailsContainer = document.createElement('div');
                    thumbnailsContainer.className = 'thumbnails-container';
                    rowDiv.appendChild(thumbnailsContainer);

                    canvasElements.push(rowDiv);

                    let currentIndex = parseInt(localStorage.getItem(`playlist-thumb-index-${project.path}`)) || 0;
                    if (currentIndex >= candidateVideos.length) currentIndex = 0;

                    const projectRotationData = await getMiscData(project.handle, project.path);

                    const updateDisplayedVideo = async (index) => {
                        const video = candidateVideos[index];
                        const videoFile = await video.getFile();
                        dateInfo.textContent = `Created: ${new Date(videoFile.lastModified).toLocaleString()}`;

                        const videoBaseName = video.name.substring(0, video.name.lastIndexOf('.'));
                        const editDirHandle = await findDirectoryHandleByName(project.handle, 'Edit Thumbnails');
                        const thumbnailFiles = [];
                        for await (const entry of editDirHandle.values()) {
                            if (entry.kind === 'file' && entry.name.startsWith(videoBaseName)) {
                                thumbnailFiles.push(await entry.getFile());
                            }
                        }

                        thumbnailFiles.sort((a, b) => {
                            const aNum = parseInt(a.name.substring(a.name.lastIndexOf('_') + 1));
                            const bNum = parseInt(b.name.substring(b.name.lastIndexOf('_') + 1));
                            return aNum - bNum;
                        });

                        thumbnailsContainer.innerHTML = '';
                        const key = project.path + '|Playlist Item';
                        let selection = shortcutSelections.get(key);
                        if (selection) {
                            selection.videoName = video.name;
                            selection.subfolder = video.subfolder;
                            selection.projectName = project.name;
                        }

                        thumbnailFiles.forEach(file => {
                            const wrapper = document.createElement('div');
                            wrapper.className = 'thumbnail-wrapper';
                            const img = new Image();
                            img.className = 'thumbnail';
                            img.dataset.projectPath = project.path;
                            wrapper.appendChild(img);
                            thumbnailsContainer.appendChild(wrapper);

                            img.onload = () => {
                                img.dataset.originalWidth = img.width;
                                img.dataset.originalHeight = img.height;
                                layoutLandscapeThumbnails();
                            };

                            img.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const activeRotation = (selection && selection.rotation) ? selection.rotation : "0";
                                const activeFlipped = (selection && selection.flipped) ? selection.flipped : false;
                                playVideo(videoFile, activeRotation, activeFlipped);
                            });

                            const url = URL.createObjectURL(file);
                            createdObjectUrls.push(url);
                            img.src = url;
                        });
                        updateRowUI(rowDiv, 'Playlist Item', project.path);
                        localStorage.setItem(`playlist-thumb-index-${project.path}`, index);
                    };

                    await updateDisplayedVideo(currentIndex);

                    prevBtn.onclick = (e) => {
                        e.stopPropagation();
                        currentIndex = (currentIndex - 1 + candidateVideos.length) % candidateVideos.length;
                        updateDisplayedVideo(currentIndex);
                    };

                    nextBtn.onclick = (e) => {
                        e.stopPropagation();
                        currentIndex = (currentIndex + 1) % candidateVideos.length;
                        updateDisplayedVideo(currentIndex);
                    };


                    updateRowUI(rowDiv, 'Playlist Item', project.path);

                    multiplierInput.addEventListener('change', () => {
                        const key = project.path + '|Playlist Item';
                        const existingSelection = shortcutSelections.get(key);
                        if (existingSelection) {
                            existingSelection.multiplier = parseInt(multiplierInput.value) || 1;
                        }
                    });

                    multiplierInput.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });

                } catch (e) {
                    console.warn(`Could not process project '${project.name}' for playlist mode:`, e);
                }
            }

            canvases.set(canvasId, { id: canvasId, name: 'Playlist View', elements: canvasElements, path: '' });
            await Promise.all(allImageLoadPromises);
            renderCanvas(canvasId);
        }

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
                }

                const isShortcut = entry.toLowerCase().endsWith('.lnk') || entry.toLowerCase().endsWith('.ink') || entry.toLowerCase().endsWith(' - shortcut.lnk');
                const isVideo = entry.toLowerCase().match(/\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v|mpg|mpeg)$/i);

                if (isQuoted || (!isShortcut && !isVideo && !entry.includes('.') && entry.length > 0)) {
                    // It's a project name
                    currentSubfolder = normalizeProjectKey(cleanLine);
                    if (currentSubfolder && !data.has(currentSubfolder)) {
                        data.set(currentSubfolder, new Map());
                    }
                } else if (entry.length > 0) {
                    // If no currentSubfolder has been identified yet, it belongs to the "" key
                    if (!data.has(currentSubfolder)) {
                        data.set(currentSubfolder, new Map());
                    }
                    data.get(currentSubfolder).set(entry.toLowerCase(), tag);
                }
            }
            return data;
        }

        init();
