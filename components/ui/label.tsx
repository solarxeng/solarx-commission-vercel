import type { LabelHTMLAttributes, ReactNode } from "react";

// A simple Label component.
export function Label({ children, className, ...props }: { children: ReactNode; className?: string } & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
}
