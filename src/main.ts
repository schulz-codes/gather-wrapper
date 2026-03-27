import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startCameraMonitoring, stopCameraMonitoring, setStatusCallback, setGatherCustomStatus, clearGatherCustomStatus } from './camera.js';
import { createTray, updateTrayStatus } from './tray.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let gatherWindow: BrowserWindow | null = null;
let isQuitting = false;

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

  // Alle Permission-Requests automatisch erlauben (kein Popup-Loop)
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      console.log('[gather-wrapper] Permission angefragt:', permission);
      callback(true);
    }
  );

  // Screen Sharing: nativen macOS Picker verwenden
  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    callback({});
  }, { useSystemPicker: true } as any);

  // User-Agent auf normales Chrome setzen, sonst blockt Gather als "unsupported"
  const chromeUA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
  gatherWindow.webContents.setUserAgent(chromeUA);

  gatherWindow.loadURL('https://app.v2.gather.town/app/6d1f902a-e3f9-4c23-a733-9ad5856db030');

  // Cmd+W: hide window instead of closing to keep the Gather session alive
  gatherWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      gatherWindow?.hide();
    }
  });

  gatherWindow.on('closed', () => {
    gatherWindow = null;
  });

  // Kamera-Monitoring starten sobald Gather geladen ist
  gatherWindow.webContents.on('did-finish-load', () => {
    if (gatherWindow) {
      // Main-Process Logs in die DevTools Console umleiten (erst nach Page-Load)
      const win = gatherWindow;
      let ready = true;
      const origLog = console.log;
      const origError = console.error;
      console.log = (...args: unknown[]) => {
        origLog(...args);
        if (!ready || win.isDestroyed()) return;
        const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        ready = false;
        win.webContents.executeJavaScript(
          `console.log('[main] ' + ${JSON.stringify(msg)})`
        ).catch(() => {}).finally(() => { ready = true; });
      };
      console.error = (...args: unknown[]) => {
        origError(...args);
        if (!ready || win.isDestroyed()) return;
        const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        ready = false;
        win.webContents.executeJavaScript(
          `console.error('[main] ' + ${JSON.stringify(msg)})`
        ).catch(() => {}).finally(() => { ready = true; });
      };

      // Auto-Join: klickt den Join-Button auf dem Prejoin-Screen
      gatherWindow.webContents.executeJavaScript(`
        (function() {
          let attempts = 0;
          const poll = setInterval(() => {
            attempts++;
            if (attempts > 60) { clearInterval(poll); return; } // 30s timeout
            const btn = document.querySelector('[data-testid="prejoin-screen"] button[type="submit"]');
            if (btn) {
              clearInterval(poll);
              btn.click();
              console.log('[gather-wrapper] Auto-Join geklickt');
            }
          }, 500);
        })()
      `).catch(() => {});

      startCameraMonitoring(gatherWindow);
    }
  });
}

// Track when the app is truly quitting (Cmd+Q) vs just closing a window (Cmd+W)
app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  createWindow();
  createTray(() => gatherWindow, {
    onSetStatus: (preset) => {
      if (gatherWindow) {
        setGatherCustomStatus(gatherWindow, preset.label, preset.emoji, preset.busy);
      }
    },
    onClearStatus: () => {
      if (gatherWindow) {
        clearGatherCustomStatus(gatherWindow);
      }
    },
  });

  setStatusCallback((status) => {
    updateTrayStatus(status, () => gatherWindow);
  });

  app.on('activate', () => {
    if (gatherWindow) {
      gatherWindow.show();
    } else {
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
