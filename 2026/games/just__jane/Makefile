CXX := em++

TARGET := sakura_samurai.html

SRC_DIR := src
OBJ_DIR := build/web

# RAYLIB_DIR := ../just-packages/raylib-web/raylib
RAYLIB_DIR := ../../examples/example_raylib

CPPFLAGS := \
  -I$(SRC_DIR) \
  -isystem $(RAYLIB_DIR)/raylib/src \
  -Iinclude

CXXFLAGS := -std=c++23 -Wall -Wextra -O2 -DPLATFORM_WEB -Wno-unused-parameter -Wno-unused-argument -sFETCH

LDFLAGS := \
  $(RAYLIB_DIR)/libraylib.a \
  -s USE_GLFW=3 \
  -s ASYNCIFY \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s ASSERTIONS=1 \
	--preload-file assets

APP_SRCS := $(shell find $(SRC_DIR) -name '*.cpp')

all: $(TARGET)

$(TARGET): $(APP_SRCS)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -o $@ $^ $(LDFLAGS)

clean:
	rm -rf $(OBJ_DIR) $(TARGET) sakura_samurai.js sakura_samurai.wasm sakura_samurai.data .cache

serve: $(TARGET)
	emrun --no_browser --port 8080 .

.PHONY: all clean serve
