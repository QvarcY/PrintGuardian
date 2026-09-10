function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export type ZipEntry = {
  name: string;
  compressionMethod: number;
  generalPurposeFlag: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const ZIP64_SENTINEL_16 = 0xffff;
const ZIP64_SENTINEL_32 = 0xffffffff;

export const ZIP_SECURITY_LIMITS = {
  maxArchiveBytes: 512 * 1024 * 1024,
  maxEntries: 10_000,
  maxEntryUncompressedBytes: 256 * 1024 * 1024,
  maxTotalDeclaredUncompressedBytes: 512 * 1024 * 1024,
  maxCompressionRatio: 500,
} as const;

function ensureRange(total: number, offset: number, length: number, label: string) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > total) {
    throw new Error(`Invalid ZIP bounds for ${label}.`);
  }
}

function findEndOfCentralDirectory(view: DataView): number {
  if (view.byteLength < 22) throw new Error('File is too small to be a ZIP archive.');
  const min = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= min; offset--) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  throw new Error('ZIP end-of-central-directory record was not found.');
}

function decodeName(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function validateDeclaredEntry(entry: ZipEntry) {
  if (entry.generalPurposeFlag & 0x0001) throw new Error(`Encrypted ZIP entries are not supported: ${entry.name}`);
  if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
    throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.name}.`);
  }
  if (entry.uncompressedSize > ZIP_SECURITY_LIMITS.maxEntryUncompressedBytes) {
    throw new Error(`ZIP entry is too large to inspect safely: ${entry.name}`);
  }
  if (entry.compressedSize === 0 && entry.uncompressedSize > 0) {
    throw new Error(`Invalid compressed size for ZIP entry: ${entry.name}`);
  }
  if (entry.compressedSize > 0 && entry.uncompressedSize / entry.compressedSize > ZIP_SECURITY_LIMITS.maxCompressionRatio) {
    throw new Error(`ZIP entry compression ratio is suspiciously high: ${entry.name}`);
  }
}

async function inflateRawLimited(bytes: Uint8Array, expectedSize: number, name: string): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support local ZIP decompression.');
  }

  const stream = new Blob([bytesToArrayBuffer(bytes)]).stream().pipeThrough(
    new DecompressionStream('deflate-raw' as CompressionFormat),
  );
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
    total += chunk.byteLength;
    if (total > ZIP_SECURITY_LIMITS.maxEntryUncompressedBytes || (expectedSize && total > expectedSize)) {
      await reader.cancel();
      throw new Error(`ZIP entry expands beyond its declared safe size: ${name}`);
    }
    chunks.push(chunk);
  }

  if (expectedSize !== total) throw new Error(`ZIP entry size mismatch: ${name}`);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export class ZipArchive {
  private readonly bytes: Uint8Array;
  private readonly view: DataView;
  readonly entries: ZipEntry[];

  private constructor(buffer: ArrayBuffer, entries: ZipEntry[]) {
    this.bytes = new Uint8Array(buffer);
    this.view = new DataView(buffer);
    this.entries = entries;
  }

  static async fromFile(file: File): Promise<ZipArchive> {
    if (file.size > ZIP_SECURITY_LIMITS.maxArchiveBytes) {
      throw new Error('3MF/ZIP file is too large for the current safe inspection limit (512 MiB).');
    }
    return ZipArchive.fromArrayBuffer(await file.arrayBuffer());
  }

  static fromArrayBuffer(buffer: ArrayBuffer): ZipArchive {
    if (buffer.byteLength > ZIP_SECURITY_LIMITS.maxArchiveBytes) {
      throw new Error('3MF/ZIP file is too large for the current safe inspection limit (512 MiB).');
    }

    const view = new DataView(buffer);
    const eocdOffset = findEndOfCentralDirectory(view);
    ensureRange(view.byteLength, eocdOffset, 22, 'end-of-central-directory');

    const diskNumber = view.getUint16(eocdOffset + 4, true);
    const centralDisk = view.getUint16(eocdOffset + 6, true);
    const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const centralSize = view.getUint32(eocdOffset + 12, true);
    const centralOffset = view.getUint32(eocdOffset + 16, true);

    if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== totalEntries) {
      throw new Error('Multi-disk ZIP archives are not supported.');
    }
    if (totalEntries === ZIP64_SENTINEL_16 || centralSize === ZIP64_SENTINEL_32 || centralOffset === ZIP64_SENTINEL_32) {
      throw new Error('ZIP64 archives are not supported yet.');
    }
    if (totalEntries > ZIP_SECURITY_LIMITS.maxEntries) {
      throw new Error(`ZIP contains too many entries to inspect safely (${totalEntries}).`);
    }
    ensureRange(view.byteLength, centralOffset, centralSize, 'central directory');
    if (centralOffset + centralSize > eocdOffset) throw new Error('ZIP central directory overlaps the end record.');

    const bytes = new Uint8Array(buffer);
    const entries: ZipEntry[] = [];
    let declaredTotal = 0;
    let cursor = centralOffset;
    const centralEnd = centralOffset + centralSize;

    for (let i = 0; i < totalEntries; i++) {
      ensureRange(centralEnd, cursor, 46, 'central directory entry');
      if (view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) throw new Error('Invalid ZIP central directory.');

      const generalPurposeFlag = view.getUint16(cursor + 8, true);
      const compressionMethod = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const uncompressedSize = view.getUint32(cursor + 24, true);
      const fileNameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localHeaderOffset = view.getUint32(cursor + 42, true);
      if ([compressedSize, uncompressedSize, localHeaderOffset].includes(ZIP64_SENTINEL_32)) {
        throw new Error('ZIP64 entries are not supported yet.');
      }

      const variableLength = fileNameLength + extraLength + commentLength;
      ensureRange(centralEnd, cursor + 46, variableLength, 'central directory variable fields');
      const nameStart = cursor + 46;
      const name = decodeName(bytes.subarray(nameStart, nameStart + fileNameLength));
      if (!name) throw new Error('ZIP entry has an empty name.');

      const entry: ZipEntry = { name, compressionMethod, generalPurposeFlag, compressedSize, uncompressedSize, localHeaderOffset };
      validateDeclaredEntry(entry);
      declaredTotal += uncompressedSize;
      if (declaredTotal > ZIP_SECURITY_LIMITS.maxTotalDeclaredUncompressedBytes) {
        throw new Error('ZIP expands beyond the current safe inspection limit (512 MiB total).');
      }
      entries.push(entry);
      cursor += 46 + variableLength;
    }

    if (cursor > centralEnd) throw new Error('Invalid ZIP central-directory length.');
    return new ZipArchive(buffer, entries);
  }

  has(name: string): boolean {
    return this.entries.some((entry) => entry.name === name);
  }

  names(): string[] {
    return this.entries.map((entry) => entry.name);
  }

  private find(name: string): ZipEntry {
    const entry = this.entries.find((candidate) => candidate.name === name);
    if (!entry) throw new Error(`ZIP entry not found: ${name}`);
    return entry;
  }

  async readBytes(name: string): Promise<Uint8Array> {
    const entry = this.find(name);
    const offset = entry.localHeaderOffset;
    ensureRange(this.view.byteLength, offset, 30, `local header for ${name}`);
    if (this.view.getUint32(offset, true) !== LOCAL_SIGNATURE) throw new Error(`Invalid ZIP local header for ${name}.`);

    const localFlags = this.view.getUint16(offset + 6, true);
    const localMethod = this.view.getUint16(offset + 8, true);
    if (localFlags & 0x0001) throw new Error(`Encrypted ZIP entries are not supported: ${name}`);
    if (localMethod !== entry.compressionMethod) throw new Error(`ZIP compression method mismatch for ${name}.`);

    const fileNameLength = this.view.getUint16(offset + 26, true);
    const extraLength = this.view.getUint16(offset + 28, true);
    const start = offset + 30 + fileNameLength + extraLength;
    ensureRange(this.view.byteLength, start, entry.compressedSize, `compressed data for ${name}`);
    const compressed = this.bytes.slice(start, start + entry.compressedSize);

    if (entry.compressionMethod === 0) {
      if (compressed.byteLength !== entry.uncompressedSize) throw new Error(`ZIP entry size mismatch: ${name}`);
      return compressed;
    }
    return inflateRawLimited(compressed, entry.uncompressedSize, name);
  }

  async readText(name: string): Promise<string> {
    return new TextDecoder('utf-8').decode(await this.readBytes(name));
  }
}
