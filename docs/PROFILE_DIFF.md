# Profile Diff — v0.3 development

## Goal

Make it immediately obvious which important printer, process and slicer values differ between two 3MF projects.

Profile Diff is deliberately factual at this stage: **different does not mean wrong**.

## Current comparison inputs

Both files are analyzed locally using the existing 3MF Inspector.

The first implementation compares:

- `Printer profile`
- `Nozzle diameter`
- `Build plate`
- `Process profile`
- `Layer height`
- `Wall loops`
- `Sparse infill density`
- `Enable support`
- `Brim width`
- `Max volumetric speed`

The setting names stay in English in Latvian and English application modes so they match Bambu Studio / OrcaSlicer terminology.

## States

Each row is classified as:

- **Same** — both inspected values are present and equal;
- **Changed** — both values are present but different;
- **Missing in one file** — only one project exposes the value at the current parser level.

A missing value is not automatically an error. 3MF projects can legitimately contain different metadata depending on slicer version, project state and how the file was exported.

## Next steps

- persistent user baseline / known-good profile;
- impact classification (quality, strength, speed, compatibility, adhesion, material flow);
- localized "why it matters" explanations for each change;
- Print DNA overlay;
- filters for only changed / high-impact values;
- exportable comparison report.
