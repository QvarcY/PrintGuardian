import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = async (name) => readFile(new URL(name, root), 'utf8');
const errors = [];
const pass = (message) => console.log(`PASS  ${message}`);
const fail = (message) => { errors.push(message); console.error(`FAIL  ${message}`); };

const version = (await read('VERSION')).trim();
const packageJson = JSON.parse(await read('package.json'));
const preview = await read('preview.html');
const readme = await read('README.md');
const en = await read('src/locales/en.ts');
const lv = await read('src/locales/lv.ts');
const app = await read('src/App.tsx');
const distribution = await read('docs/DISTRIBUTION.md');
const desktopDoc = await read('docs/DESKTOP.md');
const tauriConfig = JSON.parse(await read('src-tauri/tauri.conf.json'));
const cargoToml = await read('src-tauri/Cargo.toml');

if (packageJson.version === version) pass(`package.json version = ${version}`);
else fail(`package.json (${packageJson.version}) does not match VERSION (${version})`);

if (tauriConfig.version === version) pass(`tauri.conf.json version = ${version}`);
else fail(`tauri.conf.json (${tauriConfig.version}) does not match VERSION (${version})`);

if (new RegExp(`^version\\s*=\\s*\"${version.replaceAll('.', '\\.')}\"$`, 'm').test(cargoToml)) pass(`Cargo.toml version = ${version}`);
else fail(`Cargo.toml package version does not match VERSION (${version})`);

for (const [name, text] of [['preview.html', preview], ['README.md', readme], ['English locale', en], ['Latvian locale', lv]]) {
  if (text.includes(`v${version}`) || (name === 'README.md' && text.includes(`**v${version}**`))) pass(`${name} contains v${version}`);
  else fail(`${name} does not contain v${version}`);
}

if (/accept="\.3mf"/.test(preview) && !/accept="\.3mf,\.gcode/.test(preview)) pass('standalone picker advertises only implemented .3mf input');
else fail('standalone picker advertises unsupported input formats');

const soonVisible = /drīzumā|soon/i.test(preview) && /drīzumā|soon/i.test(app);
const soonClickable = preview.includes("ws10openSoon('history')") && preview.includes("ws10openSoon('settings')") && app.includes("setView('history')") && app.includes("setView('settings')");
if (soonVisible && soonClickable) pass('coming-soon destinations remain explicit and open explanatory surfaces');
else fail('coming-soon destinations are missing or behave like dead navigation');

if (preview.includes('https://buymeacoffee.com/craftin')) pass('Buy Me a Coffee destination is present');
else fail('Buy Me a Coffee destination is missing');

if (readme.includes('pre-release software') && (readme.includes('not** a guarantee') || readme.includes('not a guarantee'))) pass('README keeps explicit preview limitation language');
else fail('README preview limitation language is missing');

if (distribution.includes('PrintGuardian Portable.exe') && distribution.includes('Install PrintGuardian.exe')) pass('portable + installer distribution contract is documented');
else fail('Windows distribution contract is incomplete');

if (desktopDoc.includes('tauri:build:portable') && desktopDoc.includes('tauri:build:installer') && cargoToml.includes('portable = []')) pass('desktop build flavors are documented and declared');
else fail('desktop build flavor contract is incomplete');

if (packageJson.scripts?.['tauri:dev'] && packageJson.scripts?.['package:windows']) pass('desktop development/package scripts are present');
else fail('desktop scripts are missing');

if (tauriConfig.bundle?.windows?.nsis?.installMode === 'currentUser') pass('NSIS defaults to current-user installation');
else fail('NSIS install mode is not currentUser');

const scripts = [...preview.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
try {
  new vm.Script(scripts.join('\n'), { filename: 'preview-inline.js' });
  pass('standalone inline JavaScript parses');
} catch (error) {
  fail(`standalone inline JavaScript syntax error: ${error.message}`);
}

for (const fixture of ['fixtures/bambu-style-smoke-test.3mf', 'fixtures/bambu-style-profile-diff-test.3mf']) {
  try { await access(new URL(fixture, root)); pass(`${fixture} exists`); }
  catch { fail(`${fixture} is missing`); }
}

for (const file of ['SECURITY.md', 'docs/RELEASE_READINESS.md', 'docs/DISTRIBUTION.md', 'docs/DESKTOP.md', 'release/windows/START HERE - SĀC ŠEIT.txt', 'scripts/stage-windows-release.mjs', 'scripts/build-windows-flavors.mjs', 'src-tauri/src/lib.rs', 'src-tauri/capabilities/default.json', '.github/workflows/windows-desktop.yml']) {
  try { await access(new URL(file, root)); pass(`${file} exists`); }
  catch { fail(`${file} is missing`); }
}

if (errors.length) {
  console.error(`\nRelease gate failed with ${errors.length} issue(s).`);
  process.exit(1);
}
console.log('\nRelease gate checks passed. Manual desktop-build, real-file, update, license and clean-Windows blockers remain in docs/RELEASE_READINESS.md.');
