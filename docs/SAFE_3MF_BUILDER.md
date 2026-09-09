# Safe 3MF Builder

## Current development stage

The full Safe 3MF Builder is **not implemented yet**. Starting with `v0.3.0-dev.3`, PrintGuardian contains a non-destructive decision preview that appears when the current project is compared with **My Baseline**.

For every detected difference the user can explicitly choose:

- **Keep project value**
- **Use baseline value**

The current implementation stores these decisions only in UI state. It does **not** rewrite, sanitize, export, or claim to make a 3MF safe.

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

- model decisions independently from the UI component;
- persist/restore a draft decision plan for the active project;
- map decisions to concrete `project_settings.config` keys;
- define which machine/AMS metadata can be replaced safely;
- preserve geometry, painting, supports and modifiers intentionally;
- create a new 3MF archive;
- validate integrity and generate a before/after report.
