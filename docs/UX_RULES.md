# PrintGuardian UI/UX rules

1. Dark-first professional UI. Not a Bambu Studio clone and not generic cyberpunk.
2. Every primary screen should be visually strong enough for a product screenshot.
3. No settings-table overload on the default screen. Progressive disclosure first.
4. Severity must be understandable without relying only on color.
5. Slicer-native terms stay English; explanations are localized.
6. Hover behavior must also be keyboard-focus accessible.
7. First-level warnings explain *why it matters*, not only what value differs.
8. File processing status should be visible and reassuring.
9. Safe 3MF export must make it clear what is preserved and what is replaced.
10. UI should never imply analysis was performed when a parser cannot verify a fact.
11. The default workflow follows the user mental model: “Can I print this? What should I review? What can I safely change?” Internal concepts such as Profile Diff, Baseline, decision plans and raw archive checks must not be prerequisites for normal use.
12. Never use a numeric health/safety score when the analysis coverage cannot justify that precision. Show explicit checked / review / not-yet-checked states instead.
13. A primary CTA must perform or navigate to the expected action. No dead or disabled headline actions that require users to guess where the real workflow lives.
14. Trusted-printer comparison should happen automatically after one-time profile setup. The user should not need to manually activate a baseline for every project.
15. Explain unsupported automatic changes in context. Do not hide the difference, but do not offer an unsafe rewrite control.
