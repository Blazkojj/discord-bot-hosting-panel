const STATUS_STYLES = {
  online: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  stopped: "border-[#324660] bg-[#122033] text-slate-300",
  offline: "border-[#324660] bg-[#122033] text-slate-300",
  launching: "border-sky-500/25 bg-sky-500/10 text-sky-200",
  errored: "border-red-400/25 bg-red-400/10 text-red-200"
};

export function StatusBadge({ status = "offline" }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.offline;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${style}`}
    >
      {status}
    </span>
  );
}
