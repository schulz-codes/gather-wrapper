// Preload-Script läuft in der Renderer-Sandbox.
// Aktuell kein IPC nötig — Platzhalter für spätere Erweiterungen
// (z.B. manuelle Status-Overrides über ein kleines Overlay-UI).

import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('gatherWrapper', {
  version: process.env.npm_package_version ?? '0.1.0',
});
