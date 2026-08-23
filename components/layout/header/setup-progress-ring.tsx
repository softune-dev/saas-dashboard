"use client";

/** Small circular completeness indicator — profile / business / store
 * details, one third each. No label text on purpose: this is a menu, not a
 * page, and the destination (Account settings) explains itself once
 * clicked. Renders nothing once all three are done — an always-100% ring
 * sitting in a menu forever is just noise. */
export function SetupProgressRing({
  completedSteps,
  totalSteps,
}: {
  completedSteps: number;
  totalSteps: number;
}) {
  if (completedSteps >= totalSteps) return null;

  const size = 36;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = completedSteps / totalSteps;
  const offset = circumference * (1 - fraction);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-border"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-[stroke-dashoffset] duration-300"
      />
    </svg>
  );
}
