# Windows signing and SmartScreen

Status: **accepted public-preview limitation; signing deferred**.

`v0.3.0-preview.1` is intentionally distributed unsigned. PrintGuardian does not use a self-signed certificate because that does not create public Windows trust and would not solve the SmartScreen experience for ordinary users.

## What the warning means

The Portable EXE and NSIS installer are not Authenticode-signed. Windows Defender SmartScreen can therefore show an unknown/unrecognized application or unknown-publisher warning.

A SmartScreen reputation warning is **not, by itself, a malware detection**. SmartScreen evaluates reputation signals including the exact downloaded file and a trusted publisher signature. With an unsigned binary there is no trusted publisher identity whose reputation can be carried across releases, so a new unsigned build may trigger the warning again even when an earlier build became familiar to Windows users.

The `publisher` value in `tauri.conf.json` brands installer/uninstall metadata only. It does **not** create a trusted Authenticode signature.

## Public-preview policy

For `v0.3.0-preview.1`:

1. publish only from the official `QvarcY/PrintGuardian` GitHub repository;
2. publish SHA-256 checksums for the exact Portable and Installer binaries;
3. explain SmartScreen before the download/run step in the GitHub release notes and `START HERE - SĀC ŠEIT.txt`;
4. tell users to proceed only when they intentionally downloaded that exact official release;
5. do not claim that bypassing SmartScreen is generally safe — it is only a conscious trust decision for the verified official artifact;
6. keep automatic unsigned Installed updates disabled.

Some Windows environments, Smart App Control configurations, or organization policies can block unsigned applications without offering **Run anyway**. PrintGuardian will not instruct users to weaken system-wide security settings to work around that.

## Will this change?

Possibly. Trusted signing remains desirable for a later release, but it is not required for the first public preview. The project will revisit signing if a suitable free/cost-effective route becomes available or if project adoption justifies a commercial signing cost. No signing date is promised.

If trusted signing is introduced later, the release pipeline should sign and timestamp the exact public binaries and verify those signatures before checksums/release publication. Private signing credentials must never be stored in the repository.

## References

- Microsoft: SmartScreen reputation for Windows app developers — https://learn.microsoft.com/windows/apps/package-and-deploy/smartscreen-reputation
- Microsoft: Code signing options for Windows app developers — https://learn.microsoft.com/windows/apps/package-and-deploy/code-signing-options
