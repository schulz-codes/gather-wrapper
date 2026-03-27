# gather-wrapper

Electron-App die Gather als Desktop-App einbettet und den Status automatisch
auf **Busy** setzt wenn die Kamera von einer externen App (Teams etc.) genutzt wird.

## Logik

| Zustand | Gather-Status |
|---|---|
| Kamera aus | Available |
| Kamera an, Gather-Gespräch läuft | _(kein Eingriff)_ |
| Kamera an, externe App (Teams etc.) | Busy |

## Installation (macOS)

```bash
brew tap schulz-codes/tap
brew install gather-wrapper
```

Da die App nicht signiert ist, muss sie beim ersten Start manuell freigegeben werden:

1. App aus `/Applications` starten — macOS zeigt eine Warnung und bricht ab
2. **Systemeinstellungen → Datenschutz & Sicherheit** öffnen
3. Unter „Sicherheit" erscheint ein Hinweis zur blockierten App — auf **Trotzdem öffnen** klicken
4. Im nächsten Dialog nochmals **Öffnen** bestätigen

Danach startet die App ohne weitere Warnungen.

## Entwicklung

```bash
pnpm install
pnpm build
pnpm dev
```

## Distribution

```bash
pnpm dist  # Erstellt .dmg und .zip
```

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
