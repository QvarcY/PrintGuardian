# PrintGuardian desktop host

Status: **Tauri 2 Windows desktop shell, Portable/Installed builds and distribution-aware storage are implemented; dev.14 storage behavior still requires runtime verification.**

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

Starting in dev.14, the Rust host creates the WebView window itself and sets the WebView2 `data_directory` before the frontend starts. This means the existing React/localStorage persistence automatically follows the distribution mode rather than sharing the default WebView storage location.

Portable uses:

```text
<folder containing PrintGuardian Portable.exe>\PrintGuardianData\WebView2\
```

The `PrintGuardianData` root is marked hidden on Windows so normal users are not presented with browser/cache internals. If that directory cannot be created, the host falls back to the application Local AppData directory and reports `portable-fallback` through `runtime_info`. The UI must show that state rather than claiming full portability.

Installed uses Tauri's application-specific Local AppData directory, which also matches the NSIS app-data cleanup contract. See [`PORTABLE_STORAGE.md`](PORTABLE_STORAGE.md) for the full verification matrix.

## Updates

Dev.14 includes the first desktop **Update Centre** and a narrowly scoped GitHub Releases metadata check. It can report version/channel/distribution state, run manual/periodic metadata checks and simulate an update notification in development builds.

The Tauri updater plugin is intentionally **not enabled yet**. Automatic Installed updates still require a real signing key, signed updater artifacts and invalid-signature rejection tests. Portable updates remain notification/download guidance rather than installer-style self-update.
