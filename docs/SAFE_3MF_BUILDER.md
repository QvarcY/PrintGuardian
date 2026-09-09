# Safe 3MF Builder

## Current development stage

The full Safe 3MF Builder is **not implemented yet**. Starting with `v0.3.0-dev.3`, PrintGuardian contains a non-destructive decision preview that appears when the current project is compared with **My Baseline**.

For every detected difference the user can explicitly choose:

- **Keep project value**
- **Use baseline value**

Starting with `v0.3.0-dev.4`, those decisions are also stored as a **local, context-scoped draft** and can be restored when the exact same current-vs-baseline comparison is opened again. PrintGuardian also generates a profile-level before/after report from that draft.

Starting with `v0.3.0-dev.5`, PrintGuardian additionally captures a small raw-value map from `project_settings.config` and can generate an **in-memory rebuild preview**. The preview clones the current project settings object, maps only explicitly supported baseline choices to concrete existing keys, verifies that the source object was not mutated, serializes/parses the preview JSON, and reports blocked/unresolved substitutions. It still does **not** rebuild, sanitize, export, or claim to make a 3MF safe.

## Current mapping policy

The dev.5 preview is deliberately conservative. Simple scalar slicer settings such as `Layer height`, `Wall loops`, `Sparse infill density`, `Enable support` and `Brim width` can be mapped when the current project already contains the corresponding key and the baseline provides the same raw data type.

The following remain blocked in the preview:

- `Printer profile`, `Nozzle diameter`, `Build plate` and `Process profile` because changing one identifier without all coupled machine/profile data can create an inconsistent project;
- `Max volumetric speed` because the common Bambu/Orca representation is filament-indexed and must be aligned with material/AMS slots before rewriting.

Missing keys, missing raw baseline values and raw-type mismatches are treated as unresolved/blocked rather than invented or coerced.

## Why this exists before file rewriting

A reliable builder needs an explicit decision model before PrintGuardian starts changing project archives. This stage lets the UI and comparison semantics mature without risking source files.

## Safety rules for the future builder

1. Never overwrite the source 3MF by default.
2. Export to a new file and keep the original untouched.
3. Show exactly which values will come from the project and which will come from the local reference.
4. Treat missing values as unresolved rather than silently inventing replacements.
5. Validate the rebuilt archive structure before offering the output file.
6. Produce a before/after report.
7. Never label an exported file as guaranteed safe to print solely because metadata was sanitized.

## Planned next steps

- ✅ model decisions independently from the UI component;
- ✅ persist/restore a context-scoped draft decision plan;
- ✅ generate a profile-level before/after decision report;
- ✅ map supported decisions to concrete `project_settings.config` keys;
- ✅ generate an in-memory settings rebuild preview and verify source immutability / JSON validity;
- define which machine/AMS metadata can be replaced safely;
- preserve geometry, painting, supports and modifiers intentionally;
- create a new 3MF archive;
- validate integrity and generate a before/after report.
