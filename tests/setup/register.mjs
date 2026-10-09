// node:test용 로더. 새 테스트 의존성 없이 이미 설치된 `typescript`로 TS/TSX를 변환하고,
// tsconfig의 `@/*` 별칭과 확장자 없는 상대 경로를 해석한다.
//
// 외부 비용이 드는 모듈(OpenAI, Vercel Blob)과 요청 컨텍스트가 필요한 `next/headers`는
// tests/mocks의 대역으로 바꿔 끼워서, 테스트가 실제 과금·운영 데이터에 닿지 않게 한다.
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

const MOCKS = {
  "@vercel/blob": "tests/mocks/vercel-blob.mjs",
  openai: "tests/mocks/openai.mjs",
  "next/headers": "tests/mocks/next-headers.mjs",
};

const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js"];

function findFile(base) {
  const candidates = [
    base,
    ...EXTENSIONS.map((ext) => base + ext),
    ...EXTENSIONS.map((ext) => path.join(base, "index" + ext)),
  ];
  return candidates.find(
    (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
  );
}

function isProjectFile(url) {
  return (
    typeof url === "string" &&
    url.startsWith("file:") &&
    !url.includes("/node_modules/")
  );
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (MOCKS[specifier]) {
      return {
        url: pathToFileURL(path.join(root, MOCKS[specifier])).href,
        shortCircuit: true,
      };
    }

    if (specifier.startsWith("@/")) {
      const file = findFile(path.join(root, specifier.slice(2)));
      if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }

    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      isProjectFile(context.parentURL)
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const file = findFile(path.resolve(parentDir, specifier));
      if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }

    try {
      return nextResolve(specifier, context);
    } catch (error) {
      // `next`는 exports 맵이 없어서 ESM에서 `next/server`처럼 확장자 없는 하위 경로를 못 찾는다
      if (!specifier.startsWith(".") && !specifier.startsWith("node:")) {
        return nextResolve(specifier + ".js", context);
      }
      throw error;
    }
  },

  load(url, context, nextLoad) {
    if (isProjectFile(url) && /\.(ts|tsx|mts)$/.test(url)) {
      const fileName = fileURLToPath(url);
      const { outputText } = ts.transpileModule(
        fs.readFileSync(fileName, "utf8"),
        {
          fileName,
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
            sourceMap: false,
          },
        },
      );
      return { format: "module", source: outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
