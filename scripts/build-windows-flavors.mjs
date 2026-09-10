import { copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

if (process.platform !== 'win32') {
  console.error('PrintGuardian Windows flavor packaging must run on Windows.');
  process.exit(2);
}

const root = process.cwd();
const npm = 'npm.cmd';
const releaseVersion = (await readFile(resolve(root, 'VERSION'), 'utf8')).trim();
const scratch = resolve(root, 'release-build', 'windows');
const portableScratch = resolve(scratch, 'PrintGuardian-portable.exe');
const defaultOut = resolve(root, 'release-out', `PrintGuardian-v${releaseVersion}-Windows-x64`);

const run = (command, args) => new Promise((resolveRun, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: false });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)));
});

await rm(scratch, { recursive: true, force: true });
await mkdir(scratch, { recursive: true });

console.log('\n[1/3] Building portable desktop executable...');
await run(npm, ['run', 'tauri:build:portable']);
const portableSource = resolve(root, 'src-tauri', 'target', 'release', 'printguardian.exe');
await copyFile(portableSource, portableScratch);

console.log('\n[2/3] Building installed NSIS edition...');
await run(npm, ['run', 'tauri:build:installer']);
const nsisDir = resolve(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
const nsisFiles = (await readdir(nsisDir)).filter((name) => name.toLowerCase().endsWith('.exe') && name.toLowerCase().includes('setup'));
if (nsisFiles.length !== 1) {
  throw new Error(`Expected exactly one NSIS setup executable in ${nsisDir}, found ${nsisFiles.length}: ${nsisFiles.join(', ')}`);
}
const installerSource = resolve(nsisDir, nsisFiles[0]);

console.log('\n[3/3] Staging clean user-facing Windows folder...');
await run(process.execPath, [
  'scripts/stage-windows-release.mjs',
  '--portable', portableScratch,
  '--installer', installerSource,
  '--out', defaultOut,
]);

console.log(`\nPrintGuardian Windows package staged at:\n${defaultOut}`);
console.log('Portable and installer are separate builds from the same source; the app can identify its distribution mode at runtime.');
