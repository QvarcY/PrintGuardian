# Windows distribution design

Status: **release requirement for v0.3.0-preview.1**.

PrintGuardian will ship two Windows x64 choices from the same source tree. The public release archive must be understandable without opening the repository or guessing which support file to run.

## User-facing package

The release ZIP should unpack to a folder whose top level contains only clear user-facing choices:

```text
PrintGuardian-v0.3.0-preview.1-Windows-x64/
├─ START HERE - SĀC ŠEIT.html
├─ PrintGuardian Portable.exe
├─ Install PrintGuardian.exe
└─ CHECKSUMS.txt
```

The `START HERE - SĀC ŠEIT.html` guide is a self-contained offline bilingual page with no CDN, remote stylesheet, font or script dependency. It explains SmartScreen, Portable vs Installed, local-data behavior, updates and feedback before the user launches an EXE. The staging script injects the release version into the guide from `VERSION`.

If an explicit project license is adopted later, staging may also add `LICENSE.txt`. No source files, JavaScript bundles, Rust build folders, DLL collections, package-manager files or other implementation details belong at the top level. If the final portable build ever requires companion runtime resources, they must be bundled into the executable where technically reasonable or placed in one clearly internal subdirectory created by the release packager. The preferred target is a single portable executable.

## Option 1 — Portable

`PrintGuardian Portable.exe`

- starts without an installation wizard;
- does not register an uninstall entry merely to run;
- keeps portable-specific WebView/localStorage data in a dedicated hidden `PrintGuardianData` location beside the executable when that location is writable;
- reports an explicit `portable-fallback` state and uses Windows Local AppData if the executable folder is not writable;
- passed the dev.14 move/reopen/separation maintainer test documented in `PORTABLE_STORAGE.md`;
- uses the same analysis engine and UI as the installed build.

The browser preview still uses ordinary browser storage, while the Windows Portable build redirects its WebView2/localStorage directory beside the EXE. The maintainer move/reopen/separation test has passed.

## Option 2 — Installed

`Install PrintGuardian.exe`

The installed build uses Tauri 2's Windows NSIS installer. Tauri supports Windows setup executables and MSI packages; PrintGuardian's primary friendly installer asset will be the NSIS `-setup.exe` renamed at release staging time to `Install PrintGuardian.exe`.

The default installation should be per-user unless testing shows a reason to require machine-wide installation. Per-user install avoids an unnecessary Administrator prompt for normal users.


## Uninstall contract

The installed edition must be removable without hunting through application files. The NSIS build writes a real `uninstall.exe` and registers PrintGuardian in Windows **Installed apps**. PrintGuardian also adds a Start Menu shortcut named `Uninstall PrintGuardian` for discoverability.

The uninstaller must remove the installed executable, installer-created shortcuts and uninstall registry entry. Its optional **Delete application data** checkbox is the explicit path for also removing PrintGuardian application data. The Latvian installer uses a project-owned Tauri custom-language file so this checkbox and the desktop-shortcut option never appear as blank controls.

For the public preview, install -> launch -> uninstall -> reinstall must be tested using the exact staged installer.

## WebView2

Tauri uses Microsoft WebView2 on Windows. Current Windows 10/11 systems commonly already provide it; the installer path can ensure the runtime is available. The exact Windows package is smoke-tested before publication. A missing/unsupported runtime must be reported clearly rather than failing silently.

## Update behavior by distribution type

Dev.14 introduces one desktop **Update Centre** visual model and a GitHub Releases metadata feed. Both editions can discover/describe newer releases; the action after a new version is found differs:

### Installed build

- notify non-intrusively that a newer version is available;
- show release notes;
- open the official GitHub release after user confirmation;
- let the user run the newer installer manually over the existing installation;
- keep automatic execution disabled while public preview binaries are unsigned.

### Portable build

- perform the same version check and show the same update notification;
- never silently turn itself into an installed build;
- initially offer a verified download of the newer portable package and clear replacement/restart instructions;
- automatic safe self-replacement may be added only after it has a dedicated tested implementation.

This distinction is intentional. Tauri's standard Windows updater artifacts are installer-oriented, so the portable update path must not pretend to be the same thing.

## Coming-soon feature markers

Visible `Drīzumā / Soon` destinations are intentionally retained in development and preview builds. They serve two purposes:

1. users can see the planned product structure without mistaking the feature for completed functionality;
2. the same surfaces can be used to test future update notifications such as “History is now available”.

A coming-soon entry must never be a dead control. Opening it shows an explicit planned-feature panel and explains that the feature is not part of the current build.

## Release staging

`scripts/stage-windows-release.mjs` creates the clean user-facing directory from already-built portable and installer artifacts. It deliberately refuses to invent or substitute missing executables.

The release stage is packaging only. It is not evidence that either executable works; both exact staged files still require clean-Windows smoke tests before GitHub publication.
