# PrintGuardian

> [!WARNING]
> **Active development / Aktīva izstrāde**  
> PrintGuardian is **pre-release software**. The current 3MF Inspector is experimental, inspection rules are still being expanded, and no result should yet be treated as a guarantee that a print is safe or will succeed.


**Know before you print.**

PrintGuardian is a bilingual (Latvian / English) 3D-print project inspector by **CraftIN / QvarcY**.

The release-candidate branch is now prepared as **v0.3.0-preview.1**, the first public Windows x64 preview. It includes the Project Workspace, print-profile library, supported manual edits, comparison tools, verified experimental 3MF export, Portable/Installed builds, local project history and the Update Centre.

> [!IMPORTANT]
> **Windows SmartScreen / unsigned preview:** `v0.3.0-preview.1` is intentionally distributed without an Authenticode code-signing certificate. Windows may show **Windows protected your PC / Unknown publisher**. This reputation warning does not by itself mean malware was detected. Only run binaries downloaded from the official `QvarcY/PrintGuardian` GitHub Releases page and verify `CHECKSUMS.txt` when in doubt. Unsigned new builds may trigger the warning again. Signing may be revisited later if a suitable free/cost-effective route becomes available; no date is promised. See [`docs/WINDOWS_SIGNING.md`](docs/WINDOWS_SIGNING.md).

Public-preview compatibility testing is intentionally real-world driven: Bambu Studio and OrcaSlicer edge cases are expected to be reported by testers rather than treated as a prerequisite for claiming complete slicer coverage. The app therefore keeps its limitation language explicit and never equates a clean basic inspection with a print-safety guarantee.

The top bar includes a visible **Report / suggest** action beside Buy Me a Coffee. It opens a pre-filled GitHub issue for either a problem report or improvement idea and never attaches 3MF/profile contents automatically.

## Windows public preview

Official releases: **https://github.com/QvarcY/PrintGuardian/releases**

The Windows ZIP provides two user-facing choices:

- `PrintGuardian Portable.exe` — run without installing; local state stays in the hidden `PrintGuardianData` folder beside the EXE;
- `Install PrintGuardian.exe` — normal per-user Windows installation with Installed apps / Start Menu uninstall support.

The ZIP also contains `START HERE - SĀC ŠEIT.html` and `CHECKSUMS.txt`. Preview updates are currently manual: the in-app Update Centre announces a newer GitHub release, then Portable users replace the EXE while preserving `PrintGuardianData`, and Installed users run the newer installer over the existing installation.

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



### v0.3-dev.15 History + update notification UX

- turns **History** into the first real feature to graduate from **Soon / Drīzumā** to **NEW**, giving the post-update feature-discovery flow an actual end-to-end target;
- adds a bounded local history of up to 20 inspected 3MF project summaries without duplicating older source files;
- records useful context such as printer, nozzle, material, object/plate counts and attention-item count;
- clears the **NEW** marker only after the user actually opens History;
- keeps **Settings** visible as the next explicit Soon/Drīzumā feature for a future update-cycle test;
- improves GitHub Releases handling by extracting concise release highlights and showing publication metadata;
- gives Portable and Installed users different, explicit update handoff instructions instead of a generic release link;
- keeps the dev-only notification simulator, which now models the next dev.16 update so update-available UX can still be tested before a public release exists.

### v0.3-dev.14 Portable storage + Update Centre foundation

- creates the desktop WebView window from the Rust host so its data directory is chosen **before** React/localStorage starts;
- Portable keeps profiles/preferences/cache under a hidden `PrintGuardianData` directory beside the EXE, while Installed keeps the normal application-specific Windows Local AppData scope;
- exposes an explicit `portable-fallback` state if the Portable folder is not writable instead of falsely claiming full portability;
- adds a desktop Update Centre in the top bar with version, distribution, Preview/Stable channel, last check state and local storage location;
- checks only public PrintGuardian GitHub Releases metadata on a conservative interval and supports manual checks;
- adds a development-only update-notification simulator so the future **Soon → update notification → New** feature lifecycle can be tested before a release feed exists;
- keeps automatic Installed updates disabled until Tauri updater signing keys, signed artifacts and invalid-signature tests are complete;
- keeps the browser `preview.html` as a development/testing surface; distribution-aware storage and update checks are desktop-only.

See [`docs/PORTABLE_STORAGE.md`](docs/PORTABLE_STORAGE.md), [`docs/DESKTOP.md`](docs/DESKTOP.md) and [`docs/UPDATER.md`](docs/UPDATER.md).

### v0.3-dev.12 Tauri desktop shell + Windows build flavors

- added the real Tauri 2 desktop host under `src-tauri/` instead of treating the browser preview as the final application shell;
- added compile-time **Portable / Installed** distribution awareness so the application does not guess its mode from a Windows path;
- added dedicated Portable + NSIS build/staging commands and Windows GitHub Actions CI;
- established the external-link allow-list and Windows installer configuration used by later checkpoints.

### v0.3-dev.11 Release hardening + Windows distribution preparation

- keeps **History** and **Settings** visible with explicit **Soon / Drīzumā** badges; opening them shows an honest planned-feature surface instead of a dead destination;
- reserves those planned-feature surfaces for future update-notification testing such as announcing when a previously unavailable feature becomes available;
- advertises only `.3mf` as an implemented input format in the current UI;
- hardens the local ZIP/3MF reader with size/entry/decompression/bounds checks and explicit rejection of unsupported encrypted, multi-disk and ZIP64 archives;
- defines two Windows release choices: **PrintGuardian Portable.exe** and **Install PrintGuardian.exe**;
- defines a clean release-folder contract so normal users do not need to see or touch application internals;
- distinguishes installed-update behavior from portable-update behavior instead of pretending the two deployment types update identically;
- adds release-readiness, real-file test, security and Windows release-staging documentation/scripts.

The real Portable and NSIS builds now exist and have been maintainer-tested. Signed automatic updater installation remains deferred; `preview.html` remains a development/testing surface rather than the public Windows package.

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
