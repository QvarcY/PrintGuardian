# PrintGuardian desktop storage model

Status: **implemented for v0.3.0-dev.14 and awaiting Windows runtime verification**.

PrintGuardian uses the same localStorage-based React persistence APIs in both Windows distributions, but the desktop host now chooses a different WebView2 data directory before the UI starts. This keeps existing print-profile/settings code simple while making the storage location distribution-aware.

## Portable edition

The Portable build creates its WebView2/localStorage data beside the executable:

```text
<extracted PrintGuardian folder>\
  PrintGuardian Portable.exe
  PrintGuardianData\
    WebView2\
```

`PrintGuardianData` is marked hidden on Windows after it is created so normal users are not presented with WebView/cache internals. The user should copy/move the **whole extracted PrintGuardian folder**, not only the EXE, when they want their Portable profiles/preferences to move with the application.

If the executable directory is not writable, PrintGuardian does not crash. It falls back to the normal Windows Local AppData application directory and exposes `portable-fallback` through `runtime_info`. The UI must make that loss of true portability visible.

## Installed edition

The Installed build uses Tauri's application-specific Local AppData directory. This intentionally matches the normal Tauri/WebView2 storage scope and the existing NSIS uninstall data-cleanup path.

Installed and Portable builds therefore do not intentionally share profiles/preferences:

- Installed data stays in Windows Local AppData;
- Portable data stays with that extracted Portable folder;
- uninstalling the Installed edition does not delete data belonging to a separate Portable copy.

## What is stored

The storage location can contain WebView2 runtime/cache internals plus PrintGuardian browser storage. PrintGuardian currently persists small application state such as:

- interface language and scale;
- named print-profile snapshots (not the original 3MF files);
- comparison/builder decision state;
- update-check preferences and cached release metadata;
- future history/preferences as those features are implemented.

PrintGuardian does not copy the source 3MF into persistent storage merely because it was inspected.

## Runtime verification before preview.1

Portable verification must prove:

1. launch Portable from a clean extracted folder;
2. add a print profile and change at least one preference;
3. close PrintGuardian;
4. confirm `PrintGuardianData` was created beside the EXE (enable hidden-items view only for this test);
5. reopen and confirm the profile/preference remains;
6. move/copy the **whole folder** to another writable directory;
7. reopen there and confirm the same data remains;
8. launch the Installed edition and confirm it does not automatically inherit the Portable profile;
9. test a deliberately non-writable Portable location and confirm the UI reports the fallback instead of silently claiming full portability.

## Recent project resume

The current development build may keep one local copy of the last successfully inspected 3MF so the landing screen can offer **Continue previous project** after restart. The copy is stored through IndexedDB inside the same WebView2 data root as the rest of the desktop state:

- Portable: inside `PrintGuardianData\\WebView2` next to the executable;
- Installed: inside the Installed edition's Local AppData WebView data directory.

The user can remove this cached copy from the landing screen. Invalid/unreadable 3MF files are not cached. This is not the future multi-project History feature; it is a single-project convenience cache only.
