# Changelog

PrintGuardian is under active development. Until v1.0, features and internal formats may change substantially.

## v0.3.0-dev — Profile Diff (in development)

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
- Decision choices are intentionally non-destructive and do not modify or export the source 3MF yet.

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
