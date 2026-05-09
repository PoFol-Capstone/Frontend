"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  LayoutDashboard,
  Eye,
  Users,
  Mail,
  NotebookPen,
} from "lucide-react";

import { FaGithub } from "react-icons/fa";
import { RiNotionFill } from "react-icons/ri";

import { skills, sitePosts, backendPosts, works } from "@/app/_data/profile";

export default function ProfilePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const visibleSitePosts = sitePosts.slice(currentSlide, currentSlide + 2);

  const goPrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, sitePosts.length - 2));
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white px-10 py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-[300px_1fr] gap-12">
        <aside className="h-fit border border-gray-300 px-8 py-7 text-center">
          <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gray-100 text-4xl">
            👨🏻‍💻
          </div>

          <h1 className="text-3xl font-bold">HotaeHwang</h1>

          <p className="mt-2 text-sm font-medium">
            Frontend Developer · 9개월차
          </p>

          <p className="mt-4 text-left text-sm leading-6">
            안녕하세요.
            <br />
            @@대학교 프론트엔드 개발자입니다.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-300 pt-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded bg-gray-100 px-2 py-1 text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-2 text-left text-sm">
            <div className="flex items-center gap-2">
              <FaGithub className="h-4 w-4 text-gray-700" />
              <span>HotaeHwang</span>
            </div>

            <div className="flex items-center gap-2">
              <RiNotionFill className="h-4 w-4 text-gray-700" />
              <span>HotaeHwang@gmail.com</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-700" />
              <span>HotaeHwang@gmail.com</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-5 text-sm font-semibold">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>30,751</span>
            </div>

            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>101,250</span>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="mt-6 block w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            프로필 수정
          </Link>
        </aside>

        <section>
          <section className="mb-8">
            <h2 className="mb-4 text-3xl font-bold">사이트 게시물</h2>

            <div className="relative">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentSlide === 0}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white text-xl leading-none disabled:opacity-30"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-2 gap-6">
                {visibleSitePosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/board/${post.id}`}
                    className="group block"
                  >
                    <div className="aspect-video rounded-xl bg-gray-200 transition group-hover:opacity-80" />
                    <p className="mt-2 text-sm font-semibold">{post.title}</p>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={goNext}
                disabled={currentSlide >= sitePosts.length - 2}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white text-xl leading-none disabled:opacity-30"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </section>

          <section className="mb-12 border-t border-gray-300 pt-5">
            <h2 className="mb-4 text-3xl font-bold">백엔드 게시물</h2>

            <div className="grid grid-cols-3 gap-4">
              {backendPosts.map((post) => (
                <div
                  key={post.title}
                  className="rounded-2xl border border-gray-300 p-4"
                >
                  <div className="mb-4 aspect-video rounded-xl bg-gray-200" />

                  <h3 className="font-bold">{post.title}</h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {post.description}
                  </p>

                  <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {post.tag}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-3xl font-bold">작업 이력</h2>

            <div className="space-y-5">
              {works.map((work) => (
                <article
                  key={work.title}
                  className="rounded-2xl border border-gray-300 p-6"
                >
                  <h3 className="text-xl font-bold">{work.title}</h3>

                  <p className="mt-3 text-sm text-gray-500">{work.period}</p>

                  <p className="mt-4 text-sm font-medium leading-6">
                    {work.description}
                  </p>

                  <div className="mt-4 space-y-1 text-sm">
                    {work.details.map((detail) => (
                      <p key={detail}>✓ {detail}</p>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {work.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}