import type { ReactNode } from "react";

export function EditorialCover({
  eyebrow,
  subEyebrow = "模型评测报告",
  date = "v0.1 · 2026.4",
  title,
  subtitle,
  bottomLeft = "",
  bottomRight = "@海拉鲁编程客",
  children,
}: {
  eyebrow?: string;
  subEyebrow?: string;
  date?: string;
  title?: ReactNode;
  subtitle?: string;
  bottomLeft?: string;
  bottomRight?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="editorial-slide-root"
      style={{
        background: "var(--ed-bg)",
        fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        color: "var(--ed-text)",
        overflow: "hidden",
        padding: "60px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        {/* Top meta */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--ed-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "var(--ed-bg)" }} />
            </div>
            <div
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "16px",
                letterSpacing: "1.5px",
                color: "var(--ed-ink-2)",
                textTransform: "uppercase",
              }}
            >
              {subEyebrow}
            </div>
          </div>

          {/* Chip */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              border: "1px solid var(--ed-border)",
              borderRadius: "999px",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "16px",
              letterSpacing: "0.5px",
              color: "var(--ed-ink-2)",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--ed-accent)" }} />
            {date}
          </div>
        </div>

        {/* Hero */}
        <div>
          {title || (
            <div
              style={{
                fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
                fontSize: "124px",
                fontWeight: 600,
                lineHeight: 1.02,
                letterSpacing: "-3px",
                marginBottom: "28px",
              }}
            >
              <span style={{ color: "var(--ed-ds)", fontWeight: 600, display: "block" }}>Claude Opus</span>
              <span style={{ color: "var(--ed-muted)", fontWeight: 400, fontStyle: "italic", display: "block", fontSize: "72px", margin: "16px 0" }}>vs.</span>
              <span style={{ color: "var(--ed-gl)", fontWeight: 600, display: "block" }}>GPT-5.5</span>
            </div>
          )}

          {subtitle && (
            <div
              style={{
                fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
                fontSize: "36px",
                fontWeight: 500,
                lineHeight: 1.25,
                color: "var(--ed-ink-2)",
                letterSpacing: "-0.4px",
                maxWidth: "1400px",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom row — single line, right-aligned */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            fontSize: "22px",
            color: "var(--ed-muted)",
            paddingTop: "20px",
            borderTop: "1px solid var(--ed-border-subtle)",
          }}
        >
          <span>{bottomLeft}</span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: "0.5px", marginLeft: "auto" }}>{bottomRight}</span>
        </div>
      </div>

      {children}
    </div>
  );
}
