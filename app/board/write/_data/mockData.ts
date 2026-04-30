export const mockProjectData = {
  repository: "team-finder",
  repositories: ["team-finder", "portfolio-site", "chat-app", "blog-platform"],
  projectName: "Team Finer Platform",
  projectDescription:
    "팀원을 찾고 프로젝트를 함께 진행할 수 있는 플랫폼입니다.",
  mainFeatures:
    "GitHub OAuth 인증을 통한 간편 로그인\nAI 기반 프로젝트 분석 및 기술 스택 추출\n실시간 채팅 및 프로젝트 협업 도구",
  techStack: [
    "React",
    "TypeScript",
    "Next.js",
    "Prisma",
    "PostgreSQL",
    "Tailwind CSS",
  ],
  thumbnailUrl: null as string | null,
  uploadSections: [
    {
      id: "erd",
      title: "ERD 업로드",
      subtitle: "데이터베이스 설계 다이어그램",
      iconType: "erd" as const,
    },
    {
      id: "figma",
      title: "피그마 구조도 업로드",
      subtitle: "UI/UX 디자인 파일",
      iconType: "figma" as const,
    },
    {
      id: "class",
      title: "클래스 다이어그램 업로드",
      subtitle: "시스템 구조 설계 문서",
      iconType: "class" as const,
    },
    {
      id: "extra",
      title: "추가 자료",
      subtitle: "UML, 플로우차트 등",
      iconType: "extra" as const,
    },
  ],
  teamRecruitment: {
    enabled: true,
    description: "",
    roles: ["Frontend", "Backend", "Designer"],
    selectedRoles: [] as string[],
    kakaoLink: "",
  },
};
