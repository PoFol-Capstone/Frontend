"use client";

import dynamic from "next/dynamic";

/** Three.js는 무거워서 브라우저에서만, 필요할 때 불러온다 (ssr: false는 클라이언트 컴포넌트에서만 가능) */
const Trend3DLazy = dynamic(() => import("./Trend3D"), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-xl bg-gray-50" />,
});

export default Trend3DLazy;
