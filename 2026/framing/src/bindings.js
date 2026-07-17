export function js_update_lifetotal(lives) {
    window.parent.postMessage({op: "lifetotal", lives: lives});
}
