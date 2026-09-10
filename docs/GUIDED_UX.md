# Guided Review UX

PrintGuardian's normal workflow is intentionally organized around the user's goal rather than the application's internal modules.

## Primary user question

After dropping a 3MF file, the normal user should be able to answer three questions without discovering hidden modes:

1. **Can PrintGuardian see an obvious reason not to continue?**
2. **What should I review before printing?**
3. **Which supported values can I safely replace with values from my trusted printer setup?**

## Default flow

1. Load a 3MF.
2. Show a plain-language verdict.
3. Show exactly which checks were performed and which are still unavailable.
4. If no trusted print profile exists, ask for one trusted 3MF as a one-time setup step.
5. Automatically compare future projects against that trusted profile.
6. Surface important differences directly on the main screen.
7. Explain each difference in plain language while keeping slicer-native terms in English.
8. Allow **Use my value** only when the Safe 3MF mapping layer can prove that the concrete raw replacement is supported.
9. Build and verify a new 3MF copy only after explicit user choices.
10. Keep the technical diff/archive details available under **Advanced tools**.

## What the normal user should not need to understand

- Profile Diff;
- baseline activation;
- decision-plan context IDs;
- `project_settings.config` keys;
- archive fingerprints;
- ZIP rebuild mechanics.

These remain implementation and advanced-diagnostics concepts.

## Verdict policy

PrintGuardian must not show an artificial `100/100` style score while geometry and G-code coverage are incomplete.

The main screen instead uses explicit states such as:

- **Fix a problem before printing**;
- **Review a few things before printing**;
- **Basic checks look good**;
- **Basic checks look good — but your printer is not set up yet**.

The check coverage panel must separately identify unavailable geometry/G-code analysis so a clean basic verdict cannot be mistaken for a print-success guarantee.

## Trusted profile naming

The normal UX uses **My print profile / Mans drukas profils** rather than requiring users to understand the internal “My Baseline” term.

The existing baseline storage model remains the implementation underneath this UI.
## Readability policy

PrintGuardian must not trade legibility for a dense dashboard aesthetic. If information is important enough to show, it must be readable at a normal desktop viewing distance.

The default **Standard** interface size uses larger body, explanation, button and status text than the early prototype. Users can switch between **Compact**, **Standard** and **Large** at runtime; the choice is stored locally and does not require restarting the app.

Secondary text may be visually quieter, but it must not become micro-text. Important checklist details are allowed to wrap rather than being truncated simply to preserve card height.


## Project Workspace structure (dev.9)

The normal workflow is now split into **Overview, Printer, Material, Print settings, Model & Supports and Advanced** tabs. The Overview is intentionally short; it summarizes the verdict, project identity, My print profile and unresolved attention by category.

Tab badges are persistent unresolved-state indicators. Simply opening or reading a tab does not clear a badge. Setting-linked attention is cleared only by a real prepared change; structural findings remain visible until the underlying project state changes or a dedicated safe resolution mechanism exists.

Supported scalar settings can now be edited with type-aware controls directly inside their category tab. A manual high-impact edit requires an explicit acknowledgement before it enters the prepared-change plan. A sticky bottom bar keeps prepared changes, unresolved attention and verified export available across the workspace.
