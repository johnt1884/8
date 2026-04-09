// ==UserScript==
// @name         TikTok Stories Overlay Bottom-Right
// @namespace    https://example.com/tiktok-overlay-bottom-right
// @version      2.6
// @description  Bottom-right overlay with multiple controls for TikTok stories – updated green color
// @match        *://*.tiktok.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let collectedUrls = [];
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
       Clipboard helper
    ========================== */
    function copyToClipboard() {
        navigator.clipboard.writeText(collectedUrls.join('\n')).catch(() => {});
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
            if (!simulateArrowRight()) showToast('❌ Navigation failed');
            else showToast('Advanced to next story');
        };
        container.appendChild(progressBtn);

        const nextBtn = document.createElement('div');
        nextBtn.textContent = '➡️';
        nextBtn.title = 'Next story + copy URL';
        nextBtn.style.cssText = BASE_BTN_STYLE + 'background: transparent; color: black; border: 2px solid #377E47;';
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            const url = location.href;
            if (!collectedUrls.includes(url)) {
                collectedUrls.push(url);
                copyToClipboard();
                showToast(`Copied and advanced:\n${url}`);
            } else {
                showToast(`Already collected, advanced:\n${url}`);
            }
            if (!simulateArrowRight()) showToast('❌ Navigation failed');
        };
        container.appendChild(nextBtn);

        const copyBtn = document.createElement('div');
        copyBtn.textContent = '📋';
        copyBtn.title = 'Copy current URL (no progress)';
        copyBtn.style.cssText = BASE_BTN_STYLE + 'background: #377E47; color: white; border: none;';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            const url = location.href;
            if (!collectedUrls.includes(url)) {
                collectedUrls.push(url);
                copyToClipboard();
                showToast(`Copied:\n${url}`);
            } else {
                showToast(`Already collected:\n${url}`);
            }
        };
        container.appendChild(copyBtn);

        const delBtn = document.createElement('div');
        delBtn.textContent = '🗑️';
        delBtn.title = 'Clear collected URLs';
        delBtn.style.cssText = BASE_BTN_STYLE + 'background: red; color: white; border: none;';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            collectedUrls = [];
            copyToClipboard();
            showToast('Collected URLs cleared');
        };
        container.appendChild(delBtn);
    }


    /* =========================
       Reliable TikTok arrow click via Keyboard Simulation
    ========================== */
    let lastKeyTime = 0;
    function simulateArrowRight() {
        const now = Date.now();
        if (now - lastKeyTime < 500) return true; // Debounce
        lastKeyTime = now;

        const sendKey = (type) => {
            try {
                // Create the event with all standard properties
                const ev = new KeyboardEvent(type, {
                    key: 'ArrowRight',
                    code: 'ArrowRight',
                    keyCode: 39,
                    which: 39,
                    charCode: 0,
                    location: 0,
                    repeat: false,
                    isComposing: false,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    bubbles: true,
                    cancelable: true,
                    view: window
                });

                // TikTok/React-specific patches to avoid "toLocaleLowerCase" errors
                // We define these on the event object itself as well
                Object.defineProperties(ev, {
                    keyCode: { value: 39, writable: false },
                    which: { value: 39, writable: false },
                    charCode: { value: 0, writable: false }
                });

                // Dispatch to multiple targets to ensure capture
                window.dispatchEvent(ev);
                document.dispatchEvent(ev);

                // Target the player or focusable elements if possible
                const target = document.querySelector('#stories-player, [data-e2e="stories-player"], body');
                if (target) target.dispatchEvent(ev);

                return true;
            } catch (err) {
                console.error('Key simulation failed:', err);
                return false;
            }
        };

        const downOk = sendKey('keydown');
        const upOk = sendKey('keyup');

        return downOk || upOk;
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

        // Check for stories player specifically
        const isStory = !!document.querySelector('#stories-player, [data-e2e="stories-player"]');

        // Check if we are on a URL that typically hosts stories
        const isStoryUrl = location.pathname.includes('/stories/');

        if (overlay) {
            overlay.style.display = (isStory || isStoryUrl) ? 'flex' : 'none';
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
