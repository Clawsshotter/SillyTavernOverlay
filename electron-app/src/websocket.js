const WebSocket = require('ws');

let wss = null;

function startWebSocketServer(mainWindow, port = 38765) {
    wss = new WebSocket.Server({ port });
    console.log(`WebSocket server listening on port ${port}`);

    wss.on('connection', (ws) => {
        console.log('Browser connected via WebSocket');

        ws.on('message', (message) => {
            try {
                const parsed = JSON.parse(message);
                if (mainWindow && parsed.type === 'ST_OVERLAY_MESSAGE') {
                    mainWindow.webContents.send('display-message', parsed.payload);
                }
            } catch (e) {
                console.error('WS Parse Error:', e);
            }
        });
    });
}

function broadcastToBrowser(data) {
    if (!wss) return;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

module.exports = {
    startWebSocketServer,
    broadcastToBrowser
};