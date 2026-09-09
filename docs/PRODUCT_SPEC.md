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
