const fs = require('fs');
const path = require('path');

const LOADER_FILE_PATH = path.join('.', 'dist', 'wasm', 'web', 'blake3_js.js');
const WASM_FILE_PATH = path.join('.', 'dist', 'wasm', 'web', 'blake3_js_bg.wasm');

/**
 * Get `init` function body
 * @param {string} wasmFilePath
 * @returns {string}
 */
function getInitFunctionBody(wasmFilePath) {
  const wasm = fs.readFileSync(wasmFilePath);
  const wasmBase = wasm.toString('base64');

  return `
async function init() {
  const imports = {};

  imports.wbg = {};
  imports.wbg.__wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
  };

  const wasmBuffer = Buffer.from('${wasmBase}', 'base64');

  if (process.browser) {
    const blob = new Blob([wasmBuffer], { type: 'application/wasm' });
    const wasmUrl = URL.createObjectURL(blob);
    input = await fetch(wasmUrl);
  } else {
    input = wasmBuffer;
  }

  const { instance } = await load(input, imports);

  wasm = instance.exports;
}
  `;
}

async function patchLoader() {
  const loaderFileBody = fs.readFileSync(LOADER_FILE_PATH, 'utf8');

  let result = loaderFileBody.replace(
    /^async function init\s*([\w$]*)\s*\(([\w\s,$]*)\)\s*\{([\w\W\s\S]*)\}$/m,
    getInitFunctionBody(WASM_FILE_PATH),
  );

  result = result.replace(/export function/g, 'function');
  result = result.replace(/export class/g, 'class');

  result = result.replace(
    /export default init;/,
    `
module.exports = {
  hash,
  create_hasher,
  create_keyed,
  create_derive,
  Blake3Hash,
  HashReader,
  init,
};
    `,
  );

  fs.writeFileSync(LOADER_FILE_PATH, result);
}

patchLoader()
  .then(() => console.log('loader patched successfully'))
  .catch(e => console.log(e));
