import type { ReactNode } from "react";
import { useSlidesState } from "../../../app/providers/SlidesNavigationProvider";

export function EditorialDivider({
  chapter,
  eyebrow,
  title,
  desc,
  footer,
  children,
}: {
  chapter: string;
  eyebrow?: string;
  title: string;
  desc?: string;
  footer?: string;
  page?: string;
  children?: ReactNode;
}) {
  const { currentIndex, total } = useSlidesState();
  const page = `${String(currentIndex + 1).padStart(2, "0")} / ${total}`;
  return (
    <div
      className="editorial-slide-root"
      style={{
        background: "#16181d",
        color: "#f4f1e8",
        padding: "120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      }}
    >
      <div
        style={{
          fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          fontStyle: "italic",
          fontSize: "280px",
          lineHeight: ".9",
          color: "rgba(255,255,255,0.06)",
          position: "absolute",
          right: "120px",
          top: "80px",
        }}
      >
        {chapter}
      </div>

      <div>
        <div
          style={{
            fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", sans-serif',
            fontSize: "36px",
            fontWeight: 600,
            letterSpacing: ".22em",
            textTransform: "uppercase" as const,
            color: "#e8b75a",
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <span style={{ display: "inline-block", width: "48px", height: "1px", background: "#e8b75a" }} />
          {eyebrow || `Chapter ${chapter}`}
        </div>
        <h1
          style={{
            fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            fontWeight: 600,
            fontSize: "160px",
            lineHeight: 1,
            margin: 0,
            marginTop: "24px",
            color: "#f4f1e8",
          }}
        >
          {title}
        </h1>
        {desc && (
          <div style={{ color: "#bfbcb1", fontSize: "30px", maxWidth: "1100px", lineHeight: 1.5, marginTop: "36px" }}>
            {desc}
          </div>
        )}
      </div>

      {children}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "20px",
          color: "#5a5d63",
          letterSpacing: ".1em",
          textTransform: "uppercase" as const,
        }}
      >
        <div>{footer}</div>
        {page && <div>{page}</div>}
      </div>
    </div>
  );
}
