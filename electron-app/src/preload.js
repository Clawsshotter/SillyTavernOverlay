const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    onDisplayMessage: (callback) => ipcRenderer.on('display-message', (event, ...args) => callback(...args)),
});