# PrintGuardian release readiness

Target: **v0.3.0-preview.1** (GitHub pre-release, Windows x64)

This is the release gate for the first public testing build. `preview.1` is intentionally a real-world compatibility preview, not a claim of complete Bambu Studio / OrcaSlicer coverage or full print-safety analysis.

## Current status

| Gate | Status | Notes |
| --- | --- | --- |
| Project Workspace and core UX | PASS | Guided tabs, persistent attention badges, print profiles, supported manual edits and verified experimental export flow are present. |
| Feature-release navigation lifecycle | PASS | dev.14 → dev.15 runtime test confirmed update notice, History `NEW`, clearing on actual use and retained Portable state. |
| ZIP/3MF input hardening | PASS (initial) | Archive/file/entry/decompression/bounds checks, encryption/multi-disk/ZIP64 rejection and suspicious compression-ratio rejection are in place. |
| Synthetic Bambu-style fixtures | PASS | Both included fixtures pass the hardened ZIP/3MF smoke tests. |
| Tauri 2 desktop shell | PASS | Real Portable and Installed Windows builds are produced by GitHub Actions. |
| Portable executable | PASS | Maintainer verified real 3MF loading, dedicated portable storage, recent-project resume, whole-folder move and isolation from Installed data. |
| NSIS installer/uninstaller | PASS | Maintainer verified localized install, Start Menu uninstall, Windows Installed apps uninstall, optional data deletion and clean reinstall. |
| Update Centre | PASS for preview scope | GitHub Releases checks, Preview/Stable channels and manual Portable/Installed handoff exist. Automatic unsigned installation remains disabled. |
| Portable data persistence | PASS | `PrintGuardianData`, preferences/profile persistence, recent-project resume and folder-move behavior verified. |
| React dependency lock | PASS | `package-lock.json` is committed and CI uses `npm ci`. |
| React production build | PASS (CI) | GitHub Actions production build passes on the exact branch used for Windows packaging. |
| Windows Authenticode signing | ACCEPTED PREVIEW LIMITATION | `preview.1` is intentionally unsigned. SmartScreen/Unknown publisher is documented prominently in README, release notes and `START HERE`. See `WINDOWS_SIGNING.md`. |
| Signed automatic updater | DEFERRED | Not enabled in `preview.1`. Update Centre only announces/releases and hands off to manual replacement/install. |
| Real Bambu Studio compatibility matrix | PUBLIC PREVIEW TESTING | Maintainer real-file smoke tests passed; broader single/multi-plate, AMS and edge-case coverage is intentionally collected from preview users. |
| Real OrcaSlicer compatibility matrix | PUBLIC PREVIEW TESTING | Broader compatibility validation moves to testers; unsupported/incorrect cases should be reported through the in-app feedback action. |
| Export → reopen slicer matrix | PUBLIC PREVIEW TESTING | Verified export remains explicitly experimental; slicer acceptance reports are part of preview feedback. |
| Clean Windows portable test | PASS | Maintainer verified launch and persistence behavior on staged Windows builds. |
| Clean Windows installer test | PASS | Maintainer verified install/uninstall/reinstall behavior. |
| Feedback / issue reporting | PASS (source; runtime verify RC) | Visible `Report / suggest` action beside Buy Me a Coffee opens pre-filled GitHub problem/idea reports without attaching project contents. |
| SmartScreen explanation | PASS (source) | Public-preview reason, meaning, official-source requirement, checksum guidance and future-signing policy are documented. |
| Source reuse license | DEFERRED | No open-source reuse license is asserted by this preview gate. Copyright remains with the project owner until an explicit license is chosen. |
| Final preview release notes | PASS (draft) | `docs/releases/v0.3.0-preview.1.md` is ready to use as the GitHub pre-release description. |
| Exact preview.1 Windows artifact | PENDING CI + maintainer smoke | Build the release-candidate commit, test the exact ZIP, then merge/tag/publish it unchanged. |

## Public-preview test matrix

Compatibility testing continues **after** `preview.1` publication and should be recorded in [`REAL_FILE_TEST_LOG.md`](REAL_FILE_TEST_LOG.md). Reports should cover, where possible:

- Bambu Studio single-plate, multi-plate and AMS/multi-filament projects;
- OrcaSlicer simple, object-heavy/multi-plate and multi-filament projects;
- different printer/nozzle combinations;
- projects with and without supports;
- exported PrintGuardian copies reopened in the source slicer.

A successful internal archive verification is never a substitute for slicer acceptance or a print-safety guarantee.

## Release sequence

1. Freeze the `v0.3.0-preview.1` release-candidate commit.
2. Run `npm run check:release`, `npm run build` and the Windows Tauri package workflow.
3. Download the exact GitHub Actions Windows ZIP and smoke-test both Portable and Installer builds.
4. Verify the clean top-level package, SmartScreen wording, feedback button and checksums.
5. Mark PR #1 Ready for review.
6. Merge PR #1 to `main` with a normal merge commit (**no squash**).
7. Tag that merge commit `v0.3.0-preview.1`.
8. Create a GitHub **Pre-release** and attach the tested Windows ZIP unchanged.
9. Use `docs/releases/v0.3.0-preview.1.md` as the release-note foundation and keep the unsigned SmartScreen warning above the download instructions.
10. Collect real Bambu Studio / OrcaSlicer compatibility feedback through the in-app `Report / suggest` path and normal GitHub issues.
