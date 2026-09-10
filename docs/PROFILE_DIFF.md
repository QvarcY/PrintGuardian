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

## My Baseline

v0.3.0-dev.2 adds the first persistent comparison reference:

- the currently loaded 3MF inspection can be saved as **My Baseline**;
- the baseline survives page/app restarts through local storage;
- future projects can be compared against the saved baseline with one action;
- the baseline can be replaced or removed explicitly;
- only extracted printer/process metadata, selected slicer settings and Print DNA values are persisted;
- the original 3MF binary and geometry are **not** stored in the baseline record.

The baseline is intentionally described as a **reference**, not as “safe”, “approved” or “known-good” by PrintGuardian. The user chooses the reference and remains responsible for judging differences.

## Next steps

- baseline naming / multiple printer-specific baselines;
- exportable comparison report;
- richer setting coverage;
- user-selectable comparison categories.


## Safe 3MF Builder bridge — dev.6

When a project is compared against **My Baseline**, the decision plan now feeds an in-memory `project_settings.config` rebuild preview. Only explicitly supported scalar settings are mapped. Compound machine/profile metadata and filament-indexed values are intentionally blocked until dedicated rewrite rules exist. Starting in dev.6, fully mapped supported substitutions can also be rebuilt into a separate experimental 3MF, reopened locally and structurally verified before download. The source 3MF is never overwritten.
