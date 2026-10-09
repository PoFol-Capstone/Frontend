import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { startMockBackend, type MockBackend, type TestUser } from "./helpers/mockBackend";
import { setCookieContext } from "./mocks/next-headers.mjs";
import { buildPageHref, parsePageParam, visiblePageItems } from "@/lib/pagination";
import { buildLocaleSwitchHref } from "@/lib/localeSwitch";
import { boardHref } from "@/app/[locale]/board/_components/categories";
import { getPathname } from "@/i18n/navigation";
import type { PagedResponse } from "@/types/post";

// P2-7 (서버 페이지 처리 누락·북마크 불일치), P2-17 (API 실패를 빈 목록으로 표시), P2-20 (언어 변경 시 쿼리 유실)

type Item = { uuid: string; postType: "RECRUIT" | "DISPLAY"; schoolId: number | null };

/** Spring Page 응답 (기본 size는 각 BE 컨트롤러의 @PageableDefault) */
function page<T>(all: T[], query: URLSearchParams, defaultSize: number) {
  const size = Number(query.get("size") ?? defaultSize);
  const number = Number(query.get("page") ?? 0);
  const content = all.slice(number * size, number * size + size);
  const totalPages = Math.ceil(all.length / size);
  return {
    status: 200,
    body: {
      content,
      number,
      size,
      totalPages,
      totalElements: all.length,
      last: number >= totalPages - 1,
    },
  };
}

let backend: MockBackend;
let me: TestUser;
let post: typeof import("@/lib/post");
let apply: typeof import("@/lib/apply");

const posts: Item[] = Array.from({ length: 1001 }, (_, i) => ({
  uuid: `post-${i}`,
  postType: i % 3 === 0 ? "RECRUIT" : "DISPLAY",
  schoolId: i % 2 === 0 ? 7 : null,
}));
const bookmarks = Array.from({ length: 25 }, (_, i) => ({ uuid: `bookmark-${i}` })); // 마지막이 가장 오래된 북마크
const myPosts = Array.from({ length: 11 }, (_, i) => ({ uuid: `mine-${i}` }));
const searchHits = Array.from({ length: 21 }, (_, i) => ({ uuid: `hit-${i}` }));
const myRecruitPosts = Array.from({ length: 5 }, (_, i) => ({ uuid: `recruit-${i}` }));

before(async () => {
  backend = await startMockBackend();
  process.env.NEXT_PUBLIC_API_URL = backend.url;
  post = await import("@/lib/post");
  apply = await import("@/lib/apply");
  me = backend.createUser();

  backend.route("GET /api/posts", (req, user) => {
    let result = posts;
    if (req.query.get("type")) result = result.filter((p) => p.postType === req.query.get("type"));
    if (req.query.get("mySchoolOnly") === "true") {
      // 학교 필터는 로그인 사용자 기준 — 토큰이 없으면 빈 목록(200)
      result = user ? result.filter((p) => p.schoolId === 7) : [];
    }
    if (req.query.get("keyword")) return page(searchHits, req.query, 10);
    return page(result, req.query, 10);
  });
  // BE: GET /api/posts/* 공개 규칙에 걸려 토큰 없이도 200·빈 목록
  backend.route("GET /api/posts/bookmarked", (req, user) =>
    page(user ? bookmarks : [], req.query, 10),
  );
  backend.route(`GET /api/user/${me.uuid}/posts`, (req) => page(myPosts, req.query, 4));
  backend.route("GET /api/recruitment/posts", (_req, user) =>
    user ? { status: 200, body: myRecruitPosts } : { status: 403 },
  );
  backend.route("GET /api/posts/recruit-0/applicants", () => ({
    status: 500,
    body: { message: "Internal Server Error" },
  }));
});

after(async () => {
  await backend.close();
});

beforeEach(() => {
  backend.reset();
  setCookieContext({
    mode: "render",
    cookies: { uuid: me.uuid, access_token: backend.issueAccess(me) },
  });
});

/** UI와 같은 방식으로 totalPages까지 페이지를 넘기며 모든 항목을 모은다 */
async function collectAll(
  fetchPage: (page: number) => Promise<PagedResponse<{ uuid: string }>>,
) {
  const seen: string[] = [];
  let pageIndex = 0;
  let totalPages = 1;
  while (pageIndex < totalPages) {
    const result = await fetchPage(pageIndex);
    seen.push(...result.content.map((p) => p.uuid));
    totalPages = result.totalPages;
    pageIndex++;
  }
  return seen;
}

describe("서버 페이지네이션으로 모든 데이터에 접근 (P2-7)", () => {
  it("게시판 1,001개를 9개씩 넘겨 모두 볼 수 있다", async () => {
    const seen = await collectAll((page) => post.getPosts({ page, size: 9 }));
    assert.equal(seen.length, 1001);
    assert.equal(new Set(seen).size, 1001);
    assert.ok(seen.includes("post-1000"));
  });

  it("모집중 탭은 서버 type 필터를 쓴다", async () => {
    const seen = await collectAll((page) => post.getPosts({ page, size: 9, type: "RECRUIT" as never }));
    assert.equal(seen.length, posts.filter((p) => p.postType === "RECRUIT").length);
  });

  it("학교 탭은 서버 mySchoolOnly 필터를 쓰고, 토큰이 없으면 빈 목록 대신 401", async () => {
    const seen = await collectAll((page) => post.getPosts({ page, size: 9, mySchoolOnly: true }));
    assert.equal(seen.length, posts.filter((p) => p.schoolId === 7).length);

    setCookieContext({ mode: "render", cookies: { uuid: me.uuid } });
    await assert.rejects(post.getPosts({ mySchoolOnly: true }), { status: 401 });
  });

  it("북마크 탭·/bookmark는 북마크 전용 API(GET /api/posts/bookmarked)로 오래된 북마크까지 본다", async () => {
    const seen = await collectAll((page) => post.getBookmarkedPosts({ page, size: 9 }));
    assert.equal(seen.length, 25);
    assert.ok(seen.includes("bookmark-24"), "가장 오래된 북마크");
    assert.equal(backend.countRequests("GET", "/api/post/bookmarked"), 0);
    assert.ok(backend.countRequests("GET", "/api/posts/bookmarked") >= 3);
  });

  it("북마크 조회에 토큰이 없으면 빈 북마크가 아니라 401", async () => {
    setCookieContext({ mode: "render", cookies: { uuid: me.uuid } });
    await assert.rejects(post.getBookmarkedPosts({ page: 0, size: 9 }), { status: 401 });
    assert.equal(backend.requests.length, 0);
  });

  it("프로필 게시물 11개를 4개씩 넘겨 모두 볼 수 있다", async () => {
    const seen = await collectAll((page) => post.getUserPosts(me.uuid, { page, size: 4 }));
    assert.equal(seen.length, 11);
  });

  it("검색 결과 21개를 20개씩 넘겨 모두 볼 수 있다", async () => {
    const seen = await collectAll((page) => post.getPosts({ keyword: "react", page, size: 20 }));
    assert.equal(seen.length, 21);
  });

  it("모집 관리는 모집 전용 API로 5개 모두 가져온다 (BE 기본 page size 4에 잘리지 않음)", async () => {
    const result = await apply.getMyRecruitPosts();
    assert.equal(result.length, 5);
  });
});

describe("실패를 빈 목록으로 바꾸지 않는다 (P2-17)", () => {
  it("지원자 조회 500은 빈 배열이 아니라 오류로 전달된다", async () => {
    await assert.rejects(apply.getApplicants("recruit-0"), { status: 500 });
  });

  it("모집글 조회가 인증 거절이면 세션 오류로 구분된다", async () => {
    setCookieContext({ mode: "render", cookies: { uuid: me.uuid, access_token: "forged.token.x" } });
    const http = await import("@/lib/http.server");
    await assert.rejects(apply.getMyRecruitPosts(), (error: unknown) => http.isSessionRejected(error));
  });
});

describe("페이지 주소 (P2-7)", () => {
  it("?page=는 1부터, 내부는 0부터 센다", () => {
    assert.equal(parsePageParam(undefined), 0);
    assert.equal(parsePageParam("1"), 0);
    assert.equal(parsePageParam("112"), 111);
    assert.equal(parsePageParam(["3", "9"]), 2);
    for (const bad of ["0", "-1", "abc", "1.5", ""]) assert.equal(parsePageParam(bad), 0);
    assert.equal(parsePageParam("99999999"), 9999);
  });

  it("카테고리·검색어를 유지한 채 페이지 링크를 만든다", () => {
    assert.equal(buildPageHref("/search", { q: "react" }, 1), "/search?q=react&page=2");
    assert.equal(buildPageHref("/board", { category: undefined }, 0), "/board");
    assert.equal(boardHref("Bookmarks", 2), "/board?category=Bookmarks&page=3");
    assert.equal(boardHref("All"), "/board");
  });

  it("1,001개(112페이지)도 버튼을 모두 그리지 않고 처음·끝·주변만 보여준다", () => {
    assert.deepEqual(visiblePageItems(0, 112), [0, 1, "gap", 111]);
    assert.deepEqual(visiblePageItems(50, 112), [0, "gap", 49, 50, 51, "gap", 111]);
    assert.deepEqual(visiblePageItems(111, 112), [0, "gap", 110, 111]);
    assert.deepEqual(visiblePageItems(2, 5), [0, 1, 2, 3, 4]);
  });
});

describe("언어 변경 시 쿼리·hash 유지 (P2-20)", () => {
  it("검색어와 category=School을 유지한다", () => {
    const href = buildLocaleSwitchHref("/search", "?q=react&category=School", "#projects");
    assert.equal(getPathname({ href, locale: "en" }), "/en/search?q=react&category=School#projects");
    assert.equal(getPathname({ href, locale: "ko" }), "/search?q=react&category=School#projects");
  });

  it("게시판 필터·페이지도 유지한다", () => {
    const href = buildLocaleSwitchHref("/board", "?category=School&page=3", "");
    assert.equal(getPathname({ href, locale: "en" }), "/en/board?category=School&page=3");
  });

  it("쿼리·hash가 없으면 경로만 바꾼다", () => {
    assert.equal(buildLocaleSwitchHref("/settings", "", ""), "/settings");
    assert.equal(buildLocaleSwitchHref("/settings", "?", "#"), "/settings");
  });
});
