import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KpiCard({
  label,
  value,
  unit,
  delta,
  hint,
  icon: Icon,
  accent = "purple",
  testId,
  spark,
}) {
  const positive = delta >= 0;
  const accentMap = {
    purple: "text-purple-300 bg-purple-500/10 ring-purple-500/20",
    cyan: "text-cyan-300 bg-cyan-500/10 ring-cyan-500/20",
    emerald: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20",
    amber: "text-amber-300 bg-amber-500/10 ring-amber-500/20",
    red: "text-red-300 bg-red-500/10 ring-red-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid={testId}
      className="group relative overflow-hidden rounded-xl border border-[#1E2536] bg-[#111623] p-5 transition-colors hover:border-[#2A3441]"
    >
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
            {Icon && (
              <span className={cn("grid h-6 w-6 place-items-center rounded ring-1", accentMap[accent])}>
                <Icon size={12} strokeWidth={1.8} />
              </span>
            )}
            <span>{label}</span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-mono text-[28px] font-medium leading-none tracking-tight text-white">
              {value}
            </span>
            {unit && (
              <span className="font-mono text-xs text-slate-500">{unit}</span>
            )}
          </div>
        </div>
        {typeof delta === "number" && (
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-mono text-[10px]",
              positive ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
            )}
          >
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {positive ? "+" : ""}
            {delta}%
          </div>
        )}
      </div>

      {hint && (
        <div className="relative z-10 mt-4 flex items-center justify-between border-t border-[#1E2536] pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          <span>{hint}</span>
          {spark}
        </div>
      )}

      {/* corner accent */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-purple-500/[0.05] blur-2xl" />
    </motion.div>
  );
}
