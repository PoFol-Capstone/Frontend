import Image from "next/image";
import Link from "next/link";
import { Profile } from "@/types/user";
import FollowButton from "./FollowButton";

interface Props {
  profile: Profile;
  isOwner: boolean;
}

export default function ProfileSidebar({ profile, isOwner }: Props) {
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

      <p className="mt-2 text-sm font-medium">
        {profile.position} · {profile.positionMonths}개월차
      </p>

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

      <div className="mt-6 space-y-1 text-left text-sm">
        {profile.links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:underline"
          >
            {link.type}
          </a>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-8 text-sm font-bold">
        <span>팔로워 {profile.followerCount.toLocaleString()}</span>
        <span>조회 {profile.totalViewCount.toLocaleString()}</span>
      </div>

      {isOwner ? (
        <Link
          href="/profile/edit"
          className="mt-6 block w-full rounded-xl bg-black py-3 text-center text-sm font-semibold text-white hover:bg-gray-800"
        >
          프로필 수정
        </Link>
      ) : (
        <FollowButton targetUuid={profile.uuid} />
      )}
    </aside>
  );
}
