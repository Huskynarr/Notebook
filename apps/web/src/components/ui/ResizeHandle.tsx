import type { ReactElement } from 'react';

/** Ziehbarer Trenner zwischen zwei Spalten. Ein echter Separator mit Wert,
 *  damit er per Tastatur (Pfeile) bedienbar bleibt. */
export function ResizeHandle({
  label,
  value,
  min,
  max,
  onPointerDown,
  onStep,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onStep: (delta: number) => void;
}): ReactElement {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onStep(-16);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onStep(16);
        }
      }}
      className="group hidden w-2 shrink-0 cursor-col-resize touch-none items-stretch justify-center xl:flex"
    >
      <span
        aria-hidden="true"
        className="bg-border-subtle group-hover:bg-border-strong group-focus-visible:bg-action w-px transition-colors duration-[80ms]"
      />
    </div>
  );
}
