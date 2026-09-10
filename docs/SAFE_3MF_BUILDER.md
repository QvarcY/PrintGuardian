# Safe 3MF Builder

## Current development stage

The full Safe 3MF Builder is **not stable yet**, but the first end-to-end supported path now exists. Starting with `v0.3.0-dev.7`, the normal user no longer has to discover a separate baseline/compare/decision sequence. In `v0.3.0-dev.9`, that guided flow is organized into the category-based **Project Workspace**, while the same comparison/build engine remains underneath.

For relevant settings the user can see the current project value and the trusted print-profile value. Where the raw mapping is proven safe, the user can reuse the print-profile value or enter a supported manual value with a type-aware editor. High-impact manual edits require explicit acknowledgement. Compound or unresolved changes remain visible and explained, but their automatic replacement control is disabled.

Starting with `v0.3.0-dev.4`, those decisions are also stored as a **local, context-scoped draft** and can be restored when the exact same current-vs-baseline comparison is opened again. PrintGuardian also generates a profile-level before/after report from that draft.

Starting with `v0.3.0-dev.5`, PrintGuardian additionally captures a small raw-value map from `project_settings.config` and can generate an **in-memory rebuild preview**. The preview clones the current project settings object, maps only explicitly supported baseline choices to concrete existing keys, verifies that the source object was not mutated, serializes/parses the preview JSON, and reports blocked/unresolved substitutions. Starting with `v0.3.0-dev.6`, PrintGuardian can also create a **new experimental 3MF export** when every selected substitution is mapped, no selected item is blocked/unresolved, and the real source 3MF is still available in memory. The source file is never overwritten.

## Current mapping policy

The mapping policy remains deliberately conservative. Simple scalar slicer settings such as `Layer height`, `Wall loops`, `Sparse infill density`, `Enable support` and `Brim width` can be mapped when the current project already contains the corresponding key. A My print profile replacement must provide the same raw data type; supported manual edits are coerced back to the current project's scalar raw type and validated against the editor range.

The following remain blocked in the preview:

- `Printer profile`, `Nozzle diameter`, `Build plate` and `Process profile` because changing one identifier without all coupled machine/profile data can create an inconsistent project;
- `Max volumetric speed` because the common Bambu/Orca representation is filament-indexed and must be aligned with material/AMS slots before rewriting.

Missing keys, missing raw baseline values and raw-type mismatches are treated as unresolved/blocked rather than invented or coerced.

## v0.3.0-dev.6 export verification

The first export path is intentionally strict:

1. serialize the in-memory `project_settings.config` preview;
2. rebuild a separate 3MF/ZIP archive;
3. reopen that generated archive locally;
4. verify that the archive entry names/order match the source;
5. verify byte-for-byte contents of every decompressed non-target entry;
6. verify the replacement JSON and each requested mapped mutation;
7. rerun the 3MF inspector and compare core object/part/plate/entry counts;
8. only then offer the generated `*-printguardian.3mf` download.

The current writer emits classic ZIP archives (Deflate when available, Store otherwise) and normalizes ZIP container metadata while preserving entry names and decompressed non-target contents. **ZIP64 and duplicate entry names are not supported yet.** Structural verification by PrintGuardian does not prove that every Bambu Studio / OrcaSlicer version will accept every exported real-world project, and it is not a print-safety certification. Real slicer round-trip tests remain required before this feature can be called stable.

## Guided UX policy

The normal user should not need to understand `project_settings.config`, baseline activation, diff modes, archive fingerprints or decision-plan context IDs. Those concepts remain internal/advanced. The default flow asks for one trusted 3MF once, automatically compares future projects, explains the differences, and exposes only the replacements the Builder can currently prove safe.

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
- ✅ create a new 3MF archive for strictly eligible supported substitutions;
- ✅ reopen and structurally validate the generated archive before download;
- add real Bambu Studio / OrcaSlicer round-trip fixtures/tests;
- add ZIP64 support or a clear large-project fallback before stable release.
