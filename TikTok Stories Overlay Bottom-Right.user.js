// ==UserScript==
// @name         TikTok Stories Overlay Bottom-Right
// @namespace    https://example.com/tiktok-overlay-bottom-right
// @version      2.6
// @description  Bottom-right overlay with multiple controls for TikTok stories – updated green color
// @match        https://www.tiktok.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    let collectedUrls = [];

    /* =========================
       Overlay container
    ========================== */
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999999;
        display: flex;
        flex-direction: row;
        gap: 10px;
        pointer-events: auto;
    `;
    document.body.appendChild(overlay);

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
       Shared button style (≈40% smaller)
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
       1. Progress-only (black bg, white border)
    ========================== */
    const progressBtn = document.createElement('div');
    progressBtn.textContent = '➡️';
    progressBtn.title = 'Progress to next story (no copy)';
    progressBtn.style.cssText = `
        ${BASE_BTN_STYLE}
        background: black;
        color: white;
        border: 2px solid white;
    `;
    overlay.appendChild(progressBtn);

    /* =========================
       2. Next + copy (transparent bg, green border)
    ========================== */
    const nextBtn = document.createElement('div');
    nextBtn.textContent = '➡️';
    nextBtn.title = 'Next story + copy URL';
    nextBtn.style.cssText = `
        ${BASE_BTN_STYLE}
        background: transparent;
        color: black;
        border: 2px solid #377E47;
    `;
    overlay.appendChild(nextBtn);

    /* =========================
       3. Copy-only (green bg, no border)
    ========================== */
    const copyBtn = document.createElement('div');
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy current URL (no progress)';
    copyBtn.style.cssText = `
        ${BASE_BTN_STYLE}
        background: #377E47;
        color: white;
        border: none;
    `;
    overlay.appendChild(copyBtn);

    /* =========================
       4. Clear (red bg, no border)
    ========================== */
    const delBtn = document.createElement('div');
    delBtn.textContent = '🗑️';
    delBtn.title = 'Clear collected URLs';
    delBtn.style.cssText = `
        ${BASE_BTN_STYLE}
        background: red;
        color: white;
        border: none;
    `;
    overlay.appendChild(delBtn);

    /* =========================
       Clipboard helper
    ========================== */
    function copyToClipboard() {
        navigator.clipboard.writeText(collectedUrls.join('\n')).catch(() => {});
    }

    /* =========================
       Reliable TikTok arrow click
    ========================== */
    function clickTikTokArrow() {
        // 1. Try Keyboard events (ArrowRight) - very stable
        const sendKey = (type) => {
            const ev = new KeyboardEvent(type, {
                key: 'ArrowRight',
                code: 'ArrowRight',
                keyCode: 39,
                which: 39,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(ev);
            window.dispatchEvent(ev);
        };
        sendKey('keydown');
        sendKey('keyup');

        // 2. Try to find the button via ARIA labels or specific classes
        let btn =
            document.querySelector('button[aria-label*="Next"]') ||
            document.querySelector('button[aria-label*="next"]') ||
            document.querySelector('#stories-player button[class*="ButtonNext"]');

        // 3. Fallback to SVG/Path detection
        if (!btn) {
            const svg =
                document.querySelector('#stories-player button svg.flip-rtl') ||
                document.querySelector('#stories-player svg path[d*="28.74 24"]')?.closest('svg') ||
                Array.from(document.querySelectorAll('#stories-player button svg')).pop();

            if (svg) btn = svg.closest('button');
        }

        if (!btn) return true;

        // 4. Dispatch events with a tiny delay to simulate real user and avoid "Something went wrong"
        const eventSequence = ['mousedown', 'mouseup', 'click'];
        eventSequence.forEach((type, i) => {
            setTimeout(() => {
                const ev = new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail: 1
                });
                btn.dispatchEvent(ev);
            }, i * 10);
        });

        return true;
    }

    /* =========================
       Button actions
    ========================== */
    progressBtn.onclick = () => {
        if (!clickTikTokArrow()) showToast('❌ Could not find next-story button');
        else showToast('Advanced to next story');
    };

    nextBtn.onclick = () => {
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

    copyBtn.onclick = () => {
        const url = location.href;
        if (!collectedUrls.includes(url)) {
            collectedUrls.push(url);
            copyToClipboard();
            showToast(`Copied:\n${url}`);
        } else {
            showToast(`Already collected:\n${url}`);
        }
    };

    delBtn.onclick = () => {
        collectedUrls = [];
        copyToClipboard();
        showToast('Collected URLs cleared');
    };

    /* =========================
       Overlay visibility
    ========================== */
    let currentUrl = location.href;

    function updateVisibility() {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
        }

        // Check for stories player specifically
        const isStory = !!document.querySelector('#stories-player');

        // Check if we are on a URL that typically hosts stories
        const isStoryUrl = location.pathname.includes('/stories/');

        overlay.style.display = (isStory || isStoryUrl) ? 'flex' : 'none';
    }

    setInterval(updateVisibility, 500);
    updateVisibility();

})();
