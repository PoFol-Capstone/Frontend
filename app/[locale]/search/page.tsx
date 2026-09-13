import { Suspense } from "react";
import { getSessionUuid } from "@/lib/session";
import SearchPageContent from "./_components/SearchPageContent";

export default async function SearchPage() {
  const viewerUuid = await getSessionUuid();

  return (
    <Suspense fallback={null}>
      <SearchPageContent viewerUuid={viewerUuid} />
    </Suspense>
  );
}
