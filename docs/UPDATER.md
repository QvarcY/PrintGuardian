# PrintGuardian updater architecture

Status: **planned foundation — not connected in the current web/React prototype**.

The updater becomes active when PrintGuardian is packaged as the planned Tauri 2 desktop application. The current browser prototype must never pretend that it can self-update.

## Product behavior

Default behavior:

1. PrintGuardian checks for updates in the background at most once per day.
2. If a newer compatible release exists, the UI shows a non-blocking update card.
3. Release notes are shown before installation.
4. Download and installation happen only after explicit user action.
5. The application restarts after a successful installation.

A manual **Check for updates** action is always available from About / Updates.

## Channels

Planned channels:

- **Stable** — default for normal users.
- **Beta** — opt-in for users who want early builds and are willing to report regressions.

Development builds are not automatically offered to Stable users.

## Security model

PrintGuardian will use the Tauri 2 updater signature verification flow.

- The updater public key is embedded in the packaged application configuration.
- Release artifacts are signed with the private updater key.
- The private key must never be stored in the repository.
- Unsigned or invalidly signed updates are rejected.
- Production update endpoints use HTTPS.

The updater key is separate from ordinary GitHub authentication credentials.

## GitHub Releases target

The initial release backend can be GitHub Releases with a static updater JSON manifest.

Expected release assets for Windows include the installer/update bundle, its signature, and a `latest.json` manifest containing the version, release notes, platform URL and signature.

Stable and Beta can later use separate manifests/endpoints if needed.

## Privacy

Update checking is separate from project analysis.

PrintGuardian must not upload:

- 3MF contents;
- model geometry;
- slicer settings;
- printer profiles;
- filament data;
- local project history.

The update request should contain only what is required to resolve a compatible release (for example application version, target OS and architecture as required by the updater endpoint).

## UI target

About / Updates should eventually show:

- installed version;
- update channel;
- automatic update-check preference;
- last successful check time;
- current update state;
- release notes when an update is available;
- **Check for updates**;
- **Update now** / **Later** when applicable.

No forced silent installation is planned for the default experience.

## Implementation checkpoints

- [ ] scaffold Tauri 2 desktop shell;
- [ ] add `tauri-plugin-updater`;
- [ ] enable updater capability permissions;
- [ ] generate and securely archive updater signing keys;
- [ ] enable updater artifacts in Tauri bundle configuration;
- [ ] create Stable GitHub Release manifest flow;
- [ ] add About / Updates UI;
- [ ] add Beta channel routing;
- [ ] add release-note display;
- [ ] verify Windows install/update/restart path;
- [ ] test invalid-signature rejection before first public stable build.
