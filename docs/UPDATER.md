# PrintGuardian updater architecture

Status: **planned desktop implementation — not connected in the current browser preview**.

The updater becomes active only after PrintGuardian is packaged as the Tauri 2 desktop application. The current `preview.html` must never pretend that it can self-update.

## One update experience, two distribution modes

PrintGuardian will expose one user-facing **Update Centre**, but it must know whether the running build is **Installed** or **Portable**.

Both modes may:

1. check a release/version feed at a conservative interval;
2. show a non-blocking “update available” notification;
3. show release notes and newly available features;
4. offer a manual **Check for updates** action;
5. keep update checking separate from print-file analysis and telemetry.

The action after the notification differs by distribution mode.

### Installed build

The installed Windows build uses Tauri 2's signed updater flow. Tauri requires updater signatures; signature verification cannot be disabled. The release process therefore uses an embedded public key and a separately protected private signing key.

Expected behavior:

- show update + release notes;
- download/install only after explicit user action;
- reject unsigned/invalidly signed updater artifacts;
- use the tested NSIS updater artifact on Windows;
- restart only as part of the explicit update flow.

### Portable build

The portable edition must not silently launch an installer or convert itself into an installed copy.

Initial behavior:

- use the same version/feature feed for update availability;
- show the same “new version / new feature” notification UI;
- offer the newer **portable** package for download;
- clearly explain replacement/restart steps;
- add automatic self-replacement only after a dedicated implementation can safely replace a portable executable and preserve portable data.

Tauri's normal Windows updater artifacts are installer-oriented, so PrintGuardian does not treat the portable update path as identical to the installed path.

## Coming-soon markers and feature notifications

Preview builds intentionally keep selected planned destinations visible as **Soon / Drīzumā**. They are not dead controls: opening one shows that the feature is planned but unavailable in the current build.

This also gives the updater UI a concrete feature-announcement test case. Example lifecycle:

```text
v0.3 preview:  History  [DRĪZUMĀ]
new release:   Update available — “History is now available”
after update:  History  [NEW]
after user uses it: History
```

The `Soon` badge is therefore product-state information, not an unread-message badge.

## Channels

Planned channels:

- **Stable** — normal default after the product matures;
- **Beta / Preview** — opt-in/preview users willing to test earlier builds.

Development builds are never automatically offered to Stable users.

## Security model

- updater public key embedded in packaged application configuration;
- private updater key never stored in the repository;
- production update endpoint over HTTPS;
- signatures verified before installed-build update execution;
- release checksum published for human/manual verification as an additional distribution aid;
- invalid-signature rejection tested before auto-update is enabled publicly.

## GitHub Releases target

Initial release backend can use GitHub Releases with a static updater manifest for the installed build and the same release metadata for portable update notifications.

Windows release assets are expected to include the human-facing Windows ZIP, installed updater artifacts/signatures and the version manifest required by the desktop updater.

## Privacy

Update checking is separate from project analysis. PrintGuardian must not upload 3MF contents, model geometry, slicer settings, print profiles, filament data or local project history to check for a new version.

Only information needed to resolve a compatible release should be sent, such as current application version, target operating system/architecture and update channel where required.

## UI target

The future Update Centre should show:

- installed version;
- distribution type: Portable / Installed;
- update channel;
- automatic check preference;
- last successful check time;
- current update state;
- release notes and “what's new” feature announcements;
- **Check for updates**;
- an action appropriate to the current distribution type.

No forced silent installation is planned for the default experience.

## Implementation checkpoints

- [ ] scaffold Tauri 2 desktop shell;
- [ ] expose Installed / Portable distribution mode to the UI;
- [ ] add Update Centre UI and feature-state notifications;
- [ ] add `tauri-plugin-updater` for the installed build;
- [ ] generate and securely archive updater signing keys;
- [ ] enable signed updater artifacts in Tauri bundle configuration;
- [ ] implement/test portable update download + replacement guidance;
- [ ] create Preview/Beta GitHub Release manifest flow;
- [ ] verify Windows install/update/restart path;
- [ ] verify portable update-notification path does not invoke the installer;
- [ ] test invalid-signature rejection before first public updater-enabled build.
