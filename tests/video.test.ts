import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isVideoEmbedUrl, toVideoEmbedUrl } from "@/lib/video";

// 프로젝트 쇼케이스 1단계 (pofol/docs/2026-11-10-project-showcase-plan.md 3.1)
describe("데모 영상 링크 → embed", () => {
  const YT = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
  const DRIVE = "https://drive.google.com/file/d/1AbC_d-9/preview";

  it("유튜브 공유 형식은 모두 nocookie embed로 바꾼다", () => {
    for (const input of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/shorts/dQw4w9WgXcQ",
      " https://www.youtube.com/embed/dQw4w9WgXcQ ",
      YT,
    ]) {
      assert.equal(toVideoEmbedUrl(input), YT, input);
    }
  });

  it("구글 드라이브 파일 링크는 /preview로 바꾼다", () => {
    assert.equal(toVideoEmbedUrl("https://drive.google.com/file/d/1AbC_d-9/view?usp=sharing"), DRIVE);
    assert.equal(toVideoEmbedUrl(DRIVE), DRIVE);
  });

  it("다른 사이트 · http · 잘못된 id는 거부한다", () => {
    for (const input of [
      "",
      "not a url",
      "http://youtu.be/dQw4w9WgXcQ",
      "https://evil.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=short",
      "https://drive.google.com/drive/folders/abc",
      "https://vimeo.com/123",
    ]) {
      assert.equal(toVideoEmbedUrl(input), null, input);
    }
  });

  it("렌더링 직전 검사는 변환 결과 형식만 통과시킨다", () => {
    assert.equal(isVideoEmbedUrl(YT), true);
    assert.equal(isVideoEmbedUrl(DRIVE), true);
    assert.equal(isVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), false);
    assert.equal(isVideoEmbedUrl(`${YT}?autoplay=1`), false);
  });
});
