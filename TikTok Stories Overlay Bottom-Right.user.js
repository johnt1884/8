// ==UserScript==
// @name         TikTok Stories Overlay Bottom-Right
// @namespace    https://example.com/tiktok-overlay-bottom-right
// @version      2.6
// @description  Bottom-right overlay with multiple controls for TikTok stories – updated green color
// @match        https://www.tiktok.com/@*
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
        let svg = document.querySelector(
            '#stories-player > div.css-1uvgqxq-7937d88b--DivStoriesContentContainer.eif2g2u1.stories-player-transition-exit-done > div:nth-child(3) > button > div > div > svg'
        );

        if (!svg) {
            const controls = document.querySelectorAll('#stories-player button svg');
            if (controls.length >= 2) svg = controls[controls.length - 1];
        }

        if (!svg) {
            svg = document.querySelector('#stories-player svg.flip-rtl, #stories-player svg path[d*="28.74 24"]');
        }

        if (!svg) return false;

        const button = svg.closest('button');
        if (!button) return false;

        ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(type => {
            const ev = type.includes('pointer')
                ? new PointerEvent(type, { bubbles: true, cancelable: true, pointerType: 'mouse', isPrimary: true })
                : new MouseEvent(type, { bubbles: true, cancelable: true });
            button.dispatchEvent(ev);
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

    setInterval(() => {
        if (location.href !== currentUrl) currentUrl = location.href;

        const svg =
            document.querySelector('#stories-player button svg.flip-rtl') ||
            document.querySelector('#stories-player button svg:last-of-type');

        overlay.style.display = svg ? 'flex' : 'none';
    }, 300);

})();
