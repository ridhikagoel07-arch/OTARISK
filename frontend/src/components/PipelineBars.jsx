import { motion } from "framer-motion";
import { PIPELINE_DISTRIBUTION } from "@/mock/data";

export default function PipelineBars() {
  const total = PIPELINE_DISTRIBUTION.reduce((s, p) => s + p.count, 0);
  return (
    <div className="rounded-xl border border-[#1E2536] bg-[#111623] p-5 md:p-6" data-testid="pipeline-distribution">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Pipeline Distribution
          </div>
          <div className="mt-1 text-base font-medium text-white">Today · {total.toLocaleString()} txns routed</div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          Live
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {PIPELINE_DISTRIBUTION.map((p, i) => (
          <div key={p.name} data-testid={`pipeline-bar-${p.name.toLowerCase().replace(" ", "-")}`}>
            <div className="flex items-baseline justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="text-slate-200">{p.name}</span>
                <span className="text-slate-500">· {p.label}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-slate-500">{p.count.toLocaleString()}</span>
                <span className="text-white">{p.pct}%</span>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#0B0F19] ring-1 ring-inset ring-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.pct}%` }}
                transition={{ duration: 1.1, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: `linear-gradient(90deg, ${p.color}, ${p.color}80)`,
                  boxShadow: `0 0 12px ${p.color}40`,
                }}
                className="h-full rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
