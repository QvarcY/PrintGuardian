# Project Workspace — v0.3.0-dev.10

PrintGuardian's main project screen is organized by the user's mental model, not by internal parser modules.

## Information architecture

The loaded project is split into six horizontal tabs:

- **Overview / Pārskats** — verdict, project identity, print-profile setup and a concise attention summary.
- **Printer / Printeris** — printer profile, nozzle diameter and build plate.
- **Material / Materiāls** — filament information and material-flow related values.
- **Print settings / Drukas iestatījumi** — process and core slicer settings such as Layer height, Wall loops and Sparse infill density.
- **Model & Supports / Modelis & Supports** — object/part/plate facts plus support and adhesion settings.
- **Advanced / Papildu** — raw/technical diagnostics and the existing Profile Diff workflow.

The goal is to keep the Overview short while still making every relevant detail one predictable click away.

## Persistent attention badges

A tab badge is an **unresolved-state indicator**, not an unread indicator.

Opening a tab does not clear its badge. A setting-linked badge is cleared only when PrintGuardian can see a real prepared mutation that resolves that setting. Structural findings that cannot yet be edited remain visible rather than being silently dismissed by navigation.

This prevents the common UX failure where a warning disappears merely because the user looked at it.

## My print profile

The normal UI does not use the internal `baseline` vocabulary. Users see **My print profile / Mans drukas profils**.

A print profile is optional. It is created locally from a trusted 3MF and gives PrintGuardian a reference for the user's printer and usual slicer values. The source 3MF itself is not persisted and the profile is never presented as a safety certification.

The current storage implementation may still use baseline-oriented type and key names internally; those are implementation details.

## Editing model

Supported scalar settings can be changed directly inside their category tab. Controls are type-aware rather than generic text fields:

- integer stepper for `Wall loops`;
- numeric values with units and bounded ranges for `Layer height`, `Sparse infill density` and `Brim width`;
- explicit Enabled / Disabled control for `Enable support`.

The user can also select a compatible value from My print profile when the existing Safe 3MF mapping layer can verify the raw replacement.

Unsupported compound fields remain visible and explained, but PrintGuardian does not offer a fake or unsafe edit control.

## High-impact changes

The impact of a setting is intrinsic to the setting, not only to whether it currently differs from My print profile. A manual change to a high-impact setting therefore receives the high-impact treatment even when the original project and print profile happened to match.

Before a supported high-impact manual change is accepted, PrintGuardian shows a dedicated confirmation dialog and requires an explicit acknowledgement. This adds deliberate friction only where the potential effect justifies it.

## Sticky change workflow

A persistent bottom action bar keeps the current edit state visible across all tabs. It reports:

- how many real changes are prepared;
- how many attention points remain unresolved;
- reset action;
- review-changes action;
- verified new-3MF export action.

Export is never disabled without context: the button exposes why the current project cannot yet be exported through this workflow.

## Safety boundary

This workspace is a clearer front end for the existing diff, decision, build-preview and verified-export engines. It does **not** expand current analysis coverage by itself. Full geometry and G-code safety auditing remains future work, and the UI must continue to state that limitation explicitly.


## v0.3.0-dev.10 — navigation continuity and profile library

The workspace keeps its category tab rail visible while the user opens the technical **Profile Diff** inside Advanced. Entering a deeper diagnostic tool must not make the user lose their location in the project.

Displayed units are normalized before rendering. Values that already contain `%`, `mm` or `mm³/s` are not decorated a second time, preventing output such as `15%%`.

The former single local reference has grown into a named **My print profiles** library. Users can:

- add several trusted 3MF-derived reference profiles;
- keep separate references for different printer / nozzle / material workflows;
- rename profiles;
- choose which profile is active for automatic comparison;
- remove profiles without storing the source 3MF itself.

Existing single-profile local data is migrated into the library when possible. The active profile is mirrored to the legacy baseline storage layer temporarily so the existing Advanced/Profile Diff and verified-export engines remain compatible during the transition.

The support action is also intentionally more visible in the application chrome. It remains optional and visually separate from the actual project analysis/actions.
