"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import PostCard from "@/app/board/_components/PostCard";
import type { ResponsePosts } from "@/types/post";
import { Users, Eye, Heart } from "lucide-react";

const users = [
  {
    id: 1,
    name: "김개발",
    role: "Frontend · 3개월차",
    bio: "한줄소개 내용...",
    followers: 10,
    isFollowing: false,
  },
  {
    id: 2,
    name: "이개발",
    role: "Backend · 9개월차",
    bio: "개발을 좋아합니다.",
    followers: 10,
    isFollowing: false,
  },
  {
    id: 3,
    name: "박프론트",
    role: "Frontend · 6개월차",
    bio: "프론트엔드 UI 구현을 좋아합니다.",
    followers: 8,
    isFollowing: true,
  },
  {
    id: 4,
    name: "최백엔드",
    role: "Backend · 1년차",
    bio: "API 설계와 서버 개발에 관심이 있습니다.",
    followers: 6,
    isFollowing: false,
  },
];

const projects: Partial<ResponsePosts>[] = [
  {
    uuid: "1",
    title: "강의실 점검표 자동 생성 사이트",
    content:
      "교학팀의 핵심 업무 중 하나인 강의실 점검표를 자동으로 생성하는 사이트입니다.",
    tags: ["React", "Next.js"],
    thumbnailUrl: "",
    skills: [],
    authorName: "김개발",
    viewCount: 3,
    likeCount: 1,
  },
  {
    uuid: "2",
    title: "포트폴리오 자동 생성 플랫폼",
    content:
      "개발자의 프로젝트 정보를 기반으로 포트폴리오를 자동 생성합니다.",
    tags: ["Frontend", "AI"],
    thumbnailUrl: "",
    skills: [],
    authorName: "박프론트",
    viewCount: 5,
    likeCount: 1,
  },
  {
    uuid: "3",
    title: "팀원 모집 플랫폼",
    content:
      "프로젝트 팀원을 모집하고 지원자를 관리할 수 있는 서비스입니다.",
    tags: ["Backend", "Spring"],
    thumbnailUrl: "",
    skills: [],
    authorName: "이개발",
    viewCount: 4,
    likeCount: 0,
  },
];

export default function SearchPage() {
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [userList, setUserList] = useState(users);

  const visibleUsers = showAllUsers ? userList : userList.slice(0, 2);

  const handleFollowToggle = (userId: number) => {
    setUserList((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, isFollowing: !user.isFollowing }
          : user,
      ),
    );
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-6 py-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">User</h2>
            </div>
          </div>

          <div className="space-y-3">
            {visibleUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {user.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{user.name}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>{user.followers}</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">{user.role}</p>
                    <p className="mt-1 text-sm text-gray-600">{user.bio}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/profile/${user.id}`}
                    className="rounded-full border border-gray-300 px-4 py-1.5 text-sm transition hover:bg-gray-100"
                  >
                    프로필 보기
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleFollowToggle(user.id)}
                    className={`rounded-full px-4 py-1.5 text-sm transition ${
                      user.isFollowing
                        ? "border border-gray-300 bg-white text-black hover:bg-gray-100"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    {user.isFollowing ? "팔로잉" : "팔로우"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {userList.length > 2 && (
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <button
                type="button"
                onClick={() => setShowAllUsers((prev) => !prev)}
                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm transition hover:bg-gray-100"
              >
                {showAllUsers ? "접기" : "Users 더보기"}
              </button>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Project</h2>
          </div>

          <div className="flex flex-col gap-6">
            {projects.map((project) => (
              <Link
                key={project.uuid}
                href={`/board/${project.uuid}`}
                className="group flex gap-4 rounded-2xl transition hover:bg-gray-50"
              >
                <div className="relative aspect-video w-[400px] shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                  {project.thumbnailUrl ? (
                    <Image
                      src={project.thumbnailUrl}
                      alt={project.title ?? ""}
                      fill
                      sizes="400px"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col justify-center">
                  <h3 className="text-xl font-bold">{project.title}</h3>

                  <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                    {project.content}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs px-2.5 py-0.5 text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {project.authorName?.slice(0, 1)}
                      </div>

                      <span>{project.authorName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {project.viewCount}
                      </span>

                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {project.likeCount}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}