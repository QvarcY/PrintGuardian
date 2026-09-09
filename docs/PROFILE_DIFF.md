# Profile Diff — v0.3 development

## Goal

Make it immediately obvious which important printer, process and slicer values differ between two 3MF projects.

Profile Diff is deliberately factual at this stage: **different does not mean wrong**. v0.3 now adds an **impact level** to help prioritize attention without pretending that every difference is a fault.

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

## Impact levels

Changed or missing values are also tagged as:

- **High impact** — printer/nozzle/build-plate/support/material-flow differences that can materially change compatibility or print behavior;
- **Medium impact** — process values such as layer height, wall count and brim that can significantly change the result;
- **Low impact** — differences worth knowing about but less likely to indicate a direct compatibility problem on their own.

Impact is **not a risk verdict**. It only tells the user where to look first.

The UI defaults to **Differences only**, with **High impact only** for fast triage and **Show all** for forensic comparison. Numeric changes with matching units also display a relative delta where possible. Known numeric/boolean settings can additionally show a localized directional effect (for example, what a higher or lower value commonly changes) without declaring the value right or wrong.

For known slicer settings, the original English setting name is preserved and the localized explanation is available from the info affordance. Latvian UI therefore still teaches the exact terminology the user will see in Bambu Studio / OrcaSlicer.

## Visual comparison

Profile Diff now overlays both **Print DNA** signatures and highlights the three largest axis deltas. This is intentionally marked experimental: Print DNA is a heuristic summary of selected parsed values, not a quality score or safety verdict.

Rows are also grouped with lightweight categories such as compatibility, adhesion, quality, strength, material flow and process.

## Next steps

- persistent user baseline / known-good profile;
- exportable comparison report;
- richer setting coverage;
- user-selectable comparison categories.
