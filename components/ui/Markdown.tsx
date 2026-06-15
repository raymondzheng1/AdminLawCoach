import { Fragment, type ReactNode } from "react";

/**
 * Minimal, dependency-free, XSS-safe Markdown renderer for grounded answers.
 * Renders headings, bold/italic/inline-code, and ordered/unordered lists into
 * React nodes (never dangerouslySetInnerHTML), so model output cannot inject HTML.
 */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(<Fragment key={`${keyPrefix}-t${i}`}>{text.slice(last, m.index)}</Fragment>);
    if (m[2] !== undefined) nodes.push(<strong key={`${keyPrefix}-b${i}`}>{m[2]}</strong>);
    else if (m[3] !== undefined) nodes.push(<em key={`${keyPrefix}-i${i}`}>{m[3]}</em>);
    else if (m[4] !== undefined)
      nodes.push(
        <code key={`${keyPrefix}-c${i}`} className="rounded bg-[var(--color-paper)] px-1 py-0.5 text-[0.9em]">
          {m[4]}
        </code>,
      );
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(<Fragment key={`${keyPrefix}-end`}>{text.slice(last)}</Fragment>);
  return nodes;
}

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  const lines = children.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={`p${key++}`} className="my-2 leading-relaxed">
          {inline(para.join(" "), `p${key}`)}
        </p>,
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const Tag = list.ordered ? "ol" : "ul";
      const cur = list;
      blocks.push(
        <Tag key={`l${key++}`} className={`my-2 ${cur.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
          {cur.items.map((it, idx) => (
            <li key={idx}>{inline(it, `l${key}-${idx}`)}</li>
          ))}
        </Tag>,
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1]!.length;
      const Tag = (`h${Math.min(level + 1, 5)}`) as "h2" | "h3" | "h4" | "h5";
      blocks.push(
        <Tag key={`h${key++}`} className="mt-4 mb-1 font-display font-semibold">
          {inline(heading[2]!, `h${key}`)}
        </Tag>,
      );
    } else if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]!);
    } else if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]!);
    } else if (line.trim() === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return <div className={`text-[15px] ${className}`}>{blocks}</div>;
}
