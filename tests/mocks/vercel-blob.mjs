// @vercel/blob 대역 — 실제 업로드 없이 호출 기록만 남긴다.
// 2.3.3 실제 동작처럼 addRandomSuffix 기본값은 false이고, 같은 pathname에 다시 쓰면
// (allowOverwrite가 없으면) 예외를 던진다.
const state = (globalThis.__blobMock ??= { calls: [] });

export function blobCalls() {
  return state.calls;
}

export function resetBlobCalls() {
  state.calls.length = 0;
}

export async function put(pathname, body, options = {}) {
  let finalPath = pathname;
  if (options.addRandomSuffix) {
    const dot = pathname.lastIndexOf(".");
    const suffix = "-" + Math.random().toString(36).slice(2, 10);
    finalPath =
      dot === -1
        ? pathname + suffix
        : pathname.slice(0, dot) + suffix + pathname.slice(dot);
  }

  if (!options.allowOverwrite && state.calls.some((c) => c.pathname === finalPath)) {
    throw new Error(`Vercel Blob: This blob already exists (${finalPath})`);
  }

  state.calls.push({ pathname: finalPath, options });
  return { url: `https://blob.test/${finalPath}`, pathname: finalPath };
}
