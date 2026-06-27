import { cn } from "@/lib/utils";

export function StatusPill({ level, children, className }) {
  const map = {
    low: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
    critical: "bg-red-500/10 text-red-300 ring-1 ring-red-500/30",
    neutral: "bg-slate-500/10 text-slate-300 ring-1 ring-slate-500/20",
    purple: "bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/30",
    cyan: "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        map[level] || map.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

export function RiskDot({ level }) {
  const color =
    level === "low" ? "bg-emerald-400" :
    level === "medium" ? "bg-amber-400" :
    level === "critical" ? "bg-red-400" : "bg-slate-400";
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color)} />;
}
