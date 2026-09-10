import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';

const args = process.argv.slice(2);
const value = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const portable = value('--portable');
const installer = value('--installer');
const out = value('--out') || 'release-out/windows';
if (!portable || !installer) {
  console.error('Usage: node scripts/stage-windows-release.mjs --portable <exe> --installer <exe> [--out <dir>]');
  process.exit(2);
}
const root = resolve(out);
await rm(root, { recursive: true, force: true });
await mkdir(root, { recursive: true });
const copy = async (source, name) => {
  const target = resolve(root, name);
  await copyFile(resolve(source), target);
  return target;
};
const portableOut = await copy(portable, 'PrintGuardian Portable.exe');
const installerOut = await copy(installer, 'Install PrintGuardian.exe');
const version = (await readFile(resolve('VERSION'), 'utf8')).trim();
const startGuideTemplate = await readFile(resolve('release/windows/START HERE - SĀC ŠEIT.html'), 'utf8');
const startGuide = startGuideTemplate.replaceAll('{{VERSION}}', version);
await writeFile(resolve(root, 'START HERE - SĀC ŠEIT.html'), startGuide, 'utf8');
try { await copy('LICENSE', 'LICENSE.txt'); } catch {}
const sha = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const lines = [
  `${await sha(portableOut)}  ${basename(portableOut)}`,
  `${await sha(installerOut)}  ${basename(installerOut)}`,
];
await writeFile(resolve(root, 'CHECKSUMS.txt'), `${lines.join('\n')}\n`, 'utf8');
console.log(`Staged clean Windows release folder: ${root}`);
console.log('Top-level choices: PrintGuardian Portable.exe | Install PrintGuardian.exe');
