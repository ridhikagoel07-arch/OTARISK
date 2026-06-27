import { motion } from "framer-motion";
import {
  Activity,
  ShieldAlert,
  CircuitBoard,
  Timer,
  Cpu,
  DollarSign,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import KpiCard from "@/components/KpiCard";
import PipelineBars from "@/components/PipelineBars";
import ActivityFeed from "@/components/ActivityFeed";
import {
  KPIS,
  LATENCY_SERIES,
  FRAUD_TREND,
  BUDGET_BREAKDOWN,
} from "@/mock/data";

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const sparkLine = (data, color) => (
  <ResponsiveContainer width={64} height={20}>
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="latency"
        stroke={color}
        strokeWidth={1.5}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

export default function Dashboard() {
  const budgetPct = (KPIS.aiBudgetUsed / KPIS.aiBudgetTotal) * 100;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6" data-testid="dashboard-page">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
            <Sparkles size={12} strokeWidth={1.8} />
            AI Operations Center
          </div>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
            Fraud Intelligence · Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time signal across all pipelines · Atlas Bank production environment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-[#1E2536] bg-[#111623] px-3 py-2 font-mono text-[11px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            All systems nominal
          </div>
          <button
            data-testid="dashboard-range"
            className="flex items-center gap-2 rounded-md border border-[#1E2536] bg-[#111623] px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-[#171D2D]"
          >
            Last 24 hours
            <ArrowUpRight size={12} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          testId="kpi-transactions"
          label="Txns Today"
          value={fmt(KPIS.txnToday)}
          delta={KPIS.txnDelta}
          icon={Activity}
          accent="cyan"
          hint="184,730 processed"
          spark={sparkLine(LATENCY_SERIES, "#06B6D4")}
        />
        <KpiCard
          testId="kpi-fraud-cases"
          label="Fraud Detected"
          value={KPIS.fraudDetected.toLocaleString()}
          delta={KPIS.fraudDelta}
          icon={ShieldAlert}
          accent="red"
          hint="0.7% of volume"
          spark={sparkLine(LATENCY_SERIES, "#EF4444")}
        />
        <KpiCard
          testId="kpi-ai-budget"
          label="AI Budget"
          value={"$" + KPIS.aiBudgetUsed.toLocaleString()}
          unit={"/ $" + KPIS.aiBudgetTotal.toLocaleString()}
          delta={6.2}
          icon={CircuitBoard}
          accent="purple"
          hint={`${budgetPct.toFixed(1)}% consumed`}
        />
        <KpiCard
          testId="kpi-latency"
          label="Avg Detection"
          value={KPIS.avgLatency}
          unit="ms"
          delta={KPIS.latencyDelta}
          icon={Timer}
          accent="emerald"
          hint="p95 318ms"
          spark={sparkLine(LATENCY_SERIES, "#10B981")}
        />
        <KpiCard
          testId="kpi-llm"
          label="LLM Calls"
          value={fmt(KPIS.llmCalls)}
          delta={KPIS.llmDelta}
          icon={Cpu}
          accent="purple"
          hint="3 models active"
          spark={sparkLine(LATENCY_SERIES, "#8B5CF6")}
        />
        <KpiCard
          testId="kpi-saved"
          label="Money Saved"
          value={"$" + fmt(KPIS.moneySaved)}
          delta={KPIS.moneySavedDelta}
          icon={DollarSign}
          accent="emerald"
          hint="vs. baseline rules"
          spark={sparkLine(LATENCY_SERIES, "#10B981")}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FraudTrendChart />
        </div>
        <PipelineBars />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BudgetCard pct={budgetPct} />
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function FraudTrendChart() {
  return (
    <div className="h-full rounded-xl border border-[#1E2536] bg-[#111623] p-5 md:p-6" data-testid="fraud-trend-chart">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Transaction Flow
          </div>
          <div className="mt-1 text-base font-medium text-white">
            Approvals vs Flagged vs Blocked · 24h
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
          <Legend dot="#10B981" label="Approved" />
          <Legend dot="#F59E0B" label="Flagged" />
          <Legend dot="#EF4444" label="Blocked" />
        </div>
      </div>

      <div className="mt-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={FRAUD_TREND} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="g-approved" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-flagged" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-blocked" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#475569", fontSize: 10, fontFamily: "Geist Mono" }}
              axisLine={{ stroke: "#1E2536" }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 10, fontFamily: "Geist Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(11,15,25,0.95)",
                border: "1px solid #1E2536",
                borderRadius: 8,
                fontFamily: "Geist Mono",
                fontSize: 11,
                color: "#F8FAFC",
              }}
              cursor={{ stroke: "#8B5CF6", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="approved"
              stroke="#10B981"
              strokeWidth={1.5}
              fill="url(#g-approved)"
            />
            <Area
              type="monotone"
              dataKey="flagged"
              stroke="#F59E0B"
              strokeWidth={1.5}
              fill="url(#g-flagged)"
            />
            <Area
              type="monotone"
              dataKey="blocked"
              stroke="#EF4444"
              strokeWidth={1.5}
              fill="url(#g-blocked)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ dot, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

function BudgetCard({ pct }) {
  return (
    <div className="rounded-xl border border-[#1E2536] bg-[#111623] p-5 md:p-6" data-testid="ai-budget-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            AI Budget · February
          </div>
          <div className="mt-1 text-base font-medium text-white">$10,000 cap</div>
        </div>
        <span className="rounded-sm bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-purple-300 ring-1 ring-purple-500/20">
          Healthy
        </span>
      </div>

      {/* Ring */}
      <div className="mt-5 flex items-center gap-5">
        <div className="relative h-24 w-24">
          <svg width="96" height="96" className="-rotate-90">
            <circle cx="48" cy="48" r="40" stroke="#1E2536" strokeWidth="8" fill="none" />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke="#8B5CF6"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - pct / 100) }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.5))" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="font-mono text-lg leading-none text-white">
                {pct.toFixed(0)}%
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">used</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-sm">
          <Row label="Used" value="$6,341" />
          <Row label="Remaining" value="$3,659" mono="text-emerald-300" />
          <Row label="Today's calls" value="24,580" />
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-[#1E2536] pt-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Model Breakdown
        </div>
        {BUDGET_BREAKDOWN.map((m) => (
          <div key={m.name}>
            <div className="flex items-baseline justify-between font-mono text-[11px] text-slate-400">
              <span>{m.name}</span>
              <span className="text-slate-200">${m.cost.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#0B0F19]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-300"
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[#1E2536]/60 pb-1.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className={"font-mono text-sm " + (mono || "text-white")}>{value}</span>
    </div>
  );
}
