import type { ProjectInfo } from "../_lib";

export type { ProjectInfo };

export interface ThumbnailAsset {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

export interface ThumbnailProvider {
  generate(info: ProjectInfo): Promise<ThumbnailAsset>;
}
