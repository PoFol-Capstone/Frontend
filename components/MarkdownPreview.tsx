import { Fragment, type ReactNode } from "react";

/**
 * 프로필 README 초안 미리보기용 최소 마크다운 렌더러.
 * HTML 문자열을 만들지 않고 React 노드로 그려서 초안에 섞인 태그·스크립트가 실행되지 않는다.
 * 지원: 제목(#~###), 목록(-, *), 이미지·링크(https만), 굵게, 인라인 코드, 문단. HTML 주석은 숨긴다.
 */

const INLINE = /!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)|\[([^\]]+)\]\((https:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[2]) {
      // eslint-disable-next-line @next/next/no-img-element -- 외부 뱃지·통계 이미지(도메인 미정)라 next/image를 쓰지 않는다
      nodes.push(<img key={key} src={m[2]} alt={m[1]} className="inline-block max-h-40 align-middle" />);
    } else if (m[4]) {
      // 링크 텍스트 안의 이미지([![..](..)](..))도 그린다
      nodes.push(
        <a key={key} href={m[4]} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          {renderInline(m[3], key)}
        </a>,
      );
    } else if (m[5]) {
      nodes.push(<strong key={key}>{m[5]}</strong>);
    } else if (m[6]) {
      nodes.push(<code key={key} className="rounded bg-gray-100 px-1 text-[0.85em]">{m[6]}</code>);
    }
    last = m.index! + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownPreview({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];

  const flush = (key: number) => {
    if (list.length > 0) {
      blocks.push(
        <ul key={`ul-${key}`} className="my-2 list-disc pl-5">
          {list.map((item, i) => <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>)}
        </ul>,
      );
      list = [];
    }
    if (paragraph.length > 0) {
      blocks.push(
        <p key={`p-${key}`} className="my-2">
          {paragraph.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              {renderInline(line, `p-${key}-${i}`)}
            </Fragment>
          ))}
        </p>,
      );
      paragraph = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (heading) {
      flush(idx);
      const size = ["text-2xl", "text-xl", "text-lg"][heading[1].length - 1];
      blocks.push(
        <p key={`h-${idx}`} className={`${size} mt-4 mb-2 font-bold`}>
          {renderInline(heading[2], `h-${idx}`)}
        </p>,
      );
    } else if (item) {
      if (paragraph.length > 0) flush(idx);
      list.push(item[1]);
    } else if (!line.trim()) {
      flush(idx);
    } else {
      if (list.length > 0) flush(idx);
      paragraph.push(line.trim());
    }
  });
  flush(lines.length);

  return <div className="text-sm leading-6 text-gray-800">{blocks}</div>;
}
