#include <cstring>
#include <format>
#include <string>

#include <emscripten/em_types.h>
#include <emscripten/emscripten.h>
#include <emscripten/fetch.h>
#include <emscripten/html5.h>

struct PostData {
  char *body;
};

EM_JS(char *, get_cookie, (const char *name), {
  const cookieName = UTF8ToString(name) + "=";
  const cookies = document.cookie.split(";");

  for (let c of cookies) {
    c = c.trim();

    if (c.startsWith(cookieName)) {
      const value = c.substring(cookieName.length);
      const len = lengthBytesUTF8(value) + 1;
      const buffer = _malloc(len);
      stringToUTF8(value, buffer, len);
      return buffer;
    }
  }

  return 0;
});

void cleanup(emscripten_fetch_t *fetch) {
  auto *data = static_cast<PostData *>(fetch->userData);
  free(data->body);
  delete data;
  emscripten_fetch_close(fetch);
}

void on_success(emscripten_fetch_t *fetch) {
  printf("success: %d\n", fetch->status);
  cleanup(fetch);
}

void on_error(emscripten_fetch_t *fetch) {
  printf("error: %d\n", fetch->status);
  cleanup(fetch);
}

void post_score(int score) {
  auto username = get_cookie("bahms_user_login");
  if (!username) {
    return;
  }

  std::string text = std::format("## {}\nscore: {}", username, score);

  auto *data = new PostData;
  data->body = static_cast<char *>(malloc(text.size()));
  memcpy(data->body, text.data(), text.size());

  emscripten_fetch_attr_t attr;
  emscripten_fetch_attr_init(&attr);

  strcpy(attr.requestMethod, "POST");
  attr.withCredentials = true;

  const char *headers[] = {"Content-Type", "text/plain; charset=utf-8", nullptr};

  attr.requestHeaders = headers;
  attr.requestData = data->body;
  attr.requestDataSize = text.size();
  attr.userData = data;

  attr.onsuccess = on_success;
  attr.onerror = on_error;

  emscripten_fetch(&attr, "https://api.bahms.org/v1/game/sakura-samurai");
}
