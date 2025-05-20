const {Menu, app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const dataPath = path.join(app.getPath('userData'), 'titles.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.webContents.openDevTools();
  // }

  Menu.setApplicationMenu(null)
}

// Обработчики IPC
ipcMain.handle('load-titles', async () => {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    return [];
  } catch (err) {
    console.error('Error loading titles:', err);
    return [];
  }
});

ipcMain.handle('save-titles', async (_, titles) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(titles, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving titles:', err);
    return false;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});