# Security policy

PrintGuardian processes 3D-print project files locally. The project is still pre-release software and its file parsers/export path are under active hardening.

## Supported security-fix target

Security fixes currently target the latest development/pre-release line only. Older development checkpoints should not be treated as supported builds.

## Reporting a vulnerability

Please avoid publishing a reproducible exploit or malicious 3MF sample in a public issue before the maintainer has had a chance to review it.

Report security-sensitive findings to **info@craftin.lv** with:

- affected PrintGuardian version/commit;
- a concise description of the issue;
- reproduction steps;
- a minimal test file when safe to share;
- expected vs actual behavior.

Non-sensitive bugs and compatibility problems can be reported through normal GitHub issues once the public preview is released.

## Local-data boundary

The standalone PrintGuardian preview performs 3MF inspection in the browser on the user's computer. Print files, extracted profiles and project settings are not intentionally uploaded by the current standalone workflow. Local preferences and print-profile snapshots may be stored in browser local storage.

Update checks or other network features, if added later, must remain clearly separated from print-file processing and telemetry.
