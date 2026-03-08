import type { ReactNode, SelectHTMLAttributes } from "react";

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "size"> {
  label: ReactNode;
  children: ReactNode;
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: {
    container: "px-3 py-1.5 gap-2",
    select: "px-2.5 py-1",
  },
  md: {
    container: "px-3 py-2 gap-2",
    select: "px-2.5 py-1",
  },
};

export function FormSelect({
  label,
  children,
  size = "sm",
  className,
  ...props
}: FormSelectProps) {
  return (
    <label
      className={joinClassNames(
        "inline-flex items-center rounded-md border border-slate-200/80 bg-white/88 text-xs font-medium text-slate-700",
        sizeStyles[size].container,
        className,
      )}
    >
      {label}
      <select
        {...props}
        className={joinClassNames(
          "rounded-md border border-slate-200/80 bg-white text-xs text-slate-700 outline-none",
          sizeStyles[size].select,
        )}
      >
        {children}
      </select>
    </label>
  );
}
