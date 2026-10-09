"use client";

import { useId } from "react";
import { X } from "lucide-react";
import NotificationItem from "./NotificationItem";
import type { Notification } from "@/types/notification";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useTranslations } from "next-intl";

type NotificationDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  /** 목록 조회 실패 — "모든 알림을 확인했습니다"와 구분해서 보여준다 */
  loadError: boolean;
  hasMore: boolean;
  /** 실패한 요청(첫 페이지 재조회든 더보기든)을 그 페이지부터 다시 시도 */
  onRetry: () => void;
  onLoadMore: () => void;
  onItemRead: (uuid: string) => void;
  onMarkAllRead: () => void;
};

/**
 * 오른쪽에서 밀려 나오는 알림창. 닫힘 애니메이션 때문에 항상 마운트돼 있다.
 *
 * 예전엔 닫혀 있어도 안의 버튼들이 Tab 순서에 남았고, 닫기 버튼·Escape·포커스 이동이 없었다.
 * 닫힌 동안은 inert로 포커스와 보조기기 접근을 막고, 열리면 useModalA11y로 포커스를 패널 안으로
 * 옮겨 가두고(Escape로 닫기), 닫히면 알림 버튼으로 포커스를 돌려준다.
 */
export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  isLoading,
  loadError,
  hasMore,
  onRetry,
  onLoadMore,
  onItemRead,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const t = useTranslations("notification");
  const tCommon = useTranslations("common");
  const panelRef = useModalA11y<HTMLElement>(onClose, isOpen);
  const titleId = useId();

  return (
    <div
      inert={!isOpen}
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 transition ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[80vw] max-w-95 flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-black">
              {t("title")}
            </h2>

            <p className="text-sm text-gray-500">
              {t("unreadCount", { count: unreadCount })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
            className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" aria-busy={isLoading}>
          {loadError && notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <p role="alert" className="text-sm text-red-500">
                {t("loadFailed")}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium text-gray-600 underline hover:text-black"
              >
                {tCommon("retry")}
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-400">
                {isLoading ? t("loading") : t("empty")}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.uuid}
                  notification={notification}
                  onRead={onItemRead}
                />
              ))}

              {loadError && (
                <p role="alert" className="px-5 pt-4 text-center text-sm text-red-500">
                  {t("loadFailed")}
                </p>
              )}

              {(hasMore || loadError) && (
                <div className="flex justify-center py-4">
                  <button
                    type="button"
                    onClick={loadError ? onRetry : onLoadMore}
                    disabled={isLoading}
                    className="text-sm font-medium text-gray-500 transition hover:text-black disabled:opacity-50"
                  >
                    {isLoading
                      ? t("loading")
                      : loadError
                        ? tCommon("retry")
                        : t("loadMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-center border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-sm font-medium text-gray-600 transition hover:text-black"
          >
            {t("markAllRead")}
          </button>
        </div>
      </aside>
    </div>
  );
}
