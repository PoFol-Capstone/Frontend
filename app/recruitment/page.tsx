"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { applicants as initialApplicants } from "@/app/_data/applicants";
import { recruitPosts } from "@/app/_data/recruitPosts";

export default function RecruitmentPage() {
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState(1);

  const selectedPost = recruitPosts.find((post) => post.id === selectedPostId);
  const [applicants, setApplicants] = useState(initialApplicants);
  
  const handleStatusChange = (id: number, newStatus: string) => {
  setApplicants((prev) =>
    prev.map((a) =>
      a.id === id ? { ...a, status: newStatus } : a
    )
  );
};

  const filteredApplicants = applicants.filter(
    (applicant) => applicant.postId === selectedPostId
  );
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-8 py-10">
      <section className="mx-auto max-w-[1120px]">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              Recruitment
            </p>
            <h1 className="text-[32px] font-bold tracking-[-0.03em] text-gray-950">
              팀원 모집 관리
            </h1>
            <p className="mt-3 text-[15px] text-gray-500">
              내가 올린 모집글과 지원자 현황을 한 곳에서 확인하고 관리해요.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">내 모집글</h2>
                <p className="mt-1 text-sm text-gray-500">
                  현재 등록한 팀원 모집 게시글이에요.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {recruitPosts.length}개
              </span>
            </div>

            <div className="space-y-4">
              {recruitPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-[18px] border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-[17px] font-bold text-gray-950">
                          {post.title}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            post.status === "모집중"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>

                      <p className="max-w-[520px] text-sm leading-6 text-gray-500">
                        {post.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.roles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-center">
                      <p className="text-xs text-gray-500">지원자</p>
                      <p className="mt-1 text-xl font-bold text-gray-950">
                        {applicants.filter((a) => a.postId === post.id).length}
                      </p>
                    </div>
                  </div>

                  {post.status !== "마감" && (
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => setSelectedPostId(post.id)}
                        className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        지원자 보기
                      </button>

                      <button className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                        수정하기
                      </button>

                      <button className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                        마감하기
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-950">지원자 현황</h2>
              <p className="mt-1 text-sm text-gray-500">
                최근 지원한 사람들을 확인해요.
              </p>
            </div>

            <div className="space-y-4">
              {filteredApplicants.map((applicant) => (
                <article
                  key={applicant.id}
                  className="rounded-[18px] border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-gray-950">
                        {applicant.name}
                      </p>
                      <button
                        onClick={() => router.push(`/profile/${applicant.id}`)}
                        className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        프로필 보기
                      </button>
                    </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {applicant.role} 지원
                      </p>
                      <div className="mt-2 fkex fkex-wrap gap-2">
                        {applicant.tech.map((tech) => (
                          <span
                            key = {tech}
                            className = "rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                              {tech}
                            </span>
                        ))}
                    </div>
                  </div>

                  <p className="rounded-xl bg-white p-3 text-sm leading-6 text-gray-500">
                    {applicant.message}
                  </p>

                  {selectedPost?.status !== "마감" && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button className="whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100">
                        포트폴리오 보기
                      </button>

                      {applicant.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(applicant.id, "accepted")}
                            className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition"
                          >
                            수락
                          </button>

                          <button
                            onClick={() => handleStatusChange(applicant.id, "rejected")}
                            className="rounded-lg bg-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition"
                          >
                            거절
                          </button>
                        </>
                      )}

                      {applicant.status === "accepted" && (
                        <button className="col-span-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white">
                          수락됨
                        </button>
                      )}

                      {applicant.status === "rejected" && (
                        <button className="col-span-2 rounded-lg bg-gray-300 px-3 py-2 text-xs font-semibold text-gray-700">
                          거절됨
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}