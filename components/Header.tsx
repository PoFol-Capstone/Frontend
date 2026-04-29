import ProfileMenu from "@/components/ProfileMenu";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function Header() {
  const session = await getSession();

  return (
    <header className="border-b border-gray-200 px-10 py-4">
      <div className="mx-auto flex items-center justify-between">
        <Link href={session ? "/board" : "/"} className="text-xl font-bold">
          PoFol
        </Link>

        {session ? (
          <>
            {/* 로그인 상태 */}
            <div className="mx-10 flex flex-1 justify-center">
              <div className="flex w-full max-w-md items-center rounded-xl border px-4 py-2">
                🔍
                <input
                  placeholder="Search Project..."
                  className="ml-2 w-full outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-5 text-lg">
              <Link href="/board/write">➕</Link>
              <button>🔔</button>
              <ProfileMenu />
            </div>
          </>
        ) : (
          <>
            {/* 비로그인 상태 */}
            <div className="flex gap-4">
              <Link
                href="/login"
                className="rounded-lg border px-4 py-2 text-sm"
              >
                로그인
              </Link>

              <Link
                href="/signup"
                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                시작하기
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
