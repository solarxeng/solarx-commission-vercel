import type { InputHTMLAttributes } from "react";

// A simple Input component. Accepts standard input attributes.
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}
