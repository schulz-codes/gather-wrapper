import { BrowserWindow } from 'electron';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAMERA_CHECK_BIN = path.join(
  __dirname.replace('app.asar', 'app.asar.unpacked'),
  '..',
  'native',
  'camera-check'
);

type GatherStatus = 'Active' | 'Busy';

let monitoringInterval: NodeJS.Timeout | null = null;
let lastStatus: GatherStatus | null = null;

/**
 * Prüft über ein vorkompiliertes Swift-Binary (AVFoundation) welche
 * Kameras gerade aktiv sind (nicht suspended).
 * Gibt die Namen der aktiven Kameras zurück.
 */
function getActiveCameras(): string[] {
  try {
    const output = execSync(CAMERA_CHECK_BIN, { timeout: 3000 }).toString().trim();
    if (!output) return [];
    return output.split('\n');
  } catch (err) {
    console.error('[gather-wrapper] camera-check fehlgeschlagen:', err);
    return [];
  }
}

/**
 * Prüft ob Gather selbst die Kamera gerade in einem aktiven
 * Gespräch nutzt (live VideoTrack in der Seite).
 */
async function isGatherUsingCamera(win: BrowserWindow): Promise<boolean> {
  try {
    const result = await win.webContents.executeJavaScript(`
      (function() {
        const videos = [...document.querySelectorAll('video')];
        return videos.some(v => {
          if (!v.srcObject || !(v.srcObject instanceof MediaStream)) return false;
          return v.srcObject.getVideoTracks().some(
            t => t.enabled && t.readyState === 'live'
          );
        });
      })()
    `);
    return Boolean(result);
  } catch {
    // Seite noch nicht geladen o.ä.
    return false;
  }
}

async function setGatherStatus(
  win: BrowserWindow,
  status: GatherStatus
): Promise<void> {
  if (status === lastStatus) return;

  console.log(`[gather-wrapper] Status → ${status}`);
  lastStatus = status;

  try {
    await win.webContents.executeJavaScript(`
      gatherDev.PlayerManager.getLocalUserEntity().spaceUser.setAvailability({ availability: "${status}" })
    `);
  } catch (err) {
    console.error('[gather-wrapper] Fehler beim Status setzen:', err);
  }
}

/**
 * Startet das Kamera-Monitoring.
 * Läuft alle 2 Sekunden und entscheidet ob Gather auf busy/available
 * gesetzt werden soll.
 */
export function startCameraMonitoring(win: BrowserWindow): void {
  console.log('[gather-wrapper] Kamera-Monitoring gestartet');

  monitoringInterval = setInterval(async () => {
    try {
      const activeCameras = getActiveCameras();
      console.log(`[gather-wrapper] Aktive Kameras: [${activeCameras.join(', ')}]`);

      // Keine aktive Kamera → available
      if (activeCameras.length === 0) {
        await setGatherStatus(win, 'Active');
        return;
      }

      // Kamera aktiv → prüfen ob Gather selbst der Verursacher ist
      const gatherActive = await isGatherUsingCamera(win);
      console.log(`[gather-wrapper] isGatherUsingCamera() → ${gatherActive}`);
      if (gatherActive) {
        console.log('[gather-wrapper] Gather nutzt Kamera selbst → kein Eingriff');
        return;
      }

      // Kamera aktiv, nicht durch Gather → externe App
      console.log(`[gather-wrapper] Externe Kamera-Nutzung erkannt → setze busy`);
      await setGatherStatus(win, 'Busy');
    } catch (err) {
      console.error('[gather-wrapper] Monitoring-Fehler:', err);
    }
  }, 2000);
}

/**
 * Stoppt das Kamera-Monitoring.
 */
export function stopCameraMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('[gather-wrapper] Kamera-Monitoring gestoppt');
  }
}
