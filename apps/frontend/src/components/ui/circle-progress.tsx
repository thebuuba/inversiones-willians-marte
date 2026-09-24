export function CircleProgress({
  value,
  color,
  blue = false,
}: {
  value: number;
  color: string;
  blue?: boolean;
}) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  return (
    <div className="relative h-[52px] w-[52px] shrink-0">
      <svg className="-rotate-90" width="52" height="52" aria-hidden="true">
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          strokeWidth="4"
          stroke={blue ? 'rgba(255,255,255,.25)' : '#e8eef7'}
        />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          stroke={blue ? '#fff' : color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${blue ? 'text-white' : 'text-text-primary'}`}
      >
        {Math.round(progress)}
        <span className="text-[8px]">%</span>
      </span>
    </div>
  );
}
