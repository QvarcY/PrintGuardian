# Windows signing and SmartScreen

Status: **public-preview blocker**.

Development builds may be unsigned. Public Windows releases must not be presented as release-ready while Windows identifies the publisher as unknown.

## What the current warning means

The development EXE and NSIS installer are not Authenticode-signed yet. Windows Defender SmartScreen can therefore show an unknown/unrecognized application warning. This is expected during internal testing, but it is not an acceptable first-run experience for the public preview.

The `publisher` value in `tauri.conf.json` brands installer metadata and the Windows uninstall entry; it does **not** create a trusted Authenticode publisher signature.

## Release requirement

Before `v0.3.0-preview.1`:

1. choose a trusted Windows code-signing path;
2. sign the portable executable, installed application executable, uninstaller and installer through the build/release pipeline as applicable;
3. timestamp signatures;
4. verify the Authenticode signature on the exact staged release files;
5. never modify a signed binary after signing;
6. repeat the clean-Windows launch/install/uninstall test using the signed artifacts.

A valid signature identifies the publisher but does not guarantee that a brand-new application immediately has SmartScreen reputation. Early preview users may still see an unrecognized-app prompt while reputation builds.

## Candidate signing paths

- SignPath Foundation is worth evaluating for an eligible open-source project because it provides free code signing tied to the public source/build process.
- A conventional OV code-signing certificate is the fallback for direct distribution when an open-source signing service is not suitable.
- Microsoft Store distribution can be evaluated later as a separate channel; it is not required for the GitHub preview.

No private signing key or credential belongs in the repository.
