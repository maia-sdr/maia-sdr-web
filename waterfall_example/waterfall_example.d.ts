/* tslint:disable */
/* eslint-disable */

/**
 * Gives the version of the git repository as a `String`.
 */
export function maia_wasm_git_version(): string;

/**
 * Starts the maia-wasm web application.
 *
 * This function starts the maia-wasm application. It should be called from
 * JavaScript when the web page is loaded. It sets up all the objects and
 * callbacks that keep the application running.
 */
export function maia_wasm_start(): void;

/**
 * Gives the maia-wasm version as a `String`.
 */
export function maia_wasm_version(): string;

export function make_waterfall(canvas: string): void;

export function make_waterfall_with_ui(canvas: string): void;

/**
 * Initialize the wasm module.
 *
 * This function is set to run as soon as the wasm module is instantiated. It
 * applies some settings that are needed for all kinds of usage of
 * `maia-wasm`. For instance, it sets a panic hook using the
 * [`console_error_panic_hook`] crate.
 */
export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly maia_wasm_git_version: () => [number, number];
    readonly maia_wasm_start: () => [number, number];
    readonly maia_wasm_version: () => [number, number];
    readonly make_waterfall: (a: number, b: number) => [number, number];
    readonly make_waterfall_with_ui: (a: number, b: number) => [number, number];
    readonly start: () => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___f32______true_: (a: number, b: number, c: number) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___js_sys_c22228055748aa61___Function_fn_wasm_bindgen_be2f99e1e9dd2953___JsValue_____wasm_bindgen_be2f99e1e9dd2953___sys__Undefined___js_sys_c22228055748aa61___Function_fn_wasm_bindgen_be2f99e1e9dd2953___JsValue_____wasm_bindgen_be2f99e1e9dd2953___sys__Undefined_______true_: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue__core_37ee0ce0c4cd57d5___result__Result_____wasm_bindgen_be2f99e1e9dd2953___JsError___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue__wasm_bindgen_be2f99e1e9dd2953___JsValue__true__1_: (a: number, b: number, c: any) => any;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue______true_: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue______true__11: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue______true__12: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue______true__13: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue______true__14: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue__true_: (a: number, b: number) => any;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke___wasm_bindgen_be2f99e1e9dd2953___JsValue__true__17: (a: number, b: number) => any;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke_______true_: (a: number, b: number) => void;
    readonly wasm_bindgen_be2f99e1e9dd2953___convert__closures_____invoke_______true__1_: (a: number, b: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
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
