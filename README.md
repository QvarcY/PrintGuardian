# PrintGuardian

> [!WARNING]
> **Active development / Aktīva izstrāde**  
> PrintGuardian is **pre-release software**. The current 3MF Inspector is experimental, inspection rules are still being expanded, and no result should yet be treated as a guarantee that a print is safe or will succeed.


**Know before you print.**

PrintGuardian is a bilingual (Latvian / English) 3D-print project inspector by **CraftIN / QvarcY**.

The current development branch is **v0.3-dev**. It keeps the live local 3MF Inspector from v0.2 and adds the first interactive **Profile Diff** workflow for comparing two `.3mf` projects.

## Fastest way to test

Open `preview.html` in a modern Chromium-based browser and either:

- drop a real Bambu Studio / OrcaSlicer `.3mf` file into the window;
- click **Browse files**;
- or use the built-in demo project.

The standalone preview has no external runtime dependencies. A tiny synthetic smoke-test project is included at `fixtures/bambu-style-smoke-test.3mf`. A second synthetic project, `fixtures/bambu-style-profile-diff-test.3mf`, is included so the v0.3 Profile Diff can be tested with deliberately changed profile/settings values.

## React development UI

```powershell
npm install
npm run dev
```

The React source now uses the same real 3MF inspection model as the standalone preview.

## Current development capabilities

- local ZIP/3MF container reader;
- reads `Metadata/project_settings.config`;
- reads `Metadata/model_settings.config`;
- reads `Metadata/slice_info.config`;
- reads `3D/3dmodel.model`;
- detects printer/process/plate information where present;
- extracts filament palette information;
- extracts a first set of important slicer settings;
- counts objects, parts, plates and archive entries;
- displays a live preliminary inspection score;
- runs a first small ruleset for suspicious settings/metadata;
- generates a live Print DNA visualization from project values;
- LV / EN runtime language switching;
- slicer setting names remain in English in both languages;
- localized hover explanations for slicer settings;
- CraftIN / QvarcY author attribution.


### v0.3-dev Profile Diff

- open **Compare** from the sidebar after loading a project;
- select a second `.3mf` file;
- compare `Printer profile`, `Nozzle diameter`, `Build plate` and `Process profile`;
- compare the important slicer settings currently extracted by PrintGuardian;
- distinguish unchanged values, changed values and values missing from one file;
- keep both comparison files local on the computer.

Profile Diff currently reports factual differences. A changed value is **not automatically treated as an error or risk**. Impact/risk interpretation will be expanded separately.

## Important current limitation

The current inspection score is a **preliminary project check**, not a guarantee that a print will succeed. Geometry-level overhang/bridge/island analysis and full G-code safety inspection are not connected yet.

## Architecture target

- **Desktop shell:** Tauri 2
- **Frontend:** React + TypeScript
- **Localization:** i18next / react-i18next
- **Analysis engine:** currently TypeScript proof-of-concept, hardened Rust engine planned for the desktop build
- **Default data policy:** local processing


## Support the project

PrintGuardian is being developed as an independent CraftIN / QvarcY project. If the project is useful to you and you want to support continued development:

**☕ Buy Me a Coffee:** https://buymeacoffee.com/craftin

Support is optional and does not change the local-first design goal of PrintGuardian.

## Author

Created by **CraftIN / QvarcY**

- https://kas.id.lv
- https://craftin.lv
- GitHub: QvarcY

Copyright © 2026 CraftIN / QvarcY (kas.id.lv)
