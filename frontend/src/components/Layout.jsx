import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  GitBranch,
  Settings as SettingsIcon,
  ChevronsLeft,
  ChevronsRight,
  Command,
  Bell,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testId: "sidebar-nav-dashboard" },
  { to: "/stream", label: "Live Transaction Stream", icon: Activity, testId: "sidebar-nav-stream" },
  { to: "/pipelines", label: "Investigation Pipelines", icon: GitBranch, testId: "sidebar-nav-pipelines" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testId: "sidebar-nav-settings" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-slate-100 ambient-grid relative">
      {/* Spotlight overlay */}
      <div className="pointer-events-none fixed inset-0 radial-spotlight" />

      {/* Sidebar */}
      <aside
        data-testid="app-sidebar"
        className={cn(
          "relative z-10 flex flex-col border-r border-[#1E2536] bg-[#0B0F19]/90 backdrop-blur-xl transition-[width] duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-[252px]"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-[#1E2536] px-4">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-purple-500/20 to-cyan-500/10 ring-1 ring-purple-500/30">
            <ShieldCheck size={18} strokeWidth={1.75} className="text-purple-300" />
            <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 pulse-dot ring-2 ring-[#0B0F19]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-white">Otarisk</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                AI Ops · v2.4
              </span>
            </div>
          )}
        </div>

        {/* Workspace selector */}
        {!collapsed && (
          <div className="px-3 pt-4">
            <div className="flex items-center justify-between rounded-md border border-[#1E2536] bg-[#111623] px-3 py-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Workspace</div>
                <div className="text-sm font-medium text-slate-100">Atlas Bank · Prod</div>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {!collapsed && (
            <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
              Operations
            </div>
          )}
          {NAV.map((item) => {
            const isActive =
              location.pathname.startsWith(item.to) ||
              (item.to === "/stream" && location.pathname.startsWith("/analysis"));
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={item.testId}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150",
                  isActive
                    ? "bg-[#171D2D] text-white"
                    : "text-slate-400 hover:bg-[#131A2A] hover:text-slate-100"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.7)]"
                  />
                )}
                <Icon size={17} strokeWidth={1.6} className={isActive ? "text-purple-300" : ""} />
                {!collapsed && <span className="tracking-tight">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#1E2536] p-3">
          {!collapsed ? (
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/10">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&w=128&q=80"
                  alt="analyst"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-medium text-slate-100">M. Reyes</div>
                <div className="truncate font-mono text-[10px] text-slate-500">L2 Fraud Analyst</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/10">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&w=128&q=80"
                  alt="analyst"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          <button
            data-testid="sidebar-collapse-toggle"
            onClick={() => setCollapsed((c) => !c)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-[#1E2536] bg-[#111623] py-2 text-xs text-slate-400 transition-colors hover:bg-[#171D2D] hover:text-slate-100"
          >
            {collapsed ? <ChevronsRight size={14} /> : <><ChevronsLeft size={14} /> <span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="px-6 py-6 md:px-8 md:py-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#1E2536] bg-[#0B0F19]/70 px-6 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <span>Live · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          data-testid="global-search"
          className="hidden md:flex h-9 items-center gap-3 rounded-md border border-[#1E2536] bg-[#111623] px-3 text-xs text-slate-500 hover:border-[#2A3441] transition-colors w-[340px]"
        >
          <Search size={14} strokeWidth={1.6} />
          <span className="flex-1">Search transactions, customers, merchants…</span>
          <kbd className="flex items-center gap-1 rounded border border-[#1E2536] bg-[#0B0F19] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            <Command size={10} /> K
          </kbd>
        </div>
        <button
          data-testid="topbar-notifications"
          className="relative grid h-9 w-9 place-items-center rounded-md border border-[#1E2536] bg-[#111623] text-slate-400 hover:bg-[#171D2D] hover:text-slate-100 transition-colors"
        >
          <Bell size={15} strokeWidth={1.6} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-purple-400" />
        </button>
      </div>
    </header>
  );
}
