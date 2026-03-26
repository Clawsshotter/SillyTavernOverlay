const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const { startWebSocketServer } = require('./websocket');
const { startAudioEngine, killAudioEngine } = require('./audio');

let mainWindow;

// single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { 
    app.quit(); 
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow(); 
        startWebSocketServer(mainWindow);
        startAudioEngine();
    });
}

function createWindow() {
    const windowWidth = 1200;
    const windowHeight = 250;

    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        show: false,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.on('ready-to-show', () => {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        const x = Math.round((screenWidth - windowWidth) / 2);
        const y = screenHeight - windowHeight - 20;
        
        mainWindow.setPosition(x, y);
        mainWindow.show();
    });

    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

// cleanup
app.on('will-quit', () => {
    killAudioEngine();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});