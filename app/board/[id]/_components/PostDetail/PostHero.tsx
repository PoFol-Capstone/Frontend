import type { Skill } from "@/types/skill";
import Image from "next/image";

type Props = {
  thumbnailUrl: string | null;
  title: string;
  skills: Skill[];
  deployUrl?: string;
};

export default function PostHero({ thumbnailUrl, title, skills, deployUrl }: Props) {
  return (
    <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-gray-200">
      {thumbnailUrl && (
        <>
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px"
            className="object-cover"
          />
          <a
            href={deployUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-7 ${
              deployUrl ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <p className="text-3xl font-bold leading-tight text-white drop-shadow">
              {title}
            </p>
            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            )}
          </a>
        </>
      )}
    </div>
  );
}
