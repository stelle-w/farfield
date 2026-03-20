interface ContextUsageRingButtonProps {
  percentage: number;
}

function describeRingTone(percentage: number): string {
  if (percentage >= 90) {
    return "text-muted-foreground/80";
  }
  if (percentage >= 70) {
    return "text-muted-foreground/75";
  }
  return "text-muted-foreground/70";
}

export function ContextUsageRingButton({
  percentage,
}: ContextUsageRingButtonProps): React.JSX.Element {
  const boundedPercentage = Math.max(0, Math.min(percentage, 100));
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const dashOffset =
    circumference - (boundedPercentage / 100) * circumference;
  const toneClass = describeRingTone(boundedPercentage);

  return (
    <span className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
      <svg
        width="18"
        height="18"
        viewBox="0 0 26 26"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle
          cx="13"
          cy="13"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          className="text-muted-foreground/20"
        />
        <circle
          cx="13"
          cy="13"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 13 13)"
          className={toneClass}
        />
        <text
          x="13"
          y="14.8"
          textAnchor="middle"
          className="fill-current text-[5.5px] font-semibold"
        >
          %
        </text>
      </svg>
    </span>
  );
}
