import { inspectThreeMf, type ThreeMfInspection } from './threeMfInspector';
import type { SafeThreeMfBuildPreview } from './safeThreeMfBuildPreview';
import { crc32, rebuildZipWithReplacement } from './zipWriter';
import { ZipArchive } from './zip';

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

const PROJECT_SETTINGS = 'Metadata/project_settings.config';

export type SafeThreeMfExportVerification = {
  fileName: string;
  fileSize: number;
  archiveEntryCount: number;
  preservedEntryCount: number;
  replacementEntryValid: boolean;
  archiveStructureMatches: boolean;
  nonTargetEntriesPreserved: boolean;
  mutationsVerified: boolean;
  reinspectionPassed: boolean;
};

export type SafeThreeMfExportResult = {
  file: File;
  verification: SafeThreeMfExportVerification;
};

function outputName(sourceName: string): string {
  const base = sourceName.replace(/\.3mf$/i, '') || 'project';
  return `${base}-printguardian.3mf`;
}

function sameNames(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function exportEligibility(inspection: ThreeMfInspection, preview: SafeThreeMfBuildPreview): { ok: boolean; reason?: string } {
  if (!inspection.sourceFile) return { ok: false, reason: 'missing-source-file' };
  if (!preview.previewProjectSettings) return { ok: false, reason: 'missing-preview-settings' };
  if (!preview.sourceUntouched || !preview.serializes) return { ok: false, reason: 'preview-integrity-failed' };
  if (!preview.changed || preview.readyCount < 1) return { ok: false, reason: 'no-ready-changes' };
  if (preview.blockedCount > 0 || preview.unresolvedCount > 0) return { ok: false, reason: 'blocked-or-unresolved' };
  return { ok: true };
}

export async function buildVerifiedThreeMfExport(
  inspection: ThreeMfInspection,
  preview: SafeThreeMfBuildPreview,
): Promise<SafeThreeMfExportResult> {
  const eligibility = exportEligibility(inspection, preview);
  if (!eligibility.ok) throw new Error(`Export is not eligible: ${eligibility.reason}`);
  if (!inspection.sourceFile || !preview.previewProjectSettings) throw new Error('Source file or preview settings are unavailable.');

  const serialized = JSON.stringify(preview.previewProjectSettings, null, 2);
  JSON.parse(serialized);
  const replacementBytes = new TextEncoder().encode(serialized);
  const outputBytes = await rebuildZipWithReplacement(inspection.sourceFile, { name: PROJECT_SETTINGS, bytes: replacementBytes });
  const output = new File([bytesToArrayBuffer(outputBytes)], outputName(inspection.fileName), { type: 'model/3mf' });

  const sourceArchive = await ZipArchive.fromFile(inspection.sourceFile);
  const outputArchive = await ZipArchive.fromFile(output);
  const sourceNames = sourceArchive.names();
  const outputNames = outputArchive.names();
  const archiveStructureMatches = sameNames(sourceNames, outputNames);

  let preservedEntryCount = 0;
  let nonTargetEntriesPreserved = archiveStructureMatches;
  for (const name of sourceNames) {
    if (name === PROJECT_SETTINGS) continue;
    const sourceBytes = await sourceArchive.readBytes(name);
    const rebuiltBytes = await outputArchive.readBytes(name);
    if (sourceBytes.byteLength !== rebuiltBytes.byteLength || crc32(sourceBytes) !== crc32(rebuiltBytes)) {
      nonTargetEntriesPreserved = false;
      break;
    }
    preservedEntryCount += 1;
  }

  let replacementEntryValid = false;
  try {
    replacementEntryValid = sameJsonValue(JSON.parse(await outputArchive.readText(PROJECT_SETTINGS)), preview.previewProjectSettings);
  } catch {
    replacementEntryValid = false;
  }

  const rebuiltInspection = await inspectThreeMf(output);
  const readyMutations = preview.mutations.filter((mutation) => mutation.status === 'ready' && mutation.targetKey);
  const mutationsVerified = readyMutations.every((mutation) => sameJsonValue(rebuiltInspection.projectSettings?.[mutation.targetKey!], mutation.after));
  const reinspectionPassed = rebuiltInspection.archiveEntryCount === inspection.archiveEntryCount
    && rebuiltInspection.objectCount === inspection.objectCount
    && rebuiltInspection.partCount === inspection.partCount
    && rebuiltInspection.plateCount === inspection.plateCount;

  const verification: SafeThreeMfExportVerification = {
    fileName: output.name,
    fileSize: output.size,
    archiveEntryCount: rebuiltInspection.archiveEntryCount,
    preservedEntryCount,
    replacementEntryValid,
    archiveStructureMatches,
    nonTargetEntriesPreserved,
    mutationsVerified,
    reinspectionPassed,
  };

  const valid = replacementEntryValid && archiveStructureMatches && nonTargetEntriesPreserved && mutationsVerified && reinspectionPassed;
  if (!valid) throw new Error('Rebuilt 3MF did not pass post-build verification. No download should be offered.');

  return { file: output, verification };
}

export function downloadThreeMf(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
