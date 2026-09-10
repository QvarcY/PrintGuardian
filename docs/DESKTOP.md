# PrintGuardian desktop host

Status: **Tauri 2 desktop shell implemented in source; Windows binaries still require build verification.**

PrintGuardian uses one React/TypeScript UI and two Windows build flavors from the same source tree:

- **Portable** — a standalone `printguardian.exe` compiled with the Cargo feature `portable`;
- **Installed** — the normal Tauri Windows application bundled as an NSIS installer.

The application asks the Rust host for runtime information through the `runtime_info` command. This is intentionally compile-time distribution awareness rather than path guessing: a portable build reports `portable`, while the installer build reports `installed`.

## Development

Prerequisites on Windows:

- Node.js 22 or a compatible supported Node release;
- Rust stable (Tauri requires Rust 1.77.2 or newer for the plugins currently used);
- Microsoft C++ Build Tools / normal Tauri Windows prerequisites;
- Microsoft WebView2 runtime on the machine where the app runs.

Install dependencies, then launch the desktop host:

```powershell
npm install
npm run tauri:dev
```

The Tauri development window points at the Vite server on port 1420.

## Build the two Windows flavors

Portable only:

```powershell
npm run tauri:build:portable
```

This runs `tauri build --no-bundle --features portable`. The raw executable is expected at:

```text
src-tauri\target\release\printguardian.exe
```

Installed NSIS edition only:

```powershell
npm run tauri:build:installer
```

This runs the normal installed flavor and creates an NSIS setup executable under:

```text
src-tauri\target\release\bundle\nsis\
```

Build both and stage the clean user-facing folder:

```powershell
npm run package:windows
```

The script first copies the portable binary aside, then builds the installed flavor, then stages only the clear top-level user choices described in `DISTRIBUTION.md`.

## Distribution identity in the UI

Desktop builds display a small runtime badge in the top bar:

- `Portable · v...`
- `Installed · v...`

The browser-only `preview.html` does not show that badge. This lets development testers immediately confirm which executable they launched and will later let the Update Centre choose the correct update action.

## External links

Desktop external URLs such as Buy Me a Coffee are opened with Tauri's opener plugin rather than navigating the application webview. The capability allow-list is intentionally narrow and currently permits only PrintGuardian/CraftIN-related web destinations.

## Portable data

The Rust runtime already exposes the intended portable data location beside the executable:

```text
PrintGuardianData\
```

The current React persistence layer still uses browser/WebView local storage, so the application is **not yet declared fully portable for data persistence**. Moving settings, print profiles and history into an explicit desktop storage layer remains a release blocker and is tracked in `RELEASE_READINESS.md`.

## Updates

The updater plugin is intentionally **not enabled yet**. Updater signing requires a real signing key and a tested signed-artifact pipeline. The desktop shell and distribution-mode signal are now in place so the Update Centre can be added next without pretending unsigned development builds are production updaters.
