export function js_update_lifetotal(lives) {
    window.parent.postMessage({op: "lifetotal", lives: lives});
}

export function js_ready_to_reset() {
    window.parent.postMessage({op: "readytoreset"});
}

export function js_upload_highscore(score) {
    if (typeof score === "number") {
        let form = FormData();
        form.append("score", score);
        fetch("https://api.colonq.computer/api/jam/2026/score", {
            method: "POST",
            body: form,
        });
    }
}
