import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#8E8E93] text-white active:bg-[#636366] border border-transparent",
  secondary:
    "bg-[#F7F7F9] text-[#1C1C1E] border border-[#E5E5EA] active:bg-[#E5E5EA]",
  dark: "bg-[#1C1C1E] text-white active:bg-[#3A3A3C] border border-transparent",
  danger: "bg-[#FF3B30] text-white active:bg-[#E0352B]",
  ghost: "bg-transparent text-[#1C1C1E] active:bg-[#F7F7F9]",
};

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[17px] font-semibold transition-all",
        "active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100",
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
