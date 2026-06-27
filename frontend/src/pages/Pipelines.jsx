import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Shield, ArrowRight } from "lucide-react";
import { TRANSACTIONS } from "@/mock/data";
import { cn } from "@/lib/utils";

const LANES = [
  {
    id: "A",
    title: "Low Risk",
    subtitle: "Approved Automatically",
    color: "emerald",
    icon: ShieldCheck,
    risk: "low",
    description:
      "XGBoost score below 30%. Transactions flow through automated approval with no human intervention.",
    glow: "shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]",
    accent: "#10B981",
  },
  {
    id: "B",
    title: "Medium Risk",
    subtitle: "Approved with OTP Verification",
    color: "amber",
    icon: Shield,
    risk: "medium",
    description:
      "Score between 30–80%. Customer is challenged with a step-up OTP before approval.",
    glow: "shadow-[0_0_60px_-15px_rgba(245,158,11,0.3)]",
    accent: "#F59E0B",
  },
  {
    id: "C",
    title: "Critical Risk",
    subtitle: "Human Review Required",
    color: "red",
    icon: ShieldAlert,
    risk: "critical",
    description:
      "Score above 80%. LLM investigates and a senior analyst reviews before final decision.",
    glow: "shadow-[0_0_80px_-15px_rgba(239,68,68,0.35)]",
    accent: "#EF4444",
  },
];

export default function Pipelines() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6" data-testid="pipelines-page">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
          Otari Decision Engine
        </div>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
          Investigation Pipelines
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Three risk lanes process every transaction. Each lane applies a distinct strategy and audit policy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {LANES.map((lane, i) => (
          <Lane key={lane.id} lane={lane} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

function Lane({ lane, delay }) {
  const nav = useNavigate();
  const Icon = lane.icon;
  const list = TRANSACTIONS.filter((t) => t.riskLevel === lane.risk).slice(0, 9);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      data-testid={`pipeline-lane-${lane.id}`}
      className={cn(
        "relative flex flex-col rounded-2xl border border-[#1E2536] bg-[#111623]/80 backdrop-blur-xl overflow-hidden",
        lane.glow
      )}
    >
      {/* Header gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${lane.accent}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full blur-3xl opacity-30"
        style={{ background: lane.accent }}
      />

      <div className="relative flex items-start justify-between border-b border-[#1E2536] p-5">
        <div className="flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg ring-1"
            style={{
              background: `${lane.accent}14`,
              boxShadow: `inset 0 0 12px ${lane.accent}30`,
              borderColor: `${lane.accent}30`,
              ringColor: `${lane.accent}30`,
            }}
          >
            <Icon size={18} strokeWidth={1.6} style={{ color: lane.accent }} />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: lane.accent }}>
              Pipeline {lane.id}
            </div>
            <div className="text-lg font-medium text-white">{lane.title}</div>
            <div className="font-mono text-[11px] text-slate-500">{lane.subtitle}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Active</div>
          <div className="font-mono text-2xl text-white">{list.length}</div>
        </div>
      </div>

      <div className="px-5 pt-4 text-sm text-slate-400">{lane.description}</div>

      <div className="space-y-2 p-5">
        {list.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2 + i * 0.04 }}
            onClick={() => nav(`/analysis/${t.id}`)}
            data-testid={`pipeline-${lane.id}-card-${t.id}`}
            className={cn(
              "group cursor-pointer rounded-lg border border-[#1E2536] bg-[#0B0F19] p-3 transition-all duration-200",
              "hover:border-[#2A3441] hover:bg-[#131A2A]"
            )}
            style={{ "--hover-color": lane.accent }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-200">{t.id}</span>
                  <span
                    className="rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                    style={{ color: lane.accent, background: `${lane.accent}18` }}
                  >
                    {t.fraudProb}%
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-300">
                  {t.merchant} · {t.location.city}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-white">
                  ${t.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="font-mono text-[10px] text-slate-500">{t.status}</div>
              </div>
              <ArrowRight
                size={14}
                className="text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-slate-300"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto border-t border-[#1E2536] p-4">
        <button
          data-testid={`pipeline-${lane.id}-view-all`}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#1E2536] bg-[#0B0F19] py-2 font-mono text-[11px] uppercase tracking-widest text-slate-400 transition-colors hover:bg-[#131A2A] hover:text-slate-100"
        >
          View all {lane.title.toLowerCase()} cases
          <ArrowRight size={11} />
        </button>
      </div>
    </motion.div>
  );
}
