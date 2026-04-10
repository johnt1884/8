// ==UserScript==
// @name         TikTok Stories Overlay Bottom-Right
// @namespace    https://example.com/tiktok-overlay-bottom-right
// @version      2.8
// @description  Bottom-right overlay with reliable next-story navigation (video-focused)
// @match        *://*.tiktok.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const CLIPBOARD_KEY = 'tmk_internal_clipboard';
    let overlay = null;

    /* =========================
       Shared button style
    ========================== */
    const BASE_BTN_STYLE = `
        cursor: pointer;
        font-size: 32px;
        user-select: none;
        padding: 6px;
        width: 50px;
        height: 50px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    `;

    /* =========================
       Clipboard helper (tt.js compatible)
    ========================== */
    function readClipboard() {
        try {
            const raw = localStorage.getItem(CLIPBOARD_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function appendToClipboard(items) {
        const currentItems = readClipboard();
        const newSet = new Set([...currentItems, ...items]);
        const merged = Array.from(newSet);
        try {
            localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(merged));
            return merged;
        } catch (e) {
            console.error("Failed to save to clipboard:", e);
            return currentItems;
        }
    }

    function clearClipboard() {
        try {
            localStorage.removeItem(CLIPBOARD_KEY);
        } catch (e) {
            console.error("Failed to clear clipboard:", e);
        }
    }

    function syncToSystemClipboard(items) {
        navigator.clipboard.writeText(items.join('\n')).catch(() => {});
    }

    /* =========================
       Toast
    ========================== */
    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 9999999;
            font-size: 15px;
            max-width: 80vw;
            white-space: pre-wrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    /* =========================
       Overlay container
    ========================== */
    function ensureOverlay() {
        if (!document.body) return;
        if (overlay && document.body.contains(overlay)) return;

        overlay = document.createElement('div');
        overlay.id = 'tiktok-stories-overlay-custom';
        overlay.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999999;
            display: none;
            flex-direction: row;
            gap: 10px;
            pointer-events: auto;
        `;

        createButtons(overlay);

        if (document.body) {
            document.body.appendChild(overlay);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(overlay);
            });
        }
    }

    /* =========================
       Button Creation Logic
    ========================== */
    function createButtons(container) {
        container.innerHTML = '';

        const progressBtn = document.createElement('div');
        progressBtn.textContent = '➡️';
        progressBtn.title = 'Progress to next story (no copy)';
        progressBtn.style.cssText = BASE_BTN_STYLE + 'background: black; color: white; border: 2px solid white;';
        progressBtn.onclick = (e) => {
            e.stopPropagation();
            if (!simulateNextStory()) showToast('❌ No active video found');
            else showToast('✅ Advanced to next story');
        };
        container.appendChild(progressBtn);

        const nextBtn = document.createElement('div');
        nextBtn.textContent = '➡️';
        nextBtn.title = 'Next story + copy URL';
        nextBtn.style.cssText = BASE_BTN_STYLE + 'background: transparent; color: black; border: 2px solid #377E47;';
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            const url = location.href;
            const updated = appendToClipboard([url]);
            syncToSystemClipboard(updated);
            showToast(`✅ Copied & advanced (Total: ${updated.length}):\n${url}`);
            if (!simulateNextStory()) showToast('❌ No active video found');
        };
        container.appendChild(nextBtn);

        const copyBtn = document.createElement('div');
        copyBtn.textContent = '📋';
        copyBtn.title = 'Copy current URL (no progress)';
        copyBtn.style.cssText = BASE_BTN_STYLE + 'background: #377E47; color: white; border: none;';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            const url = location.href;
            const updated = appendToClipboard([url]);
            syncToSystemClipboard(updated);
            showToast(`✅ Copied (Total: ${updated.length}):\n${url}`);
        };
        container.appendChild(copyBtn);

        const delBtn = document.createElement('div');
        delBtn.textContent = '🗑️';
        delBtn.title = 'Clear collected URLs';
        delBtn.style.cssText = BASE_BTN_STYLE + 'background: red; color: white; border: none;';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (!confirm('Are you sure you want to clear memory?')) return;
            clearClipboard();
            syncToSystemClipboard([]);
            showToast('🗑️ Collected URLs cleared');
        };
        container.appendChild(delBtn);
    }

    /* =========================
       VIDEO-FOCUSED Story Progression (v2.7)
    ========================== */
    let lastKeyTime = 0;
    function simulateNextStory() {
        const now = Date.now();
        if (now - lastKeyTime < 500) return true; // Debounce
        lastKeyTime = now;

        // 1. Find STORY VIDEO specifically (most reliable target)
        const videoSelectors = [
            'video',  // Primary
            '[class*="StoriesPlayerVideo"] video',
            '[class*="DivStoriesContent"] video',
            '#stories-player video',
            '[data-e2e="stories-player"] video',
            '.stories-player video',
            '[class*="StoriesViewer"] video'
        ];

        let target = null;
        for (let sel of videoSelectors) {
            target = document.querySelector(sel);
            if (target && target.tagName === 'VIDEO') break;
        }

        if (!target) {
            console.log('No story video found. All videos:', document.querySelectorAll('video').length);
            return false;
        }

        // 2. Focus ONLY the video (prevents modal exit)
        target.focus({preventScroll: true});
        target.style.outline = 'none';

        // 3. ArrowRight keys (video handles progression)
        const dispatchKey = (type) => {
            const ev = new KeyboardEvent(type, {
                key: 'ArrowRight', code: 'ArrowRight',
                keyCode: 39, which: 39, charCode: 0,
                bubbles: true, cancelable: true,
                ctrlKey: false, shiftKey: false
            });
            target.dispatchEvent(ev);
            // Only bubble if video didn't handle it
            if (ev.defaultPrevented === false) {
                document.dispatchEvent(ev);
            }
        };

        dispatchKey('keydown');
        setTimeout(() => dispatchKey('keyup'), 30);

        // 4. Fallback: Swipe simulation
        setTimeout(() => {
            const rect = target.getBoundingClientRect();
            const touchStart = new MouseEvent('mousedown', {
                bubbles: true, cancelable: true,
                clientX: rect.right - 50, clientY: rect.top + rect.height / 2
            });
            const touchEnd = new MouseEvent('mouseup', {
                bubbles: true, cancelable: true,
                clientX: rect.left + 50, clientY: rect.top + rect.height / 2
            });
            target.dispatchEvent(touchStart);
            setTimeout(() => target.dispatchEvent(touchEnd), 150);
        }, 80);

        console.log('✅ Next dispatched to video:', target);
        return true;
    }

    /* =========================
       Overlay visibility
    ========================== */
    let currentUrl = location.href;

    function updateVisibility() {
        ensureOverlay();

        if (location.href !== currentUrl) {
            currentUrl = location.href;
        }

        // Check for the specific "exit" button provided by the user
        const exitBtn = document.querySelector('button[aria-label="exit"].TUXButton');
        const isStory = !!exitBtn;

        if (overlay) {
            overlay.style.display = isStory ? 'flex' : 'none';
        }
    }

    setInterval(updateVisibility, 500);

    // Initial call
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateVisibility);
    } else {
        updateVisibility();
    }

})();
