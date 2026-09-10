import {
  initializeFeatureDiscovery,
  markFeatureSeen,
} from '../src/lib/featureDiscovery.ts';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS  ${message}`);
};

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  clear() { this.#data.clear(); }
}

globalThis.window = { localStorage: new MemoryStorage() };

let state = initializeFeatureDiscovery('0.3.0-dev.15', false);
assert(state.newFeatures.length === 0, 'fresh dev.15 install does not pretend an existing feature is newly updated');

window.localStorage.clear();
state = initializeFeatureDiscovery('0.3.0-dev.15', true);
assert(state.previousVersion === '0.3.0-dev.14', 'returning dev.14 user is migrated into feature discovery');
assert(state.newFeatures.includes('history'), 'History is announced as new after dev.14 -> dev.15');
state = initializeFeatureDiscovery('0.3.0-dev.15', true);
assert(state.newFeatures.includes('history'), 'History NEW state survives restart until the feature is actually opened');

markFeatureSeen('history', '0.3.0-dev.15');
state = initializeFeatureDiscovery('0.3.0-dev.15', true);
assert(!state.newFeatures.includes('history'), 'History NEW marker clears after the feature is opened');
