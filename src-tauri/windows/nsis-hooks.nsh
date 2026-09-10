; Keep uninstall discoverable without exposing application internals.
; Tauri already writes uninstall.exe and registers it in Windows Installed apps.
; This hook adds a conventional Start Menu shortcut and removes it during uninstall.

!macro NSIS_HOOK_POSTINSTALL
  CreateShortCut "$SMPROGRAMS\Uninstall ${PRODUCTNAME}.lnk" "$INSTDIR\uninstall.exe"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$SMPROGRAMS\Uninstall ${PRODUCTNAME}.lnk"
!macroend
