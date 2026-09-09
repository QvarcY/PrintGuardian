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
- ⏳ import/select a persistent user baseline profile
- ⏳ side-by-side / overlay Print DNA

## v0.4 — Safe 3MF Builder
- choose what to keep from project vs local printer profile
- preserve geometry / painting / supports / modifiers selectively
- remove unwanted printer/AMS/profile metadata
- non-destructive export to a new file
- integrity validation
- before/after report

## v0.5 — G-code Preflight
- `.gcode` metadata/parser
- `.gcode.3mf` support
- printer/nozzle/temperature checks
- pauses / filament changes / custom G-code
- initial motion and extrusion risk engine

## Later
- `.bgcode`
- geometry analysis: islands, bridges, overhangs, contact area
- print-cost / purge-waste analysis
- local print history / Print Memory
