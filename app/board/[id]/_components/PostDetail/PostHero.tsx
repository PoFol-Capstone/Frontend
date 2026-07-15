import { ExternalLink, ImageOff } from "lucide-react";
import Image from "next/image";

type Props = {
  thumbnailUrl: string | null;
  title: string;
  deployUrl?: string;
};

export default function PostHero({ thumbnailUrl, title, deployUrl }: Props) {
  return (
    <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-linear-to-br from-gray-100 to-gray-200">
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1280px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageOff className="h-10 w-10 text-gray-300" />
        </div>
      )}

      {deployUrl && (
        <a
          href={deployUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-black shadow-md backdrop-blur-sm transition hover:bg-white"
        >
          사이트 방문
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
