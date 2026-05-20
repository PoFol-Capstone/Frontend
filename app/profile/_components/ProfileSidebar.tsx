"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Users, Mail, Globe } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { RiNotionFill } from "react-icons/ri";
import { Profile } from "@/types/user";
import FollowButton from "./FollowButton";
import { useRef, useState } from "react";
import ProfileEditModal from "./ProfileEditModal";

function LinkIcon({ type }: { type: string }) {
  const t = type.toUpperCase();
  if (t === "GITHUB") return <FaGithub className="h-4 w-4 shrink-0 text-gray-700" />;
  if (t === "NOTION") return <RiNotionFill className="h-4 w-4 shrink-0 text-gray-700" />;
  if (t === "EMAIL") return <Mail className="h-4 w-4 shrink-0 text-gray-700" />;
  return <Globe className="h-4 w-4 shrink-0 text-gray-700" />;
}

interface Props {
  profile: Profile;
  isOwner: boolean;
}

export default function ProfileSidebar({ profile, isOwner }: Props) {
  const githubUrl = profile.links.find((link) => link.type === "GITHUB")?.url;
  const notionUrl = profile.links.find((link) => link.type === "NOTION")?.url;
  const emailUrl = profile.links.find((link) => link.type === "EMAIL")?.url;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  return (
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
          <span className="text-4xl">👨🏻‍💻</span>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <FaGithub className="h-4 w-4" />
            <span>{githubUrl || "GitHub: "}</span>
          </div>
        </div>

  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-gray-700">
      <RiNotionFill className="h-4 w-4" />
      <span>{notionUrl || "Notion: "}</span>
    </div>
  </div>

  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-gray-700">
      <Mail className="h-4 w-4" />
      <span>{emailUrl || "Email: "}</span>
    </div>
  </div>
</div>

      <div className="mt-6 flex items-center justify-center gap-5 text-sm font-semibold">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{profile.followerCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{profile.totalViewCount.toLocaleString()}</span>
        </div>
      </div>

      {isOwner && (
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="mt-6 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800">
          프로필 수정
        </button>
      )}
      {isEditModalOpen && (
        <ProfileEditModal
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </aside>
  );
}
