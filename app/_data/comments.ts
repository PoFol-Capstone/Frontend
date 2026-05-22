import type { Comment } from "@/types/comment";

export const comments: Comment[] = [
  {
    uuid: "c1",
    author: {
      uuid: "u1",
      name: "user-fd345",
    },
    content: "이 컨셉 너무 좋아요 ㅋㅋㅋ 실제로 써보고 싶어요.",
    createdAt: "2026-04-29T12:30:00",
    likeCount: 3,
    deleted: false,
    replies: [],
  },
  {
    uuid: "c2",
    author: {
      uuid: "u2",
      name: "user-gof91t",
    },
    content: "프로젝트 분위기랑 UI가 잘 맞는 것 같아요.",
    createdAt: "2026-04-29T12:40:00",
    likeCount: 1,
    deleted: false,
    replies: [],
  },
];
