# PrintGuardian release readiness

Target: **v0.3.0-preview.1** (GitHub pre-release, Windows x64)

This document is the release gate. A public preview is created only when every **BLOCKER** below is closed. Feature expansion is paused while these checks are completed.

## Current status

| Gate | Status | Notes |
| --- | --- | --- |
| Project Workspace and core UX | PASS | Guided tabs, persistent attention badges, print profiles, supported manual edits and verified export flow are present. |
| Coming-soon navigation is explicit | PASS | History / Settings remain visible with Soon/Drīzumā markers and open an explanatory planned-feature surface instead of acting as dead controls. |
| Standalone development preview scope | PASS | The browser preview advertises only `.3mf`; G-code/BG-code remain roadmap items. |
| ZIP/3MF input hardening | PASS (initial) | Archive/file/entry/decompression limits, bounds checks, encryption/multi-disk/ZIP64 rejection and suspicious compression-ratio rejection are in place. |
| Synthetic Bambu-style fixtures | PASS | Both included fixtures are accepted by the hardened ZIP reader. |
| Distribution contract | PASS (design) | Portable + installed Windows package shape and update behavior are documented in `DISTRIBUTION.md`. |
| Tauri 2 desktop shell | PASS (source) | Tauri 2 host, Windows config, distribution-mode command and external-link capability are present. Windows compilation still needs to pass. |
| Portable executable | BLOCKER | Source build flavor exists; build and verify `PrintGuardian Portable.exe`. Portable data/storage behavior must still be deliberate and tested. |
| NSIS installer executable | BLOCKER | NSIS config/build command exists; build and verify the installer that becomes `Install PrintGuardian.exe`. |
| Update Centre + distribution awareness | PARTIAL | Desktop build now knows portable vs installed at compile time and exposes it to the UI; the actual Update Centre/check flow remains BLOCKER. |
| Signed installed-update flow | BLOCKER | Tauri updater signing key/public key, artifacts and invalid-signature rejection must be tested before public auto-update is enabled. |
| React dependency lock | BLOCKER | Successful `npm install`; commit `package-lock.json` and stop relying on unpinned resolution for a release build. |
| React production build | BLOCKER | `npm run build` must complete successfully on the maintainer Windows machine. |
| Real Bambu Studio 3MF matrix | BLOCKER | Test multiple real projects, including multi-plate and AMS/multi-filament examples. |
| Real OrcaSlicer 3MF matrix | BLOCKER | Test multiple real projects and confirm extracted values remain correct. |
| Export -> reopen in Bambu Studio | BLOCKER | Exported files must open normally and retain untouched project content. |
| Export -> reopen in OrcaSlicer | BLOCKER | Exported files must open normally and retain untouched project content. |
| Clean Windows portable test | BLOCKER | Exact staged portable executable must launch and operate from a fresh unpacked folder. |
| Clean Windows installer test | BLOCKER | Exact staged installer must install, launch and uninstall normally. |
| Clean top-level release layout | BLOCKER | Final release staging must contain only clear user-facing choices plus license/checksum/readme files. |
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
6. Test installed update notification/signature/install behavior and portable update-notification/download behavior.
7. Update changelog/README/version to `v0.3.0-preview.1`.
8. Finish PR #1 and merge with a normal merge commit (no squash).
9. Tag the merge commit `v0.3.0-preview.1`.
10. Create a GitHub **pre-release**, attach the tested Windows ZIP plus updater assets, and publish limitations prominently.
