console.log('[SillyTavernOverlay] Script successfully injected into the page context.');

(function() {
    if (window.hasInjectedOverlayScript) return;
    window.hasInjectedOverlayScript = true;

    const WS_PORT = 38765;
    let ws = null;
    let connected = false;

    function connectWebSocket() {
        console.log(`[SillyTavernOverlay] Attempting WebSocket on port ${WS_PORT}...`);
        ws = new WebSocket(`ws://127.0.0.1:${WS_PORT}`);

        ws.onopen = () => { console.log('[SillyTavernOverlay] Connected to Electron App.'); connected = true; };
        ws.onclose = () => { connected = false; setTimeout(connectWebSocket, 5000); };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'STT_RESULT') insertTextIntoSillyTavern(data.text);
            } catch (e) { console.error('WS Error:', e); }
        };
    }

    function insertTextIntoSillyTavern(text) {
        const textArea = document.querySelector('#send_textarea'); 
        if (textArea) {
            const currentVal = textArea.value;
            const prefix = currentVal && !currentVal.endsWith(' ') ? ' ' : '';
            
            // 1. inject the text
            textArea.value = currentVal + prefix + text;
            
            // 2. force SillyTavern's internal state to recognize the text
            // use both native AND jQuery events because ST relies on jQuery
            textArea.dispatchEvent(new Event('input', { bubbles: true }));
            if (typeof window.$ !== 'undefined') {
                window.$(textArea).trigger('input');
            }
            
            console.log('[SillyTavernOverlay] Inserted text:', text);

            // 3. autosend
            setTimeout(() => {
                // SendMessage() is the exact function ST triggers when you press Enter
                if (typeof window.SendMessage === 'function') {
                    window.SendMessage();
                    console.log('[SillyTavernOverlay] Auto-sent via window.SendMessage()!');
                } 

                // fallback: use jQuery to trigger the button click natively in ST's ecosystem
                else if (typeof window.$ !== 'undefined') {
                    window.$('#send_but').trigger('click');
                    console.log('[SillyTavernOverlay] Auto-sent via jQuery click!');
                } 
                // final native fallback
                else {
                    const sendButton = document.querySelector('#send_but');
                    if (sendButton) sendButton.click();
                }
            }, 150); // 150ms delay gives ST's auto-expanding textarea time to visually catch up

        } else {
            console.warn('[SillyTavernOverlay] Could not find #send_textarea');
        }
    }

    let attempts = 0;
    function initializeConnector() {
        attempts++;
        console.log(`[SillyTavernOverlay] Initialization attempt #${attempts}...`);

        let evSource = null;
        let evTypes = null;
        let chatData = null;

        // safely try to get context the old way
        try {
            if (typeof window.SillyTavern !== 'undefined' && typeof window.SillyTavern.getContext === 'function') {
                const context = window.SillyTavern.getContext();
                if (context) {
                    evSource = context.eventSource;
                    evTypes = context.event_types;
                }
            }
        } catch (e) {
            console.warn('[SillyTavernOverlay] getContext() crashed. Falling back to globals...', e.message);
        }

        // fallback: look for global variables
        if (!evSource) evSource = window.eventSource;
        if (!evTypes) evTypes = window.event_types;

        if (!evSource || !evTypes) {
             console.warn('[SillyTavernOverlay] Could not find eventSource. Waiting...');
             setTimeout(initializeConnector, 1000);
             return;
        }

        console.log('[SillyTavernOverlay] SillyTavern API found. Setting up Listeners.');
        connectWebSocket();

        // setup ST Listener
        evSource.on(evTypes.MESSAGE_RECEIVED, (messageId) => {
            setTimeout(() => {
                // safely try to fetch the chat log
                try {
                    const freshContext = (typeof window.SillyTavern !== 'undefined' && typeof window.SillyTavern.getContext === 'function') 
                        ? window.SillyTavern.getContext() 
                        : null;
                        
                    // if getContext fails, try grabbing it from the global chat array
                    const chatLog = freshContext && freshContext.chat ? freshContext.chat : window.chat;
                    const message = chatLog ? chatLog[messageId] : null;

                    if (!message || message.mes === '' || message.mes === '...' || message.is_user) return;

                    console.log('[SillyTavernOverlay] Sending to Electron:', message.name);

                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'ST_OVERLAY_MESSAGE',
                            payload: { name: message.name, text: message.mes }
                        }));
                    }
                } catch (e) {
                    console.error('[SillyTavernOverlay] Error reading message:', e);
                }
            }, 50);
        });
    }

    initializeConnector();
})();