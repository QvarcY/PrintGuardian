import {
  compareVersions,
  createSimulatedUpdate,
  parseVersion,
  shouldRunAutomaticCheck,
} from '../src/lib/updateCenter.ts';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS  ${message}`);
};

assert(parseVersion('v0.3.0-preview.1') !== null, 'preview tag parses as SemVer');
assert(compareVersions('0.3.0-dev.14', '0.3.0-dev.13') > 0, 'dev.14 sorts newer than dev.13');
assert(compareVersions('0.3.0-preview.1', '0.3.0-dev.14') > 0, 'preview.1 sorts newer than dev.14');
assert(compareVersions('0.3.0', '0.3.0-preview.9') > 0, 'stable sorts newer than prerelease');
assert(compareVersions('0.4.0-preview.1', '0.3.9') > 0, 'core version precedence is respected');

const simulated = createSimulatedUpdate('0.3.0-dev.14');
assert(simulated.version === '0.3.0-dev.15', 'development notification simulation advances the dev build number');
assert(simulated.simulated === true, 'development candidate is explicitly marked simulated');

assert(shouldRunAutomaticCheck({ automaticChecks: true, lastCheckedAt: null }, Date.now()), 'automatic update check runs when never checked');
assert(!shouldRunAutomaticCheck({ automaticChecks: false, lastCheckedAt: null }, Date.now()), 'automatic update check respects disabled preference');
assert(!shouldRunAutomaticCheck({ automaticChecks: true, lastCheckedAt: new Date().toISOString() }, Date.now()), 'automatic update check is throttled after a recent check');
