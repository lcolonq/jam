export function js_update_lifetotal(lives) {
    window.parent.postMessage({op: "lifetotal", lives: lives});
}

export function js_ready_to_reset() {
    window.parent.postMessage({op: "readytoreset"});
}
