# PrintGuardian

> [!WARNING]
> **Active development / Aktīva izstrāde**  
> PrintGuardian is **pre-release software**. The current 3MF Inspector is experimental, inspection rules are still being expanded, and no result should yet be treated as a guarantee that a print is safe or will succeed.


**Know before you print.**

PrintGuardian is a bilingual (Latvian / English) 3D-print project inspector by **CraftIN / QvarcY**.

The current development branch is **v0.3.0-dev.12**. Feature expansion is temporarily frozen while PrintGuardian is hardened for its first usable Windows preview. The existing Project Workspace, print-profile library, manual supported edits, comparison tools and verified experimental 3MF export remain in place.

Dev.12 adds the real **Tauri 2 desktop host source**, explicit **Portable / Installed** build flavors, runtime edition identity, native external-link handling and an automated Windows packaging/CI path. Windows binaries still require successful build and smoke-test verification before preview.1.

## Fastest way to test

Open `preview.html` in a modern Chromium-based browser and either:

- drop a real Bambu Studio / OrcaSlicer `.3mf` file into the window;
- click **Browse files**;
- or use the built-in demo project.

The standalone preview has no external runtime dependencies. A tiny synthetic smoke-test project is included at `fixtures/bambu-style-smoke-test.3mf`. A second synthetic project, `fixtures/bambu-style-profile-diff-test.3mf`, is included so the v0.3 Profile Diff can be tested with deliberately changed profile/settings values.

## React development UI

```powershell
npm install
npm run dev
```

The React source now uses the same real 3MF inspection model as the standalone preview.

## Current development capabilities

- local ZIP/3MF container reader;
- reads `Metadata/project_settings.config`;
- reads `Metadata/model_settings.config`;
- reads `Metadata/slice_info.config`;
- reads `3D/3dmodel.model`;
- detects printer/process/plate information where present;
- extracts filament palette information;
- extracts a first set of important slicer settings;
- counts objects, parts, plates and archive entries;
- displays a plain-language project verdict and explicit check coverage instead of a misleading numeric safety score;
- runs a first small ruleset for suspicious settings/metadata;
- generates a live Print DNA visualization from project values;
- LV / EN runtime language switching;
- slicer setting names remain in English in both languages;
- localized hover explanations for slicer settings;
- CraftIN / QvarcY author attribution.



### v0.3-dev.12 Tauri desktop shell + Windows build flavors

- adds the real Tauri 2 desktop host under `src-tauri/` instead of treating the browser preview as the final application shell;
- adds compile-time **Portable / Installed** distribution awareness so the application does not guess its mode from a Windows path;
- shows the running desktop edition and application version in the top bar, while the browser preview remains clearly separate;
- opens external support links through the Tauri opener plugin with an explicit allow-list instead of navigating the app webview;
- adds dedicated commands for `tauri:dev`, portable build, NSIS installer build and combined clean Windows package staging;
- adds a Windows GitHub Actions build job for the existing PR / manual CI path;
- adds Tauri window, CSP, NSIS current-user installer and bilingual installer configuration;
- keeps signed updater activation disabled until real signing keys and invalid-signature tests exist;
- keeps portable settings/profile persistence as a release blocker until the browser local-storage layer is replaced by deliberate desktop storage.

See [`docs/DESKTOP.md`](docs/DESKTOP.md) for the desktop build contract.

### v0.3-dev.11 Release hardening + Windows distribution preparation

- keeps **History** and **Settings** visible with explicit **Soon / Drīzumā** badges; opening them shows an honest planned-feature surface instead of a dead destination;
- reserves those planned-feature surfaces for future update-notification testing such as announcing when a previously unavailable feature becomes available;
- advertises only `.3mf` as an implemented input format in the current UI;
- hardens the local ZIP/3MF reader with size/entry/decompression/bounds checks and explicit rejection of unsupported encrypted, multi-disk and ZIP64 archives;
- defines two Windows release choices: **PrintGuardian Portable.exe** and **Install PrintGuardian.exe**;
- defines a clean release-folder contract so normal users do not need to see or touch application internals;
- distinguishes installed-update behavior from portable-update behavior instead of pretending the two deployment types update identically;
- adds release-readiness, real-file test, security and Windows release-staging documentation/scripts.

The Tauri desktop host source now exists in dev.12. The actual portable binary, NSIS installer, desktop storage behavior and signed updater flow are still **release blockers**. `preview.html` remains a development/testing surface, not the intended final public Windows package.

### v0.3-dev.10 Print Profiles + UX polish

- workspace tabs remain visible while entering **Advanced → Profile Diff**, so deeper diagnostics no longer replace the project navigation context;
- unit rendering is normalized to prevent duplicated suffixes such as `15%%`;
- **My print profiles** is now a real local library rather than a single opaque baseline: add, rename, select and remove several trusted 3MF-derived reference profiles;
- one profile is explicitly active and is used automatically for the current project comparison;
- legacy single-profile data is migrated when possible;
- the source 3MF files are still not stored in the profile library;
- Buy Me a Coffee support is deliberately more visible in the top bar and sidebar without becoming part of the print-safety workflow.

### v0.3-dev Project Workspace + Advanced Profile Diff

- the normal project view is split into predictable category tabs instead of one long page;
- **Overview** stays concise and shows the verdict, project identity, My print profile and attention summary;
- **Printer**, **Material**, **Print settings** and **Model & Supports** own the settings that belong to those categories;
- unresolved findings appear as persistent count bubbles beside the relevant tab and are not cleared merely by opening the tab;
- a trusted 3MF can be selected once as optional **My print profile / Mans drukas profils**; the underlying source 3MF is not persisted;
- future projects are compared with that profile automatically, while file analysis still works without a profile;
- supported scalar settings can be changed directly with type-aware controls such as integer steppers, bounded numeric/unit inputs and Enabled/Disabled choices;
- compatible values from My print profile can be applied when the Safe 3MF mapping layer can verify the concrete raw replacement;
- supported high-impact manual edits require an explicit acknowledgement before they enter the prepared-change plan;
- prepared profile/manual edits are stored locally and scoped to the exact current project + print-profile context;
- a sticky change bar keeps prepared-change count, unresolved attention, reset, review and verified new-3MF export visible across tabs;
- export remains a separate new file, never overwrites the source, and reopens/verifies the rebuilt archive before download;
- compound printer/nozzle/plate/process rewrites and filament-indexed flow values remain blocked until dedicated safe rewrite semantics exist;
- **Advanced** retains the technical two-file Profile Diff, raw-value/build-preview detail and Print DNA comparison for users who want to inspect implementation-level differences;
- slicer-native setting names stay in English in both languages while explanations are localized.

The internal storage/model may still use names such as `baseline` and decision context. Those are implementation details and are not prerequisites for normal use. The workspace design is documented in [`docs/PROJECT_WORKSPACE.md`](docs/PROJECT_WORKSPACE.md).

Profile Diff still treats a changed value as a **fact, not an automatic error**. The impact label is a prioritization aid, not a safety verdict.

**My print profile is not a safety certification.** It is an optional user-selected local reference that helps PrintGuardian explain how another project differs from the printer/settings the user trusts.

## Important current limitation

PrintGuardian intentionally no longer presents a numeric “100/100” style safety score. The main verdict reports what was actually checked and clearly marks missing analysis coverage. Geometry-level overhang/bridge/island analysis and full G-code safety inspection are not connected yet, so even a clean basic verdict is **not** a guarantee that a print will succeed.

## Architecture target

- **Desktop shell:** Tauri 2
- **Frontend:** React + TypeScript
- **Localization:** i18next / react-i18next
- **Analysis engine:** currently TypeScript proof-of-concept, hardened Rust engine planned for the desktop build
- **Default data policy:** local processing
- **Desktop updates:** signed Tauri updater flow with opt-in installation and Stable / Beta channels planned before v1.0

Updater design notes are tracked in [`docs/UPDATER.md`](docs/UPDATER.md), and the Windows package contract is tracked in [`docs/DISTRIBUTION.md`](docs/DISTRIBUTION.md). The current browser prototype does **not** self-update and is not the final public distribution format.


## Support the project

PrintGuardian is being developed as an independent CraftIN / QvarcY project. If the project is useful to you and you want to support continued development:

**☕ Buy Me a Coffee:** https://buymeacoffee.com/craftin

Support is optional and does not change the local-first design goal of PrintGuardian.

## Author

Created by **CraftIN / QvarcY**

- https://kas.id.lv
- https://craftin.lv
- GitHub: QvarcY

Copyright © 2026 CraftIN / QvarcY (kas.id.lv)
