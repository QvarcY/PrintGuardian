# PrintGuardian updater architecture

Status: **release notification is enabled for preview.1; automatic Installed updates are deliberately deferred while public builds remain unsigned**.

The Windows desktop application has a real Update Centre that checks the public PrintGuardian GitHub Releases metadata feed, extracts concise release highlights and provides distribution-specific update handoff guidance. The browser `preview.html` still does not self-update. Actual Installed update installation remains disabled in the unsigned public preview. Updates are announced in-app, then handed off to the official GitHub release for a manual install/replacement.

## One update experience, two distribution modes

PrintGuardian will expose one user-facing **Update Centre**, but it must know whether the running build is **Installed** or **Portable**.

Both desktop modes now:

1. check the public GitHub Releases metadata feed at a conservative interval;
2. show a non-blocking “update available” notification;
3. show release notes when a release provides them;
4. offer a manual **Check for updates** action;
5. keep update checking separate from print-file analysis and telemetry.

Development (`-dev.*`) builds include an explicit **test notification** action. Public `preview.*` builds do not expose that simulator.

The action after the notification differs by distribution mode.

### Installed build

A later signed release may use Tauri 2's signed updater flow. Tauri requires updater signatures; signature verification cannot be disabled. Because `preview.1` is intentionally unsigned, PrintGuardian does not enable automatic Installed update execution in this release.

Expected behavior:

- show update + release notes;
- open the official GitHub release on explicit user action;
- let the user run the newer installer manually over the existing installation;
- keep automatic execution disabled until a future trusted-signing design is implemented and tested.

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

- update discovery uses the official GitHub Releases API over HTTPS;
- public preview automatic Installed execution is disabled;
- release checksums are published for manual artifact verification;
- if automatic updater execution is added later, it must require verified signatures and keep private signing credentials outside the repository.

## GitHub Releases target

The first public preview uses GitHub Releases as the update-discovery backend. The human-facing Windows x64 ZIP is the update target for both distribution modes; Portable replaces its EXE while keeping `PrintGuardianData`, and Installed users run the newer installer manually. Signed updater manifests/assets are deferred.

## Privacy

Update checking is separate from project analysis. PrintGuardian must not upload 3MF contents, model geometry, slicer settings, print profiles, filament data or local project history to check for a new version.

Only information needed to resolve a compatible release should be sent, such as current application version, target operating system/architecture and update channel where required.

## UI target

The Preview Update Centre shows:

- installed version;
- distribution type: Portable / Installed;
- update channel;
- automatic check preference;
- last successful check time;
- current update state;
- release notes and “what's new” feature announcements;
- **Check for updates**;
- an action appropriate to the current distribution type.

The current public-preview action opens the official release/download surface. Automatic in-app installation is deliberately not part of the unsigned preview. No forced silent installation is planned for the default experience.

## Implementation checkpoints

- [x] scaffold Tauri 2 desktop shell;
- [x] expose Installed / Portable distribution mode to the UI;
- [x] add Update Centre UI, GitHub Releases metadata checks and development notification simulation;
- [x] add release-note highlight extraction and explicit Portable/Installed manual update handoff guidance;
- [x] add persistent post-update feature discovery and verify the first Soon → NEW target in source (History);
- [x] keep `v0.3.0-preview.1` update execution manual while binaries are unsigned;
- [x] provide explicit Portable replacement guidance that preserves `PrintGuardianData`;
- [x] provide explicit Installed guidance to run the newer official installer manually;
- [ ] publish the first GitHub Preview release and verify the real release-discovery path from an older build;
- [ ] verify the published Portable update notification opens the Windows x64 ZIP rather than the installer;
- [ ] verify the published Installed update notification opens the official release page;
- [ ] if trusted signing is introduced later, evaluate `tauri-plugin-updater`, signing keys and invalid-signature rejection before enabling automatic execution.
