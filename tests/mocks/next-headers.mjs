// next/headers 대역.
//
// Next 16에서 cookies()는 Server Component 렌더 중에는 읽기 전용이라 set/delete가 예외를 던지고,
// Server Function·Route Handler에서만 쓸 수 있다. 테스트가 두 문맥을 모두 재현할 수 있도록
// mode("render" | "action")를 바꿔 가며 쓴다.
const state = (globalThis.__cookieMock ??= {
  mode: "render",
  jar: new Map(),
  writes: [],
});

export function setCookieContext({ mode = "render", cookies = {} } = {}) {
  state.mode = mode;
  state.jar = new Map(Object.entries(cookies));
  state.writes = [];
}

export function cookieWrites() {
  return state.writes;
}

export function cookieJar() {
  return state.jar;
}

function assertWritable(method) {
  if (state.mode === "render") {
    throw new Error(
      `Cookies can only be modified in a Server Action or Route Handler. (${method})`,
    );
  }
}

export async function cookies() {
  return {
    get(name) {
      return state.jar.has(name)
        ? { name, value: state.jar.get(name) }
        : undefined;
    },
    has(name) {
      return state.jar.has(name);
    },
    getAll() {
      return [...state.jar].map(([name, value]) => ({ name, value }));
    },
    set(name, value, options) {
      assertWritable("set");
      state.writes.push({ op: "set", name, value, options });
      state.jar.set(name, value);
    },
    delete(name) {
      assertWritable("delete");
      state.writes.push({ op: "delete", name });
      state.jar.delete(name);
    },
  };
}

export async function headers() {
  return new Headers();
}
