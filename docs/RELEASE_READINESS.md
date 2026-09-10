# PrintGuardian release readiness

Target: **v0.3.0-preview.1** (GitHub pre-release, Windows x64)

This document is the release gate. A public preview is created only when every **BLOCKER** below is closed. Feature expansion is paused while these checks are completed.

## Current status

| Gate | Status | Notes |
| --- | --- | --- |
| Project Workspace and core UX | PASS | Guided tabs, persistent attention badges, print profiles, supported manual edits and verified export flow are present. |
| Feature-release navigation lifecycle | PASS (source) / runtime verify dev.15 | History graduates from Soon to a real local feature and uses a persistent NEW marker for returning dev.14 users; Settings remains the next explicit Soon/Drīzumā destination. |
| Standalone development preview scope | PASS | The browser preview advertises only `.3mf`; G-code/BG-code remain roadmap items. |
| ZIP/3MF input hardening | PASS (initial) | Archive/file/entry/decompression limits, bounds checks, encryption/multi-disk/ZIP64 rejection and suspicious compression-ratio rejection are in place. |
| Synthetic Bambu-style fixtures | PASS | Both included fixtures are accepted by the hardened ZIP reader. |
| Distribution contract | PASS (design) | Portable + installed Windows package shape and update behavior are documented in `DISTRIBUTION.md`. |
| Tauri 2 desktop shell | PASS (source) | Tauri 2 host, Windows config, distribution-mode command and external-link capability are present. GitHub Actions has built the real Windows artifacts successfully. |
| Portable executable | PASS (build + maintainer smoke) | GitHub Actions produced `PrintGuardian Portable.exe`; maintainer verified demo/real 3MF loading, dedicated portable storage, recent-project resume, whole-folder move and separation from the Installed data scope on dev.14. |
| NSIS installer executable | PASS | GitHub Actions built dev.13 successfully; maintainer verified localized finish controls, Start Menu uninstall, Windows Installed apps uninstall, optional app-data deletion and clean reinstall. |
| Update Centre + distribution awareness | PARTIAL | Dev.15 adds release-highlight parsing, published-date display, persistent post-update feature discovery and explicit Portable/Installed update handoff guidance. A real published-release notification still needs runtime verification because no public PrintGuardian Release exists yet. |
| Portable data isolation + move test | PASS | Maintainer verified hidden `PrintGuardianData`, UI/profile persistence, recent-project resume, whole-folder move and separation behavior on dev.14. |
| Signed installed-update flow | BLOCKER | Tauri updater signing key/public key, artifacts and invalid-signature rejection must be tested before public auto-update is enabled. |
| Windows Authenticode signing | BLOCKER | Current development binaries show Unknown publisher / SmartScreen warnings. Choose signing path, sign exact public artifacts, timestamp and verify before preview.1. See `WINDOWS_SIGNING.md`. |
| React dependency lock | PASS | The CI-generated lock is committed and the subsequent Windows workflow passed using `npm ci`. |
| React production build | PASS (CI) / BLOCKER (maintainer) | GitHub Actions production build passes. `npm run build` still needs one successful run on the maintainer Windows machine before preview.1. |
| Real Bambu Studio 3MF matrix | BLOCKER | Test multiple real projects, including multi-plate and AMS/multi-filament examples. |
| Real OrcaSlicer 3MF matrix | BLOCKER | Test multiple real projects and confirm extracted values remain correct. |
| Export -> reopen in Bambu Studio | BLOCKER | Exported files must open normally and retain untouched project content. |
| Export -> reopen in OrcaSlicer | BLOCKER | Exported files must open normally and retain untouched project content. |
| Clean Windows portable test | PASS | Maintainer verified fresh-folder launch, local persistence, recent-project resume and whole-folder move behavior on the staged dev.14 Portable build. |
| Clean Windows installer test | PASS | Maintainer verified install, localized finish checkbox, Start Menu uninstall shortcut, Windows Installed apps uninstall, optional app-data deletion, full removal and clean reinstall on dev.13. |
| Clean top-level release layout | PASS (development artifact) | Generated artifact contains only Portable, Installer, checksums and START HERE. Final preview package still needs the chosen license file. |
| License choice | BLOCKER | Repository owner must explicitly choose the source/distribution license before publication. |
| Final release package + notes | PENDING | Build only after blockers above pass. |

## Real-file test matrix

Use [`REAL_FILE_TEST_LOG.md`](REAL_FILE_TEST_LOG.md) for compatibility testing. Do not use successful internal archive verification as a substitute for slicer acceptance testing.

Minimum before preview.1:

- 3 Bambu Studio projects: simple single-plate, multi-plate, AMS/multi-filament;
- 3 OrcaSlicer projects: simple single-plate, multi-plate/object-heavy, multi-filament;
- at least 2 exported copies reopened in Bambu Studio;
- at least 2 exported copies reopened in OrcaSlicer.

## Release sequence after all blockers pass

1. Freeze source at a release-candidate commit.
2. Run `npm run check:release`, `npm run build` and the Tauri Windows build.
3. Produce both portable and NSIS installer artifacts.
4. Stage the clean Windows release folder with `scripts/stage-windows-release.mjs`.
5. Perform clean-Windows smoke tests using those exact staged binaries.
6. Test real GitHub release notification behavior, then installed signature/install behavior and portable release/download behavior.
7. Update changelog/README/version to `v0.3.0-preview.1`.
8. Finish PR #1 and merge with a normal merge commit (no squash).
9. Tag the merge commit `v0.3.0-preview.1`.
10. Create a GitHub **pre-release**, attach the tested Windows ZIP plus updater assets, and publish limitations prominently.
