import { useState } from "react";
import {
  Sliders,
  Wallet,
  BellRing,
  Palette,
  Save,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [thresholds, setThresholds] = useState({ medium: 30, critical: 80 });
  const [budget, setBudget] = useState({ daily: 600, monthly: 10000 });
  const [notifs, setNotifs] = useState({
    critical: true,
    medium: true,
    weekly: false,
    sms: false,
  });
  const [theme, setTheme] = useState("dark-enterprise");

  return (
    <div className="mx-auto max-w-[1100px] space-y-8" data-testid="settings-page">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-purple-300">
          Platform Configuration
        </div>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tune Otarisk for your fraud team&apos;s risk appetite and operational cadence.
        </p>
      </div>

      <SettingsCard
        icon={Sliders}
        title="Pipeline Thresholds"
        description="Decide how the Otari Decision Engine routes transactions across risk lanes."
        testId="settings-thresholds"
      >
        <div className="space-y-6">
          <ThresholdSlider
            label="Medium Risk Threshold"
            sublabel="XGBoost score above this value triggers Pipeline B"
            value={thresholds.medium}
            onChange={(v) => setThresholds({ ...thresholds, medium: v })}
            color="#F59E0B"
            min={10}
            max={60}
          />
          <ThresholdSlider
            label="Critical Risk Threshold"
            sublabel="Score above this triggers Pipeline C and human review"
            value={thresholds.critical}
            onChange={(v) => setThresholds({ ...thresholds, critical: v })}
            color="#EF4444"
            min={60}
            max={95}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Wallet}
        title="Budget Limits"
        description="Cap how much spend the AI pipelines can consume across LLM providers."
        testId="settings-budget"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BudgetInput
            label="Daily cap"
            value={budget.daily}
            onChange={(v) => setBudget({ ...budget, daily: v })}
            testId="budget-daily"
          />
          <BudgetInput
            label="Monthly cap"
            value={budget.monthly}
            onChange={(v) => setBudget({ ...budget, monthly: v })}
            testId="budget-monthly"
          />
        </div>
        <div className="mt-4 rounded-md border border-[#1E2536] bg-[#0B0F19] p-3 font-mono text-[11px] text-slate-400">
          <span className="text-slate-500">Auto-throttle</span> · Pipelines downgrade to XGBoost-only when daily cap is reached.
        </div>
      </SettingsCard>

      <SettingsCard
        icon={BellRing}
        title="Notification Preferences"
        description="Choose how analysts are alerted to critical events."
        testId="settings-notifications"
      >
        <div className="space-y-2">
          <Toggle
            label="Critical alerts"
            sub="Real-time pings for Pipeline C decisions"
            value={notifs.critical}
            onChange={(v) => setNotifs({ ...notifs, critical: v })}
            testId="toggle-critical"
          />
          <Toggle
            label="Medium-risk digest"
            sub="Hourly summary of Pipeline B activity"
            value={notifs.medium}
            onChange={(v) => setNotifs({ ...notifs, medium: v })}
            testId="toggle-medium"
          />
          <Toggle
            label="Weekly report"
            sub="Monday morning analyst recap"
            value={notifs.weekly}
            onChange={(v) => setNotifs({ ...notifs, weekly: v })}
            testId="toggle-weekly"
          />
          <Toggle
            label="SMS escalation"
            sub="Page on-call for blocked high-value transactions"
            value={notifs.sms}
            onChange={(v) => setNotifs({ ...notifs, sms: v })}
            testId="toggle-sms"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Palette}
        title="Theme"
        description="Otarisk is optimized for command-room ergonomics."
        testId="settings-theme"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { id: "dark-enterprise", label: "Dark Enterprise", desc: "Default · low-eye-strain", swatches: ["#0B0F19", "#8B5CF6", "#06B6D4"] },
            { id: "obsidian", label: "Obsidian", desc: "Higher contrast", swatches: ["#000000", "#A78BFA", "#34D399"] },
            { id: "ops-blue", label: "Ops Blue", desc: "SOC analyst variant", swatches: ["#0A192F", "#60A5FA", "#22D3EE"] },
          ].map((t) => (
            <button
              key={t.id}
              data-testid={`theme-${t.id}`}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all",
                theme === t.id
                  ? "border-purple-500/40 bg-[#131A2A] shadow-[0_0_20px_-8px_rgba(139,92,246,0.5)]"
                  : "border-[#1E2536] bg-[#0B0F19] hover:bg-[#131A2A]"
              )}
            >
              <div className="flex gap-1.5">
                {t.swatches.map((s) => (
                  <span key={s} className="h-5 w-5 rounded-sm ring-1 ring-white/10" style={{ background: s }} />
                ))}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-100">{t.label}</div>
                <div className="font-mono text-[10px] text-slate-500">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end gap-3 border-t border-[#1E2536] pt-5">
        <button className="rounded-md border border-[#1E2536] bg-[#111623] px-4 py-2 text-xs text-slate-300 hover:bg-[#171D2D]">
          Discard
        </button>
        <button
          data-testid="save-settings"
          className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-xs font-medium text-white shadow-[0_0_24px_-8px_rgba(139,92,246,0.7)] transition-colors hover:bg-purple-500"
        >
          <Save size={13} /> Save changes
        </button>
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, children, testId }) {
  return (
    <div className="rounded-xl border border-[#1E2536] bg-[#111623]" data-testid={testId}>
      <div className="flex items-start justify-between border-b border-[#1E2536] p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-purple-500/10 ring-1 ring-purple-500/20">
            <Icon size={15} strokeWidth={1.7} className="text-purple-300" />
          </div>
          <div>
            <div className="text-base font-medium text-white">{title}</div>
            <div className="mt-0.5 text-xs text-slate-500">{description}</div>
          </div>
        </div>
        <ChevronRight size={14} className="text-slate-600" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ThresholdSlider({ label, sublabel, value, onChange, color, min = 0, max = 100 }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm text-slate-100">{label}</div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-500">{sublabel}</div>
        </div>
        <div className="font-mono text-2xl text-white" style={{ textShadow: `0 0 12px ${color}40` }}>
          {value}%
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="mt-3 w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}

function BudgetInput({ label, value, onChange, testId }) {
  return (
    <div className="rounded-md border border-[#1E2536] bg-[#0B0F19] p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="font-mono text-slate-500">$</span>
        <input
          data-testid={testId}
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value || 0, 10))}
          className="w-full bg-transparent font-mono text-xl text-white focus:outline-none"
        />
      </div>
    </div>
  );
}

function Toggle({ label, sub, value, onChange, testId }) {
  return (
    <button
      data-testid={testId}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-md border border-[#1E2536] bg-[#0B0F19] p-3 transition-colors hover:bg-[#131A2A]"
    >
      <div className="text-left">
        <div className="text-sm text-slate-100">{label}</div>
        <div className="mt-0.5 font-mono text-[10px] text-slate-500">{sub}</div>
      </div>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          value ? "bg-purple-500/70" : "bg-[#1E2536]"
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}
