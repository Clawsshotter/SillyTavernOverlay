console.log('[SillyTavernOverlay] Conductor script loaded. Injecting...');

const s = document.createElement('script');
s.src = chrome.runtime.getURL('injector.js');
(document.head || document.documentElement).appendChild(s);
s.onload = function() {
    s.remove();
};