# gather-wrapper

## 0.2.0

### Minor Changes

- [`2e2b50c`](https://github.com/schulz-codes/gather-wrapper/commit/2e2b50c6f963a4ab40330a92ceaa6fa738194ff9) Thanks [@takethefake](https://github.com/takethefake)! - Initial release of Gather desktop wrapper with camera auto-status sync.

  - Electron wrapper loading Gather v2 with spoofed Chrome user-agent
  - Native Swift binary using CoreMediaIO to detect active camera hardware
  - Automatic Gather status toggle: sets "Busy" when an external app uses the camera, "Active" when released
  - Gather game client integration via `gatherDev.PlayerManager` API
  - Homebrew Cask distribution via `schulz-codes/tap`
  - Changesets + GitHub Actions for automated versioning and releases
