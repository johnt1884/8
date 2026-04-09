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
            if (!clickTikTokArrow()) showToast('❌ Could not find next-story button');
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
            if (!clickTikTokArrow()) showToast('❌ Could not find next-story button');
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
       Reliable TikTok arrow click
    ========================== */
    let lastClickTime = 0;
    function clickTikTokArrow() {
        const now = Date.now();
        if (now - lastClickTime < 500) return true; // Debounce
        lastClickTime = now;

        // 1. Multi-stage button discovery
        const findButton = () => {
            // A. Specific TikTok TUXButton patterns (user provided)
            let b = document.querySelector('button.action-item svg.flip-rtl')?.closest('button') ||
                    document.querySelector('button[class*="TUXButton"] svg.flip-rtl')?.closest('button');
            if (b) return b;

            // B. Data-e2e and Test attributes (most stable)
            b = document.querySelector('[data-e2e="arrow-right"], [data-e2e="story-next"], [data-testid="story-next-button"]');
            if (b) return b;

            // C. ARIA labels (Check all buttons globally first)
            b = document.querySelector('button[aria-label*="Next"], button[aria-label*="next"], button[aria-label*="arrow-right"]');
            if (b) return b;

            // D. Search within stories player
            const player = document.querySelector('#stories-player, [data-e2e="stories-player"], [class*="DivStoriesContentContainer"], [class*="DivStoriesViewerContainer"]');
            if (player) {
                // Try to find by SVG path
                const svg = player.querySelector('svg.flip-rtl') ||
                            player.querySelector('svg path[d*="28.74 24"]')?.closest('svg');
                if (svg) return svg.closest('button');

                // E. Geometric fallback: find buttons on the right half of the player
                const rect = player.getBoundingClientRect();
                const buttons = Array.from(player.querySelectorAll('button'));
                for (const btn of buttons) {
                    const bRect = btn.getBoundingClientRect();
                    if (bRect.left > rect.left + rect.width * 0.7) {
                        return btn;
                    }
                }
            }
            return null;
        };

        const btn = findButton();
        if (!btn) return false;

        // 3. Staggered "Human" click sequence using Pointer and Mouse events
        const rect = btn.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        const common = {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX,
            clientY,
            screenX: clientX,
            screenY: clientY,
            buttons: 1,
            button: 0,
            which: 1,
            detail: 1,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
        };

        const dispatch = (type, Cls) => {
            try {
                btn.dispatchEvent(new Cls(type, common));
            } catch (e) {}
        };

        dispatch('pointerdown', PointerEvent);
        dispatch('mousedown', MouseEvent);

        setTimeout(() => {
            dispatch('pointerup', PointerEvent);
            dispatch('mouseup', MouseEvent);
            dispatch('click', MouseEvent);

            // Final fallback: native .click()
            try {
                btn.click();
            } catch (e) {}

            btn.focus();
        }, 20);

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
