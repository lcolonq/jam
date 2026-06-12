import * as __wbg_star0 from './snippets/teleia-727bf4351691f1c8/src/helpers.js';

const lAudioContext = (typeof AudioContext !== 'undefined' ? AudioContext : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : undefined));
let wasm;

function isLikeNone(x) {
    return x === undefined || x === null;
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_1.set(idx, obj);
    return idx;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_6.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_6.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

export function lose_life() {
    wasm.lose_life();
}

export function main_js() {
    wasm.main_js();
}

function __wbg_adapter_34(arg0, arg1, arg2) {
    wasm.closure112_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_37(arg0, arg1, arg2, arg3) {
    wasm.closure116_externref_shim(arg0, arg1, arg2, arg3);
}

function __wbg_adapter_40(arg0, arg1, arg2) {
    wasm.closure114_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_43(arg0, arg1, arg2) {
    wasm.closure522_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_54(arg0, arg1) {
    wasm._dyn_core_34211b08701b9ee6___ops__function__FnMut_____Output______as_wasm_bindgen_281264ddc8baceeb___closure__WasmClosure___describe__invoke______(arg0, arg1);
}

function __wbg_adapter_57(arg0, arg1, arg2) {
    wasm.closure597_externref_shim(arg0, arg1, arg2);
}

const __wbindgen_enum_VisibilityState = ["hidden", "visible"];

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_Window_781446b33bfaba10 = function(arg0) {
        const ret = arg0.Window;
        return ret;
    };
    imports.wbg.__wbg_abort_cac984b033708f40 = function(arg0) {
        arg0.abort();
    };
    imports.wbg.__wbg_activeElement_5dbdf743acf25253 = function(arg0) {
        const ret = arg0.activeElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_activeTexture_26aec0bcc8d3ecf1 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_activeTexture_60b5ab2d38535679 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_addEventListener_bcd3fce3779e3548 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_addListener_06d657e7b63c7bd4 = function() { return handleError(function (arg0, arg1) {
        arg0.addListener(arg1);
    }, arguments) };
    imports.wbg.__wbg_altKey_378bd422ca39ff93 = function(arg0) {
        const ret = arg0.altKey;
        return ret;
    };
    imports.wbg.__wbg_altKey_64c14e853146b6ff = function(arg0) {
        const ret = arg0.altKey;
        return ret;
    };
    imports.wbg.__wbg_appendChild_2828421c2ee9ee9a = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.appendChild(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_attachShader_5e2b3217836a1ed6 = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_attachShader_68ef536b2907f096 = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_bindAttribLocation_8b5a305df194de44 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bindAttribLocation_bd4a5c4802cbe3e2 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bindBuffer_7435f89e1ba2d801 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindBuffer_91c68cb76c2d0637 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_4ea71f4a94f62e64 = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_eda442467b138423 = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_6bd5e3517d4509d5 = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_eb40f80f4de36341 = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_a2d8556d60a99641 = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_f3b632fc9da52d0f = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindVertexArrayOES_5e9de25c9975b0b0 = function(arg0, arg1) {
        arg0.bindVertexArrayOES(arg1);
    };
    imports.wbg.__wbg_bindVertexArray_ef8c879d6b8b7b36 = function(arg0, arg1) {
        arg0.bindVertexArray(arg1);
    };
    imports.wbg.__wbg_blendEquationSeparate_1df823b01a5a1916 = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendEquationSeparate_fb702d818a53462e = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_dc0d952cb0fff605 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_e026e1b80d46d46b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blockSize_f9051c32170d7220 = function(arg0) {
        const ret = arg0.blockSize;
        return ret;
    };
    imports.wbg.__wbg_body_b98fb06e57a78537 = function(arg0) {
        const ret = arg0.body;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_bufferData_073fb84f8a689bb1 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_f5cf73e0d13855ad = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_buffer_231ea43a506cb537 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_291b8e2ff43870af = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_button_61dde9d82c55ffc3 = function(arg0) {
        const ret = arg0.button;
        return ret;
    };
    imports.wbg.__wbg_buttons_dd38ed576eb7b4d1 = function(arg0) {
        const ret = arg0.buttons;
        return ret;
    };
    imports.wbg.__wbg_call_7d56a9e01f3eb909 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_f3f2fb3f9a357aac = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_cancelAnimationFrame_75506c6fbbc72603 = function() { return handleError(function (arg0, arg1) {
        arg0.cancelAnimationFrame(arg1);
    }, arguments) };
    imports.wbg.__wbg_cancelIdleCallback_2f332d1636e57549 = function(arg0, arg1) {
        arg0.cancelIdleCallback(arg1 >>> 0);
    };
    imports.wbg.__wbg_catch_c8a23c6e3a06a914 = function(arg0, arg1) {
        const ret = arg0.catch(arg1);
        return ret;
    };
    imports.wbg.__wbg_checkFramebufferStatus_2ac28e4736d3ccf4 = function(arg0, arg1) {
        const ret = arg0.checkFramebufferStatus(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_checkFramebufferStatus_cffd5b7b7d57a578 = function(arg0, arg1) {
        const ret = arg0.checkFramebufferStatus(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_clearColor_2314181d57ccce89 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearColor_bb0bbeeaf57eb676 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearDepth_1a630e6621266ec3 = function(arg0, arg1) {
        arg0.clearDepth(arg1);
    };
    imports.wbg.__wbg_clearDepth_44e545bc706ce9f8 = function(arg0, arg1) {
        arg0.clearDepth(arg1);
    };
    imports.wbg.__wbg_clearTimeout_a25910639cd38306 = function(arg0, arg1) {
        arg0.clearTimeout(arg1);
    };
    imports.wbg.__wbg_clear_3922dfefa0451b78 = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_clear_fa069f253630db40 = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_close_be39df300fe3697e = function(arg0) {
        arg0.close();
    };
    imports.wbg.__wbg_code_90a02d31ec6d3baa = function(arg0, arg1) {
        const ret = arg1.code;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_compileShader_2895468a12e38f54 = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_compileShader_859f6cd1429c87de = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_connect_3539822fa5177d7b = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.connect(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_contains_68609d7debfe747d = function(arg0, arg1) {
        const ret = arg0.contains(arg1);
        return ret;
    };
    imports.wbg.__wbg_contentRect_7eca7b7e12b27424 = function(arg0) {
        const ret = arg0.contentRect;
        return ret;
    };
    imports.wbg.__wbg_createBufferSource_cc40ac9d355e5258 = function() { return handleError(function (arg0) {
        const ret = arg0.createBufferSource();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createBuffer_8bcb37bf62b523cc = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createBuffer_e53bdaa2a7565c6e = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createElement_aa4cd252213e908d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.createElement(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createFramebuffer_d12233b1c6edc076 = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createFramebuffer_de6816497fb956fd = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createGain_b80c92fb60246cef = function() { return handleError(function (arg0) {
        const ret = arg0.createGain();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createProgram_5dccc40f634d5988 = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createProgram_f4b99fba6c325981 = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderbuffer_96bc1c04ba5ac881 = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderbuffer_a5b7ebb5959b19aa = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createShader_339a85b64343eea8 = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createShader_70f95d6514e02a93 = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_10548ad80997b1bc = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_ed718dd5da601a70 = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArrayOES_df0e9d12c4524fd9 = function(arg0) {
        const ret = arg0.createVertexArrayOES();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArray_78cafa30d8e06fa9 = function(arg0) {
        const ret = arg0.createVertexArray();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_crypto_8b2f439d7d40e47c = function(arg0) {
        const ret = arg0.crypto;
        return ret;
    };
    imports.wbg.__wbg_ctrlKey_65e911a45a44fca1 = function(arg0) {
        const ret = arg0.ctrlKey;
        return ret;
    };
    imports.wbg.__wbg_ctrlKey_84ced3e1fefce55f = function(arg0) {
        const ret = arg0.ctrlKey;
        return ret;
    };
    imports.wbg.__wbg_cullFace_2953fb46d5b8bba9 = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_cullFace_e468740ec7c93438 = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_currentTime_32f30467e7da167a = function(arg0) {
        const ret = arg0.currentTime;
        return ret;
    };
    imports.wbg.__wbg_debug_4620f342436d9aaf = function(arg0) {
        console.debug(arg0);
    };
    imports.wbg.__wbg_decodeAudioData_d17353e0e3be205b = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.decodeAudioData(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_defaultView_f6aecea05f1a2709 = function(arg0) {
        const ret = arg0.defaultView;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_deleteShader_2a18e11def569941 = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deleteShader_5367d670e248a5c2 = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deltaMode_3d1443c229379c80 = function(arg0) {
        const ret = arg0.deltaMode;
        return ret;
    };
    imports.wbg.__wbg_deltaX_48a01b6c97029eea = function(arg0) {
        const ret = arg0.deltaX;
        return ret;
    };
    imports.wbg.__wbg_deltaY_c382db3702368801 = function(arg0) {
        const ret = arg0.deltaY;
        return ret;
    };
    imports.wbg.__wbg_depthFunc_969f9b8135239111 = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_depthFunc_da45f61226e4b4a4 = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_destination_32162fab9a5e9535 = function(arg0) {
        const ret = arg0.destination;
        return ret;
    };
    imports.wbg.__wbg_detachShader_a9f803a0d79c976b = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_detachShader_f40463e1eac30e78 = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_devicePixelContentBoxSize_28f63859121983ff = function(arg0) {
        const ret = arg0.devicePixelContentBoxSize;
        return ret;
    };
    imports.wbg.__wbg_devicePixelRatio_addfbb036c77db00 = function(arg0) {
        const ret = arg0.devicePixelRatio;
        return ret;
    };
    imports.wbg.__wbg_disconnect_be4523bd8a5dd2b7 = function(arg0) {
        arg0.disconnect();
    };
    imports.wbg.__wbg_disconnect_dacfbbb0b711bb25 = function(arg0) {
        arg0.disconnect();
    };
    imports.wbg.__wbg_document_f91f41ba5741d668 = function(arg0) {
        const ret = arg0.document;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_drawArrays_57b979507cbbaceb = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawArrays_8704f0a8625df25d = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawBuffersWEBGL_35be902894f1eb3a = function(arg0, arg1) {
        arg0.drawBuffersWEBGL(arg1);
    };
    imports.wbg.__wbg_drawBuffers_572b596f932b5925 = function(arg0, arg1) {
        arg0.drawBuffers(arg1);
    };
    imports.wbg.__wbg_drawElements_1242993870ab4076 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_509e7066b6d0a352 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_enableVertexAttribArray_3055e61d5d461474 = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enableVertexAttribArray_3db9c5a6be741149 = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_c60d43e1cf8dd14f = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_ec796d4b5e7b0e3e = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_error_52f6102fb15fdc04 = function(arg0) {
        console.error(arg0);
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_error_b9d0db5114b81cc9 = function(arg0, arg1) {
        console.error(arg0, arg1);
    };
    imports.wbg.__wbg_focus_dd469f24246d5b00 = function() { return handleError(function (arg0) {
        arg0.focus();
    }, arguments) };
    imports.wbg.__wbg_framebufferRenderbuffer_21051f565ecae110 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferRenderbuffer_9cee57cb6ecc9b62 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferTexture2D_278cf83d039dad11 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTexture2D_94d884c8391d8856 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_fullscreenElement_8c60dad2d19a9fa8 = function(arg0) {
        const ret = arg0.fullscreenElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_gain_0d848eb62b9371c6 = function(arg0) {
        const ret = arg0.gain;
        return ret;
    };
    imports.wbg.__wbg_generateMipmap_78fc7c0f7c060e2e = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_generateMipmap_f80ac6143613a8bb = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_getActiveUniform_c4f1b7acc1db944b = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniform_e20fcbc139c12bd9 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getCoalescedEvents_7f0d3461c0323c5b = function(arg0) {
        const ret = arg0.getCoalescedEvents();
        return ret;
    };
    imports.wbg.__wbg_getCoalescedEvents_c7e4ef019798f464 = function(arg0) {
        const ret = arg0.getCoalescedEvents;
        return ret;
    };
    imports.wbg.__wbg_getComputedStyle_8cf728444359e9ea = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getComputedStyle(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_27b4637ef34de5f6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getElementById_8869830d1fb2c832 = function(arg0, arg1, arg2) {
        const ret = arg0.getElementById(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getExtension_87c35d439d6099a2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getExtension(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getOwnPropertyDescriptor_04d86fdf3c0fd21b = function(arg0, arg1) {
        const ret = Object.getOwnPropertyDescriptor(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_getParameter_76f981d9979eebfd = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getParameter(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getProgramInfoLog_38e9f1d034f8be74 = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramInfoLog_6e111269b5c263ba = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramParameter_c5b5f64aee8cb9f0 = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getProgramParameter_f5dd032fd809895e = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getPropertyValue_683f34bec6d4d02a = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.getPropertyValue(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_7b17ba35056bcdd1 = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_getShaderInfoLog_331cc4e1a8e8abd8 = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderInfoLog_555491cf2b8ca510 = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderParameter_09d6326087570ca1 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getShaderParameter_f205fffd52d84d39 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getSupportedExtensions_7e78764a8362d1b0 = function(arg0) {
        const ret = arg0.getSupportedExtensions();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_8502ed11c6ae8d03 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_cfaec7113dec0334 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_cd14550e1d81d435 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_globalThis_e113b880925b8d2c = function() { return handleError(function () {
        const ret = globalThis.globalThis;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_global_11697d819aee3b52 = function() { return handleError(function () {
        const ret = global.global;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_height_c5ff4d8ea283bcca = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_info_c19ba9dd1ed747af = function(arg0) {
        console.info(arg0);
    };
    imports.wbg.__wbg_inlineSize_77c9c53cb822416c = function(arg0) {
        const ret = arg0.inlineSize;
        return ret;
    };
    imports.wbg.__wbg_innerHeight_5e0429917f5eb00c = function() { return handleError(function (arg0) {
        const ret = arg0.innerHeight;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_innerWidth_eef92e28bfe9d93f = function() { return handleError(function (arg0) {
        const ret = arg0.innerWidth;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_instanceof_HtmlCanvasElement_4ea840ebf8b4898a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLCanvasElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGl2RenderingContext_5be3106c642b11c5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGL2RenderingContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_629fd7c8d79b2944 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_isIntersecting_86d72c57fe220776 = function(arg0) {
        const ret = arg0.isIntersecting;
        return ret;
    };
    imports.wbg.__wbg_is_7269798d5a3c2dfa = function(arg0, arg1) {
        const ret = Object.is(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_key_2a87c0c4acd4a12e = function(arg0, arg1) {
        const ret = arg1.key;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_length_c866a78f58329364 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_linkProgram_2fdf18368478f071 = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_linkProgram_6d472fb940c6fadf = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_location_b1a2fb0ccfc7b00c = function(arg0) {
        const ret = arg0.location;
        return ret;
    };
    imports.wbg.__wbg_log_0cc1b7768397bcfe = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.log(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_log_cb9e190acc5753fb = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.log(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_log_da268e7784a11c3b = function(arg0) {
        console.log(arg0);
    };
    imports.wbg.__wbg_mark_7438147ce31e9d4b = function(arg0, arg1) {
        performance.mark(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_matchMedia_c07def26c32aeb27 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.matchMedia(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_matches_2a86a2a0cb1c5b8d = function(arg0) {
        const ret = arg0.matches;
        return ret;
    };
    imports.wbg.__wbg_measure_fb7825c11612c823 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        let deferred0_0;
        let deferred0_1;
        let deferred1_0;
        let deferred1_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            deferred1_0 = arg2;
            deferred1_1 = arg3;
            performance.measure(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }, arguments) };
    imports.wbg.__wbg_media_a6ccf2daf90ce051 = function(arg0, arg1) {
        const ret = arg1.media;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_metaKey_3435f465fbb27ba1 = function(arg0) {
        const ret = arg0.metaKey;
        return ret;
    };
    imports.wbg.__wbg_metaKey_d30b8af04670ca30 = function(arg0) {
        const ret = arg0.metaKey;
        return ret;
    };
    imports.wbg.__wbg_movementX_52b5d625d7918a34 = function(arg0) {
        const ret = arg0.movementX;
        return ret;
    };
    imports.wbg.__wbg_movementY_ff2a94c38a923ba4 = function(arg0) {
        const ret = arg0.movementY;
        return ret;
    };
    imports.wbg.__wbg_msCrypto_592a45e469d83ced = function(arg0) {
        const ret = arg0.msCrypto;
        return ret;
    };
    imports.wbg.__wbg_name_8f23c94bcd4bf3b4 = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_new_0421ca087df85661 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_26ef0b3cc4cf4d28 = function() { return handleError(function () {
        const ret = new MessageChannel();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_62b6f67828a7d9ff = function() { return handleError(function (arg0) {
        const ret = new IntersectionObserver(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_6d39d98011e499e0 = function() { return handleError(function () {
        const ret = new AbortController();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_new_add56de78b171ec9 = function() { return handleError(function (arg0) {
        const ret = new ResizeObserver(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_e40adef275820cb9 = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_ff1aa1f72a20d2f4 = function() { return handleError(function () {
        const ret = new lAudioContext();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newnoargs_4a2be95ce3446ab3 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_0ff0abac078f90ac = function(arg0, arg1, arg2) {
        const ret = new Uint32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_6c9c1295808bf4e9 = function(arg0, arg1, arg2) {
        const ret = new Int16Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_9ac3d8fe643e76fa = function(arg0, arg1, arg2) {
        const ret = new Int8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_ad293e668a2058e9 = function(arg0, arg1, arg2) {
        const ret = new Float32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_b52e0c33563966cb = function(arg0, arg1, arg2) {
        const ret = new Uint16Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_c69913a685991fa6 = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_e6be0629c660ba3e = function(arg0, arg1, arg2) {
        const ret = new Int32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_d5e8da64130b6189 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_node_6d722617e26f29f2 = function(arg0) {
        const ret = arg0.node;
        return ret;
    };
    imports.wbg.__wbg_now_6f91d421b96ea22a = function(arg0) {
        const ret = arg0.now();
        return ret;
    };
    imports.wbg.__wbg_now_d1b86f5b18c99ab5 = function(arg0) {
        const ret = arg0.now();
        return ret;
    };
    imports.wbg.__wbg_observe_3a41e4483fa90813 = function(arg0, arg1, arg2) {
        arg0.observe(arg1, arg2);
    };
    imports.wbg.__wbg_observe_995ada5f44ee308c = function(arg0, arg1) {
        arg0.observe(arg1);
    };
    imports.wbg.__wbg_observe_d957ea673c9697ce = function(arg0, arg1) {
        arg0.observe(arg1);
    };
    imports.wbg.__wbg_of_21996a757a084be1 = function(arg0) {
        const ret = Array.of(arg0);
        return ret;
    };
    imports.wbg.__wbg_offsetX_cca22992ada210f2 = function(arg0) {
        const ret = arg0.offsetX;
        return ret;
    };
    imports.wbg.__wbg_offsetY_5e3fcf9de68b3a1e = function(arg0) {
        const ret = arg0.offsetY;
        return ret;
    };
    imports.wbg.__wbg_onpointerrawupdate_d7e65c280dee45ba = function(arg0) {
        const ret = arg0.onpointerrawupdate;
        return ret;
    };
    imports.wbg.__wbg_performance_f2a9ed0f007e87fb = function(arg0) {
        const ret = arg0.performance;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_performance_f71bd4abe0370171 = function(arg0) {
        const ret = arg0.performance;
        return ret;
    };
    imports.wbg.__wbg_persisted_783e8471e4363fac = function(arg0) {
        const ret = arg0.persisted;
        return ret;
    };
    imports.wbg.__wbg_pointerId_ddaad8bf5ae30a2d = function(arg0) {
        const ret = arg0.pointerId;
        return ret;
    };
    imports.wbg.__wbg_pointerType_bddb1d76076448e6 = function(arg0, arg1) {
        const ret = arg1.pointerType;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_port1_bdee3914316b93b4 = function(arg0) {
        const ret = arg0.port1;
        return ret;
    };
    imports.wbg.__wbg_port2_6ba18df617ed6ab1 = function(arg0) {
        const ret = arg0.port2;
        return ret;
    };
    imports.wbg.__wbg_postMessage_1715fdbaf9b43940 = function() { return handleError(function (arg0, arg1) {
        arg0.postMessage(arg1);
    }, arguments) };
    imports.wbg.__wbg_postTask_076eee2dd6ca2f6c = function(arg0, arg1, arg2) {
        const ret = arg0.postTask(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_pressure_e7f13c9ed1aae030 = function(arg0) {
        const ret = arg0.pressure;
        return ret;
    };
    imports.wbg.__wbg_preventDefault_5709c63e03c80680 = function(arg0) {
        arg0.preventDefault();
    };
    imports.wbg.__wbg_process_d9ea7ce819197991 = function(arg0) {
        const ret = arg0.process;
        return ret;
    };
    imports.wbg.__wbg_prototype_cd41f5789d244756 = function() {
        const ret = ResizeObserverEntry.prototype;
        return ret;
    };
    imports.wbg.__wbg_queueMicrotask_6c22d88054515cb4 = function(arg0) {
        const ret = arg0.queueMicrotask;
        return ret;
    };
    imports.wbg.__wbg_queueMicrotask_b81e3a75ab81ca62 = function(arg0) {
        queueMicrotask(arg0);
    };
    imports.wbg.__wbg_randomFillSync_e2ae5c896c5ec592 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_removeEventListener_85ad24058aa5c948 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_removeListener_eaddfb5b98a61692 = function() { return handleError(function (arg0, arg1) {
        arg0.removeListener(arg1);
    }, arguments) };
    imports.wbg.__wbg_removeProperty_4707ed2849d04167 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.removeProperty(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_renderbufferStorage_31abd87941f303dc = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
    };
    imports.wbg.__wbg_renderbufferStorage_7ee8ea590632e047 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
    };
    imports.wbg.__wbg_repeat_00f4f65cc3ab81ce = function(arg0) {
        const ret = arg0.repeat;
        return ret;
    };
    imports.wbg.__wbg_requestAnimationFrame_095d73193a319169 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.requestAnimationFrame(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestFullscreen_1c019906e2b813ce = function(arg0) {
        const ret = arg0.requestFullscreen;
        return ret;
    };
    imports.wbg.__wbg_requestFullscreen_84eb00d7fc5c44f7 = function(arg0) {
        const ret = arg0.requestFullscreen();
        return ret;
    };
    imports.wbg.__wbg_requestIdleCallback_2d7168fc01a73f5c = function(arg0) {
        const ret = arg0.requestIdleCallback;
        return ret;
    };
    imports.wbg.__wbg_requestIdleCallback_b6ef4045285df24a = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.requestIdleCallback(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_require_d3a2417979c32e11 = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_resolve_c6d078ec2280b345 = function(arg0) {
        const ret = Promise.resolve(arg0);
        return ret;
    };
    imports.wbg.__wbg_scheduler_344ff4a7a89e57fa = function(arg0) {
        const ret = arg0.scheduler;
        return ret;
    };
    imports.wbg.__wbg_scheduler_dfc2a492974786a1 = function(arg0) {
        const ret = arg0.scheduler;
        return ret;
    };
    imports.wbg.__wbg_self_e2c10f5e6e7cf832 = function() { return handleError(function () {
        const ret = self.self;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setAttribute_c8feee6915e87514 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_setPointerCapture_8be4cb2d83e9028f = function() { return handleError(function (arg0, arg1) {
        arg0.setPointerCapture(arg1);
    }, arguments) };
    imports.wbg.__wbg_setProperty_9a56f92c3dfbaa30 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.setProperty(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_setTimeout_5356cabf3c726313 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_7b1d2540bdb6efc7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setTimeout(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setValueAtTime_2f346ec7108b1f1b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setValueAtTime(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_1413900f9964ccdd = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_3118aa8ca3783bf6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setbuffer_dd7ccdb0446384a2 = function(arg0, arg1) {
        arg0.buffer = arg1;
    };
    imports.wbg.__wbg_setheight_7a4dc0cfb1189753 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_setloopEnd_65fcb971f1091d96 = function(arg0, arg1) {
        arg0.loopEnd = arg1;
    };
    imports.wbg.__wbg_setloopStart_e06af91d87343474 = function(arg0, arg1) {
        arg0.loopStart = arg1;
    };
    imports.wbg.__wbg_setloop_88f908480eda9921 = function(arg0, arg1) {
        arg0.loop = arg1 !== 0;
    };
    imports.wbg.__wbg_setonmessage_66f0b5be843c5e50 = function(arg0, arg1) {
        arg0.onmessage = arg1;
    };
    imports.wbg.__wbg_setwidth_ff6ab8a7515c2299 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_shaderSource_41c22ac7b6cc67a6 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_shaderSource_a64d5270716c7781 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_shiftKey_b0d2e0c03ba64f03 = function(arg0) {
        const ret = arg0.shiftKey;
        return ret;
    };
    imports.wbg.__wbg_shiftKey_ddfbf11a9b2bbc05 = function(arg0) {
        const ret = arg0.shiftKey;
        return ret;
    };
    imports.wbg.__wbg_signal_1b977f5b60bbd3ce = function(arg0) {
        const ret = arg0.signal;
        return ret;
    };
    imports.wbg.__wbg_size_6086a636c6bbdefe = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_start_5a3bf8c7dbeaee4b = function(arg0) {
        arg0.start();
    };
    imports.wbg.__wbg_start_9e2f7f6c26a55fca = function() { return handleError(function (arg0) {
        arg0.start();
    }, arguments) };
    imports.wbg.__wbg_stencilMask_346a33c6b4386b1a = function(arg0, arg1) {
        arg0.stencilMask(arg1 >>> 0);
    };
    imports.wbg.__wbg_stencilMask_dada3773f3d5f226 = function(arg0, arg1) {
        arg0.stencilMask(arg1 >>> 0);
    };
    imports.wbg.__wbg_style_59ace31f3c27e375 = function(arg0) {
        const ret = arg0.style;
        return ret;
    };
    imports.wbg.__wbg_subarray_9cb7e6a147ccc10f = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_texImage2D_7bbd5bdd189a5353 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_a9669b153b340d99 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texParameteri_22b3b2650f39bd55 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameteri_31dfcd4f1f3d13f2 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_then_391d3889eb0a168b = function(arg0, arg1, arg2) {
        const ret = arg0.then(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_then_b8a1d0da2b8e9764 = function(arg0, arg1) {
        const ret = arg0.then(arg1);
        return ret;
    };
    imports.wbg.__wbg_type_0e1dea4f4f5e9e16 = function(arg0) {
        const ret = arg0.type;
        return ret;
    };
    imports.wbg.__wbg_uniform1f_287cc8bccdd449f2 = function(arg0, arg1, arg2) {
        arg0.uniform1f(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1f_43cb1277ef89c92b = function(arg0, arg1, arg2) {
        arg0.uniform1f(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1i_3198ba1461af0074 = function(arg0, arg1, arg2) {
        arg0.uniform1i(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1i_ffa145c175b5b7ff = function(arg0, arg1, arg2) {
        arg0.uniform1i(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2f_5bea39ab26618f3e = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2f(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2f_a8a694a78c30f563 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2f(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2fv_4cc340f9b2b03de2 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2fv_e2ecf742a85cf1ca = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3f_4be2abc952568c1f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3f(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3f_ab656279e1cca47e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3f(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3fv_45252956c3ddbf30 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3fv_a29b4e30b9a1418a = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4f_4713b4466a103dc7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4f_6255a6726a564dd6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniformMatrix4fv_eb6715411374b877 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4fv_f905eeb97e49c806 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_unobserve_5357ef18a7b396d7 = function(arg0, arg1) {
        arg0.unobserve(arg1);
    };
    imports.wbg.__wbg_useProgram_15059789492e5678 = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_useProgram_2bdc5f3ffe48288b = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_versions_c8e8bcb59a0bf647 = function(arg0) {
        const ret = arg0.versions;
        return ret;
    };
    imports.wbg.__wbg_vertexAttribPointer_85b4814ee044c622 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_f23fbd3db35bda1f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_viewport_4239a4641a351c1c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_viewport_5b9e8ee86a76c679 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_visibilityState_a04ed8ff3e2e171a = function(arg0) {
        const ret = arg0.visibilityState;
        return (__wbindgen_enum_VisibilityState.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_warn_c5c288204670fa0d = function(arg0) {
        console.warn(arg0);
    };
    imports.wbg.__wbg_webkitFullscreenElement_987e215aab12de46 = function(arg0) {
        const ret = arg0.webkitFullscreenElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_webkitRequestFullscreen_cdba2299c3040b25 = function(arg0) {
        arg0.webkitRequestFullscreen();
    };
    imports.wbg.__wbg_width_9cbffddbbbaaa2b2 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_window_889524d6cbee00d6 = function() { return handleError(function () {
        const ret = window.window;
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = arg0.original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper3074 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 523, __wbg_adapter_43);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper3075 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 523, __wbg_adapter_43);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper3076 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 523, __wbg_adapter_43);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper3077 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 523, __wbg_adapter_43);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper3078 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 523, __wbg_adapter_43);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper3079 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 523, __wbg_adapter_54);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper3305 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 598, __wbg_adapter_57);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper460 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 113, __wbg_adapter_34);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper462 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 117, __wbg_adapter_37);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper464 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 115, __wbg_adapter_40);
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_1;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports['./snippets/teleia-727bf4351691f1c8/src/helpers.js'] = __wbg_star0;

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('game_lib_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
