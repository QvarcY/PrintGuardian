import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = async (name) => readFile(new URL(name, root), 'utf8');
const errors = [];
const pass = (message) => console.log(`PASS  ${message}`);
const fail = (message) => { errors.push(message); console.error(`FAIL  ${message}`); };

const version = (await read('VERSION')).trim();
const packageJson = JSON.parse(await read('package.json'));
const packageLock = JSON.parse(await read('package-lock.json'));
const preview = await read('preview.html');
const readme = await read('README.md');
const en = await read('src/locales/en.ts');
const lv = await read('src/locales/lv.ts');
const app = await read('src/App.tsx');
const distribution = await read('docs/DISTRIBUTION.md');
const desktopDoc = await read('docs/DESKTOP.md');
const portableStorageDoc = await read('docs/PORTABLE_STORAGE.md');
const desktopRuntime = await read('src/lib/desktopRuntime.ts');
const updateCentre = await read('src/components/UpdateCentreButton.tsx');
const updateModel = await read('src/lib/updateCenter.ts');
const recentProject = await read('src/lib/recentProject.ts');
const projectHistory = await read('src/lib/projectHistory.ts');
const featureDiscovery = await read('src/lib/featureDiscovery.ts');
const historyPanel = await read('src/components/HistoryPanel.tsx');
const feedbackButton = await read('src/components/FeedbackButton.tsx');
const windowsSigning = await read('docs/WINDOWS_SIGNING.md');
const previewReleaseNotes = await read('docs/releases/v0.3.0-preview.1.md');
const dropZone = await read('src/components/DropZone.tsx');
const rustHost = await read('src-tauri/src/lib.rs');
const tauriConfig = JSON.parse(await read('src-tauri/tauri.conf.json'));
const cargoToml = await read('src-tauri/Cargo.toml');

if (packageJson.version === version) pass(`package.json version = ${version}`);
else fail(`package.json (${packageJson.version}) does not match VERSION (${version})`);

if (packageLock.lockfileVersion === 3 && packageLock.version === version && packageLock.packages?.['']?.version === version) pass(`package-lock.json locks ${version} with lockfileVersion 3`);
else fail(`package-lock.json is missing, stale, or does not match VERSION (${version})`);

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

const previewSoonVisible = /drīzumā|soon/i.test(preview) && preview.includes("ws10openSoon('history')") && preview.includes("ws10openSoon('settings')");
const desktopSettingsSoon = app.includes('kind="settings"') && app.includes('soon-badge');
const desktopHistoryLive = app.includes('<HistoryPanel') && app.includes('new-badge') && featureDiscovery.includes("introducedIn: '0.3.0-dev.15'");
if (previewSoonVisible && desktopSettingsSoon && desktopHistoryLive) pass('planned Settings remains explicit while desktop History has graduated to a real NEW feature');
else fail('planned/new-feature navigation state is inconsistent');

if (preview.includes('https://buymeacoffee.com/craftin')) pass('Buy Me a Coffee destination is present');
else fail('Buy Me a Coffee destination is missing');

if (app.includes('<FeedbackButton />') && feedbackButton.includes('Report / suggest') && feedbackButton.includes('issues/new') && feedbackButton.includes('does not attach')) pass('public preview has a visible local-safe problem/idea feedback handoff');
else fail('public preview feedback entry point is missing or unclear');

if (windowsSigning.includes('accepted public-preview limitation') && windowsSigning.includes('SmartScreen') && previewReleaseNotes.includes('does not by itself mean') && previewReleaseNotes.includes('CHECKSUMS.txt')) pass('unsigned preview SmartScreen limitation is explicitly documented');
else fail('unsigned preview SmartScreen disclosure is incomplete');

if (readme.includes('pre-release software') && (readme.includes('not** a guarantee') || readme.includes('not a guarantee'))) pass('README keeps explicit preview limitation language');
else fail('README preview limitation language is missing');

if (distribution.includes('PrintGuardian Portable.exe') && distribution.includes('Install PrintGuardian.exe')) pass('portable + installer distribution contract is documented');
else fail('Windows distribution contract is incomplete');

if (desktopDoc.includes('tauri:build:portable') && desktopDoc.includes('tauri:build:installer') && cargoToml.includes('portable = []')) pass('desktop build flavors are documented and declared');
else fail('desktop build flavor contract is incomplete');


if (Array.isArray(tauriConfig.app?.windows) && tauriConfig.app.windows.length === 0 && rustHost.includes('WebviewWindowBuilder::new') && rustHost.includes('.data_directory(data_directory)')) pass('desktop window is created by Rust with distribution-aware WebView data storage');
else fail('desktop window still bypasses distribution-aware storage setup');

if (rustHost.includes('PrintGuardianData') && rustHost.includes('portable-fallback') && desktopRuntime.includes('portable-fallback') && portableStorageDoc.includes('PrintGuardianData')) pass('portable storage root and explicit fallback state are implemented/documented');
else fail('portable storage contract is incomplete');

if (tauriConfig.app?.security?.csp?.includes('https://api.github.com') && updateModel.includes('api.github.com/repos/QvarcY/PrintGuardian/releases') && updateCentre.includes('Update Centre')) pass('desktop update metadata check is narrowly scoped to GitHub Releases');
else fail('update metadata foundation or CSP scope is missing');

if (updateCentre.includes('createSimulatedUpdate') && updateCentre.includes('Test update notification') && updateCentre.includes('update-handoff')) pass('development update notification simulation and distribution-specific handoff guidance are available');
else fail('update notification test/handoff path is missing');

if (updateModel.includes('extractReleaseHighlights') && updateModel.includes('publishedAt') && updateModel.includes('assetName')) pass('published release metadata is normalized into update notes/highlights');
else fail('published release metadata normalization is incomplete');

if (recentProject.includes('indexedDB') && recentProject.includes("id: 'last'") && dropZone.includes('recentProject') && dropZone.includes('continueRecent')) pass('last-project local resume cache is implemented');
else fail('last-project resume path is missing');

if (projectHistory.includes('MAX_ENTRIES = 20') && projectHistory.includes('recordProjectInspection') && historyPanel.includes('LOKĀLĀ PROJEKTU VĒSTURE') && historyPanel.includes('metadata only')) pass('local bounded project-history summary is implemented without duplicating old 3MF files');
else fail('project history is missing, unbounded, or unclear about file retention');

if (featureDiscovery.includes('initializeFeatureDiscovery') && featureDiscovery.includes('markFeatureSeen') && app.includes("onFeatureSeen('history')")) pass('post-update NEW feature discovery is persistent and clears on actual feature use');
else fail('post-update feature discovery lifecycle is incomplete');

if (updateCentre.includes('createPortal') && updateCentre.includes('update-centre-backdrop') && updateCentre.includes('aria-modal="true"')) pass('Update Centre is isolated in a modal portal');
else fail('Update Centre may visually blend with the underlying workspace');

if (packageJson.scripts?.['tauri:dev'] && packageJson.scripts?.['package:windows']) pass('desktop development/package scripts are present');
else fail('desktop scripts are missing');

const windowsFlavorBuilder = await read('scripts/build-windows-flavors.mjs');
if (windowsFlavorBuilder.includes('process.env.ComSpec') && windowsFlavorBuilder.includes('runNpmScript')) pass('Windows packager invokes npm through the Windows command shell');
else fail('Windows packager may fail to launch npm scripts on Windows');

if (tauriConfig.bundle?.windows?.nsis?.installMode === 'currentUser') pass('NSIS defaults to current-user installation');
else fail('NSIS install mode is not currentUser');

const nsis = tauriConfig.bundle?.windows?.nsis;
if (nsis?.customLanguageFiles?.Latvian === 'windows/Latvian.nsh') pass('NSIS uses project-owned Latvian Tauri strings');
else fail('NSIS Latvian Tauri-specific strings are not configured');

if (nsis?.installerHooks === 'windows/nsis-hooks.nsh') pass('NSIS uninstall discoverability hook is configured');
else fail('NSIS uninstall discoverability hook is missing');

const lvNsis = await read('src-tauri/windows/Latvian.nsh');
if (lvNsis.includes('LangString createDesktop ${LANG_LATVIAN}') && lvNsis.includes('LangString deleteAppData ${LANG_LATVIAN}')) pass('Latvian NSIS desktop/app-data labels are non-empty');
else fail('Latvian NSIS labels are incomplete');

const nsisHooks = await read('src-tauri/windows/nsis-hooks.nsh');
if (nsisHooks.includes('Uninstall ${PRODUCTNAME}.lnk') && nsisHooks.includes('uninstall.exe')) pass('Start Menu uninstall shortcut is created and removable');
else fail('NSIS uninstall shortcut hook is incomplete');

const workflow = await read('.github/workflows/windows-desktop.yml');
if (/actions\/upload-artifact@v(?:6|7)/.test(workflow)) pass('artifact upload action uses Node 24 generation');
else fail('artifact upload action still targets deprecated Node runtime');

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

for (const file of ['SECURITY.md', 'docs/RELEASE_READINESS.md', 'docs/DISTRIBUTION.md', 'docs/DESKTOP.md', 'docs/PORTABLE_STORAGE.md', 'docs/WINDOWS_SIGNING.md', 'release/windows/START HERE - SĀC ŠEIT.txt', 'src-tauri/windows/Latvian.nsh', 'src-tauri/windows/nsis-hooks.nsh', 'scripts/stage-windows-release.mjs', 'scripts/build-windows-flavors.mjs', 'scripts/update-center-smoke.mjs', 'scripts/feature-discovery-smoke.mjs', 'src/lib/recentProject.ts', 'src/lib/projectHistory.ts', 'src/lib/featureDiscovery.ts', 'src/components/HistoryPanel.tsx', 'src/components/HistoryPanel.css', 'src/components/FeedbackButton.tsx', 'docs/releases/v0.3.0-preview.1.md', 'src-tauri/src/lib.rs', 'src-tauri/capabilities/default.json', '.github/workflows/windows-desktop.yml']) {
  try { await access(new URL(file, root)); pass(`${file} exists`); }
  catch { fail(`${file} is missing`); }
}

if (errors.length) {
  console.error(`\nRelease gate failed with ${errors.length} issue(s).`);
  process.exit(1);
}
console.log('\nRelease gate checks passed. Build and smoke-test the exact preview.1 Windows artifact before merge/tag/publication; broader slicer compatibility remains public-preview testing.');
