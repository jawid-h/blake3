const { provideWasm } = require('./esm/browser/wasm.js');
const loadWasm = require('./dist/wasm/web/blake3_js.js');
const blake3 = require('./esm/browser/index.js');

let cached;

/**
 * Manually loads the WebAssembly module, returning a promise that resolves
 * to the BLAKE3 implementation once available.
 */
module.exports = async function load() {
  if (!cached) {
    await loadWasm.init();

    provideWasm(loadWasm);

    cached = blake3;
  }

  return cached;
};
