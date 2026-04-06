import { Link } from "react-router-dom";
import { Activity, Play, RotateCcw, Square, Trash2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatBytes, formatDate, formatUptime } from "../lib/format";

function Metric({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-[#243448] bg-[#0a1321] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

export function BotCard({ bot, onAction, busyAction }) {
  return (
    <article className="rounded-[1.7rem] border border-[#243448] bg-[#0a1321] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="break-words text-2xl font-semibold tracking-tight text-white">
              {bot.name}
            </h3>
            <StatusBadge status={bot.status} />
          </div>
          <p className="mt-3 break-all font-mono text-xs text-slate-400">
            {bot.runtimeMode === "npm" ? "npm run start" : bot.entryFile || "Brak pliku startowego"}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="CPU" value={`${bot.metrics?.cpu || 0}%`} />
            <Metric label="RAM" value={formatBytes(bot.metrics?.memory || 0)} />
            <Metric label="Uptime" value={formatUptime(bot.metrics?.uptime)} />
            <Metric label="Utworzono" value={formatDate(bot.createdAt)} />
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Ostatni upload: {formatDate(bot.lastUploadedAt)}
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:max-w-[330px] xl:justify-end">
          <button
            type="button"
            onClick={() => onAction(bot.id, "start")}
            disabled={busyAction === "start"}
            className="button-base border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
          >
            <Play size={16} className="mr-2" />
            Start
          </button>
          <button
            type="button"
            onClick={() => onAction(bot.id, "stop")}
            disabled={busyAction === "stop"}
            className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-red-400/35 hover:text-red-200"
          >
            <Square size={16} className="mr-2" />
            Stop
          </button>
          <button
            type="button"
            onClick={() => onAction(bot.id, "restart")}
            disabled={busyAction === "restart"}
            className="button-base border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
          >
            <RotateCcw size={16} className="mr-2" />
            Restart
          </button>
          <Link
            to={`/bots/${bot.id}`}
            className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-sky-500/35 hover:text-sky-200"
          >
            <Activity size={16} className="mr-2" />
            Przejdz do serwera
          </Link>
          <button
            type="button"
            onClick={() => onAction(bot.id, "delete")}
            disabled={busyAction === "delete"}
            className="button-base border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/20"
          >
            <Trash2 size={16} className="mr-2" />
            {busyAction === "delete" ? "Usuwanie..." : "Usun"}
          </button>
        </div>
      </div>
    </article>
  );
}
