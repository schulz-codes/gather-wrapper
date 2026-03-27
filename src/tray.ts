import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(
  __dirname.replace('app.asar', 'app.asar.unpacked'),
  '..',
  'assets'
);

type GatherStatus = 'Active' | 'Busy';

interface StatusPreset {
  label: string;
  emoji: string;
  busy: boolean;
}

const STATUS_PRESETS: StatusPreset[] = [
  { label: 'Lunch', emoji: '🍕', busy: true },
  { label: 'AFK', emoji: '🚶', busy: true },
  { label: 'In a Meeting', emoji: '📅', busy: true },
  { label: 'Focus', emoji: '🎯', busy: true },
  { label: 'BRB', emoji: '⏳', busy: true },
];

let tray: Tray | null = null;
let currentStatus: GatherStatus = 'Active';
let onSetStatus: ((preset: StatusPreset) => void) | null = null;
let onClearStatus: (() => void) | null = null;

function loadIcon(status: GatherStatus): Electron.NativeImage {
  const name = status === 'Active' ? 'tray-active' : 'tray-busy';
  const icon = nativeImage.createEmpty();
  const img1x = nativeImage.createFromPath(path.join(assetsDir, `${name}.png`));
  const img2x = nativeImage.createFromPath(path.join(assetsDir, `${name}@2x.png`));
  icon.addRepresentation({ scaleFactor: 1.0, buffer: img1x.toPNG() });
  icon.addRepresentation({ scaleFactor: 2.0, buffer: img2x.toPNG() });
  return icon;
}

export function createTray(
  getWindow: () => BrowserWindow | null,
  callbacks: {
    onSetStatus: (preset: StatusPreset) => void;
    onClearStatus: () => void;
  }
): void {
  onSetStatus = callbacks.onSetStatus;
  onClearStatus = callbacks.onClearStatus;

  tray = new Tray(loadIcon(currentStatus));
  tray.setToolTip(`Gather – ${currentStatus}`);

  updateContextMenu(getWindow);

  tray.on('click', () => {
    const win = getWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });
}

function updateContextMenu(getWindow: () => BrowserWindow | null): void {
  if (!tray) return;

  const statusItems = STATUS_PRESETS.map((preset) => ({
    label: `${preset.emoji}  ${preset.label}`,
    click: () => onSetStatus?.(preset),
  }));

  const menu = Menu.buildFromTemplate([
    {
      label: `Status: ${currentStatus}`,
      enabled: false,
    },
    { type: 'separator' },
    ...statusItems,
    { type: 'separator' },
    {
      label: 'Clear Status',
      click: () => onClearStatus?.(),
    },
    { type: 'separator' },
    {
      label: 'Show Gather',
      click: () => {
        const win = getWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
}

export function updateTrayStatus(
  status: GatherStatus,
  getWindow: () => BrowserWindow | null
): void {
  if (!tray || status === currentStatus) return;
  currentStatus = status;
  tray.setImage(loadIcon(status));
  tray.setToolTip(`Gather – ${status}`);
  updateContextMenu(getWindow);
}
