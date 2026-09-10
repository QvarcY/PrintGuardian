import {
  compareVersions,
  createSimulatedUpdate,
  extractReleaseHighlights,
  isCandidateNewer,
  parseVersion,
  shouldRunAutomaticCheck,
} from '../src/lib/updateCenter.ts';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS  ${message}`);
};

assert(parseVersion('v0.3.0-preview.1') !== null, 'preview tag parses as SemVer');
assert(compareVersions('0.3.0-dev.15', '0.3.0-dev.14') > 0, 'dev.15 sorts newer than dev.14');
assert(compareVersions('0.3.0-preview.1', '0.3.0-dev.14') > 0, 'preview.1 sorts newer than dev.14');
assert(compareVersions('0.3.0', '0.3.0-preview.9') > 0, 'stable sorts newer than prerelease');
assert(compareVersions('0.4.0-preview.1', '0.3.9') > 0, 'core version precedence is respected');

const simulated = createSimulatedUpdate('0.3.0-dev.15');
assert(simulated.version === '0.3.0-dev.16', 'development notification simulation advances the dev build number');
assert(simulated.simulated === true, 'development candidate is explicitly marked simulated');

assert(shouldRunAutomaticCheck({ automaticChecks: true, lastCheckedAt: null }, Date.now()), 'automatic update check runs when never checked');
assert(!shouldRunAutomaticCheck({ automaticChecks: false, lastCheckedAt: null }, Date.now()), 'automatic update check respects disabled preference');
assert(!shouldRunAutomaticCheck({ automaticChecks: true, lastCheckedAt: new Date().toISOString() }, Date.now()), 'automatic update check is throttled after a recent check');

const highlights = extractReleaseHighlights('## What\'s new\n- History panel\n- Better update guidance\n## Fixes\n- ignored');
assert(highlights.length === 2 && highlights[0] === 'History panel', 'release-note highlights are extracted from the What\'s new section');

assert(isCandidateNewer(simulated, '0.3.0-dev.15'), 'a simulated dev.16 candidate is newer than dev.15');
assert(!isCandidateNewer({ ...simulated, version: '0.3.0-dev.15' }, '0.3.0-dev.15'), 'a cached candidate equal to the running version is ignored after upgrade');
assert(!isCandidateNewer({ ...simulated, version: '0.3.0-dev.14' }, '0.3.0-dev.15'), 'a stale cached candidate older than the running version is ignored');
