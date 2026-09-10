# Changelog

PrintGuardian is under active development. Until v1.0, features and internal formats may change substantially.

## v0.3.0-dev — Profile Diff (in development)

- Added the real Tauri 2 desktop host source and Windows application configuration.
- Added separate Portable and Installed build flavors from the same source tree, with compile-time runtime identity instead of path heuristics.
- Added a desktop edition/version badge so testers can confirm which executable is running.
- Routed desktop external links through Tauri opener permissions rather than navigating the app webview.
- Added combined Windows flavor packaging and a Windows CI build workflow for the draft PR/manual runs.
- Configured the NSIS installer for current-user installation and English/Latvian language selection.
- Kept signed updater activation deliberately disabled until real updater keys and signature-failure tests are in place.

- Began pre-release hardening while intentionally freezing feature expansion.
- Kept History / Settings visible with explicit Soon / Drīzumā markers and made them open explanatory planned-feature surfaces instead of dead controls.
- Reserved coming-soon surfaces for future update-notification UX testing.
- Restricted advertised file input to the currently implemented `.3mf` path.
- Hardened ZIP/3MF parsing with archive size, entry count, decompression, bounds, encryption, multi-disk, ZIP64 and suspicious compression-ratio checks.
- Defined a clean Windows release package with separate `PrintGuardian Portable.exe` and `Install PrintGuardian.exe` user-facing choices.
- Defined distinct installed-vs-portable update behavior and added a release staging script that hides implementation clutter from the release root.
- Added release readiness, real-file compatibility and security documentation.

- Kept the Project Workspace tab rail visible when entering the technical **Profile Diff** view.
- Normalized rendered units so values that already contain `%`, `mm` or `mm³/s` are not decorated twice.
- Added a local named **My print profiles** library with add, rename, select-active and remove actions.
- Added migration from the earlier single print-profile/baseline storage model and retained temporary compatibility with Advanced/Profile Diff.
- Made the active print profile explicit and reusable across subsequently opened projects.
- Increased Buy Me a Coffee visibility with a dedicated top-bar support action and stronger sidebar treatment.
- Replaced the long single-page guided review with a category-based **Project Workspace** using Overview, Printer, Material, Print settings, Model & Supports and Advanced tabs.
- Added persistent tab attention bubbles that represent unresolved findings; opening a tab does not clear them.
- Reframed the old baseline concept as the optional user-facing **My print profile / Mans drukas profils**, while retaining baseline naming only as an internal implementation detail.
- Added type-aware manual editing for supported scalar settings, including integer, numeric-with-unit and boolean controls.
- Added persistent project-scoped manual/profile change plans so prepared edits survive navigation and are not applied to a different project/profile context.
- Added explicit acknowledgement before supported high-impact manual changes are accepted.
- Made setting impact intrinsic in the workspace, so a high-impact setting remains high-impact even when its original value happened to match the trusted profile.
- Added a sticky change bar with prepared-change count, unresolved-attention count, reset, review and verified new-3MF export actions.
- Kept technical Profile Diff and raw builder diagnostics under Advanced instead of mixing them into the normal workflow.
- Mirrored the tabbed workspace, attention-state behavior, print-profile setup, manual editors and sticky change workflow in standalone `preview.html`.
- Added persistent **Compact / Standard / Large** interface-size control in the top bar.
- Increased default body, explanation, sidebar, button, tooltip, settings, checklist and guided-review text sizes for normal reading distance.
- Increased contrast of secondary copy so explanations remain subordinate without becoming difficult to read.
- Allowed guided checklist detail text to wrap instead of silently truncating important status information.
- Applied the readability pass to Advanced/Profile Diff and Safe 3MF Builder views as well as the normal guided workflow.
- Mirrored the same interface-size preference and readable typography in standalone `preview.html`.
- Reworked the primary application UX around the user question “Can I print this, what should I review, and what can I safely change?” rather than around internal PrintGuardian concepts.
- Removed the prominent numeric project score from the main workflow and replaced it with a plain-language verdict plus explicit check coverage.
- Added a guided **My print profile** setup directly on the main screen using a trusted 3MF as the local reference source.
- Added automatic current-project vs trusted-profile comparison without requiring the user to enter a separate Compare mode.
- Added plain-language difference cards with current value, trusted profile value, impact explanation and direct **Keep / Use my value** decisions.
- Kept unsupported compound machine/profile rewrites visible and explained while disabling unsafe automatic replacement.
- Added a main-screen adjusted-copy flow that reuses the verified Safe 3MF export engine.
- Simplified sidebar navigation to user-oriented **Overview / Understand settings / Advanced tools**.
- Moved the technical Profile Diff workflow to Advanced tools instead of making it part of the normal path.
- Made the main Review & Prepare action functional and context-aware instead of leaving a disabled Safe 3MF button.
- Added an interactive two-file 3MF Profile Diff view.
- Added side-by-side comparison for printer, nozzle, build plate, process profile and extracted slicer settings.
- Added changed / same / missing comparison states.
- Added low / medium / high impact prioritization for differences.
- Added differences-only, high-impact-only and full comparison filters.
- Added numeric delta hints and directional setting guidance where values can be compared safely.
- Added lightweight comparison categories (compatibility, adhesion, quality, strength, material flow, process).
- Added a dual Print DNA overlay for visual project comparison.
- Added localized "why it matters" explanations without translating slicer-native setting names.
- Added local-only second-file analysis in React and the standalone preview.
- Added Buy Me a Coffee support CTA to the application and README.
- Kept slicer-native setting names in English while UI explanations remain localized.
- Added persistent **My Baseline** comparison reference using local browser storage.
- Added one-click comparison against the saved baseline plus explicit replace/remove actions.
- Baseline persistence stores only extracted profile metadata/settings and Print DNA values, never the source 3MF file.
- Kept the baseline explicitly framed as a user-selected reference rather than a safety guarantee.
- Added the first **Safe 3MF Builder decision preview** when comparing a project against My Baseline.
- Added per-difference **Keep project value / Use baseline value** choices with a live selection summary.
- Decision choices are intentionally non-destructive; the source 3MF is never modified, and export occurs only through the later explicit verified builder action.
- Extracted decision-plan persistence/report logic into a dedicated builder model.
- Added a context-scoped local decision draft that is restored only when the compared values still match the saved plan context.
- Added a profile-level before/after report with planned baseline substitutions, retained project values, unresolved choices and high-impact change counts.
- Added a concrete `project_settings.config` mapping layer for Safe 3MF Builder preview work.
- Added an in-memory rebuild preview that applies only explicitly supported baseline substitutions to a cloned project settings object.
- Added source-untouched and JSON serialize/parse integrity checks plus before/after fingerprints.
- Added deliberate blocking for compound machine/profile metadata and filament-indexed flow values until safer rewrite semantics are implemented.
- Baselines now retain a small raw-value map for Builder preview; the source 3MF itself is still never stored.
- Added the first experimental **verified 3MF export** for fully mapped supported substitutions.
- Rebuilds a separate archive and never overwrites the source 3MF.
- Reopens the generated archive before download and verifies entry structure, untouched non-target entry contents, the replaced `project_settings.config`, requested mutations and core inspection counts.
- Blocks export whenever a selected baseline substitution is unresolved or intentionally unsupported.
- Added a small local ZIP writer with CRC32 and Deflate/store output; ZIP64 remains intentionally unsupported at this stage.
- Export verification is structural/internal and is not a slicer acceptance or print-safety guarantee.

## v0.2.0 — Live 3MF Inspector

- Added local ZIP/3MF container reading.
- Added Bambu Studio / OrcaSlicer project metadata inspection.
- Added live printer, plate, process, filament and slicer-setting extraction.
- Added preliminary inspection warnings and Print DNA visualization.
- Added standalone browser preview using real `.3mf` files.
- Added synthetic Bambu-style smoke-test fixture.

## v0.1.0 — UI Foundation

- Established the PrintGuardian visual direction and design system foundation.
- Added Latvian / English runtime switching.
- Kept slicer setting names in English in both languages.
- Added localized hover explanations for slicer terminology.
- Added initial Drop Zone, Print Health, Profile Diff and Print DNA concepts.
- Added CraftIN / QvarcY attribution and project documentation.
