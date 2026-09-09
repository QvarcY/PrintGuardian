# PrintGuardian

> [!WARNING]
> **Active development / Aktīva izstrāde**  
> PrintGuardian is **pre-release software**. The current 3MF Inspector is experimental, inspection rules are still being expanded, and no result should yet be treated as a guarantee that a print is safe or will succeed.


**Know before you print.**

PrintGuardian is a bilingual (Latvian / English) 3D-print project inspector by **CraftIN / QvarcY**.

The current development branch is **v0.3.0-dev.7**. The core parser, Profile Diff, local reference profile, decision-plan model and verified experimental 3MF export remain in place, but the primary workflow is now **guided-first**: load a project, see a plain-language verdict, set up a trusted print profile once, and review important differences directly on the main screen.

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


### v0.3-dev Guided Review + Advanced Profile Diff

- the default screen now automatically guides the user through project checks and trusted-profile comparison without requiring them to discover a Compare workflow;
- a trusted 3MF can be selected once as **My print profile** directly from the main review flow;
- future projects are compared against that profile automatically;
- important differences appear as plain-language review cards with **In this project / In my profile** values and clear actions;
- safely rewritable values can be selected directly with **Use my value**, while unsupported compound changes remain explained but intentionally non-editable;
- the primary **Review & Prepare** action scrolls directly to the relevant workflow instead of acting as a dead button;
- the old technical Profile Diff remains available under **Advanced tools** for users who want raw comparison detail;
- open **Advanced tools** to manually compare a second `.3mf` file;
- select a second `.3mf` file;
- compare `Printer profile`, `Nozzle diameter`, `Build plate` and `Process profile`;
- compare the important slicer settings currently extracted by PrintGuardian;
- distinguish unchanged values, changed values and values missing from one file;
- prioritize changed values with low / medium / high impact labels;
- default to a differences-only view, with **High impact only** and full comparison filters available on demand;
- classify known differences into lightweight categories such as compatibility, adhesion, quality, strength and material flow;
- show localized "why it matters" explanations while keeping slicer-native names in English;
- show directional guidance for known higher/lower or enabled/disabled setting changes;
- show relative numeric deltas when both values use compatible units;
- overlay both experimental **Print DNA** signatures for a fast visual comparison;
- keep both comparison files local on the computer;
- save the currently loaded project profile as **My Baseline** in local browser storage;
- compare future 3MF projects directly against that saved baseline without re-opening the reference file;
- replace or remove the baseline from the comparison screen;
- store only extracted profile metadata/settings, Print DNA values and a small Builder raw-value map — never the 3MF file itself.
- when comparing against **My Baseline**, review each changed value and choose **Keep project value** or **Use baseline value**;
- persist those choices locally as a scoped decision-plan draft tied to the exact current-vs-baseline comparison;
- automatically ignore a saved draft when the comparison context no longer matches;
- show a profile-level **before / after report** with planned baseline substitutions, retained project values, unresolved items and high-impact planned changes;
- map supported baseline choices to the concrete `project_settings.config` keys already present in the current project;
- build a modified `project_settings.config` copy **in memory** and verify that the source object remains untouched;
- validate that the preview JSON serializes/parses and show before/after fingerprints;
- deliberately block compound printer/nozzle/plate/process metadata and filament-indexed flow values until safer rewrite rules exist;
- rebuild a **new** 3MF archive for eligible supported substitutions without overwriting the source file;
- reopen the rebuilt archive locally before download and verify archive-entry order/count, non-target entry contents, replacement JSON, requested mutations and core inspection counts;
- name the result with a `-printguardian.3mf` suffix;
- block export when any selected baseline substitution is unresolved or intentionally unsupported;
- keep compound machine/profile metadata and filament-indexed flow values blocked until safer rewrite semantics exist;
- treat this as **structural PrintGuardian verification**, not proof that Bambu Studio / OrcaSlicer will accept every real-world project and not a guarantee that the print will succeed.

Profile Diff still treats a changed value as a **fact, not an automatic error**. The impact label is a prioritization aid, not a safety verdict.

**My Baseline is also not a safety certification.** It is a user-selected local reference that helps answer “what changed from the profile I trust?” faster.

## Important current limitation

PrintGuardian intentionally no longer presents a numeric “100/100” style safety score. The main verdict reports what was actually checked and clearly marks missing analysis coverage. Geometry-level overhang/bridge/island analysis and full G-code safety inspection are not connected yet, so even a clean basic verdict is **not** a guarantee that a print will succeed.

## Architecture target

- **Desktop shell:** Tauri 2
- **Frontend:** React + TypeScript
- **Localization:** i18next / react-i18next
- **Analysis engine:** currently TypeScript proof-of-concept, hardened Rust engine planned for the desktop build
- **Default data policy:** local processing
- **Desktop updates:** signed Tauri updater flow with opt-in installation and Stable / Beta channels planned before v1.0

Updater design notes are tracked in [`docs/UPDATER.md`](docs/UPDATER.md). The current browser prototype does **not** self-update.


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
