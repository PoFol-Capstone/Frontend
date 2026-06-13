"use client";

import Image from "next/image";
import { Eye, Users, Mail, Link2 } from "lucide-react";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";

import { Profile } from "@/types/user";
import ProfileEditModal from "./ProfileEditModal";
import FollowerModal from "./FollowerModal";
import type { FollowerUser } from "@/types/user";

interface Props {
  profile: Profile;
  isOwner: boolean;
  followers?: FollowerUser[];
  onToggleFollow?: (userId: number) => void;
}

export default function ProfileSidebar({
  profile,
  isOwner,
  followers = [],
  onToggleFollow,
}: Props) {
  const githubUrl = profile.links.find((link) => link.type === "GITHUB")?.url;
  const portfolioUrl = profile.links.find((link) => link.type !== "GITHUB")?.url;
  const emailUrl = profile.email;

  const [isFollowerOpen, setIsFollowerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleToggleFollow = async (userId: number) => {
    if (!onToggleFollow) return;

    await onToggleFollow(userId);
  };

  return (
    <>
      <aside className="h-fit border border-gray-300 px-8 py-7 text-center">
        <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              width={112}
              height={112}
              className="h-full w-full object-cover"
            />
          ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-3xl font-semibold text-gray-700">
                {profile.name.charAt(0)}
              </div>
          )}
        </div>

        <h1 className="text-3xl font-bold">{profile.name}</h1>

        <div className="mt-2 text-sm font-medium">
          {profile.position} · {profile.positionMonths}개월차
        </div>

        <p className="mt-4 text-left text-sm leading-6">
          {profile.bio || "소개 글을 등록해주세요"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-300 pt-3">
          {profile.skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded px-2 py-1 text-xs font-medium"
              style={{ backgroundColor: skill.badgeColor }}
            >
              {skill.name}
            </span>
          ))}
        </div>

        <div className="mt-6 space-y-3 text-left text-sm">
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-black truncate transition"
            >
              <FaGithub className="h-4 w-4 shrink-0" />
              <span className="truncate">{githubUrl}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <FaGithub className="h-4 w-4 shrink-0" />
              <span>GitHub 미연동</span>
            </div>
          )}

          {portfolioUrl ? (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-black truncate transition"
            >
              <Link2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{portfolioUrl}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Link2 className="h-4 w-4 shrink-0" />
              <span>포트폴리오 없음</span>
            </div>
          )}

          {emailUrl ? (
            <a
              href={`mailto:${emailUrl}`}
              className="flex items-center gap-2 text-gray-700 hover:text-black truncate transition"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{emailUrl}</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="h-4 w-4 shrink-0" />
              <span>이메일 없음</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setIsFollowerOpen(true)}
            className="flex items-center gap-1 transition hover:text-gray-500"
          >
            <Users className="h-4 w-4" />
            <span>{profile.followerCount.toLocaleString()}</span>
          </button>

          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{profile.totalViewCount.toLocaleString()}</span>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            프로필 수정
          </button>
        )}

        {isEditModalOpen && (
          <ProfileEditModal
            profile={profile}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </aside>

      {isFollowerOpen && (
        <FollowerModal
          onClose={() => setIsFollowerOpen(false)}
          followers={followers}
          onToggleFollow={handleToggleFollow}
        />
      )}
    </>
  );
}