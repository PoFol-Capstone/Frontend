import { PostType } from "@/types/post";

/**
 * 게시글 본문 = 프로젝트 설명 + "## 주요 기능" 구역.
 *
 * 예전엔 `content.split(SEPARATOR)`로 나눈 뒤 앞의 두 조각만 썼다. 구분자가 두 번 이상이면
 * 세 번째 조각부터 화면에서 빠지고, 편집 화면에서 제목만 고쳐 저장해도 그 내용이 삭제됐다.
 * 이제 첫 구분자에서만 나누고, 편집 시 설명·기능을 건드리지 않았으면 원문을 그대로 보낸다.
 */
export const FEATURES_SEPARATOR = "\n\n## 주요 기능\n";

export type PostContentParts = {
  description: string;
  features: string;
};

/** 첫 구분자에서만 나눈다. 뒤에 다시 나오는 구분자는 기능 텍스트의 일부로 보존된다. */
export function splitPostContent(content: string): PostContentParts {
  const index = content.indexOf(FEATURES_SEPARATOR);
  if (index === -1) return { description: content, features: "" };
  return {
    description: content.slice(0, index),
    features: content.slice(index + FEATURES_SEPARATOR.length),
  };
}

/** splitPostContent의 역. 기능이 비어 있으면 구분자를 붙이지 않는다. */
export function joinPostContent(description: string, features: string): string {
  return features ? `${description}${FEATURES_SEPARATOR}${features}` : description;
}

/**
 * 편집 화면의 저장 본문. 설명·기능을 고치지 않았다면(예: 제목만 수정) 원문을 그대로 돌려줘
 * 구분자 개수·공백까지 바이트 단위로 보존한다.
 */
export function buildEditedContent(
  original: string,
  description: string,
  features: string,
): string {
  const initial = splitPostContent(original);
  if (description === initial.description && features === initial.features) {
    return original;
  }
  return joinPostContent(description, features);
}

/**
 * 모집 조건(recruitNote)을 어떻게 보여줄지.
 * 모집 전용 글(프로젝트 정보 없이 작성)은 본문과 모집 조건이 같은 값으로 저장되므로
 * 본문은 숨기고 모집 조건으로 한 번만 보여준다.
 */
export function getRecruitNoteDisplay(
  content: string,
  recruitNote: string | null | undefined,
  postType: PostType,
): { note: string; showContent: boolean } {
  const note = postType === PostType.RECRUIT ? (recruitNote ?? "").trim() : "";
  const sameAsContent = !!note && content.trim() === note;
  return { note, showContent: !sameAsContent };
}
