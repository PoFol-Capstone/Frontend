# 썸네일 생성 Provider 추상화 (SVG ↔ OpenAI)

`/api/ai/thumbnail`이 SVG 생성과 AI 이미지 생성 중 하나를 환경변수로 골라 쓸 수 있도록
provider 인터페이스를 도입했다.

## 구조

```
app/api/ai/thumbnail/
  _lib.ts                 # 기존 SVG 생성 로직 (그대로 유지)
  route.ts                # provider를 선택해서 호출, Blob에 업로드
  providers/
    types.ts              # ThumbnailProvider 인터페이스
    svgProvider.ts         # _lib.ts를 감싼 기본 provider
    openaiProvider.ts      # OpenAI gpt-image-1로 이미지 생성하는 provider
    index.ts               # THUMBNAIL_PROVIDER env로 provider 선택하는 팩토리
```

`ThumbnailProvider` 인터페이스:

```ts
interface ThumbnailAsset {
  buffer: Buffer;
  contentType: string; // Blob 업로드 시 사용
  extension: string;   // 파일 확장자 (svg/png 등)
}

interface ThumbnailProvider {
  generate(info: ProjectInfo): Promise<ThumbnailAsset>;
}
```

`route.ts`는 `getThumbnailProvider()`가 돌려주는 provider의 `generate()`만 호출하고,
반환된 `contentType`/`extension`으로 Vercel Blob에 업로드한다. provider 내부 구현(SVG 문자열
조립이든 OpenAI API 호출이든)은 route가 알 필요가 없다.

## 전환 방법

`.env.local`의 `THUMBNAIL_PROVIDER` 값만 바꾸면 된다. 코드 수정도, 재배포용 브랜치도 필요 없다.

```bash
THUMBNAIL_PROVIDER=svg     # 기본값. 무료, 즉시 생성, 결정론적 그라디언트+텍스트
THUMBNAIL_PROVIDER=openai  # gpt-image-1로 실제 이미지 생성. 비용 발생, 1~2초 이상 소요
```

값을 비워두거나 아예 지우면 `svg`로 fallback한다. 잘못된 값(오타 등)을 넣으면 요청 시점에
에러를 던진다 (`getThumbnailProvider()`).

## OpenAI provider 세부사항

- 모델: `gpt-image-1` (`openai.images.generate`), 크기 `1536x1024`, `n: 1`.
- 프롬프트는 `projectName`, `techStack`, `projectDescription`으로 구성 (`openaiProvider.ts`의
  `buildPrompt`). 텍스트/로고 없이 플랫 벡터 일러스트 스타일을 요청한다.
- 응답은 `b64_json`으로 받아 PNG Buffer로 변환 — SVG와 달리 결과가 결정론적이지 않고,
  요청마다 과금된다 (`OPENAI_API_KEY` 필요, `/api/ai/summarize`와 같은 키 재사용).
- 실패 시(키 없음, 빈 응답 등) 에러를 던지고, `route.ts`의 기존 catch 블록이
  `{ error }` 500 응답으로 처리한다 — 별도 에러 핸들링 추가 안 해도 됨.

## 새 provider를 추가하려면 (예: Replicate, Gemini)

1. `providers/xxxProvider.ts`에 `ThumbnailProvider`를 구현.
2. `providers/index.ts`의 `PROVIDERS` 맵에 등록.
3. `.env.local`에서 `THUMBNAIL_PROVIDER=xxx`로 전환.

`route.ts`, 클라이언트(`useProjectForm.ts`) 쪽은 전혀 손댈 필요 없다 — 둘 다
`{ url }` JSON만 주고받는 계약은 그대로다.

## 참고

- `REPLICATE_API_TOKEN`이 `.env.local`에 이미 있지만 코드에서 쓰이는 곳은 없다. Replicate
  provider를 붙일 계획이 있었던 것으로 보이며, 위 3단계 그대로 따라 추가하면 된다.
- Rate limit(`10회/분/유저`, `route.ts`)은 provider 종류와 무관하게 그대로 적용된다. OpenAI
  provider를 기본값으로 바꿀 경우 비용 관리 차원에서 더 낮추는 것을 고려할 것.
