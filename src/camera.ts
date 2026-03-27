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
let onStatusChange: ((status: GatherStatus) => void) | null = null;
let cameraStatusActive = false;

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

async function getGatherStatus(win: BrowserWindow): Promise<GatherStatus | null> {
  try {
    const result = await win.webContents.executeJavaScript(`
      (function() {
        try {
          return gatherDev.PlayerManager.getLocalUserEntity().spaceUser.availability;
        } catch(e) { return null; }
      })()
    `);
    const value = typeof result === 'object' && result !== null ? result.value : result;
    if (value === 'Active' || value === 'Busy') return value;
    return null;
  } catch {
    return null;
  }
}

async function setGatherStatus(
  win: BrowserWindow,
  status: GatherStatus
): Promise<void> {
  if (status === lastStatus) return;

  console.log(`[gather-wrapper] Status → ${status}`);
  lastStatus = status;
  onStatusChange?.(status);

  try {
    await win.webContents.executeJavaScript(`
      gatherDev.PlayerManager.getLocalUserEntity().spaceUser.setAvailability({ availability: "${status}" })
    `);
  } catch (err) {
    console.error('[gather-wrapper] Fehler beim Status setzen:', err);
  }
}

function notifyStatusIfChanged(status: GatherStatus): void {
  if (status === lastStatus) return;
  console.log(`[gather-wrapper] Status (manuell geändert) → ${status}`);
  lastStatus = status;
  onStatusChange?.(status);
}

/**
 * Startet das Kamera-Monitoring.
 * Läuft alle 2 Sekunden und entscheidet ob Gather auf busy/available
 * gesetzt werden soll.
 */
export function setStatusCallback(cb: (status: GatherStatus) => void): void {
  onStatusChange = cb;
}

export async function setGatherCustomStatus(
  win: BrowserWindow,
  statusText: string,
  emoji: string,
  busy: boolean
): Promise<void> {
  const availability = busy ? 'Busy' : 'Active';
  console.log(`[gather-wrapper] Custom Status → ${emoji} ${statusText} (${availability})`);

  try {
    const result = await win.webContents.executeJavaScript(`
      (async function() {
        try {
          const su = gatherDev.PlayerManager.getLocalUserEntity().spaceUser;
          const clearAt = new Date(Date.now() + 60 * 60 * 1000);
          await su.setCustomStatus({
            text: ${JSON.stringify(statusText)},
            emoji: ${JSON.stringify(emoji)},
            clearCondition: { type: "DateTime", clearAt }
          });
          await su.setAvailability({ availability: "${availability}" });
          return { ok: true };
        } catch(e) {
          return { ok: false, error: e.message };
        }
      })()
    `);
    if (result?.ok) {
      lastStatus = availability;
      onStatusChange?.(availability);
    }
  } catch (err) {
    console.error('[gather-wrapper] Fehler beim Custom Status setzen:', err);
  }
}

async function setGatherCustomStatusNever(
  win: BrowserWindow,
  statusText: string,
  emoji: string,
  busy: boolean
): Promise<boolean> {
  const availability = busy ? 'Busy' : 'Active';
  console.log(`[gather-wrapper] Custom Status (Never) → ${emoji} ${statusText} (${availability})`);

  try {
    const result = await win.webContents.executeJavaScript(`
      (async function() {
        try {
          const su = gatherDev.PlayerManager.getLocalUserEntity().spaceUser;
          await su.setCustomStatus({
            text: ${JSON.stringify(statusText)},
            emoji: ${JSON.stringify(emoji)},
            clearCondition: { type: "Never" }
          });
          await su.setAvailability({ availability: "${availability}" });
          return { ok: true };
        } catch(e) {
          console.error('[gather-wrapper] JS setCustomStatus error:', e.message);
          return { ok: false, error: e.message };
        }
      })()
    `);
    if (result?.ok) {
      lastStatus = availability;
      onStatusChange?.(availability);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[gather-wrapper] Fehler beim Custom Status setzen:', err);
    return false;
  }
}

export async function clearGatherCustomStatus(win: BrowserWindow): Promise<void> {
  console.log('[gather-wrapper] Custom Status gelöscht');

  try {
    await win.webContents.executeJavaScript(`
      (function() {
        const su = gatherDev.PlayerManager.getLocalUserEntity().spaceUser;
        su.clearCustomStatus();
        su.setAvailability({ availability: "Active" });
      })()
    `);
    lastStatus = 'Active';
    onStatusChange?.('Active');
  } catch (err) {
    console.error('[gather-wrapper] Fehler beim Custom Status löschen:', err);
  }
}

export function startCameraMonitoring(win: BrowserWindow): void {
  console.log('[gather-wrapper] Kamera-Monitoring gestartet');

  monitoringInterval = setInterval(async () => {
    try {
      const activeCameras = getActiveCameras();

      // Aktuellen Gather-Status abfragen (erkennt manuelle Änderungen)
      const currentGatherStatus = await getGatherStatus(win);
      if (currentGatherStatus) {
        notifyStatusIfChanged(currentGatherStatus);
      }

      // Keine aktive Kamera → Custom Status löschen falls wir ihn gesetzt haben
      if (activeCameras.length === 0) {
        if (cameraStatusActive) {
          console.log('[gather-wrapper] Kamera aus → Custom Status wird gelöscht');
          cameraStatusActive = false;
          await clearGatherCustomStatus(win);
        }
        return;
      }

      // Kamera aktiv → prüfen ob Gather selbst der Verursacher ist
      const gatherActive = await isGatherUsingCamera(win);
      if (gatherActive) return;

      // Kamera aktiv, nicht durch Gather → externe App → "In a Meeting" (Never-clear, wir räumen selbst auf)
      if (!cameraStatusActive) {
        console.log(`[gather-wrapper] Externe Kamera-Nutzung erkannt → setze "In a Meeting"`);
        const ok = await setGatherCustomStatusNever(win, 'In a Meeting', '📅', true);
        if (ok) cameraStatusActive = true;
      }
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
