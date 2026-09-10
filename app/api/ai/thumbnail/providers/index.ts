import type { ThumbnailProvider } from "./types";
import { svgProvider } from "./svgProvider";
import { openaiProvider } from "./openaiProvider";

const PROVIDERS: Record<string, ThumbnailProvider> = {
  svg: svgProvider,
  openai: openaiProvider,
};

const DEFAULT_PROVIDER = "svg";

export function getThumbnailProvider(): ThumbnailProvider {
  const key = (process.env.THUMBNAIL_PROVIDER ?? DEFAULT_PROVIDER).toLowerCase();
  const provider = PROVIDERS[key];
  if (!provider) {
    throw new Error(
      `알 수 없는 THUMBNAIL_PROVIDER: "${key}" (사용 가능: ${Object.keys(PROVIDERS).join(", ")})`,
    );
  }
  return provider;
}

export type { ThumbnailProvider, ThumbnailAsset, ProjectInfo } from "./types";
