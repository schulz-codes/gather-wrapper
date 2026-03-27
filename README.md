# gather-wrapper

Electron-App die Gather als Desktop-App einbettet und den Status automatisch
auf **Busy** setzt wenn die Kamera von einer externen App (Teams etc.) genutzt wird.

## Logik

| Zustand | Gather-Status |
|---|---|
| Kamera aus | Available |
| Kamera an, Gather-Gespräch läuft | _(kein Eingriff)_ |
| Kamera an, externe App (Teams etc.) | Busy |

## Setup

```bash
npm install
npm run build
npm run dev   # Entwicklung
```

## Distribution

```bash
npm run dist  # Erstellt gather-wrapper.dmg
```

DMG-Datei per Slack/Drive ans Team verteilen.
Beim ersten Start: Rechtsklick → Öffnen (Gatekeeper-Warnung umgehen).

## TODO: Gather Status-Selector

Der Status-Button-Selector in `src/camera.ts` → `setGatherStatus()` muss
einmalig per DevTools herausgefunden werden:

1. App starten (`npm run dev`)
2. `Cmd+Option+I` → DevTools öffnen
3. Elements-Tab → Status-Button in Gather inspizieren
4. Korrekten Selector / Event in `setGatherStatus()` eintragen

## Projektstruktur

```
src/
  main.ts      # Electron Main Process, Window-Setup
  camera.ts    # Kamera-Monitoring + Gather-Status-Logik
  preload.ts   # Renderer-Bridge (contextBridge)
```
