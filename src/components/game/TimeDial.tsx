import { MAX_TIME } from '@/lib/constants';

export const formatHours = (hours: number) =>
  Number(hours.toFixed(1)).toString();

// The dial and the "hours left" number both show the Player's remaining Time.
// The dial is decoration; the number is the text assistive technology reads.
export function TimeDial({ hours }: { hours: number }) {
  const fraction = Math.min(Math.max(hours / MAX_TIME, 0), 1);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
      <svg viewBox="0 0 36 36" className="h-3/5 w-3/5 -rotate-90" aria-hidden>
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          className="stroke-slate-700"
          strokeWidth="4"
        />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          className="stroke-blue-400"
          strokeWidth="4"
          pathLength={100}
          strokeDasharray={`${fraction * 100} 100`}
        />
      </svg>
      <span className="text-center font-mono text-[10px] leading-tight text-white sm:text-xs">
        {formatHours(hours)} hours left
      </span>
    </div>
  );
}
