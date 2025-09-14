import type { ButtonHTMLAttributes, ReactNode } from "react";

// A simple Button component. Accepts standard button attributes.
export function Button({ children, className, ...props }: { children: ReactNode; className?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}
