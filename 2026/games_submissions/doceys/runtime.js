// Is the game running standalone or in the harness
let is_standalone = false;
// A global reference of the WASM’s memory area so that we can look up pointers
let allocated;
// Global Canvas Object
let canvas;
// Global Canvas Context
let ctx;
// Current Mouse Position in Canvas coordinates
let mouse_position = {
    x: -1,
    y: -1,
};
let mouse_is_down = false;
// Global image cache
const image_cache = new Map();

function init_canvas() {
    canvas = document.getElementById("game_canvas");
    ctx = canvas.getContext("2d");

    canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();

        // Mouse position relative to the canvas
        const relative_x = (event.clientX - rect.left) / rect.width;
        const relative_y = (event.clientY - rect.top) / rect.height;

        // Internal pixel position
        mouse_position.x = Math.round(relative_x * canvas.width);
        mouse_position.y = Math.round(relative_y * canvas.height);
    });

    canvas.onmousedown = (_) => {
        mouse_is_down = true;
    };
    canvas.onmouseup = (event) => {
        mouse_is_down = false;
    };
}

// These are all the functions that we declared as "#foreign" in our Jai code.
// They let you interact with the JS and DOM world from within Jai.
// If you forget to implement one, the Proxy below will log a nice error.
const exported_js_functions = {
    signal_done: (win) => {
        window.parent.postMessage({op: "done", win});
    },

    draw_rect: (x, y, width, height, color_ptr) => {
        // Needed to convert Jai's BigInts to numbers
        [x, y, width, height] = [Number(x), Number(y), Number(width), Number(height)];
        const {r, g, b} = rgb_from_jai_color(color_ptr);

        ctx.fillStyle = `rgb(${r} ${g} ${b})`;
        ctx.fillRect(x, y, width, height);
    },

    draw_image: (x, y, width, height, image_ptr) => {
        [x, y, width, height] = [Number(x), Number(y), Number(width), Number(height)];
        const ptr = Number(image_ptr);

        const memory_view = new DataView(allocated.buffer);
        const count = Number(memory_view.getBigInt64(ptr, true));
        const data_ptr = memory_view.getUint32(ptr + 8, true);

        if (count <= 0 || data_ptr === 0) return;

        // Load image from pointer if it isn't in the cache already
        if (!image_cache.has(data_ptr)) {
            // Create image and add it to the cache
            const image_buffer = new Uint8Array(allocated.buffer, data_ptr, count);
            const image_blob = new Blob([image_buffer], { type: "image/png" });
            const blob_url = URL.createObjectURL(image_blob);

            const image = new Image();
            image.src = blob_url;
            image.is_ready = false;
            image.onload = () => {
                image.is_ready = true;
                URL.revokeObjectURL(blob_url);
            };

            image_cache.set(data_ptr, image);
        }

        const image = image_cache.get(data_ptr);
        if (image && image.is_ready) {
            ctx.drawImage(image, x, y, width, height);
        }
    },

    draw_text: (x, y, font_size, text_ptr, color_ptr, max_width) => {
        [x, y, font_size, max_width] = [Number(x), Number(y), Number(font_size), Number(max_width)];
        const text = js_string_from_jai_string(text_ptr);
        const {r, g, b} = rgb_from_jai_color(color_ptr);

        ctx.fillStyle = `rgb(${r} ${g} ${b})`;
        ctx.font = font_size + "px serif";
        ctx.fillText(text, x, y, max_width);
    },

    get_text_width: (font_size, text_ptr) => {
        ctx.font = Number(font_size) + "px serif";
        const text_metrics = ctx.measureText(js_string_from_jai_string(text_ptr));
        return text_metrics.width;
    },

    clear_rect: (x, y, width, height) => {
        [x, y, width, height] = [Number(x), Number(y), Number(width), Number(height)];
        ctx.clearRect(x, y, width, height);
    },

    clear_canvas: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    // This function "returns" a Struct like the following:
    // struct { width: s64; height: s64; }
    get_canvas_size_struct: (struct_ptr) => {
        const ptr = Number(struct_ptr);

        const memory_view = new DataView(allocated.buffer);
        memory_view.setBigInt64(ptr + 0, BigInt(canvas.width), true);
        memory_view.setBigInt64(ptr + 8, BigInt(canvas.height), true);
    },

    // Same "return" as with "get_canvas_size_struct"
    get_mouse_position: (struct_ptr) => {
        const ptr = Number(struct_ptr);

        const memory_view = new DataView(allocated.buffer);
        memory_view.setBigInt64(ptr + 0, BigInt(mouse_position.x), true);
        memory_view.setBigInt64(ptr + 8, BigInt(mouse_position.y), true);
    },
    is_mouse_down: () => {
        return mouse_is_down;
    },

    // These two need to be implemented for print/write_string and the debugger
    wasm_write_string: (s_count, s_data, to_standard_error) => {
        const string = js_string_from_jai_string_length(s_data, s_count);
        write_to_console_log(string, to_standard_error);
    },
    wasm_debug_break: () => {
        debugger;
    },
}

// Create the environment for the WASM file,
// which includes the exported JS functions for the WASM:
const imports = {
    "env": new Proxy(exported_js_functions, {
        get(target, prop, receiver) {
            if (target.hasOwnProperty(prop)) {
                return target[prop];
            }

            return () => { throw new Error("Missing function: " + prop); };
        },
    }),
}

let last_time_ms = 0;
// Runs the exported frame function at 60 FPS
function frame(timestamp_ms) {
    const delta_time_ms = timestamp_ms - last_time_ms;
    last_time_ms = timestamp_ms;

    if (wasm_instance) {
        wasm_instance.exports.frame(delta_time_ms, timestamp_ms);
    }

    requestAnimationFrame(frame);
}

function init_message_listener() {
    window.addEventListener("message", (event) => {
        switch (event.data.op) {
        case "start":
            wasm_instance.exports.on_signal_start(BigInt(event.data.difficulty));
            window.parent.postMessage({ op: "started", verb: "chinese gopher time (bad)" });
            break;
        default:
            console.log(`Unexpected event: ${event}`);
            break;
        }
    });
}

// Load the WASM file we compiled and start the game.
WebAssembly.instantiateStreaming(fetch("main.wasm"), imports).then(
    (obj) => {
        wasm_instance = obj.instance;
        allocated = obj.instance.exports.memory;
        // Running standalone, outside the Jam harness
        is_standalone = window.self === window.top;

        init_canvas();
        init_message_listener();

        if (is_standalone) {
            const restart_button = document.getElementById("game_restart");
            restart_button.addEventListener("click", (event) => {
                wasm_instance.exports.main(0, BigInt(0));
            });
            restart_button.style.visibility = "visible";

            wasm_instance.exports.main(0, BigInt(0));
        }

        window.parent.postMessage({ op: "ready" });
        requestAnimationFrame(frame);
    }
);

const text_decoder = new TextDecoder("utf-8");
function js_string_from_jai_string_length(pointer, length) {
    const u8 = new Uint8Array(allocated.buffer)
    const bytes = u8.subarray(Number(pointer), Number(pointer) + Number(length));
    return text_decoder.decode(bytes);
}

function js_string_from_jai_string(pointer) {
    const ptr = Number(pointer);

    const memory_view = new DataView(allocated.buffer);
    const length = Number(memory_view.getBigInt64(ptr, true));
    const data_ptr = memory_view.getUint32(ptr + 8, true);

    const u8 = new Uint8Array(allocated.buffer);
    const bytes = u8.subarray(Number(data_ptr), Number(data_ptr) + Number(length));

    return text_decoder.decode(bytes);
}

function rgb_from_jai_color(color_ptr) {
    const ptr = Number(color_ptr);
    const memory_view = new DataView(allocated.buffer);

    // Read the colors from the pointer
    const r = memory_view.getUint8(ptr + 0);
    const g = memory_view.getUint8(ptr + 1);
    const b = memory_view.getUint8(ptr + 2);

    return {r, g, b};
}

// console.log and console.error always add newlines so we need to buffer the output from write_string
// to simulate a more basic I/O behavior. We’ll flush it after a certain time so that you still
// see the last line if you forget to terminate it with a newline for some reason.
let console_buffer = "";
let console_buffer_is_standard_error;
let console_timeout;
const FLUSH_CONSOLE_AFTER_MS = 3;

function write_to_console_log(str, to_standard_error) {
    if (console_buffer && console_buffer_is_standard_error != to_standard_error) {
        flush_buffer();
    }

    console_buffer_is_standard_error = to_standard_error;
    const lines = str.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
        console_buffer += lines[i];
        flush_buffer();
    }

    console_buffer += lines[lines.length - 1];

    clearTimeout(console_timeout);
    if (console_buffer) {
        console_timeout = setTimeout(() => {
            flush_buffer();
        }, FLUSH_CONSOLE_AFTER_MS);
    }

    function flush_buffer() {
        if (!console_buffer) return;

        if (console_buffer_is_standard_error) {
            console.error(console_buffer);
        } else {
            console.log(console_buffer);
        }

        console_buffer = "";
    }
}
