const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs-extra');

// Expose 'fs' and 'ipcRenderer' to the main window through contextBridge
contextBridge.exposeInMainWorld('fs', {
  // Expose 'writeFile' and 'readFile' methods of 'fs'
  writeFile: fs.writeFile,
  readFile: fs.readFile
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  // Expose 'send' method of 'ipcRenderer'
  send: ipcRenderer.send
});

// Listen to 'main-to-preload' event from the main process
ipcRenderer.on('main-to-preload', (event, data) => {
  console.log(data);
  // Store the received data in localStorage with the key 'cid'
  localStorage.setItem('cid', data);
});

// Listen to 'file-retrieved' event from the main process
ipcRenderer.on('file-retrieved', (event, data) => {
  console.log("File successfully saved to disk.");
});

