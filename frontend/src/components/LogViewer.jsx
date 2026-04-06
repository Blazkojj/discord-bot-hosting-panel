import { useDeferredValue, useEffect, useRef } from "react";

export function LogViewer({ entries, connected, error }) {
  const containerRef = useRef(null);
  const deferredEntries = useDeferredValue(entries);

  const formattedLogs = deferredEntries
    .map((entry) => `[${entry.source}] ${entry.message}`)
    .join("\n");

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [formattedLogs]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            connected
              ? "border-neon/50 bg-neon/10 text-neon"
              : "border-slate-600 bg-slate-700/40 text-slate-300"
          }`}
        >
          {connected ? "socket live" : "socket offline"}
        </span>
        {error ? <span className="text-sm text-alert">{error}</span> : null}
      </div>
      <div
        ref={containerRef}
        className="h-[420px] overflow-auto rounded-3xl border border-line bg-slate-950/80 p-4 font-mono text-xs leading-6 text-slate-200"
      >
        {formattedLogs || "Brak logów. Uruchom bota, aby zobaczyć output."}
      </div>
    </div>
  );
}
