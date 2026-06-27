import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, ChevronDown, ArrowUpDown, Download } from "lucide-react";
import { TRANSACTIONS } from "@/mock/data";
import { StatusPill, RiskDot } from "@/components/StatusPill";
import { cn } from "@/lib/utils";

const RISKS = ["all", "low", "medium", "critical"];
const PIPELINES = ["all", "A", "B", "C"];

export default function LiveTransactions() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const [pipeline, setPipeline] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [location, setLocation] = useState("all");

  const locations = useMemo(() => {
    const set = new Set(TRANSACTIONS.map((t) => t.location.country));
    return ["all", ...Array.from(set).sort()];
  }, []);

  const rows = useMemo(() => {
    return TRANSACTIONS.filter((t) => {
      if (risk !== "all" && t.riskLevel !== risk) return false;
      if (pipeline !== "all" && t.pipeline !== pipeline) return false;
      if (location !== "all" && t.location.country !== location) return false;
      if (minAmount && t.amount < parseFloat(minAmount)) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.customerId.toLowerCase().includes(q) ||
          t.merchant.toLowerCase().includes(q) ||
          t.location.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [query, risk, pipeline, location, minAmount]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5" data-testid="live-stream-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 pulse-dot" />
            Streaming · Kafka topic <span className="text-slate-500">fraud.events.v3</span>
          </div>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">
            Live Transaction Stream
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length.toLocaleString()} transactions · sorted by ingest time
          </p>
        </div>
        <button
          data-testid="export-btn"
          className="flex items-center gap-2 rounded-md border border-[#1E2536] bg-[#111623] px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-[#171D2D]"
        >
          <Download size={13} /> Export
        </button>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-[#1E2536] bg-[#111623]/70 p-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 min-w-[280px] flex-1 items-center gap-2 rounded-md border border-[#1E2536] bg-[#0B0F19] px-3">
            <Search size={14} className="text-slate-500" />
            <input
              data-testid="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Tx ID, Customer, Merchant, City…"
              className="w-full bg-transparent font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          <Select
            label="Risk"
            value={risk}
            onChange={setRisk}
            options={RISKS}
            testId="filter-risk"
          />
          <Select
            label="Pipeline"
            value={pipeline}
            onChange={setPipeline}
            options={PIPELINES}
            testId="filter-pipeline"
          />
          <Select
            label="Country"
            value={location}
            onChange={setLocation}
            options={locations}
            testId="filter-country"
          />

          <div className="flex h-9 items-center gap-2 rounded-md border border-[#1E2536] bg-[#0B0F19] px-3">
            <Filter size={12} className="text-slate-500" />
            <input
              data-testid="filter-min-amount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              type="number"
              placeholder="Min $"
              className="w-24 bg-transparent font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#1E2536] bg-[#0B0F19]">
        <div className="max-h-[calc(100vh-360px)] overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[#0B0F19]/95 backdrop-blur-xl">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <Th>Tx ID</Th>
                <Th>Customer</Th>
                <Th className="text-right">Amount</Th>
                <Th>Location</Th>
                <Th>Merchant</Th>
                <Th className="text-right">Fraud %</Th>
                <Th>Action</Th>
                <Th className="text-center">Pipeline</Th>
                <Th>Status</Th>
                <Th>Risk</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr
                  key={t.id}
                  data-testid={`tx-row-${t.id}`}
                  onClick={() => nav(`/analysis/${t.id}`)}
                  className={cn(
                    "group cursor-pointer border-b border-[#131A2A] transition-colors duration-150",
                    "hover:bg-[#131A2A]",
                    t.riskLevel === "critical" && "bg-red-500/[0.025]",
                    t.riskLevel === "medium" && "bg-amber-500/[0.018]"
                  )}
                >
                  <Td>
                    <span className="font-mono text-xs text-slate-200">{t.id}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs text-slate-200">{t.customerName}</span>
                      <span className="font-mono text-[10px] text-slate-500">{t.customerId}</span>
                    </div>
                  </Td>
                  <Td className="text-right font-mono text-xs text-white">
                    ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-300">{t.location.city}</span>
                    <span className="ml-1.5 font-mono text-[10px] text-slate-500">{t.location.flag}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-300">{t.merchant}</span>
                  </Td>
                  <Td className="text-right">
                    <FraudBar pct={t.fraudProb} level={t.riskLevel} />
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-300">{t.action}</span>
                  </Td>
                  <Td className="text-center">
                    <PipelineChip p={t.pipeline} />
                  </Td>
                  <Td>
                    <span className="font-mono text-[11px] text-slate-300">{t.status}</span>
                  </Td>
                  <Td>
                    <StatusPill level={t.riskLevel}>
                      <RiskDot level={t.riskLevel} />
                      {t.riskLevel}
                    </StatusPill>
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm text-slate-500">
                    No transactions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, className }) {
  return (
    <th
      className={cn(
        "border-b border-[#1E2536] px-4 py-3 font-medium",
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown size={9} className="opacity-30 group-hover:opacity-80" />
      </span>
    </th>
  );
}

function Td({ children, className }) {
  return <td className={cn("px-4 py-2.5 align-middle", className)}>{children}</td>;
}

function FraudBar({ pct, level }) {
  const color =
    level === "critical" ? "#EF4444" : level === "medium" ? "#F59E0B" : "#10B981";
  return (
    <div className="ml-auto flex items-center justify-end gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-[#171D2D]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs text-slate-200">{pct}%</span>
    </div>
  );
}

function PipelineChip({ p }) {
  const map = {
    A: "ring-emerald-500/30 text-emerald-300 bg-emerald-500/10",
    B: "ring-amber-500/30 text-amber-300 bg-amber-500/10",
    C: "ring-red-500/30 text-red-300 bg-red-500/10",
  };
  return (
    <span
      className={cn(
        "inline-grid h-5 w-5 place-items-center rounded-sm ring-1 font-mono text-[10px] font-medium",
        map[p]
      )}
    >
      {p}
    </span>
  );
}

function Select({ label, value, onChange, options, testId }) {
  return (
    <div className="relative" data-testid={testId}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-md border border-[#1E2536] bg-[#0B0F19] pl-3 pr-8 font-mono text-xs text-slate-200 focus:border-purple-500/40 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#111623]">
            {`${label}: ${o === "all" ? "All" : o}`}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
