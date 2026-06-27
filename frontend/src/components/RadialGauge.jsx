import { motion } from "framer-motion";

/**
 * Animated radial gauge for displaying probability/confidence scores.
 * Props:
 *  - value: number 0..100
 *  - label: string
 *  - sublabel: string
 *  - color: 'red' | 'amber' | 'emerald' | 'purple'
 *  - size: pixel size
 */
export default function RadialGauge({
  value = 0,
  label = "",
  sublabel = "",
  color = "red",
  size = 220,
  testId,
}) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  const colorMap = {
    red: { hex: "#EF4444", glow: "rgba(239,68,68,0.4)" },
    amber: { hex: "#F59E0B", glow: "rgba(245,158,11,0.4)" },
    emerald: { hex: "#10B981", glow: "rgba(16,185,129,0.4)" },
    purple: { hex: "#8B5CF6", glow: "rgba(139,92,246,0.4)" },
    cyan: { hex: "#06B6D4", glow: "rgba(6,182,212,0.4)" },
  };
  const c = colorMap[color] || colorMap.red;

  return (
    <div className="relative grid place-items-center" data-testid={testId} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.hex} stopOpacity="1" />
            <stop offset="100%" stopColor={c.hex} stopOpacity="0.4" />
          </linearGradient>
          <filter id={`glow-${color}`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E2536"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Value */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#grad-${color})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          filter={`url(#glow-${color})`}
        />
        {/* Tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * 2 * Math.PI;
          const r1 = radius + stroke / 2 + 6;
          const r2 = i % 5 === 0 ? r1 + 6 : r1 + 3;
          const cx1 = size / 2 + Math.cos(angle) * r1;
          const cy1 = size / 2 + Math.sin(angle) * r1;
          const cx2 = size / 2 + Math.cos(angle) * r2;
          const cy2 = size / 2 + Math.sin(angle) * r2;
          return (
            <line
              key={i}
              x1={cx1}
              y1={cy1}
              x2={cx2}
              y2={cy2}
              stroke="#1E2536"
              strokeWidth={i % 5 === 0 ? 1 : 0.5}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>
          <div
            className="mt-1 font-mono text-[44px] font-medium leading-none tracking-tight text-white"
            style={{ textShadow: `0 0 24px ${c.glow}` }}
          >
            {value}
            <span className="text-2xl text-slate-500">%</span>
          </div>
          {sublabel && (
            <div className="mt-2 font-mono text-[11px] text-slate-500">{sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}
