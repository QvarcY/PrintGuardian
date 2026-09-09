# 3MF Inspector v0.2

## Goal

Read enough of a Bambu Studio / OrcaSlicer-style 3MF project to explain what is inside the file before the user imports it into a slicer.

## Files currently inspected

- `3D/3dmodel.model` — 3MF model/build XML
- `Metadata/project_settings.config` — global slicer/project settings JSON
- `Metadata/model_settings.config` — per-object / part / plate metadata XML
- `Metadata/slice_info.config` — sliced plate and filament summary XML when present

The inspector also detects plate/thumbnail files in `Metadata/`.

## Current extracted information

- printer profile / model where available
- nozzle diameter
- build plate
- process profile
- object count
- part count
- plate count
- filament types/vendors/colors/profiles
- filament used grams when present in `slice_info.config`
- selected slicer settings:
  - `Layer height`
  - `Wall loops`
  - `Sparse infill density`
  - `Enable support`
  - `Brim width`
  - `Max volumetric speed`

## Localization rule

The slicer terms above remain in English in both application languages. Their explanations are localized to Latvian or English on hover/focus.

## First ruleset

v0.2 can currently flag:

- missing `project_settings.config`;
- no detected printable/build objects;
- unusually large filament palette;
- layer height greater than 80% of the detected nozzle diameter;
- one-wall projects.

These are deliberately conservative checks. The UI labels the result as a preliminary check, not a print-success guarantee.

## Privacy

Inspection is local. The standalone preview does not upload project files.
