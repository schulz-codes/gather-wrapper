# gather-wrapper

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
