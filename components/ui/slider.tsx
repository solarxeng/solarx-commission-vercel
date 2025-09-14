import type { ChangeEvent } from "react";

interface SliderProps {
  value: [number];
  onValueChange: (val: [number]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

// A basic slider component using an HTML range input. The value prop expects a single-element array for compatibility with the original API.
export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, disabled }: SliderProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    onValueChange([num]);
  };
  return (
    <input
      type="range"
      value={value[0]}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
