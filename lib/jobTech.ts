/**
 * 채용공고 → 필수 · 우대 기술 추출 (docs/2026-11-10-job-trends-plan.md 3.1 · 3.2).
 * 판정은 전부 규칙: 구역은 제목 패턴으로 나누고, 기술은 사전 별칭으로 찾는다. AI 없음.
 * 같은 사전의 `npm`은 내 레포 매칭(기능 C)에서 쓴다.
 */

export type TechCategory =
  | "language"
  | "frontend"
  | "backend"
  | "mobile"
  | "data"
  | "infra"
  | "practice";

export type Tech = {
  id: string;
  name: string;
  category: TechCategory;
  /** 공고 문장에서 찾을 말 (대소문자 무시) */
  aliases: string[];
  /** 흔한 영어 단어와 겹치는 별칭 — 대소문자까지 같아야 인정 ("Go", "Express") */
  exact?: string[];
  /** 레포에서 이 의존성이 있으면 사용 근거 */
  npm?: string[];
  /** simple-icons slug (https://cdn.simpleicons.org/{slug}) — 없으면 화면은 색 pill로 표시 */
  icon?: string;
};

export const TECH: Tech[] = [
  // 언어
  { id: "javascript", name: "JavaScript", category: "language", icon: "javascript", aliases: ["JavaScript", "ES6", "ECMAScript"] },
  { id: "typescript", name: "TypeScript", category: "language", icon: "typescript", aliases: ["TypeScript"], npm: ["typescript"] },
  { id: "java", name: "Java", category: "language", icon: "openjdk", aliases: ["Java"] },
  { id: "kotlin", name: "Kotlin", category: "language", icon: "kotlin", aliases: ["Kotlin"] },
  { id: "python", name: "Python", category: "language", icon: "python", aliases: ["Python"] },
  { id: "go", name: "Go", category: "language", icon: "go", aliases: ["Golang"], exact: ["Go"] },
  { id: "rust", name: "Rust", category: "language", icon: "rust", aliases: ["Rust"] },
  { id: "cpp", name: "C++", category: "language", icon: "cplusplus", aliases: ["C++"] },
  { id: "csharp", name: "C#", category: "language", aliases: ["C#"] },
  { id: "swift", name: "Swift", category: "language", icon: "swift", aliases: ["Swift"] },
  { id: "dart", name: "Dart", category: "language", icon: "dart", aliases: ["Dart"] },
  { id: "php", name: "PHP", category: "language", icon: "php", aliases: ["PHP"] },
  { id: "scala", name: "Scala", category: "language", icon: "scala", aliases: ["Scala"] },
  { id: "sql", name: "SQL", category: "language", aliases: ["SQL"] },
  { id: "html-css", name: "HTML/CSS", category: "language", aliases: ["HTML5", "HTML", "CSS3", "CSS"] },

  // 프론트엔드
  { id: "react", name: "React", category: "frontend", icon: "react", aliases: ["React.js", "ReactJS", "React"], npm: ["react"] },
  { id: "nextjs", name: "Next.js", category: "frontend", icon: "nextdotjs", aliases: ["Next.js", "NextJS"], npm: ["next"] },
  { id: "vue", name: "Vue", category: "frontend", icon: "vuedotjs", aliases: ["Vue.js", "VueJS", "Vue"], npm: ["vue"] },
  { id: "nuxt", name: "Nuxt", category: "frontend", icon: "nuxtdotjs", aliases: ["Nuxt.js", "Nuxt"], npm: ["nuxt"] },
  { id: "angular", name: "Angular", category: "frontend", icon: "angular", aliases: ["Angular"], npm: ["@angular/core"] },
  { id: "svelte", name: "Svelte", category: "frontend", icon: "svelte", aliases: ["SvelteKit", "Svelte"], npm: ["svelte"] },
  { id: "redux", name: "Redux", category: "frontend", icon: "redux", aliases: ["Redux"], npm: ["redux", "@reduxjs/toolkit"] },
  { id: "react-query", name: "TanStack Query", category: "frontend", icon: "reactquery", aliases: ["React Query", "TanStack Query"], npm: ["@tanstack/react-query", "react-query"] },
  { id: "zustand", name: "Zustand", category: "frontend", aliases: ["Zustand"], npm: ["zustand"] },
  { id: "tailwind", name: "Tailwind CSS", category: "frontend", icon: "tailwindcss", aliases: ["Tailwind CSS", "Tailwind"], npm: ["tailwindcss"] },
  { id: "webpack", name: "Webpack", category: "frontend", icon: "webpack", aliases: ["Webpack"], npm: ["webpack"] },
  { id: "vite", name: "Vite", category: "frontend", icon: "vite", aliases: ["Vite"], npm: ["vite"] },
  { id: "babel", name: "Babel", category: "frontend", icon: "babel", aliases: ["Babel"], npm: ["@babel/core"] },
  { id: "storybook", name: "Storybook", category: "frontend", icon: "storybook", aliases: ["Storybook"], npm: ["storybook", "@storybook/react"] },
  { id: "threejs", name: "Three.js", category: "frontend", icon: "threedotjs", aliases: ["Three.js", "ThreeJS", "react-three-fiber", "R3F"], npm: ["three", "@react-three/fiber"] },
  { id: "webgl", name: "WebGL", category: "frontend", aliases: ["WebGL", "WebGPU"] },
  { id: "ssr", name: "SSR", category: "frontend", aliases: ["SSR", "Server Side Rendering", "Server-Side Rendering", "서버 사이드 렌더링"] },
  { id: "ssr-streaming", name: "SSR Streaming", category: "frontend", aliases: ["Streaming SSR", "SSR Streaming", "React Server Components", "RSC"] },
  { id: "spa", name: "SPA", category: "frontend", aliases: ["SPA", "Single Page Application"] },
  { id: "web-performance", name: "웹 성능 최적화", category: "frontend", aliases: ["Web Vitals", "Lighthouse", "렌더링 최적화", "성능 최적화"] },
  { id: "a11y", name: "웹 접근성", category: "frontend", aliases: ["웹 접근성", "Accessibility", "a11y", "WAI-ARIA"] },
  { id: "design-system", name: "디자인 시스템", category: "frontend", aliases: ["디자인 시스템", "Design System"] },

  // 백엔드
  { id: "nodejs", name: "Node.js", category: "backend", icon: "nodedotjs", aliases: ["Node.js", "NodeJS"] },
  { id: "express", name: "Express", category: "backend", icon: "express", aliases: ["Express.js"], exact: ["Express"], npm: ["express"] },
  { id: "nestjs", name: "NestJS", category: "backend", icon: "nestjs", aliases: ["NestJS", "Nest.js"], npm: ["@nestjs/core"] },
  { id: "spring", name: "Spring", category: "backend", icon: "spring", aliases: ["Spring Boot", "Spring Framework", "Spring"] },
  { id: "jpa", name: "JPA", category: "backend", aliases: ["JPA", "Hibernate", "QueryDSL"] },
  { id: "django", name: "Django", category: "backend", icon: "django", aliases: ["Django"] },
  { id: "fastapi", name: "FastAPI", category: "backend", icon: "fastapi", aliases: ["FastAPI"] },
  { id: "flask", name: "Flask", category: "backend", icon: "flask", aliases: ["Flask"] },
  { id: "graphql", name: "GraphQL", category: "backend", icon: "graphql", aliases: ["GraphQL"], npm: ["graphql"] },
  { id: "grpc", name: "gRPC", category: "backend", aliases: ["gRPC"] },
  { id: "rest", name: "REST API", category: "backend", aliases: ["RESTful", "REST API"] },
  { id: "msa", name: "MSA", category: "backend", aliases: ["MSA", "Microservice", "Microservices", "Micro service", "마이크로서비스"] },
  { id: "kafka", name: "Kafka", category: "backend", icon: "apachekafka", aliases: ["Kafka"] },
  { id: "rabbitmq", name: "RabbitMQ", category: "backend", icon: "rabbitmq", aliases: ["RabbitMQ"] },

  // 데이터 저장소
  { id: "mysql", name: "MySQL", category: "data", icon: "mysql", aliases: ["MySQL"], npm: ["mysql2"] },
  { id: "postgresql", name: "PostgreSQL", category: "data", icon: "postgresql", aliases: ["PostgreSQL", "Postgres"], npm: ["pg"] },
  { id: "mongodb", name: "MongoDB", category: "data", icon: "mongodb", aliases: ["MongoDB"], npm: ["mongodb", "mongoose"] },
  { id: "redis", name: "Redis", category: "data", icon: "redis", aliases: ["Redis"], npm: ["redis", "ioredis"] },
  { id: "elasticsearch", name: "Elasticsearch", category: "data", icon: "elasticsearch", aliases: ["Elasticsearch", "OpenSearch"] },
  { id: "spark", name: "Spark", category: "data", icon: "apachespark", aliases: ["Apache Spark", "Spark"] },
  { id: "airflow", name: "Airflow", category: "data", icon: "apacheairflow", aliases: ["Airflow"] },
  { id: "pytorch", name: "PyTorch", category: "data", icon: "pytorch", aliases: ["PyTorch"] },
  { id: "tensorflow", name: "TensorFlow", category: "data", icon: "tensorflow", aliases: ["TensorFlow"] },
  { id: "llm", name: "LLM", category: "data", aliases: ["LLM", "RAG", "LangChain", "Agentic", "MCP"] },

  // 모바일
  { id: "android", name: "Android", category: "mobile", icon: "android", aliases: ["Android"] },
  { id: "ios", name: "iOS", category: "mobile", aliases: ["iOS"] },
  { id: "swiftui", name: "SwiftUI", category: "mobile", icon: "swift", aliases: ["SwiftUI"] },
  { id: "jetpack-compose", name: "Jetpack Compose", category: "mobile", icon: "jetpackcompose", aliases: ["Jetpack Compose"] },
  { id: "react-native", name: "React Native", category: "mobile", icon: "react", aliases: ["React Native", "ReactNative"], npm: ["react-native"] },
  { id: "flutter", name: "Flutter", category: "mobile", icon: "flutter", aliases: ["Flutter"] },

  // 인프라
  { id: "aws", name: "AWS", category: "infra", aliases: ["AWS", "Amazon Web Services", "EC2"] },
  { id: "gcp", name: "GCP", category: "infra", icon: "googlecloud", aliases: ["GCP", "Google Cloud"] },
  { id: "azure", name: "Azure", category: "infra", aliases: ["Azure"] },
  { id: "docker", name: "Docker", category: "infra", icon: "docker", aliases: ["Docker"] },
  { id: "kubernetes", name: "Kubernetes", category: "infra", icon: "kubernetes", aliases: ["Kubernetes", "K8s", "EKS", "GKE"] },
  { id: "terraform", name: "Terraform", category: "infra", icon: "terraform", aliases: ["Terraform", "IaC"] },
  { id: "linux", name: "Linux", category: "infra", icon: "linux", aliases: ["Linux"] },

  // 개발 방식
  { id: "testing", name: "테스트 코드", category: "practice", aliases: ["테스트 코드", "단위 테스트", "통합 테스트", "테스트 자동화", "자동화 테스트", "테스트를 구현", "Unit Test", "Test Automation", "TDD", "SDET", "Jest", "Vitest", "JUnit", "Pytest", "TestNG", "Selenium", "Appium", "Cypress", "Playwright"], npm: ["jest", "vitest", "cypress", "@playwright/test"] },
  { id: "cicd", name: "CI/CD", category: "practice", icon: "githubactions", aliases: ["CI/CD", "GitHub Actions", "Jenkins", "ArgoCD"] },
  { id: "git", name: "Git", category: "practice", icon: "git", aliases: ["Git"] },
  { id: "code-review", name: "코드 리뷰", category: "practice", aliases: ["코드 리뷰", "Code Review"] },
  { id: "agile", name: "애자일", category: "practice", aliases: ["애자일", "Agile", "Scrum"] },
];

export type Section = "required" | "preferred" | "other";

// 짧은 줄이 이 말을 담으면 구역 제목으로 본다. 우대를 먼저 본다 ("Preferred Qualifications"에 Qualifications가 있다)
const HEADING_MAX = 50;
const PREFERRED = /우대|preferred|nice to have|bonus points|더 좋아요|있으면 좋아요/i;
const REQUIRED = /자격\s*요건|필수|지원\s*자격|qualifications|requirements|what you('ll)? need|right for me|이런 분과 함께하고 싶어요|이런 분을 찾/i;
const OTHER = /업무|하는 일|이런 일을 해요|소개|about|what you will do|role overview|responsibilities|전형|절차|복지|혜택|benefits|근무|process|참고|안내|privacy|고용형태|values/i;

function headingOf(line: string): Section | null {
  if (line.length > HEADING_MAX) return null;
  if (PREFERRED.test(line)) return "preferred";
  if (REQUIRED.test(line)) return "required";
  if (OTHER.test(line)) return "other";
  return null;
}

/** Greenhouse 등 HTML 본문 → 줄 단위 텍스트 (본문은 저장하지 않고 추출에만 쓴다) */
const decode = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

export function htmlToText(html: string): string {
  // Greenhouse content는 HTML이 한 번 이스케이프돼 온다 → 태그를 살리고, 지운 뒤 본문 속 &nbsp; 등을 한 번 더 푼다
  return decode(
    decode(html)
      .replace(/<\/(p|li|h[1-6]|div|ul|ol)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

/** 구역별 본문. 제목을 하나도 못 찾으면 null — 추측해서 나누지 않는다 */
export function splitSections(text: string): Record<Section, string> | null {
  const out: Record<Section, string[]> = { required: [], preferred: [], other: [] };
  let current: Section = "other";
  let found = false;
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const heading = headingOf(line);
    if (heading) {
      current = heading;
      if (heading !== "other") found = true;
      continue;
    }
    out[current].push(line);
  }
  if (!found) return null;
  return { required: out.required.join("\n"), preferred: out.preferred.join("\n"), other: out.other.join("\n") };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// 영숫자 · 기호(+#.)에 붙어 있지 않을 때만 — Java ≠ JavaScript, C ≠ C++
const bounded = (alias: string, flags: string) =>
  new RegExp(`(?<![A-Za-z0-9+#.])${escape(alias)}(?![A-Za-z0-9+#])`, flags);

// 긴 별칭부터 찾고 찾은 자리는 지운다 — "React Native"를 React로 또 세지 않는다
const PATTERNS = TECH.flatMap((t) => [
  ...t.aliases.map((a) => ({ id: t.id, alias: a, re: bounded(a, "gi") })),
  ...(t.exact ?? []).map((a) => ({ id: t.id, alias: a, re: bounded(a, "g") })),
]).sort((a, b) => b.alias.length - a.alias.length);

/** 텍스트에 나온 기술 id (사전 순서) */
export function findTech(text: string): string[] {
  let rest = text;
  const hit = new Set<string>();
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    if (!p.re.test(rest)) continue;
    hit.add(p.id);
    rest = rest.replace(p.re, " ");
  }
  return TECH.filter((t) => hit.has(t.id)).map((t) => t.id);
}

export type JobTech = {
  required: string[];
  preferred: string[];
  /** 구역 제목을 못 찾았을 때만 — 본문 전체에서 찾은 기술 */
  mentioned: string[];
};

/** 공고 본문(텍스트) → 필수 · 우대 기술. 둘 다 나오면 필수로 둔다 */
export function extractJobTech(text: string): JobTech {
  const sections = splitSections(text);
  if (!sections) return { required: [], preferred: [], mentioned: findTech(text) };
  const required = findTech(sections.required);
  const preferred = findTech(sections.preferred).filter((id) => !required.includes(id));
  return { required, preferred, mentioned: [] };
}
