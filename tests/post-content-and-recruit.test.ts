import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEditedContent,
  FEATURES_SEPARATOR,
  getRecruitNoteDisplay,
  joinPostContent,
  splitPostContent,
} from "@/lib/postContent";
import {
  hasValidRecruitPositions,
  toRecruitPositionRequests,
  toRoleCounts,
} from "@/lib/recruitPositions";
import { deriveStatus, getApplicantActions } from "@/app/[locale]/recruitment/_components/utils";
import { getPathname } from "@/i18n/navigation";
import { PostType } from "@/types/post";
import type {
  ApplicantResponse,
  ResponsePosts,
  UpdatePostRequest,
} from "@/types/post";

// P2-5 (본문 편집 시 내용 삭제), P2-8~12 (모집 관리·유형 전환·지원자·모집 설명·빈 포지션)

describe("본문 분리·편집 (P2-5)", () => {
  const SEP = FEATURES_SEPARATOR;
  const bodies: [string, string][] = [
    ["구분자 0회", "설명만 있는 글\n둘째 줄"],
    ["구분자 1회", `설명${SEP}- 기능 1\n- 기능 2`],
    ["구분자 2회", `설명${SEP}- 기능 1${SEP}- 부록에 다시 쓴 기능`],
    ["구분자 1회 + 빈 기능", `설명${SEP}`],
    ["설명 없이 기능만", `${SEP}- 기능`],
    ["예전 작성 화면 형식(설명 없음)", "## 주요 기능\n- 기능"],
  ];

  for (const [name, content] of bodies) {
    it(`${name}: 제목만 수정하면 본문을 그대로 보존한다`, () => {
      const { description, features } = splitPostContent(content);
      assert.equal(buildEditedContent(content, description, features), content);
    });

    it(`${name}: 설명+기능에 첫 구분자를 뺀 원문이 빠짐없이 들어 있다`, () => {
      const { description, features } = splitPostContent(content);
      const separator = content.includes(SEP) ? SEP : "";
      assert.equal(`${description}${separator}${features}`, content);
    });
  }

  it("구분자 2회 글에서 기능을 고쳐도 두 번째 구분자 뒤 내용이 남는다", () => {
    const content = `설명${SEP}- 기능 1${SEP}- 부록`;
    const { description, features } = splitPostContent(content);
    assert.equal(features, `- 기능 1${SEP}- 부록`);
    const edited = buildEditedContent(content, description, features.replace("기능 1", "기능 A"));
    assert.equal(edited, `설명${SEP}- 기능 A${SEP}- 부록`);
  });

  it("작성 화면 조합은 분리와 왕복된다 (설명이 비어 있어도)", () => {
    for (const [d, f] of [["설명", "기능"], ["", "기능"], ["설명", ""]]) {
      assert.deepEqual(splitPostContent(joinPostContent(d, f)), { description: d, features: f });
    }
  });
});

const post = (overrides: Partial<ResponsePosts> = {}): ResponsePosts => ({
  uuid: "post-1",
  title: "모집",
  content: "본문",
  thumbnailUrl: "",
  postType: PostType.RECRUIT,
  authorName: "작성자",
  authorUuid: "author",
  links: [],
  recruitNote: "모집 조건",
  recruitPositionInfos: [],
  totalApplicantCount: 0,
  viewCount: 0,
  likeCount: 0,
  isLiked: false,
  isBookmarked: false,
  isAuthorFollowed: false,
  isPublished: true,
  skills: [],
  tags: [],
  createdAt: "2026-10-09T00:00:00",
  ...overrides,
});

const applicant = (
  applyUuid: string,
  status: ApplicantResponse["status"],
  portfolioUrl?: string,
): ApplicantResponse => ({
  applyUuid,
  applicantUuid: `user-${applyUuid}`,
  applicantName: applyUuid,
  applicantSkills: [],
  positionType: "FRONTEND",
  introduction: "자기소개",
  portfolioUrl,
  status,
});

describe("모집 마감 후 지원자 처리 (P2-10)", () => {
  it("정원 1명·지원자 2명: 한 명을 수락해 마감돼도 남은 지원자를 거절할 수 있고 상태·포트폴리오는 그대로다", () => {
    const before = post({
      recruitPositionInfos: [{ positionType: "FRONTEND", maxCount: 1, currentCount: 0, isFull: false }],
    });
    const first = applicant("a", "PENDING", "https://a.dev");
    const second = applicant("b", "PENDING", "https://b.dev");
    assert.deepEqual(getApplicantActions(first, before), {
      canAccept: true,
      canReject: true,
      positionFull: false,
    });

    // 수락 후 서버가 돌려주는 상태 (revalidate 결과)
    const after = post({
      recruitPositionInfos: [{ positionType: "FRONTEND", maxCount: 1, currentCount: 1, isFull: true }],
    });
    assert.equal(deriveStatus(after), "CLOSED");

    const remaining = getApplicantActions(second, after);
    assert.equal(remaining.canAccept, false, "정원이 찼으니 수락은 막는다");
    assert.equal(remaining.canReject, true, "마감돼도 남은 지원자는 거절할 수 있어야 한다");
    assert.equal(remaining.positionFull, true);

    const accepted = getApplicantActions({ ...first, status: "ACCEPTED" }, after);
    assert.deepEqual(accepted, { canAccept: false, canReject: false, positionFull: true });
  });

  it("포지션 정보가 없는 지원서는 수락할 수 없다", () => {
    const actions = getApplicantActions(applicant("c", "PENDING"), post());
    assert.equal(actions.canAccept, false);
    assert.equal(actions.canReject, true);
  });
});

describe("모집 포지션 검증 (P2-12)", () => {
  it("빈 포지션·0명·알 수 없는 포지션은 게시할 수 없다", () => {
    assert.equal(hasValidRecruitPositions({}), false);
    assert.equal(hasValidRecruitPositions({ Frontend: 0 }), false);
    assert.equal(hasValidRecruitPositions({ Frontend: 1.5 }), false);
    assert.equal(hasValidRecruitPositions({ Hacker: 1 }), false);
    assert.equal(hasValidRecruitPositions({ Frontend: 1, Backend: -1 }), false);
  });

  it("유효한 포지션은 백엔드 PositionType으로 보낸다", () => {
    assert.equal(hasValidRecruitPositions({ Frontend: 2, Designer: 1 }), true);
    assert.deepEqual(toRecruitPositionRequests({ Frontend: 2, Designer: 1 }), [
      { positionType: "FRONTEND", maxCount: 2 },
      { positionType: "DESIGNER", maxCount: 1 },
    ]);
  });

  it("정상 게시한 글은 지원 가능한 상태로 보이고, 수정 화면에서 포지션이 그대로 복원된다", () => {
    const created = post({
      recruitPositionInfos: toRecruitPositionRequests({ Backend: 2 }).map((p) => ({
        ...p,
        currentCount: 0,
        isFull: false,
      })),
    });
    assert.equal(deriveStatus(created), "RECRUITING");
    assert.equal(getApplicantActions({ ...applicant("d", "PENDING"), positionType: "BACKEND" }, created).canAccept, true);
    assert.deepEqual(toRoleCounts(created.recruitPositionInfos), { Backend: 2 });
  });

  it("이전에 만들어진 빈 포지션 모집글은 마감으로 본다", () => {
    assert.equal(deriveStatus(post({ recruitPositionInfos: [] })), "CLOSED");
  });
});

describe("모집 설명 표시 (P2-11)", () => {
  it("프로젝트 소개와 모집 조건을 모두 보여준다", () => {
    assert.deepEqual(getRecruitNoteDisplay("프로젝트 소개", "React 경험자", PostType.RECRUIT), {
      note: "React 경험자",
      showContent: true,
    });
  });

  it("모집 전용 글(본문 = 모집 조건)은 한 번만 보여준다", () => {
    assert.deepEqual(getRecruitNoteDisplay("같은 내용\n", "같은 내용", PostType.RECRUIT), {
      note: "같은 내용",
      showContent: false,
    });
  });

  it("일반 게시글은 모집 조건을 보여주지 않는다", () => {
    assert.equal(getRecruitNoteDisplay("본문", "남은 값", PostType.DISPLAY).note, "");
  });
});

describe("모집 관리 수정 링크 (P2-8)", () => {
  it("실제 게시글 수정 경로로 연결된다 (한국어·영어)", async () => {
    // 컴포넌트 모듈을 그대로 불러와 실제로 쓰는 경로를 확인한다
    const { recruitmentEditHref } = await import(
      "@/app/[locale]/recruitment/_components/PostCard"
    );
    const href = recruitmentEditHref("post-1");
    assert.equal(getPathname({ href, locale: "ko" }), "/board/post-1/edit");
    assert.equal(getPathname({ href, locale: "en" }), "/en/board/post-1/edit");
  });
});

describe("게시글 유형 전환 (P2-9)", () => {
  it("수정 요청 타입에는 type이 없다 (백엔드 UpdatePostRequest가 유형을 바꾸지 않음)", () => {
    const body: UpdatePostRequest = {
      title: "t",
      content: "c",
      links: [],
      recruitNote: "",
      recruitPositions: [],
      isPublished: true,
      skillIds: [],
      tagNames: [],
    };
    // @ts-expect-error — type을 보내면 컴파일 단계에서 막힌다
    const withType: UpdatePostRequest = { ...body, type: PostType.DISPLAY };
    assert.ok(withType);
    assert.equal("type" in body, false);
  });
});
