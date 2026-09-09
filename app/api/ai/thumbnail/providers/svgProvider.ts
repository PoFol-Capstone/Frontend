import { generatePastelSvgBuffer } from "../_lib";
import type { ThumbnailProvider } from "./types";

export const svgProvider: ThumbnailProvider = {
  async generate(info) {
    return {
      buffer: generatePastelSvgBuffer(info),
      contentType: "image/svg+xml",
      extension: "svg",
    };
  },
};
