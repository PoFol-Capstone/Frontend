// 인메모리 슬라이딩 윈도우 rate limiter.
//
// OpenAI 호출·Blob 업로드처럼 요청당 실제 비용이 발생하는 라우트에서 인증된 사용자 1명이
// 무한히 호출하는 것을 막는 최소한의 방어선. 서버 인스턴스별 메모리라 다중 인스턴스
// 배포에서는 인스턴스 수만큼 한도가 늘어나므로, 엄격한 쿼터가 필요해지면 Redis 등
// 공유 스토어로 교체해야 한다.

type Bucket = number[]; // 요청 타임스탬프(ms) 목록

const buckets = new Map<string, Bucket>();

// 메모리 누수 방지: 윈도우가 완전히 지난 버킷은 접근 시점에 정리하고,
// 그래도 남는 유령 키를 대비해 전체 크기에 상한을 둔다.
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** 다시 시도 가능해지기까지 남은 초. allowed=true면 0. */
  retryAfterSeconds: number;
};

/**
 * @param key 제한 단위 (예: `ai:summarize:${userUuid}`)
 * @param limit 윈도우 내 허용 요청 수
 * @param windowMs 윈도우 길이(ms)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const recent = (buckets.get(key) ?? []).filter((ts) => ts > windowStart);

  if (recent.length >= limit) {
    // 가장 오래된 요청이 윈도우를 벗어나면 한 자리가 생긴다
    const retryAfterMs = recent[0] + windowMs - now;
    buckets.set(key, recent);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, v] of buckets) {
      if (v.every((ts) => ts <= windowStart)) buckets.delete(k);
    }
  }

  return {
    allowed: true,
    remaining: limit - recent.length,
    retryAfterSeconds: 0,
  };
}

/** rate limit 초과 시 공통 429 응답 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      error: `요청이 너무 많습니다. ${result.retryAfterSeconds}초 후에 다시 시도해주세요.`,
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
