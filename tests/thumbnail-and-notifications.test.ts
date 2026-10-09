import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  replaceThumbnail,
  requestAiThumbnail,
  thumbnailErrorMessage,
  uploadThumbnailFile,
} from "@/lib/thumbnailClient";
import { MAX_THUMBNAIL_BYTES } from "@/lib/uploadLimits";
import { createNotificationListStore } from "@/hooks/notificationList";
import type { Notification } from "@/types/notification";
import type { PagedResponse } from "@/types/post";

// P2-13 (썸네일 교체 실패가 기존 이미지까지 지움), P2-14 (새 알림이 와도 목록이 갱신되지 않음)

const EXISTING = "https://blob.test/thumbnails/existing.png";

function respond(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
}

const png = () => new File([new Uint8Array(8)], "a.png", { type: "image/png" });

describe("썸네일 교체 (P2-13)", () => {
  const failures: [string, () => Promise<Response>, string][] = [
    ["업로드 400", respond(400, { error: "지원하지 않는 이미지 형식입니다." }), "invalidType"],
    ["업로드 429", respond(429, { error: "too many" }, { "Retry-After": "42" }), "rateLimited"],
    ["업로드 413", respond(413), "tooLarge"],
    ["업로드 401", respond(401), "unauthorized"],
    ["업로드 500", respond(500), "failed"],
    ["업로드 200인데 url 없음", respond(200, {}), "failed"],
    [
      "네트워크 실패",
      async () => {
        throw new TypeError("Failed to fetch");
      },
      "network",
    ],
  ];

  for (const [name, fetchImpl, reason] of failures) {
    it(`${name}: 기존 이미지(=임시 저장본에 들어갈 값)를 유지하고 사유를 돌려준다`, async () => {
      const next = await replaceThumbnail(EXISTING, () => uploadThumbnailFile(png(), fetchImpl));
      assert.equal(next.url, EXISTING);
      assert.equal(next.error?.reason, reason);
    });
  }

  it("429는 Retry-After를 안내 문구에 쓴다", async () => {
    const next = await replaceThumbnail(EXISTING, () =>
      uploadThumbnailFile(png(), respond(429, {}, { "Retry-After": "42" })),
    );
    assert.deepEqual(thumbnailErrorMessage(next.error!), {
      key: "rateLimited",
      values: { seconds: 42 },
    });
  });

  it("AI 생성 500도 기존 이미지를 유지한다", async () => {
    const next = await replaceThumbnail(EXISTING, () =>
      requestAiThumbnail({ projectName: "P", techStack: [] }, respond(500, { error: "boom" })),
    );
    assert.equal(next.url, EXISTING);
    assert.equal(next.error?.reason, "failed");
  });

  it("AI 생성 400은 입력 오류로 안내한다", async () => {
    const next = await replaceThumbnail("", () =>
      requestAiThumbnail({ projectName: "", techStack: [] }, respond(400)),
    );
    assert.equal(next.url, "");
    assert.equal(next.error?.reason, "invalidInput");
  });

  it("성공했을 때만 새 URL로 바꾼다", async () => {
    const next = await replaceThumbnail(EXISTING, () =>
      uploadThumbnailFile(png(), respond(200, { url: "https://blob.test/new.png" })),
    );
    assert.deepEqual(next, { url: "https://blob.test/new.png", error: null });
  });

  it("한도를 넘는 파일·허용하지 않는 형식은 요청을 보내지 않는다", async () => {
    let calls = 0;
    const counting = async () => {
      calls++;
      return new Response("{}");
    };
    const big = new File([new Uint8Array(MAX_THUMBNAIL_BYTES + 1)], "big.png", { type: "image/png" });
    const svg = new File(["<svg/>"], "a.svg", { type: "image/svg+xml" });
    assert.equal((await replaceThumbnail(EXISTING, () => uploadThumbnailFile(big, counting))).error?.reason, "tooLarge");
    assert.equal((await replaceThumbnail(EXISTING, () => uploadThumbnailFile(svg, counting))).error?.reason, "invalidType");
    assert.equal(calls, 0);
  });

  it("AI 요청은 서버가 거절하는 길이를 넘지 않게 잘라 보낸다", async () => {
    let sent: { projectDescription?: string; mainFeatures?: string } = {};
    await requestAiThumbnail(
      { projectName: " P ", techStack: [], projectDescription: "x".repeat(5000), mainFeatures: "y".repeat(5000) },
      async (_url, init) => {
        sent = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ url: "u" }));
      },
    );
    assert.equal(sent.projectDescription?.length, 2000);
    assert.equal(sent.mainFeatures?.length, 3000);
  });
});

function notification(uuid: string, isRead = false): Notification {
  return {
    uuid,
    type: "FOLLOW",
    actor: { uuid: `actor-${uuid}`, name: uuid },
    post: null,
    count: 1,
    isRead,
    createdAt: "2026-10-09T00:00:00",
  };
}

/** 서버 알림 목록(최신순)을 page/size로 자르는 가짜 API */
function fakeServer(pageSize = 2) {
  const server = { items: [] as Notification[], calls: [] as number[] };
  const fetchPage = async (page: number): Promise<PagedResponse<Notification>> => {
    server.calls.push(page);
    const content = server.items.slice(page * pageSize, page * pageSize + pageSize);
    const totalPages = Math.ceil(server.items.length / pageSize);
    return { content, number: page, totalPages, last: page >= totalPages - 1 } as PagedResponse<Notification>;
  };
  return { server, fetchPage };
}

describe("알림 목록 갱신 (P2-14)", () => {
  it("알림창 최초 열기 → 새 알림 도착 → 다시 열기: 새 알림이 목록에 보인다", async () => {
    const { server, fetchPage } = fakeServer();
    server.items = [notification("A")];
    const store = createNotificationListStore(fetchPage);

    await store.reload(); // 처음 열기
    assert.deepEqual(store.getState().items.map((n) => n.uuid), ["A"]);

    server.items = [notification("B"), ...server.items]; // 새 알림 도착 (배지는 폴링으로 갱신)

    await store.reload(); // 다시 열기
    assert.deepEqual(store.getState().items.map((n) => n.uuid), ["B", "A"]);
    assert.equal(store.getState().page, 0);
    assert.deepEqual(server.calls, [0, 0]);
  });

  it("더보기 후 다시 열면 첫 페이지부터 다시 맞춘다", async () => {
    const { server, fetchPage } = fakeServer(2);
    server.items = ["A", "B", "C"].map((id) => notification(id));
    const store = createNotificationListStore(fetchPage);

    await store.reload();
    await store.loadMore();
    assert.deepEqual(store.getState().items.map((n) => n.uuid), ["A", "B", "C"]);
    assert.equal(store.getState().page, 1);
    assert.equal(store.getState().hasMore, false);

    server.items = [notification("D"), ...server.items];
    await store.reload();
    assert.deepEqual(store.getState().items.map((n) => n.uuid), ["D", "A"]);
    assert.equal(store.getState().page, 0);
    assert.equal(store.getState().hasMore, true);
  });

  it("다시 열기 전에 시작된 더보기 응답이 늦게 와도 목록에 섞이지 않는다", async () => {
    const { server, fetchPage } = fakeServer(1);
    server.items = ["A", "B"].map((id) => notification(id));
    let releaseLoadMore: () => void = () => {};
    const store = createNotificationListStore(async (page) => {
      if (page === 1) await new Promise<void>((resolve) => (releaseLoadMore = resolve));
      return fetchPage(page);
    });

    await store.reload();
    const pendingMore = store.loadMore();
    server.items = [notification("C"), ...server.items];
    const reopen = store.reload();
    releaseLoadMore();
    await Promise.all([pendingMore, reopen]);

    assert.deepEqual(store.getState().items.map((n) => n.uuid), ["C"]);
    assert.equal(store.getState().page, 0);
  });

  it("조회 실패는 빈 목록이 아니라 오류로 남고, 다시 시도하면 복구된다", async () => {
    const { server, fetchPage } = fakeServer();
    server.items = [notification("A")];
    let fail = true;
    const store = createNotificationListStore(async (page) => {
      if (fail) throw new Error("500");
      return fetchPage(page);
    });

    await store.reload();
    assert.equal(store.getState().error, true);
    assert.equal(store.getState().isLoading, false);

    fail = false;
    await store.retry();
    assert.equal(store.getState().error, false);
    assert.deepEqual(store.getState().items.map((n) => n.uuid), ["A"]);
  });
});
