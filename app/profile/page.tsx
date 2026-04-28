"use client";

import { useState } from "react";

const mockUser = {
  name: "HotaeHwang",
  role: "Frontend Developer",
  badge: "9학점사",
  bio: "안녕하세요.\n@4대학교 프론트엔드 개발자입니다.",
  tags: ["Next.js", "React", "React Native"],
  github: "HotaeHwang",
  notion: "HotaeHwang@gmail.com",
  email: "HotaeHwang@gmail.com",
  followers: 30751,
  following: 101250,
  githubUrl: "https://github.com/HotaeHwang",
  notionUrl: "#",
};

const mockSitePosts = [
  { id: 1, title: "사이트 게시물 1", thumbnail: null },
  { id: 2, title: "사이트 게시물 2", thumbnail: null },
  { id: 3, title: "사이트 게시물 3", thumbnail: null },
  { id: 4, title: "사이트 게시물 4", thumbnail: null },
];

const mockBackendPosts = [
  {
    id: 1,
    title: "ERD",
    description: "데이터베이스 스키마 및 관계도",
    tag: "Database",
    thumbnail: null,
  },
  {
    id: 2,
    title: "피그마 구조도",
    description: "서비스 플로우 및 라인 구조",
    tag: "Flow",
    thumbnail: null,
  },
  {
    id: 3,
    title: "플래스 다이어그램",
    description: "래퍼 이벤트 상세다이어그램",
    tag: "UML",
    thumbnail: null,
  },
];

const mockWorkHistory = [
  {
    id: 1,
    title: "PoFol",
    period: "2026.02 ~ 2026.03",
    description:
      "포트폴리오를 자동으로 정리하고 공유할 수 있도록 하기 위해 개발했습니다.\n사용자가 프로젝트를 등록하고, 팀원을 모집할 수 있는 플랫폼입니다.\n✔ GitHub 연동 자동 등록\n✔ 팀원 모집 및 지원 기능\n✔ 기술 스택 기반 검색",
    tags: ["Next.js", "React", "Firebase"],
    workPeriod: "2026.02 ~ 2026.03",
    devLevel: "사이드 프로젝트",
    serviceDesc: "포트폴리오 공유 및 팀원 모집 플랫폼",
    coreFeatures: "GitHub 연동, 팀원 모집, 기술 스택 검색",
    techTags: "Next.js, React, Firebase",
  },
];

function formatNumber(n: number) {
  return n.toLocaleString();
}

function Avatar() {
  return (
    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
      <svg viewBox="0 0 96 96" fill="none" className="w-full h-full">
        <circle cx="48" cy="48" r="48" fill="#E5E7EB" />
        <ellipse cx="48" cy="38" rx="16" ry="18" fill="#9CA3AF" />
        <ellipse cx="48" cy="82" rx="26" ry="22" fill="#9CA3AF" />
        <ellipse cx="48" cy="36" rx="14" ry="15" fill="#FCD34D" />
        <rect x="34" y="20" width="28" height="14" rx="4" fill="#1F2937" />
        <circle cx="43" cy="38" r="2" fill="#1F2937" />
        <circle cx="53" cy="38" r="2" fill="#1F2937" />
      </svg>
    </div>
  );
}

function TechTag({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
      {label}
    </span>
  );
}

function PostCard({
  title,
  description,
  tag,
}: {
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <div className="shrink-0 w-40 border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="h-24 bg-gray-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
          <path d="M3 9h18M9 21V9" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
        <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
          {tag}
        </span>
      </div>
    </div>
  );
}

function SitePostCard() {
  return (
    <div className="shrink-0 w-44 h-32 border border-gray-200 rounded-xl bg-gray-50" />
  );
}

export default function ProfilePage() {
  const [sitePostIndex, setSitePostIndex] = useState(0);
  const [selectedWork, setSelectedWork] = useState(mockWorkHistory[0]);

  const visibleSitePosts = 2;
  const maxIndex = mockSitePosts.length - visibleSitePosts;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-10 flex gap-8">
        {/* Left: Profile Card */}
        <aside className="w-64 shrink-0">
          <div className="border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 sticky top-10">
            <Avatar />
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900">
                {mockUser.name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {mockUser.role}{" "}
                <span className="text-gray-400">· {mockUser.badge}</span>
              </p>
            </div>
            <p className="text-xs text-gray-600 text-center whitespace-pre-line leading-relaxed">
              {mockUser.bio}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {mockUser.tags.map((tag) => (
                <TechTag key={tag} label={tag} />
              ))}
            </div>
            <div className="w-full border-t border-gray-100 pt-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.748-1.026 2.748-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="font-medium">Github:</span>
                <span className="text-gray-500">{mockUser.github}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 8h8M8 12h5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-medium">Notion:</span>
                <span className="text-gray-500 truncate">{mockUser.notion}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-medium">Email:</span>
                <span className="text-gray-500 truncate">{mockUser.email}</span>
              </div>
            </div>
            <div className="w-full border-t border-gray-100 pt-3 flex justify-around text-center">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {formatNumber(mockUser.followers)}
                </p>
                <p className="text-xs text-gray-400">팔로워</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {formatNumber(mockUser.following)}
                </p>
                <p className="text-xs text-gray-400">팔로잉</p>
              </div>
            </div>
            <div className="w-full flex gap-2">
              <a
                href={mockUser.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                GitHub Link
              </a>
              <a
                href={mockUser.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Notion Link
              </a>
            </div>
          </div>
        </aside>

        {/* Right: Content */}
        <main className="flex-1 flex flex-col gap-8 min-w-0">
          {/* 사이트 게시물 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">
              사이트 게시물
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSitePostIndex((i) => Math.max(0, i - 1))}
                disabled={sitePostIndex === 0}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 shrink-0 transition-colors"
              >
                ←
              </button>
              <div className="flex gap-3 overflow-hidden flex-1">
                {mockSitePosts
                  .slice(sitePostIndex, sitePostIndex + visibleSitePosts)
                  .map((post) => (
                    <SitePostCard key={post.id} />
                  ))}
              </div>
              <button
                onClick={() =>
                  setSitePostIndex((i) => Math.min(maxIndex, i + 1))
                }
                disabled={sitePostIndex >= maxIndex}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 shrink-0 transition-colors"
              >
                →
              </button>
            </div>
          </section>

          {/* 백엔드 게시물 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">
              백엔드 게시물
            </h2>
            <div className="flex gap-3">
              {mockBackendPosts.map((post) => (
                <PostCard
                  key={post.id}
                  title={post.title}
                  description={post.description}
                  tag={post.tag}
                />
              ))}
            </div>
          </section>

          {/* 작업 이력 */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">
              작업 이력
            </h2>
            <div className="flex flex-col gap-3">
              {mockWorkHistory.map((work) => (
                <button
                  key={work.id}
                  onClick={() => setSelectedWork(work)}
                  className={`text-left border rounded-xl p-4 transition-colors ${
                    selectedWork?.id === work.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {work.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {work.period}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 whitespace-pre-line leading-relaxed line-clamp-4">
                    {work.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {work.tags.map((tag) => (
                      <TechTag key={tag} label={tag} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 선택된 프로젝트 상세 */}
          {selectedWork && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-3">
                {selectedWork.title}
              </h2>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                <DetailRow label="작업 기간" value={selectedWork.workPeriod} />
                <DetailRow label="개발 도도" value={selectedWork.devLevel} />
                <DetailRow
                  label="서비스 설명"
                  value={selectedWork.serviceDesc}
                />
                <DetailRow
                  label="핵심 기능"
                  value={selectedWork.coreFeatures}
                />
                <DetailRow label="태그" value={selectedWork.techTags} />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-5 py-3">
      <span className="text-xs font-medium text-gray-500 w-24 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-xs text-gray-800 flex-1">{value}</span>
    </div>
  );
}
