import type { Notification } from "@/types/notification";
import type { PagedResponse } from "@/types/post";

/**
 * 알림 목록 상태. React와 분리해 두어 동작을 그대로 테스트할 수 있다.
 *
 * 예전엔 목록을 "한 번도 안 불렀을 때(isLoaded=false)"만 불러오고 이후 폴링은 개수만 갱신해서,
 * 알림창을 한 번 연 뒤 새 알림이 오면 배지는 바뀌어도 다시 연 목록에는 새 알림이 없었다.
 * 이제 알림창을 열 때마다 첫 페이지부터 다시 받고, 늦게 도착한 이전 요청(더보기 등)의 응답은
 * 버려서 페이지 상태가 섞이지 않게 한다.
 */

export type NotificationListState = {
  items: Notification[];
  /** 마지막으로 받은 서버 페이지(0부터). 아직 없으면 -1 */
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  /** 마지막 요청이 실패했는지 — 빈 목록("모두 확인")과 구분해서 보여준다 */
  error: boolean;
};

export const initialNotificationListState: NotificationListState = {
  items: [],
  page: -1,
  hasMore: false,
  isLoading: false,
  error: false,
};

type FetchPage = (page: number) => Promise<PagedResponse<Notification>>;

export function createNotificationListStore(fetchPage: FetchPage) {
  let state = initialNotificationListState;
  // 가장 최근 요청 번호. 응답이 올 때 이 값과 다르면 더 새로운 요청이 있다는 뜻이라 버린다
  let latestRequest = 0;
  // 실패한 요청의 페이지 — 다시 시도하면 그 페이지부터 받는다(첫 페이지 재조회든 더보기든)
  let failedPage: number | null = null;
  const listeners = new Set<() => void>();

  const setState = (next: NotificationListState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const load = async (page: number) => {
    const requestId = ++latestRequest;
    setState({ ...state, isLoading: true, error: false });

    try {
      const data = await fetchPage(page);
      if (requestId !== latestRequest) return;
      failedPage = null;

      const items =
        page === 0
          ? data.content
          : // 더보기 사이에 새 알림이 생겨 경계가 밀리면 같은 알림이 다시 올 수 있다
            [
              ...state.items,
              ...data.content.filter(
                (n) => !state.items.some((existing) => existing.uuid === n.uuid),
              ),
            ];
      setState({
        items,
        page: data.number ?? page,
        hasMore: !data.last,
        isLoading: false,
        error: false,
      });
    } catch (error) {
      if (requestId !== latestRequest) return;
      failedPage = page;
      console.error("[notification] 목록 조회 실패:", error);
      setState({ ...state, isLoading: false, error: true });
    }
  };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** 알림창을 열 때마다 — 최신 목록을 첫 페이지부터 다시 받는다 */
    reload: () => load(0),
    loadMore: () => {
      if (state.isLoading || !state.hasMore) return Promise.resolve();
      return load(state.page + 1);
    },
    retry: () => load(failedPage ?? 0),
    markRead(uuid: string) {
      setState({
        ...state,
        items: state.items.map((n) => (n.uuid === uuid ? { ...n, isRead: true } : n)),
      });
    },
    markAllRead() {
      setState({ ...state, items: state.items.map((n) => ({ ...n, isRead: true })) });
    },
  };
}

export type NotificationListStore = ReturnType<typeof createNotificationListStore>;
