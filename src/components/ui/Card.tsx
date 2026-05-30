import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "w-full rounded-2xl bg-[#F7F7F9] p-4 text-left",
        "border border-[#E5E5EA]/80",
        onClick ? "active:bg-[#ECECEF] transition-colors" : "",
        className,
      ].join(" ")}
    >
      {children}
    </Component>
  );
}
