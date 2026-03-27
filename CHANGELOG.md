# gather-wrapper

## 0.3.0

### Minor Changes

- [`91246d0`](https://github.com/schulz-codes/gather-wrapper/commit/91246d05da0b6e679901c9ca3995d26834e6d9a5) Thanks [@takethefake](https://github.com/takethefake)! - Add menubar tray icon, custom status presets, and improved window management.

  - Cmd+W now hides the window instead of closing it, keeping the Gather session alive; clicking the dock icon or tray icon restores the window
  - Menubar tray icon shows Gather status using the project logo (green for Active, yellow for Busy) and updates automatically when the status changes manually in Gather
  - Tray context menu with quick-set status presets (Lunch, AFK, In a Meeting, Focus, BRB) that set a custom status with 1h auto-clear via the Gather API
  - External camera usage automatically sets "In a Meeting" custom status with Busy availability, cleared when the camera is released
  - Auto-join on the prejoin screen so the app connects immediately on launch
  - Screen sharing support via native macOS picker (requires Electron 41+)
  - Upgrade Electron from v28 to v41

## 0.2.8

### Patch Changes

- [`eb48031`](https://github.com/schulz-codes/gather-wrapper/commit/eb48031214723ec2e9a65f6975876fb85702be19) Thanks [@takethefake](https://github.com/takethefake)! - fix: repackage ZIP after ad-hoc signing so distributed app contains entitlements

## 0.2.7

### Patch Changes

- [`5fc2a3b`](https://github.com/schulz-codes/gather-wrapper/commit/5fc2a3bd5e044cdc5606585637abc3cced8439c6) Thanks [@takethefake](https://github.com/takethefake)! - fix: ad-hoc sign app with camera/microphone entitlements so macOS shows privacy prompts

## 0.2.6

### Patch Changes

- [`84ed26e`](https://github.com/schulz-codes/gather-wrapper/commit/84ed26e102ad10259968e9e928e4af7eb2f0cd5e) Thanks [@takethefake](https://github.com/takethefake)! - dev: add event debug logging, main-process console forwarding to DevTools, and fix permission loop

- [`47cd17e`](https://github.com/schulz-codes/gather-wrapper/commit/47cd17e84bd9e83ea120c941a3bfcb4ce2c21879) Thanks [@takethefake](https://github.com/takethefake)! - docs: add Homebrew installation and macOS Gatekeeper instructions to README

## 0.2.5

### Patch Changes

- [`84c8e8d`](https://github.com/schulz-codes/gather-wrapper/commit/84c8e8d8389da680cca6e6a02e5c585e0cb31ee0) Thanks [@takethefake](https://github.com/takethefake)! - fix: unpack native camera-check binary from asar archive so it can be executed in packaged app

## 0.2.4

### Patch Changes

- [`42062ae`](https://github.com/schulz-codes/gather-wrapper/commit/42062aeb0dcf6794a25d8853d3decd5b13f9a69d) Thanks [@takethefake](https://github.com/takethefake)! - Fix electron-builder auto-publish in CI by adding --publish never flag.

## 0.2.3

### Patch Changes

- [`8f65fb0`](https://github.com/schulz-codes/gather-wrapper/commit/8f65fb056f5efcc64346b7b6fb8f5e4a1d6b626d) Thanks [@takethefake](https://github.com/takethefake)! - Fix CI release pipeline to use version-diff check instead of changesets published output.

## 0.2.2

### Patch Changes

- [`82c1322`](https://github.com/schulz-codes/gather-wrapper/commit/82c1322729fcf1a6d074eeb0a3c51267746fd252) Thanks [@takethefake](https://github.com/takethefake)! - Fix CI release pipeline: unified workflow with correct changesets publish trigger and swiftc cross-compilation flags.

## 0.2.1

### Patch Changes

- [`ebcbd22`](https://github.com/schulz-codes/gather-wrapper/commit/ebcbd226b7b5d868c3a255f81d5657cbe7c45af6) Thanks [@takethefake](https://github.com/takethefake)! - Fix CI workflow: correct swiftc flags for universal binary cross-compilation and merge version + release into single workflow.

## 0.2.0

### Minor Changes

- [`2e2b50c`](https://github.com/schulz-codes/gather-wrapper/commit/2e2b50c6f963a4ab40330a92ceaa6fa738194ff9) Thanks [@takethefake](https://github.com/takethefake)! - Initial release of Gather desktop wrapper with camera auto-status sync.

  - Electron wrapper loading Gather v2 with spoofed Chrome user-agent
  - Native Swift binary using CoreMediaIO to detect active camera hardware
  - Automatic Gather status toggle: sets "Busy" when an external app uses the camera, "Active" when released
  - Gather game client integration via `gatherDev.PlayerManager` API
  - Homebrew Cask distribution via `schulz-codes/tap`
  - Changesets + GitHub Actions for automated versioning and releases
