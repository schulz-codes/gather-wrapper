import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startCameraMonitoring, stopCameraMonitoring } from './camera.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let gatherWindow: BrowserWindow | null = null;

function createWindow(): void {
  gatherWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Gather',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Kamera + Mikro erlauben (wie ein echter Browser)
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Kamera/Mikro-Requests automatisch erlauben (kein Popup)
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowed = ['media', 'audioCapture', 'videoCapture'];
      callback(allowed.includes(permission));
    }
  );

  // User-Agent auf normales Chrome setzen, sonst blockt Gather als "unsupported"
  const chromeUA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  gatherWindow.webContents.setUserAgent(chromeUA);

  gatherWindow.loadURL('https://app.v2.gather.town/app/6d1f902a-e3f9-4c23-a733-9ad5856db030');

  gatherWindow.on('closed', () => {
    gatherWindow = null;
  });

  // Kamera-Monitoring starten sobald Gather geladen ist
  gatherWindow.webContents.on('did-finish-load', () => {
    if (gatherWindow) {
      startCameraMonitoring(gatherWindow);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopCameraMonitoring();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
