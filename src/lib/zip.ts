export type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

function findEndOfCentralDirectory(view: DataView): number {
  const min = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= min; offset--) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  throw new Error('ZIP end-of-central-directory record was not found.');
}

function decodeName(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes);
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
    return ZipArchive.fromArrayBuffer(await file.arrayBuffer());
  }

  static fromArrayBuffer(buffer: ArrayBuffer): ZipArchive {
    const view = new DataView(buffer);
    const eocdOffset = findEndOfCentralDirectory(view);
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    const centralOffset = view.getUint32(eocdOffset + 16, true);
    const bytes = new Uint8Array(buffer);
    const entries: ZipEntry[] = [];

    let cursor = centralOffset;
    for (let i = 0; i < totalEntries; i++) {
      if (view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) {
        throw new Error('Invalid ZIP central directory.');
      }

      const compressionMethod = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const uncompressedSize = view.getUint32(cursor + 24, true);
      const fileNameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localHeaderOffset = view.getUint32(cursor + 42, true);
      const nameStart = cursor + 46;
      const name = decodeName(bytes.subarray(nameStart, nameStart + fileNameLength));

      entries.push({ name, compressionMethod, compressedSize, uncompressedSize, localHeaderOffset });
      cursor = nameStart + fileNameLength + extraLength + commentLength;
    }

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
    if (this.view.getUint32(offset, true) !== LOCAL_SIGNATURE) {
      throw new Error(`Invalid ZIP local header for ${name}.`);
    }

    const fileNameLength = this.view.getUint16(offset + 26, true);
    const extraLength = this.view.getUint16(offset + 28, true);
    const start = offset + 30 + fileNameLength + extraLength;
    const compressed = this.bytes.slice(start, start + entry.compressedSize);

    if (entry.compressionMethod === 0) return compressed;
    if (entry.compressionMethod !== 8) {
      throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${name}.`);
    }

    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser does not support local ZIP decompression.');
    }

    const stream = new Blob([compressed]).stream().pipeThrough(
      new DecompressionStream('deflate-raw' as CompressionFormat),
    );
    const result = new Uint8Array(await new Response(stream).arrayBuffer());

    if (entry.uncompressedSize && result.byteLength !== entry.uncompressedSize) {
      console.warn(`Unexpected uncompressed size for ${name}.`);
    }
    return result;
  }

  async readText(name: string): Promise<string> {
    return new TextDecoder('utf-8').decode(await this.readBytes(name));
  }
}
