import { motion } from "framer-motion";
import {
  Inbox,
  GitBranch,
  Cpu,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { ACTIVITY_FEED } from "@/mock/data";
import { cn } from "@/lib/utils";

const ICONS = {
  received: Inbox,
  pipeline: GitBranch,
  llm: Cpu,
  recommendation: Sparkles,
  human: CheckCircle2,
  default: ShieldAlert,
};

const COLORS = {
  cyan: "text-cyan-300 ring-cyan-500/30 bg-cyan-500/10",
  purple: "text-purple-300 ring-purple-500/30 bg-purple-500/10",
  emerald: "text-emerald-300 ring-emerald-500/30 bg-emerald-500/10",
  amber: "text-amber-300 ring-amber-500/30 bg-amber-500/10",
};

export default function ActivityFeed() {
  return (
    <div className="rounded-xl border border-[#1E2536] bg-[#111623] p-5 md:p-6" data-testid="activity-feed">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Live Activity Feed
          </div>
          <div className="mt-1 text-base font-medium text-white">Last 60 seconds</div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          Streaming
        </div>
      </div>

      <div className="relative mt-5 space-y-4">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-[#1E2536] to-transparent" />
        {ACTIVITY_FEED.map((item, idx) => {
          const Icon = ICONS[item.type] || ICONS.default;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className="relative flex gap-4"
            >
              <div
                className={cn(
                  "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1",
                  COLORS[item.color] || COLORS.purple
                )}
              >
                <Icon size={13} strokeWidth={1.7} />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm text-slate-100">{item.label}</div>
                  <div className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    {item.time}
                  </div>
                </div>
                <div className="mt-0.5 truncate font-mono text-xs text-slate-500">
                  {item.detail}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
