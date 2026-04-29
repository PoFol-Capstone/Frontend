import type { Post } from "@/app/_types/post";

export const posts: Post[] = [
  {
    id: "1",
    title: "감정 일기장",
    description: "감정 일기장 어쩌고 상세 설명입니다.",
    tags: ["Next.js", "React", "Firebase"],
    category: "Frontend",
    author: "HotaeHwang",
    viewCount: 12000,
    likeCount: 342,
    recruitmentRoles: [
      { role: "Frontend", current: 1, total: 2 },
      { role: "Backend", current: 0, total: 2 },
      { role: "Designer", current: 1, total: 1 },
    ],
  },
  {
    id: "2",
    title: "채팅 어플리케이션",
    description: "실시간 채팅 가능 상세 설명입니다.",
    tags: ["React", "Next.js", "Firebase"],
    category: "Backend",
    author: "HotaeHwang",
    viewCount: 8500,
    likeCount: 210,
    recruitmentRoles: [
      { role: "Frontend", current: 0, total: 2 },
      { role: "Backend", current: 1, total: 2 },
    ],
  },
  {
    id: "3",
    title: "디자인 시스템",
    description: "컴포넌트 구조 정리",
    tags: ["Figma", "Design"],
    category: "Design",
    author: "HotaeHwang",
    viewCount: 4300,
    likeCount: 98,
    recruitmentRoles: [
      { role: "Designer", current: 1, total: 1 },
      { role: "Frontend", current: 0, total: 1 },
    ],
  },
];