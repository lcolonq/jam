extends Node

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	JavaScriptBridge.eval("window.parent.postMessage({op: \"ready\"});")

var started = false
# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	if !started && JavaScriptBridge.eval("window.lcolonqJamStart || -1.0") > 0.0:
		started = true
		JavaScriptBridge.eval("window.parent.postMessage({op: \"started\"});")

func _input(event) -> void:
	if event is InputEventMouseButton:
		JavaScriptBridge.eval("window.parent.postMessage({op: \"done\", win: true});")
