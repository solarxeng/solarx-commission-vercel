import type { ReactNode, HTMLAttributes } from "react";

// A simple Card component that wraps content in a div with a border and padding.
export function Card({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={"border rounded-xl p-4 " + (className || "")} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={"mb-2 " + (className || "")} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={"" + (className || "")} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <h2 className={"text-2xl font-bold " + (className || "")} {...props}>
      {children}
    </h2>
  );
}
