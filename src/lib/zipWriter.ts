import { ZipArchive } from './zip';

export type ZipReplacement = {
  name: string;
  bytes: Uint8Array;
};

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_SIGNATURE = 0x06054b50;
const UTF8_FLAG = 0x0800;
const VERSION_20 = 20;
const DOS_EPOCH_DATE = 0x0021; // 1980-01-01
const MAX_UINT16 = 0xffff;
const MAX_UINT32 = 0xffffffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number) {
  new DataView(target.buffer, target.byteOffset, target.byteLength).setUint16(offset, value, true);
}

function writeUint32(target: Uint8Array, offset: number, value: number) {
  new DataView(target.buffer, target.byteOffset, target.byteLength).setUint32(offset, value >>> 0, true);
}

function ensureClassicZip(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_UINT32) {
    throw new Error(`${label} exceeds classic ZIP limits; ZIP64 export is not implemented yet.`);
  }
}

async function compressForZip(bytes: Uint8Array): Promise<{ method: 0 | 8; bytes: Uint8Array }> {
  if (typeof CompressionStream === 'undefined' || bytes.byteLength === 0) return { method: 0, bytes };
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw' as CompressionFormat));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return compressed.byteLength < bytes.byteLength ? { method: 8, bytes: compressed } : { method: 0, bytes };
  } catch {
    return { method: 0, bytes };
  }
}

function concat(parts: Uint8Array[], total: number): Uint8Array {
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

export async function rebuildZipWithReplacement(sourceFile: File, replacement: ZipReplacement): Promise<Uint8Array> {
  const source = await ZipArchive.fromFile(sourceFile);
  if (!source.has(replacement.name)) throw new Error(`ZIP entry not found: ${replacement.name}`);
  if (source.entries.length > MAX_UINT16) throw new Error('ZIP contains too many entries for classic ZIP export.');
  const names = source.names();
  if (new Set(names).size !== names.length) throw new Error('Duplicate ZIP entry names are not supported by the safe exporter yet.');

  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of source.entries) {
    const nameBytes = encoder.encode(entry.name);
    if (nameBytes.byteLength > MAX_UINT16) throw new Error(`ZIP entry name is too long: ${entry.name}`);

    const bytes = entry.name === replacement.name ? replacement.bytes : await source.readBytes(entry.name);
    ensureClassicZip(bytes.byteLength, `ZIP entry ${entry.name}`);
    ensureClassicZip(localOffset, 'ZIP offset');
    const checksum = crc32(bytes);
    const packed = await compressForZip(bytes);
    ensureClassicZip(packed.bytes.byteLength, `Compressed ZIP entry ${entry.name}`);

    const localHeader = new Uint8Array(30 + nameBytes.byteLength);
    writeUint32(localHeader, 0, LOCAL_SIGNATURE);
    writeUint16(localHeader, 4, VERSION_20);
    writeUint16(localHeader, 6, UTF8_FLAG);
    writeUint16(localHeader, 8, packed.method);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, DOS_EPOCH_DATE);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, packed.bytes.byteLength);
    writeUint32(localHeader, 22, bytes.byteLength);
    writeUint16(localHeader, 26, nameBytes.byteLength);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, packed.bytes);

    const centralHeader = new Uint8Array(46 + nameBytes.byteLength);
    writeUint32(centralHeader, 0, CENTRAL_SIGNATURE);
    writeUint16(centralHeader, 4, VERSION_20);
    writeUint16(centralHeader, 6, VERSION_20);
    writeUint16(centralHeader, 8, UTF8_FLAG);
    writeUint16(centralHeader, 10, packed.method);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, DOS_EPOCH_DATE);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, packed.bytes.byteLength);
    writeUint32(centralHeader, 24, bytes.byteLength);
    writeUint16(centralHeader, 28, nameBytes.byteLength);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, localOffset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    localOffset += localHeader.byteLength + packed.bytes.byteLength;
  }

  const centralOffset = localOffset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
  ensureClassicZip(centralOffset, 'Central-directory offset');
  ensureClassicZip(centralSize, 'Central-directory size');

  const eocd = new Uint8Array(22);
  writeUint32(eocd, 0, EOCD_SIGNATURE);
  writeUint16(eocd, 4, 0);
  writeUint16(eocd, 6, 0);
  writeUint16(eocd, 8, source.entries.length);
  writeUint16(eocd, 10, source.entries.length);
  writeUint32(eocd, 12, centralSize);
  writeUint32(eocd, 16, centralOffset);
  writeUint16(eocd, 20, 0);

  const total = centralOffset + centralSize + eocd.byteLength;
  ensureClassicZip(total, 'ZIP output size');
  return concat([...localParts, ...centralParts, eocd], total);
}
