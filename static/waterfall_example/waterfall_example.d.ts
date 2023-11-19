/* tslint:disable */
/* eslint-disable */
/**
* @param {string} canvas
*/
export function make_waterfall(canvas: string): void;
/**
* Initialize the wasm module.
*
* This function is set to run as soon as the wasm module is instantiated. It
* applies some settings that are needed for all kinds of usage of
* `maia-wasm`. For instance, it sets a panic hook using the
* [`console_error_panic_hook`] crate.
*/
export function start(): void;
/**
* Starts the maia-wasm web application.
*
* This function starts the maia-wasm application. It should be called from
* JavaScript when the web page is loaded. It sets up all the objects and
* callbacks that keep the application running.
*/
export function maia_wasm_start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly make_waterfall: (a: number, b: number, c: number) => void;
  readonly start: () => void;
  readonly maia_wasm_start: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly wasm_bindgen__convert__closures__invoke0_mut__h753980cbd1cbc076: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h976f10506cfdcd54: (a: number, b: number) => number;
  readonly _dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h27ab54773cbdf6c0: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures__invoke1__h17db849b883ffabd: (a: number, b: number, c: number) => void;
  readonly wasm_bindgen__convert__closures__invoke1_mut__h8e72ed99db1a0cc0: (a: number, b: number, c: number) => void;
  readonly wasm_bindgen__convert__closures__invoke1_mut__haa33983119709e8b: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h1ea8417eb6b6165e: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
