/* tslint:disable */
/* eslint-disable */
/**
* @param {string} canvas
*/
export function make_waterfall(canvas: string): void;
/**
* @param {string} canvas
*/
export function make_waterfall_with_ui(canvas: string): void;
/**
* Gives the maia-wasm version as a `String`.
* @returns {string}
*/
export function maia_wasm_version(): string;
/**
* Gives the version of the git repository as a `String`.
* @returns {string}
*/
export function maia_wasm_git_version(): string;
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
  readonly make_waterfall_with_ui: (a: number, b: number, c: number) => void;
  readonly maia_wasm_version: (a: number) => void;
  readonly maia_wasm_git_version: (a: number) => void;
  readonly start: () => void;
  readonly maia_wasm_start: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h0c596325967f6c77: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h930468a8fcebc8cc: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h932abab7cf4bdee2: (a: number, b: number) => number;
  readonly _dyn_core__ops__function__Fn__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h24e04260ec50b3af: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hd468912a4bf555ef: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h83939ffc2866bfe8: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h2aae8203f6ec6e78: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
