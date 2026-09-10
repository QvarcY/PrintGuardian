# PrintGuardian — Product foundation v0.1

## Product promise
Inspect, explain, compare and safely repair 3D-print project files before the user sends them to a printer.

## Initial supported inputs
- `.3mf`
- `.gcode`
- `.bgcode` (planned parser after 3MF/G-code foundation)

## MVP modules
1. 3MF Inspector
2. Profile / setting diff
3. Selective 3MF Cleaner
4. Safe 3MF Export
5. Local project report

## Localization rule
The application UI is bilingual: Latvian and English.

**Slicer setting names and slicer section names remain in English in both modes.**
Examples: `Wall loops`, `Max volumetric speed`, `Sparse infill density`, `Prime tower`.

Why: the user must be able to find the same term immediately in Bambu Studio, OrcaSlicer or another slicer.

Hover / focus explanation follows the selected PrintGuardian language:
- LV mode → Latvian explanation
- EN mode → English explanation

Each advanced setting explanation should answer:
- What does it do?
- What usually happens when the value is increased?
- What usually happens when the value is decreased?
- Optional later: why PrintGuardian flagged it in this project.

## Privacy principle
Default to local processing. A print project should not need to leave the user's computer for ordinary inspection.

## Author identity
PrintGuardian
Created by CraftIN / QvarcY
- kas.id.lv
- craftin.lv
- GitHub: QvarcY

Copyright © 2026 CraftIN / QvarcY (kas.id.lv)

## Project support

Optional project support is exposed through the official CraftIN Buy Me a Coffee page:
- https://buymeacoffee.com/craftin

The CTA must remain secondary to the product workflow and must never block or gate local inspection features.


## Local reference profile — My print profile

PrintGuardian may persist a user-selected trusted print reference locally. Internally this is still the baseline model, but the normal UI calls it **My print profile / Mans drukas profils** because users should not need to understand the implementation concept. The stored record is intentionally minimal: printer/process metadata, selected slicer settings, derived Print DNA values and the small raw-value map needed for supported Builder substitutions. The source 3MF binary is not persisted. The UI must never label the reference as certified-safe; it is a user-selected reference for change detection and supported value reuse.

## Primary interaction model

The default screen must answer the user's real questions in order:

1. Can PrintGuardian see an obvious reason not to continue?
2. What should I review before printing?
3. What does each relevant setting mean in the real print?
4. Which values can PrintGuardian safely replace with values from my trusted setup?

Technical Profile Diff and archive-level diagnostics belong under advanced tools, not in the normal path.

## Project Workspace information architecture

The primary project interface is tabbed by meaning: **Overview, Printer, Material, Print settings, Model & Supports, Advanced**. A tab badge represents unresolved state and must not disappear simply because the user viewed the tab. Supported setting edits use type-aware controls, while high-impact manual edits require an explicit acknowledgement. Prepared changes remain visible in a sticky action bar across tab navigation.
