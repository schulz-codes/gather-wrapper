---
'gather-wrapper': minor
---

Add menubar tray icon, custom status presets, and improved window management.

- Cmd+W now hides the window instead of closing it, keeping the Gather session alive; clicking the dock icon or tray icon restores the window
- Menubar tray icon shows Gather status using the project logo (green for Active, yellow for Busy) and updates automatically when the status changes manually in Gather
- Tray context menu with quick-set status presets (Lunch, AFK, In a Meeting, Focus, BRB) that set a custom status with 1h auto-clear via the Gather API
- External camera usage automatically sets "In a Meeting" custom status with Busy availability, cleared when the camera is released
- Auto-join on the prejoin screen so the app connects immediately on launch
- Screen sharing support via native macOS picker (requires Electron 41+)
- Upgrade Electron from v28 to v41
