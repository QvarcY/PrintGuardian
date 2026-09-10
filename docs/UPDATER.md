# PrintGuardian updater architecture

Status: **release-notification + post-update feature-discovery UX implemented through dev.15; signed Installed updates are not yet enabled**.

The Windows desktop application has a real Update Centre that checks the public PrintGuardian GitHub Releases metadata feed, extracts concise release highlights and provides distribution-specific update handoff guidance. The browser `preview.html` still does not self-update. Actual Installed update installation remains disabled until the signed Tauri updater path is configured and tested.

## One update experience, two distribution modes

PrintGuardian will expose one user-facing **Update Centre**, but it must know whether the running build is **Installed** or **Portable**.

Both desktop modes now:

1. check the public GitHub Releases metadata feed at a conservative interval;
2. show a non-blocking “update available” notification;
3. show release notes when a release provides them;
4. offer a manual **Check for updates** action;
5. keep update checking separate from print-file analysis and telemetry.

Development builds also include an explicit **test notification** action. It creates a simulated next-version candidate locally and never pretends that a fake release was downloaded or signed.

The action after the notification differs by distribution mode.

### Installed build

The final installed Windows update path will use Tauri 2's signed updater flow. Tauri requires updater signatures; signature verification cannot be disabled. The release process therefore uses an embedded public key and a separately protected private signing key.

Expected behavior:

- show update + release notes;
- download/install only after explicit user action;
- reject unsigned/invalidly signed updater artifacts;
- use the tested NSIS updater artifact on Windows;
- restart only as part of the explicit update flow.

### Portable build

The portable edition must not silently launch an installer or convert itself into an installed copy.

Initial behavior:

- uses the same GitHub Releases metadata check for update availability;
- shows the same “new version / new feature” notification UI;
- opens the matching Windows x64 ZIP asset when one is published;
- clearly explain replacement/restart steps;
- add automatic self-replacement only after a dedicated implementation can safely replace a portable executable and preserve portable data.

Tauri's normal Windows updater artifacts are installer-oriented, so PrintGuardian does not treat the portable update path as identical to the installed path.

## Coming-soon markers and feature notifications

Preview builds intentionally keep selected planned destinations visible as **Soon / Drīzumā**. They are not dead controls: opening one shows that the feature is planned but unavailable in the current build.

This also gives the updater UI a concrete feature-announcement test case. Example lifecycle:

```text
dev.14:         History  [DRĪZUMĀ]
dev.15 launch:  “History is now available”
dev.15 sidebar: History  [NEW]
after user uses it: History
next cycle:     Settings [DRĪZUMĀ]
```

The `Soon` badge is therefore product-state information, not an unread-message badge.

## Channels

Planned channels:

- **Stable** — ignores GitHub pre-releases;
- **Preview** — accepts both GitHub pre-releases and stable releases. Development/prerelease builds default to Preview.

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

The dev.15 Update Centre now shows:

- installed version;
- distribution type: Portable / Installed;
- update channel;
- automatic check preference;
- last successful check time;
- current update state;
- release notes and “what's new” feature announcements;
- **Check for updates**;
- an action appropriate to the current distribution type.

The current action opens the public release/download surface; signed in-app installation is deliberately withheld until the updater security gates pass. No forced silent installation is planned for the default experience.

## Implementation checkpoints

- [x] scaffold Tauri 2 desktop shell;
- [x] expose Installed / Portable distribution mode to the UI;
- [x] add Update Centre UI, GitHub Releases metadata checks and development notification simulation;
- [x] add release-note highlight extraction and explicit Portable/Installed manual update handoff guidance;
- [x] add persistent post-update feature discovery and verify the first Soon → NEW target in source (History);
- [ ] add `tauri-plugin-updater` for the installed build;
- [ ] generate and securely archive updater signing keys;
- [ ] enable signed updater artifacts in Tauri bundle configuration;
- [ ] complete portable update download + replacement guidance (release-page/ZIP handoff foundation exists; replacement guidance still needs the first real release test);
- [ ] complete Preview GitHub Release flow (GitHub Releases discovery exists; signed updater manifest still pending);
- [ ] verify Windows install/update/restart path;
- [ ] verify portable update-notification path does not invoke the installer;
- [ ] test invalid-signature rejection before first public updater-enabled build.
