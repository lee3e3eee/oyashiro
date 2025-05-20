const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveTitles: (titles) => ipcRenderer.invoke('save-titles', titles),
  loadTitles: () => ipcRenderer.invoke('load-titles')
});