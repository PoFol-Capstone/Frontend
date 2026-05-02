"use client";

import Link from "next/link";
import { useState } from "react";

type Post = { id: string; title: string };

export default function PostCarousel({ posts }: { posts: Post[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const visible = posts.slice(currentSlide, currentSlide + 2);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
        disabled={currentSlide === 0}
        className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white text-xl leading-none disabled:opacity-30"
      >
        ←
      </button>

      <div className="grid grid-cols-2 gap-6 px-12">
        {visible.map((post) => (
          <Link key={post.id} href={`/board/${post.id}`} className="group block">
            <div className="aspect-video rounded-xl bg-gray-200 transition group-hover:opacity-80" />
            <p className="mt-2 text-sm font-semibold">{post.title}</p>
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCurrentSlide((s) => Math.min(Math.max(0, posts.length - 2), s + 1))}
        disabled={currentSlide >= posts.length - 2}
        className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-black bg-white text-xl leading-none disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
}
