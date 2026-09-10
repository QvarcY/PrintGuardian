# Readability and interface scale

PrintGuardian uses a readable-by-default desktop UI. The early prototype used many 7–10 px labels to achieve a dense diagnostic-dashboard look; dev.8 deliberately moves away from that pattern.

## Runtime sizes

The top bar exposes three local interface-size choices:

- **Compact** — 0.92×, for users who prefer higher information density;
- **Standard** — 1.00×, the readable default;
- **Large** — 1.14×, for larger monitors, higher viewing distance or easier reading.

The preference is stored in local browser/app storage under `printguardian.uiScale.v1`. It contains no project or telemetry data.

## Rules

- Normal explanations should generally render around 12–13 px or larger at Standard scale.
- Primary settings and values should generally render around 13–14 px.
- Sidebar navigation and action buttons should be comfortably readable and clickable.
- Tooltips should be readable without browser zoom.
- Secondary copy may use lower contrast, but not so low that it disappears into the background.
- Checklist details may wrap instead of being ellipsized when the text is useful to the decision.
- Advanced diagnostics may remain denser than the guided workflow, but should not return to 7–9 px micro-text for meaningful content.

This scale layer is intentionally UI-only. It does not change 3MF inspection, comparison or export results.
