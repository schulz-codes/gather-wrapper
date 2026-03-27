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

  // Alle Permission-Requests automatisch erlauben (kein Popup-Loop)
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      console.log('[gather-wrapper] Permission angefragt:', permission);
      callback(true);
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

      startCameraMonitoring(gatherWindow);

      // Debug: gatherDev API erkunden — wartet bis nach Login
      gatherWindow.webContents.executeJavaScript(`
        (function() {
          let lastKeyCount = 0;
          const poll = setInterval(() => {
            if (typeof gatherDev === 'undefined') return;

            const keys = Object.keys(gatherDev);
            // Warte bis sich die API nicht mehr aendert (= Login fertig)
            if (keys.length !== lastKeyCount) {
              lastKeyCount = keys.length;
              console.log('[event-debug] gatherDev keys (' + keys.length + '):', keys);
              return;
            }
            // Erst auswerten wenn 2x hintereinander gleich
            if (keys.length < 5) return;
            clearInterval(poll);

            console.log('[event-debug] API stabil, starte Exploration');

            // Rekursiv emit/on/subscribe suchen
            const seen = new Set();
            function explore(obj, path, depth) {
              if (!obj || depth > 3 || typeof obj !== 'object') return;
              if (seen.has(obj)) return;
              seen.add(obj);
              try {
                const allKeys = [...Object.keys(obj), ...Object.getOwnPropertyNames(Object.getPrototypeOf(obj) || {})];
                for (const key of allKeys) {
                  if (key === 'constructor') continue;
                  try {
                    const val = obj[key];
                    const fullPath = path + '.' + key;
                    if (typeof val === 'function') {
                      if (['on', 'emit', 'subscribe', 'addEventListener', 'addListener', 'onEvent'].includes(key)) {
                        console.log('[event-debug] EVENT-METHODE:', fullPath);
                      }
                    } else if (val && typeof val === 'object') {
                      explore(val, fullPath, depth + 1);
                    }
                  } catch(e) {}
                }
              } catch(e) {}
            }
            explore(gatherDev, 'gatherDev', 0);

            // Alle Top-Level Objekte mit emit wrappen
            for (const [key, val] of Object.entries(gatherDev)) {
              if (val && typeof val === 'object' && typeof val.emit === 'function') {
                const origEmit = val.emit.bind(val);
                val.emit = function(event, ...args) {
                  console.log('[event-debug]', key + '.emit(' + event + ')', JSON.stringify(args).substring(0, 300));
                  return origEmit(event, ...args);
                };
                console.log('[event-debug] emit-Hook auf', key);
              }
              // Auch subscribe probieren
              if (val && typeof val === 'object' && typeof val.subscribe === 'function') {
                try {
                  val.subscribe((data) => {
                    console.log('[event-debug]', key + '.subscribe:', JSON.stringify(data).substring(0, 300));
                  });
                  console.log('[event-debug] subscribed to', key);
                } catch(e) {}
              }
            }

            // game/engine Objekt suchen (manchmal verschachtelt)
            const game = gatherDev.game || gatherDev.engine;
            if (game && typeof game.emit === 'function') {
              const origEmit = game.emit.bind(game);
              game.emit = function(event, ...args) {
                console.log('[event-debug] game.emit(' + event + ')', JSON.stringify(args).substring(0, 300));
                return origEmit(event, ...args);
              };
              console.log('[event-debug] emit-Hook auf game');
            }

            // WebSocket messages abfangen
            const origWsSend = WebSocket.prototype.send;
            WebSocket.prototype.send = function(data) {
              try {
                const str = typeof data === 'string' ? data : '';
                if (str.includes('wave') || str.includes('nudge') || str.includes('ring') || str.includes('knock') || str.includes('emote')) {
                  console.log('[event-debug] WS-SEND:', str.substring(0, 500));
                }
              } catch(e) {}
              return origWsSend.call(this, data);
            };

            // Eingehende WS-Messages loggen
            const origAddEventListener = EventTarget.prototype.addEventListener;
            const hookedSockets = new Set();
            const origWsConstructor = window.WebSocket;
            window.WebSocket = function(...args) {
              const ws = new origWsConstructor(...args);
              if (!hookedSockets.has(ws)) {
                hookedSockets.add(ws);
                ws.addEventListener('message', (e) => {
                  try {
                    const str = typeof e.data === 'string' ? e.data : '';
                    if (str.includes('wave') || str.includes('nudge') || str.includes('ring') || str.includes('knock') || str.includes('emote') || str.includes('Wave') || str.includes('Nudge')) {
                      console.log('[event-debug] WS-RECV:', str.substring(0, 500));
                    }
                  } catch(e) {}
                });
              }
              return ws;
            };
            window.WebSocket.prototype = origWsConstructor.prototype;

            console.log('[event-debug] Alle Hooks installiert. Warte auf Events...');
          }, 3000);
        })()
      `).catch(() => {});
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
