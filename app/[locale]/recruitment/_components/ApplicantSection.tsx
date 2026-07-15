import type { ApplicantResponse, ResponsePosts } from "@/types/post";
import ApplicantCard from "./ApplicantCard";
import { deriveStatus } from "./utils";

interface Props {
  applicants: ApplicantResponse[];
  selectedPost: ResponsePosts | undefined;
  selectedPostUuid: string | undefined;
  isPending: boolean;
  onAccept: (applyUuid: string) => void;
  onReject: (applyUuid: string) => void;
}

export default function ApplicantSection({
  applicants,
  selectedPost,
  selectedPostUuid,
  isPending,
  onAccept,
  onReject,
}: Props) {
  const isClosed = selectedPost ? deriveStatus(selectedPost) === "마감" : false;

  return (
    <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-950">지원자 현황</h2>
        <p className="mt-1 text-sm text-gray-500">
          {selectedPost
            ? `"${selectedPost.title}" 지원자`
            : "게시글을 선택해주세요."}
        </p>
      </div>

      <div className="space-y-4">
        {!selectedPostUuid && (
          <p className="py-8 text-center text-sm text-gray-400">
            왼쪽에서 게시글을 선택해주세요.
          </p>
        )}
        {selectedPostUuid && applicants.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            아직 지원자가 없어요.
          </p>
        )}
        {applicants.map((applicant) => (
          <ApplicantCard
            key={applicant.applyUuid}
            applicant={applicant}
            isClosed={isClosed}
            isPending={isPending}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </aside>
  );
}
