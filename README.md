# PrintGuardian

**Know before you print.**

PrintGuardian is a local-first Windows desktop tool for inspecting `.3mf` projects before printing.

It helps you understand what is inside a Bambu Studio / OrcaSlicer project, highlights settings that deserve attention, compares projects against your own trusted print profiles, supports selected safe setting changes, and can export a verified new 3MF copy without overwriting the original.

> [!IMPORTANT]
> **PrintGuardian v0.3.0-preview.1 is now available as the first public Windows x64 preview.**

[Download PrintGuardian v0.3.0-preview.1](https://github.com/QvarcY/PrintGuardian/releases/tag/v0.3.0-preview.1)

**Windows x64 · Portable + Installed · LV / EN · Local-first**

---

## Why PrintGuardian?

3MF viewers, extractors and profile-comparison tools already exist.

PrintGuardian is built around a different workflow:

**Inspect → understand → identify attention points → compare → fix supported settings → verify → export a new 3MF copy**

The goal is not to dump hundreds of raw settings on screen.

The goal is to help answer questions such as:

- What printer, nozzle, material and process settings are inside this 3MF?
- Which settings should I check before printing?
- How does this project differ from a profile I already trust?
- Is something unusual or potentially problematic?
- Can a supported setting be corrected without manually rebuilding the whole project?
- Can I save the result as a new 3MF without touching the original file?

Think of PrintGuardian as a **pre-flight inspection layer for 3MF projects**.

---

## Download

### Windows x64

Current public preview:

**[PrintGuardian v0.3.0-preview.1](https://github.com/QvarcY/PrintGuardian/releases/tag/v0.3.0-preview.1)**

The Windows ZIP contains:

- `PrintGuardian Portable.exe`
- `Install PrintGuardian.exe`
- `START HERE - SĀC ŠEIT.html`
- `CHECKSUMS.txt`

### Portable

Run PrintGuardian without installing it.

Portable application data is stored in the hidden `PrintGuardianData` folder beside the executable, allowing the application and its local data to move together.

### Installed

A normal per-user Windows installation with Start Menu and uninstall support.

---

## Quick start

1. Download the latest Windows preview from GitHub Releases.
2. Extract the ZIP.
3. Open `START HERE - SĀC ŠEIT.html`.
4. Choose either **Portable** or **Installed**.
5. Open or drop a `.3mf` project into PrintGuardian.
6. Review the detected project information and attention points.
7. Optionally compare it with one of your trusted print profiles.
8. Review or apply supported changes.
9. Export a new verified 3MF copy.

The original source 3MF is not overwritten by the export workflow.

---

## What PrintGuardian can do today

### 3MF project inspection

PrintGuardian reads relevant information from the 3MF container, including:

- printer information;
- process/profile information;
- plate information;
- filament/material information;
- important slicer settings;
- object and part counts;
- plate counts;
- archive structure and metadata.

Supported Bambu Studio / OrcaSlicer project data is presented in a structured workspace instead of as one large raw settings dump.

### Project Workspace

The main project view is divided into:

- **Overview**
- **Printer**
- **Material**
- **Print settings**
- **Model & Supports**
- **Advanced**

Attention indicators remain visible on the relevant sections until the underlying condition is resolved.

---

## Attention points

PrintGuardian includes an expanding rules engine that checks selected project settings and metadata for conditions worth reviewing.

Where possible, an attention point is linked directly to the setting responsible for it.

For example, PrintGuardian can identify situations such as:

```text
Wall loops = 1
