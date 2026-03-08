import type { ButtonHTMLAttributes, ReactNode } from "react";

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const toneClassNames = {
  default:
    "border-slate-200/80 bg-white/88 text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45",
  active: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
  danger:
    "border-rose-300/80 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45",
  violet:
    "border-violet-300/80 bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45",
  success:
    "border-emerald-300/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45",
  info: "border-green-300/80 bg-green-50 text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-45",
} as const;

const sizeClassNames = {
  sm: "size-8",
  md: "size-9",
} as const;

const radiusClassNames = {
  soft: "rounded-md",
  chrome: "rounded-md",
} as const;

export function ChromeIconButton({
  children,
  className,
  tone = "default",
  size = "md",
  radius = "chrome",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: keyof typeof toneClassNames;
  size?: keyof typeof sizeClassNames;
  radius?: keyof typeof radiusClassNames;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={joinClassNames(
        "inline-flex shrink-0 items-center justify-center border transition",
        toneClassNames[tone],
        sizeClassNames[size],
        radiusClassNames[radius],
        className,
      )}
    >
      {children}
    </button>
  );
}
