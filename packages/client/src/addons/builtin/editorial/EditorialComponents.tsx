import type { ReactNode, CSSProperties } from "react";
import { Children, isValidElement, useEffect, useState } from "react";
import type { HighlighterCore } from "shiki";
import { createHighlighter } from "shiki";

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}

/* ─── Eyebrow ─── */
export function EdEyebrow({ plain, children }: { plain?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-[18px] text-[22px] font-semibold uppercase tracking-[.22em] text-[var(--ed-accent)]">
      {!plain && <span className="inline-block h-px w-12 bg-[var(--ed-accent)]" />}
      {children}
    </div>
  );
}

/* ─── Title ─── */
export function EdTitle({
  size = "lg",
  children,
  style,
}: {
  size?: "lg" | "md" | "sm";
  children: ReactNode;
  style?: CSSProperties;
}) {
  const fs = size === "lg" ? "text-[96px]" : size === "md" ? "text-[72px]" : "text-[54px]";
  return (
    <h1 className={cn(fs, "m-0 font-semibold leading-[1.05] tracking-[-0.01em]")} style={style}>
      {children}
    </h1>
  );
}

export function EdH2({
  size = "lg",
  children,
  style,
}: {
  size?: "lg" | "sm";
  children: ReactNode;
  style?: CSSProperties;
}) {
  const fs = size === "lg" ? "text-[64px]" : "text-[54px]";
  return (
    <h2
      className={cn(fs, "m-0 mt-6 font-semibold leading-[1.1] tracking-[-0.005em]")}
      style={style}
    >
      {children}
    </h2>
  );
}

/* ─── Lede ─── */
export function EdLede({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="mt-6 max-w-[1500px] text-[30px] leading-[1.5] text-[var(--ed-ink-2)]"
      style={style}
    >
      {children}
    </div>
  );
}

/* ─── Card ─── */
export function EdCard({
  title,
  dot,
  children,
}: {
  title: string;
  dot?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-[var(--ed-border)] bg-[var(--ed-surface)] px-[36px] py-[32px]">
      <div className="mb-[14px] flex items-center gap-3 text-[30px] font-semibold text-[var(--ed-text)]">
        {dot && <span className="size-[10px] rounded-full" style={{ background: dot }} />}
        {title}
      </div>
      <div className="text-[24px] leading-[1.5] text-[var(--ed-ink-2)]">{children}</div>
    </div>
  );
}

/* ─── Callout ─── */
export function EdCallout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="border-l-[3px] border-l-[var(--ed-accent)] bg-[#fbf6e8] px-[32px] py-[24px] text-[24px] leading-[1.5] text-[var(--ed-ink-2)]">
      {title && (
        <div className="mb-[6px] text-[26px] font-semibold text-[var(--ed-text)]">{title}</div>
      )}
      {children}
    </div>
  );
}

/* ─── Insight ─── */
export function EdInsight({
  label = "Insight",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 flex items-start gap-7 bg-[#1f1d18] px-[36px] py-[28px] text-[26px] leading-[1.5] text-[#f4f1e8]">
      <div className="whitespace-nowrap pt-[6px] font-mono text-[18px] uppercase tracking-[.16em] text-[#e8b75a]">
        {label}
      </div>
      <div className="text-[25px] text-[#e6e3d8]">{children}</div>
    </div>
  );
}

/* ─── VsRow ─── */
export function EdVsRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[1fr_1px_1fr] items-stretch gap-12">{children}</div>;
}

export function EdVsCol({
  side,
  tag,
  name,
  children,
}: {
  side: "ds" | "gl";
  tag?: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center gap-[14px] text-[36px] font-semibold text-[var(--ed-text)]">
        {tag && (
          <span
            className="rounded-full px-3 py-[6px] font-mono text-[18px] uppercase tracking-[.08em]"
            style={{
              color: `var(--ed-${side})`,
              background: `var(--ed-${side}-bg)`,
              border: `1px solid var(--ed-${side}-stroke)`,
            }}
          >
            {tag}
          </span>
        )}
        {name}
      </div>
      {children}
    </div>
  );
}

export function EdVsSep() {
  return <div className="bg-[var(--ed-rule)]" />;
}

export function EdVsList({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-none p-0">{children}</ul>;
}

export function EdVsItem({ children }: { children: ReactNode }) {
  return (
    <li className="!m-0 !px-0 !py-[10px] !text-[25px] !leading-[1.5] !text-[var(--ed-ink-2)] border-b border-dashed border-[var(--ed-rule)] last:border-b-0">
      {children}
    </li>
  );
}

/* ─── WinPill ─── */
export function EdWin({ side, label }: { side: "ds" | "gl" | "tie"; label: string }) {
  const variants: Record<string, string> = {
    ds: "bg-[var(--ed-ds-bg)] text-[var(--ed-ds)] border-[var(--ed-ds-stroke)]",
    gl: "bg-[var(--ed-gl-bg)] text-[var(--ed-gl)] border-[var(--ed-gl-stroke)]",
    tie: "bg-[rgba(22,24,29,0.06)] text-[var(--ed-muted)] border-[var(--ed-border)]",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-[10px] py-1 font-mono text-[18px] uppercase tracking-[.08em]",
        variants[side],
      )}
    >
      {label}
    </span>
  );
}

/* ─── Scoreboard ─── */
export function EdScoreboard({ children }: { children: ReactNode }) {
  return <div className="mt-6 grid grid-cols-2 gap-8">{children}</div>;
}

export function EdScorePanel({
  side,
  value,
  unit,
  label,
}: {
  side: "ds" | "gl";
  value: string;
  unit?: string;
  label: string;
}) {
  return (
    <div
      className="relative rounded-sm border border-[var(--ed-border)] bg-[var(--ed-surface)] px-[32px] py-[28px]"
      style={{ borderTop: `4px solid var(--ed-${side})` }}
    >
      <div className="text-[120px] font-semibold leading-none text-[var(--ed-text)]">
        {value}
        {unit && (
          <small className="ml-[6px] text-[36px] font-normal text-[var(--ed-muted)]">{unit}</small>
        )}
      </div>
      <div className="mt-[6px] font-mono text-[22px] uppercase tracking-[.08em] text-[var(--ed-muted)]">
        {label}
      </div>
    </div>
  );
}

/* ─── NumList ─── */
export function EdNumList({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <ol className="m-0 mt-8 list-none p-0">
      {items.map((item, idx) => {
        const num = String(idx + 1).padStart(2, "0");
        return (
          <EdNumItemInternal key={idx} num={num}>
            {(item.props as { children: ReactNode }).children}
          </EdNumItemInternal>
        );
      })}
    </ol>
  );
}

function EdNumItemInternal({ num, children }: { num: string; children: ReactNode }) {
  return (
    <li className="!m-0 !px-0 !py-[18px] grid grid-cols-[60px_1fr] items-baseline gap-6 border-t border-[var(--ed-border)] !text-[26px] !leading-[1.5] !text-[var(--ed-ink-2)]">
      <span className="text-[32px] font-semibold leading-[1.2] text-[var(--ed-accent)]">{num}</span>
      <div>{children}</div>
    </li>
  );
}

export function EdNumItem({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/* ─── Statement ─── */
export function EdStatement({ children, sig }: { children: ReactNode; sig?: string }) {
  return (
    <div className="editorial-slide-root flex flex-col justify-center bg-[var(--ed-bg)] p-[120px] text-[var(--ed-text)]">
      <div className="max-w-[1500px] text-[88px] font-medium leading-[1.2]">{children}</div>
      {sig && (
        <div className="mt-[60px] font-mono text-[22px] uppercase tracking-[.16em] text-[var(--ed-muted)]">
          {sig}
        </div>
      )}
    </div>
  );
}

/* ─── Tree (architecture topology) ─── */
export function EdTreeBand({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[18px] uppercase tracking-[.1em] text-[var(--ed-muted)]">
      {children}
    </div>
  );
}

export function EdSwatch({ color }: { color: string }) {
  return <span className="inline-block size-[14px]" style={{ background: color }} />;
}

export function EdTreeLayer({ cols, children }: { cols: number; children: ReactNode }) {
  return (
    <div className="gap-3" style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)` }}>
      {children}
    </div>
  );
}

export function EdTreeNode({
  layer = "core",
  name,
  loc,
}: {
  layer?: "entry" | "core" | "infra" | "found";
  name: string;
  loc?: string;
}) {
  const colors = {
    entry: "var(--ed-blue-title)",
    core: "var(--ed-green-title)",
    infra: "var(--ed-amber-title)",
    found: "var(--ed-muted)",
  };
  return (
    <div
      className="rounded-sm border border-[var(--ed-border)] bg-[var(--ed-surface)] px-[18px] py-[14px] font-mono text-[18px] text-[var(--ed-text)]"
      style={{ borderLeft: `4px solid ${colors[layer]}` }}
    >
      {name}
      {loc && (
        <>
          <br />
          <span className="text-[var(--ed-muted)]">{loc}</span>
        </>
      )}
    </div>
  );
}

/* ─── Inline code chip ─── */
export function EdKw({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[4px] bg-[rgba(22,24,29,0.07)] px-[6px] py-[2px] font-mono text-[0.9em] text-[var(--ed-accent)]">
      {children}
    </code>
  );
}

/* ─── Shiki highlighter singleton ─── */
let edHighlighterPromise: Promise<HighlighterCore> | null = null;

function getEdHighlighter(lang: string) {
  if (!edHighlighterPromise) {
    edHighlighterPromise = createHighlighter({
      themes: ["vitesse-light"],
      langs: [lang],
    });
  }
  return edHighlighterPromise;
}

/* ─── Code block (for prompts inside slides) ─── */
export function EdCode({
  children,
  size = "sm",
  lang,
}: {
  children: ReactNode;
  size?: "sm" | "xs";
  lang?: string;
}) {
  const fs = size === "sm" ? "text-[17px]" : "text-[14px]";
  const code =
    typeof children === "string" ? children : Array.isArray(children) ? children.join("") : "";
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!lang || !code) return;
    let cancelled = false;
    getEdHighlighter(lang).then((hl) => {
      if (cancelled) return;
      const loaded = hl.getLoadedLanguages();
      if (!loaded.includes(lang)) {
        hl.loadLanguage(lang as Parameters<typeof hl.loadLanguage>[0]).then(() => {
          if (!cancelled) setHtml(hl.codeToHtml(code, { lang, theme: "vitesse-light" }));
        });
      } else {
        setHtml(hl.codeToHtml(code, { lang, theme: "vitesse-light" }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (lang && html) {
    return (
      <div
        className={cn(
          fs,
          "m-0 overflow-hidden whitespace-pre-wrap leading-[1.55] [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!border-0 [&_pre]:!bg-[var(--ed-surface-elevated)] [&_pre]:!p-[24px_28px] [&_pre]:!shadow-none",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <pre
      className={cn(
        fs,
        "m-0 overflow-hidden whitespace-pre-wrap bg-[var(--ed-surface-elevated)] px-[28px] py-[24px] leading-[1.55] text-[var(--ed-text)]",
      )}
    >
      {children}
    </pre>
  );
}

/* ─── Table ─── */
export function EdTable({ children }: { children: ReactNode }) {
  return (
    <table className="mt-8 w-full border-collapse bg-white text-[24px] text-[var(--ed-text)] border border-[var(--ed-rule)]">
      {children}
    </table>
  );
}

export function EdThead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-[#faf7ee]">{children}</tr>
    </thead>
  );
}

export function EdTh({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <th
      className="text-left px-[20px] py-[16px] border-b border-[var(--ed-rule)] font-semibold text-[20px] uppercase tracking-[.08em] text-[var(--ed-muted)]"
      style={width ? { width } : undefined}
    >
      {children}
    </th>
  );
}

export function EdTd({
  children,
  label,
  win,
  last,
}: {
  children: ReactNode;
  label?: boolean;
  win?: "ds" | "gl";
  last?: boolean;
}) {
  const base = last
    ? "px-[20px] py-[16px]"
    : "px-[20px] py-[16px] border-b border-[var(--ed-rule)]";
  const labelCls = label ? "font-semibold" : "";
  const winCls =
    win === "ds"
      ? "font-semibold text-[var(--ed-ds)]"
      : win === "gl"
        ? "font-semibold text-[var(--ed-gl)]"
        : "";
  return <td className={cn(base, labelCls, winCls, "leading-[1.4]")}>{children}</td>;
}

/* ─── Status Pill ─── */
export function EdStatus({ status }: { status: "done" | "partial" | "fail" }) {
  const variants = {
    done: {
      text: "已完成",
      cls: "text-[var(--ed-green-title)] bg-[rgba(22,163,74,0.08)] border-[rgba(22,163,74,0.24)]",
    },
    partial: {
      text: "未全部完成",
      cls: "text-[var(--ed-amber-title)] bg-[rgba(217,119,6,0.08)] border-[rgba(217,119,6,0.24)]",
    },
    fail: {
      text: "未完成",
      cls: "text-[var(--ed-red-title)] bg-[rgba(220,38,38,0.08)] border-[rgba(220,38,38,0.24)]",
    },
  };
  const v = variants[status];
  return (
    <span
      className={cn(
        "font-mono text-[14px] uppercase tracking-[.08em] px-2 py-[3px] rounded-full border",
        v.cls,
      )}
    >
      {v.text}
    </span>
  );
}

/* ─── Section heading (used inside slide content) ─── */
export function EdSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[14px] text-[32px] font-semibold text-[var(--ed-text)]">{children}</div>
  );
}

/* ─── Verification list item (for prompt pages) ─── */
export function EdCheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="!m-0 !px-0 !py-2 !text-[21px] !leading-[1.5] !text-[var(--ed-ink-2)] border-b border-dashed border-[var(--ed-rule)] last:border-b-0">
      {children}
    </li>
  );
}

/* ─── Task item (for five-tasks overview) ─── */
export function EdTaskItem({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-5">
      <span className="min-w-[40px] font-mono text-[28px] font-semibold text-[var(--ed-accent)]">
        {num}
      </span>
      <div>
        <div className="text-[26px] font-semibold text-[var(--ed-text)]">{title}</div>
        <div className="mt-[6px] text-[24px] leading-[1.5] text-[var(--ed-muted)]">{desc}</div>
      </div>
    </div>
  );
}

/* ─── Prompt section sub-heading ─── */
export function EdSubHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 mt-[18px] text-[24px] font-semibold text-[var(--ed-text)]">{children}</div>
  );
}

/* ─── Two-column wrapper ─── */
export function EdGrid({
  cols = 2,
  template,
  gap = "32px",
  marginTop,
  children,
}: {
  cols?: number;
  template?: string;
  gap?: string;
  marginTop?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: template || `repeat(${cols}, 1fr)`,
        gap,
        marginTop,
      }}
    >
      {children}
    </div>
  );
}

/* ─── BarRow ─── */
export function EdBarRow({
  label,
  value,
  max = 100,
  side = "ds",
}: {
  label: string;
  value: number;
  max?: number;
  side?: "ds" | "gl";
}) {
  const pct = (value / max) * 100;
  return (
    <div className="grid grid-cols-[220px_1fr_80px] items-center gap-5 py-[14px] text-[22px] text-[var(--ed-text)]">
      <div>{label}</div>
      <div className="relative h-[10px] overflow-hidden rounded-full bg-[var(--ed-surface-elevated)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: `var(--ed-${side})` }}
        />
      </div>
      <div className="text-right font-mono font-semibold">{value}</div>
    </div>
  );
}

/* ─── Score (e.g. 8:6) ─── */
export function EdScore({
  a,
  b,
  win,
}: {
  a: number | string;
  b: number | string;
  win?: "a" | "b" | "tie";
}) {
  const aColor = win === "a" ? "text-[var(--ed-ds)]" : "text-[var(--ed-muted)]";
  const bColor = win === "b" ? "text-[var(--ed-gl)]" : "text-[var(--ed-muted)]";
  return (
    <span className="whitespace-nowrap">
      <span className={cn("font-mono text-[26px] font-bold", aColor)}>{a}</span>{" "}
      <span className="font-mono text-[20px] text-[var(--ed-muted)]">:</span>{" "}
      <span className={cn("font-mono text-[26px] font-bold", bColor)}>{b}</span>
    </span>
  );
}

/* ─── Disclaimer (renders inside dark divider) ─── */
export function EdDisclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[900px] rounded-lg border border-[rgba(247,247,244,0.12)] bg-[rgba(247,247,244,0.06)] px-7 py-5 text-[22px] leading-[1.5] text-[rgba(247,247,244,0.56)]">
      <b className="text-[rgba(247,247,244,0.72)]">免责声明</b>
      {"　"}
      {children}
    </div>
  );
}

/* ─── ProjectTag (header line with badge + name + LOC + status) ─── */
export function EdProjectTag({
  side,
  name,
  loc,
  status,
}: {
  side: "ds" | "gl";
  name: string;
  loc: string;
  status?: "done" | "partial" | "fail";
}) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-3 text-[28px] font-semibold leading-[1.4]">
      <span
        className="rounded-full border px-[10px] py-1 font-mono text-[16px] uppercase tracking-[.08em]"
        style={{
          color: `var(--ed-${side})`,
          background: `var(--ed-${side}-bg)`,
          borderColor: `var(--ed-${side}-stroke)`,
        }}
      >
        {side === "ds" ? "Opus" : "GPT"}
      </span>
      {name}
      <span className="font-mono text-[20px] text-[var(--ed-muted)]">{loc}</span>
      {status && <EdStatus status={status} />}
    </div>
  );
}

/* ─── BrandCard (two-column comparison card with top border) ─── */
export function EdBrandCard({
  side,
  title,
  children,
}: {
  side: "ds" | "gl";
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-sm border border-[var(--ed-rule)] bg-white px-9 py-8"
      style={{ borderTop: `4px solid var(--ed-${side})` }}
    >
      <div className="mb-[14px] flex items-center gap-3 text-[30px] font-semibold">
        <span className="size-[10px] rounded-full" style={{ background: `var(--ed-${side})` }} />
        {title}
      </div>
      {children}
    </div>
  );
}

/* ─── CoverTitle (hero title for EditorialCover) ─── */
export function EdCoverTitle({ a, b }: { a: string; b: string }) {
  return (
    <div className="mb-7 text-[124px] font-semibold leading-[1.02] tracking-[-3px]">
      <span className="block font-semibold text-[var(--ed-ds)]">{a}</span>
      <span className="my-4 block text-[72px] font-normal italic text-[var(--ed-muted)]">vs.</span>
      <span className="block font-semibold text-[var(--ed-gl)]">{b}</span>
    </div>
  );
}

/* ─── Mark (bold span with editorial palette color) ─── */
export function EdMark({
  color = "accent",
  children,
}: {
  color?: "accent" | "ds" | "gl" | "red" | "green" | "amber";
  children: ReactNode;
}) {
  const colorMap: Record<string, string> = {
    accent: "text-[var(--ed-accent)]",
    ds: "text-[var(--ed-ds)]",
    gl: "text-[var(--ed-gl)]",
    red: "text-[var(--ed-red-title)]",
    green: "text-[var(--ed-green-title)]",
    amber: "text-[var(--ed-amber-title)]",
  };
  return <b className={colorMap[color]}>{children}</b>;
}

/* ─── Link ─── */
export function EdLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--ed-accent)] underline"
    >
      {children}
    </a>
  );
}

/* ─── SummaryCard (compact card with mono label) ─── */
export function EdSummaryCard({
  side,
  label,
  children,
}: {
  side: "ds" | "gl";
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-sm border border-[var(--ed-rule)] bg-white px-7 py-6"
      style={{ borderTop: `4px solid var(--ed-${side})` }}
    >
      <div className="font-mono text-[20px] uppercase tracking-[.08em] text-[var(--ed-muted)]">
        {label}
      </div>
      <div className="mt-2 text-[26px] leading-[1.5] text-[var(--ed-ink-2)]">{children}</div>
    </div>
  );
}

/* ─── BrandLabel (colored dot + text, used as section label) ─── */
export function EdBrandLabel({ side, children }: { side: "ds" | "gl"; children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3 text-[30px] font-semibold">
      <span className="size-[10px] rounded-full" style={{ background: `var(--ed-${side})` }} />
      {children}
    </div>
  );
}

/* ─── BarLabel (mono uppercase label for bar charts) ─── */
export function EdBarLabel({ side, children }: { side: "ds" | "gl"; children: ReactNode }) {
  return (
    <div
      className="mb-2 font-mono text-[20px] uppercase tracking-[.08em]"
      style={{ color: `var(--ed-${side})` }}
    >
      {children}
    </div>
  );
}

/* ─── Image placeholder with drag-and-drop upload ─── */
declare const __SLIDES_ASSETS_BASE__: string;

export function EdImage({
  id,
  caption,
  aspect = "16/9",
}: {
  id: string;
  caption?: string;
  aspect?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetch("/__slides-api/image-list")
      .then((r) => r.json())
      .then((map: Record<string, string>) => {
        if (map[id]) setSrc(map[id] + "?t=" + Date.now());
      })
      .catch(() => {});
  }, [id]);

  const upload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      fetch("/__slides-api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, data }),
      })
        .then((r) => r.json())
        .then((res: { url: string }) => setSrc(res.url + "?t=" + Date.now()))
        .catch(() => {});
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) upload(file);
  };

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) upload(file);
    };
    input.click();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetch("/__slides-api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).then(() => setSrc(null));
  };

  if (src) {
    return (
      <figure className="relative m-0 mt-4">
        <img
          src={src}
          alt={caption || id}
          className="w-full rounded-sm border border-[var(--ed-border)]"
          style={{ aspectRatio: aspect, objectFit: "cover" }}
        />
        {caption && (
          <figcaption className="mt-2 text-center font-mono text-[16px] text-[var(--ed-muted)]">
            {caption}
          </figcaption>
        )}
        <button
          type="button"
          onClick={handleDelete}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-[14px] text-white hover:bg-black/80"
        >
          ×
        </button>
      </figure>
    );
  }

  return (
    <figure className="m-0 mt-4" onClick={handleClick}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed transition-colors",
          dragging
            ? "border-[var(--ed-accent)] bg-[var(--ed-ds-bg)]"
            : "border-[var(--ed-border)] bg-[var(--ed-surface-elevated)]",
        )}
        style={{ aspectRatio: aspect }}
      >
        <div className="text-[36px] text-[var(--ed-muted)]">+</div>
        <div className="mt-1 font-mono text-[16px] text-[var(--ed-muted)]">{caption || id}</div>
        <div className="mt-1 text-[14px] text-[var(--ed-ghost)]">拖入图片或点击上传</div>
      </div>
    </figure>
  );
}
