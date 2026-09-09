# PrintGuardian

> [!WARNING]
> **Active development / Aktīva izstrāde**  
> PrintGuardian is pre-release software. UI, analysis rules and file handling may change between development versions.


**Know before you print.**

PrintGuardian is a bilingual (Latvian / English) desktop-oriented 3D-print project inspector concept by **CraftIN / QvarcY**.

This repository snapshot currently contains the **v0.1 interactive UI foundation**. Real 3MF parsing will be connected in the next development stage through a Tauri/Rust backend.

## Run the UI prototype

```powershell
npm install
npm run dev
```

Then open the local Vite address shown in the terminal.

## Current prototype features
- LV / EN live language switching
- drag-and-drop `.3mf`, `.gcode`, `.bgcode` UI
- demo analysis dashboard
- Print Health presentation
- Profile Diff sample
- Print DNA concept
- localized hover explanations while retaining slicer setting names in English
- CraftIN / QvarcY author attribution

## Architecture target
- **Desktop shell:** Tauri 2
- **Frontend:** React + TypeScript
- **Localization:** i18next / react-i18next
- **Analysis engine:** Rust
- **Default data policy:** local processing

## Author
Created by **CraftIN / QvarcY**

- https://kas.id.lv
- https://craftin.lv
- GitHub: QvarcY

Copyright © 2026 CraftIN / QvarcY (kas.id.lv)
