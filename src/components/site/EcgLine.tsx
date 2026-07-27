export function EcgLine({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  const path =
    "M0 60 L120 60 L140 60 L155 40 L170 90 L185 10 L200 100 L215 60 L340 60 L360 60 L375 45 L390 80 L405 30 L420 60 L560 60";
  return (
    <svg
      viewBox="0 0 560 120"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ecgGrad" x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.5" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#ecgGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
      />
    </svg>
  );
}
