import type { ReactNode } from "react";
import { useSlidesState } from "../../../app/providers/SlidesNavigationProvider";

export function EditorialSlide({
  brand,
  eyebrow,
  context,
  footer,
  tight,
  children,
}: {
  brand: string;
  eyebrow?: string;
  context?: string;
  footer?: string;
  page?: string;
  tight?: boolean;
  children: ReactNode;
}) {
  const { currentIndex, total } = useSlidesState();
  const page = `${String(currentIndex + 1).padStart(2, "0")} / ${total}`;
  return (
    <div
      className="editorial-slide-root"
      style={{
        background: "var(--ed-bg)",
        fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        color: "var(--ed-text)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "70px 110px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header — section-tag style with green dot */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: "18px",
            letterSpacing: "2px",
            textTransform: "uppercase" as const,
            color: "var(--ed-muted)",
            paddingBottom: "24px",
            borderBottom: "1px solid var(--ed-border-subtle)",
            marginBottom: "40px",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--ed-accent)", display: "inline-block" }} />
            <span style={{ color: "var(--ed-text)", fontWeight: 600 }}>{brand}</span>
            {eyebrow && (
              <>
                <span style={{ color: "var(--ed-ghost)" }}>·</span>
                <span style={{ color: "var(--ed-accent)", fontWeight: 600 }}>{eyebrow}</span>
              </>
            )}
          </span>
          <span style={{ fontSize: "18px", color: "var(--ed-ghost)", letterSpacing: "1px" }}>{page || ""}</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>

        {/* Footer — minimal mono caption */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: "14px",
            letterSpacing: "1.6px",
            textTransform: "uppercase" as const,
            color: "var(--ed-ghost)",
            paddingTop: "24px",
          }}
        >
          <span>{footer || "DeepSeek V4 Pro  ×  GLM 5.1"}</span>
          {context && <span>{context}</span>}
        </div>
      </div>
    </div>
  );
}
