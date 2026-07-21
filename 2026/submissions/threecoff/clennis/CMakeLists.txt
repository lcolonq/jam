cmake_minimum_required(VERSION 3.16)
project(clonk_tennis C)

set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON) # for clangd (see .clangd)

if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
    set(CMAKE_BUILD_TYPE Debug CACHE STRING "" FORCE)
endif()

include(FetchContent)

# --- raylib: windowing, rendering, input (native + web) ---
set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(BUILD_GAMES    OFF CACHE BOOL "" FORCE)
FetchContent_Declare(
    raylib
    URL https://github.com/raysan5/raylib/archive/refs/tags/5.5.tar.gz
)

# --- box3d: 3D rigid body physics (Erin Catto). Only the library builds via
#     FetchContent: its samples/tests (and their forced -pthread) are gated
#     behind PROJECT_IS_TOP_LEVEL, and it sets its own SIMD flags for wasm. ---
FetchContent_Declare(
    box3d
    URL https://github.com/erincatto/box3d/archive/refs/tags/v0.1.0.tar.gz
)

FetchContent_MakeAvailable(raylib box3d)

add_executable(tennis src/main.c)
target_link_libraries(tennis PRIVATE raylib box3d::box3d)

if(NOT EMSCRIPTEN)
    # main.c pokes GLFW directly (glfwSetInputMode, to undo raylib's
    # raw-mouse-motion default); use the GLFW bundled inside raylib.
    target_include_directories(tennis PRIVATE
        "${raylib_SOURCE_DIR}/src/external/glfw/include")
endif()

# Where the game finds its models at runtime: baked into the wasm bundle on
# web, read straight from the source tree natively (dev builds only).
if(EMSCRIPTEN)
    target_compile_definitions(tennis PRIVATE ASSETS_DIR="assets")
else()
    target_compile_definitions(tennis PRIVATE ASSETS_DIR="${CMAKE_CURRENT_SOURCE_DIR}/assets")
endif()

if(EMSCRIPTEN)
    # Work around an LLVM optimizer crash in emcc's clang (6.0.3) that segfaults
    # while compiling some Box3D files at -O2/-O3 (independent of SIMD). Build the
    # physics library at -O1 on web; it's more than fast enough for this game.
    # The trailing -O1 wins over the build-type -O3 for this target only.
    if(TARGET box3d)
        target_compile_options(box3d PRIVATE -O1)
    endif()

    # Produce tennis.html + tennis.js + tennis.wasm
    set_target_properties(tennis PROPERTIES SUFFIX ".html")
    target_compile_definitions(tennis PRIVATE PLATFORM_WEB)
    target_link_options(tennis PRIVATE
        -sUSE_GLFW=3
        -sALLOW_MEMORY_GROWTH=1
        # dr_mp3's whole-file decode (raylib LoadSound on .mp3) keeps ~30KB of
        # scratch structs on the stack and overflows Emscripten's 64KB default,
        # crashing at startup with "memory access out of bounds".
        -sSTACK_SIZE=262144
        -sGL_ENABLE_GET_PROC_ADDRESS=1
        # Emscripten 4+ stopped putting the heap views on Module by default,
        # but raylib's miniaudio audio callback reads Module.HEAPF32 — without
        # this every audio tick throws "Cannot read properties of undefined
        # (reading 'buffer')" in the ScriptProcessorNode handler.
        "-sEXPORTED_RUNTIME_METHODS=HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64"
        --shell-file "${CMAKE_CURRENT_SOURCE_DIR}/shell.html"
        --preload-file "${CMAKE_CURRENT_SOURCE_DIR}/assets@assets"
    )

    # Also expose the page as index.html so a plain directory server's bare
    # URL (e.g. http://localhost:8000/) serves the game, not a file listing.
    add_custom_command(TARGET tennis POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
                "$<TARGET_FILE:tennis>" "${CMAKE_CURRENT_BINARY_DIR}/index.html"
        VERBATIM
    )

    # `cmake --install` publishes just the runtime files (what a web server
    # needs), leaving all the CMake/emscripten machinery in the build dir.
    install(FILES
        "${CMAKE_CURRENT_BINARY_DIR}/index.html"
        "${CMAKE_CURRENT_BINARY_DIR}/tennis.html"
        "${CMAKE_CURRENT_BINARY_DIR}/tennis.js"
        "${CMAKE_CURRENT_BINARY_DIR}/tennis.wasm"
        "${CMAKE_CURRENT_BINARY_DIR}/tennis.data"
        DESTINATION .
        COMPONENT web   # keeps raylib/box3d's own install rules out
    )
endif()
