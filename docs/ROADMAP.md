# Roadmap

## v0.1 — Foundation ✅
- React/TypeScript UI shell
- LV/EN live switch
- Design tokens and core components
- Drop zone
- Demo dashboard
- Localized setting tooltips
- Author attribution

## v0.2 — Real 3MF inspection ✅ proof-of-concept
- local ZIP container reader
- parse `project_settings.config`
- parse `model_settings.config`
- parse `slice_info.config`
- parse `3D/3dmodel.model`
- printer / process / build plate extraction
- filament palette extraction
- first slicer setting extraction
- first inspection rules
- live Print DNA visualization
- standalone `preview.html` can inspect real 3MF files

### v0.2 hardening still planned
- move/harden archive parser in Rust/Tauri backend
- ZIP64 handling
- malformed XML/JSON diagnostics with richer error codes
- Bambu Studio / OrcaSlicer fixture suite
- exact slicer/version identification

## v0.3 — Profile Diff 🚧
- ✅ compare two imported 3MF projects
- ✅ printer / nozzle / build plate / process comparison
- ✅ selected slicer-setting diff
- ✅ changed / same / missing states
- ✅ LV / EN comparison UI
- ✅ low / medium / high impact prioritization
- ✅ localized "why it matters" explanations while keeping slicer names in English
- ✅ differences-only / show-all filtering
- ✅ relative numeric delta hints where units match
- ✅ side-by-side / overlay Print DNA
- ✅ high-impact-only filtering
- ✅ directional setting guidance for known numeric/boolean changes
- ✅ persistent local **My Baseline** reference profile
- ✅ one-click comparison against the saved baseline
- ✅ baseline replace/remove workflow with local-only metadata storage
- ✅ non-destructive **Keep project / Use baseline** decision preview
- ✅ decision summary as the bridge toward Safe 3MF Builder
- ✅ context-scoped local decision-plan persistence
- ✅ profile-level before/after decision report
- ✅ map supported decisions to concrete `project_settings.config` keys
- ✅ in-memory project-settings rebuild preview with source-untouched and JSON integrity checks
- ✅ experimental verified 3MF export for fully mapped supported substitutions
- ✅ reopen generated archive and verify non-target entries / requested mutations before download
- ✅ block compound machine/profile metadata and filament-indexed values until safer rewrite rules exist
- ⏳ multiple named baselines / printer-specific references

## v0.4 — Safe 3MF Builder
- ✅ decision model and in-memory `project_settings.config` preview started in v0.3
- choose what to keep from project vs local printer profile
- preserve geometry / painting / supports / modifiers selectively
- remove unwanted printer/AMS/profile metadata
- ✅ first non-destructive export path started in v0.3.0-dev.6
- ✅ first archive-level structural integrity validation started in v0.3.0-dev.6
- real Bambu Studio / OrcaSlicer round-trip compatibility tests
- ZIP64 / large-project export handling
- archive-level before/after validation report

## v0.5 — G-code Preflight
- `.gcode` metadata/parser
- `.gcode.3mf` support
- printer/nozzle/temperature checks
- pauses / filament changes / custom G-code
- initial motion and extrusion risk engine

## Later
- signed desktop updater with Stable / Beta channels (design documented in `docs/UPDATER.md`)
- `.bgcode`
- geometry analysis: islands, bridges, overhangs, contact area
- print-cost / purge-waste analysis
- local print history / Print Memory
