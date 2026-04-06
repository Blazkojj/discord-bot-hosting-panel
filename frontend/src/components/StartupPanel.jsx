import { useEffect, useState } from "react";
import { Save, ScanSearch } from "lucide-react";
import { PanelCard } from "./PanelCard";
import { api } from "../lib/api";

export function StartupPanel({
  botId,
  token,
  bot,
  onBotChange,
  onFeedback,
  onError
}) {
  const [runtimeMode, setRuntimeMode] = useState("node");
  const [entryFile, setEntryFile] = useState("");
  const [prestartCommand, setPrestartCommand] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setRuntimeMode(bot?.runtimeMode || "node");
    setEntryFile(bot?.entryFile || "");
    setPrestartCommand(bot?.prestartCommand || "");
  }, [bot?.id, bot?.runtimeMode, bot?.entryFile, bot?.prestartCommand]);

  async function handleSave() {
    setBusy("save");

    try {
      const data = await api.put(
        `/bots/${botId}/startup`,
        {
          runtimeMode,
          entryFile,
          prestartCommand
        },
        token
      );
      onBotChange(data.bot);
      onFeedback(data.message);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy("");
    }
  }

  async function handleDetect() {
    setBusy("detect");

    try {
      const data = await api.post(`/bots/${botId}/startup/detect`, {}, token);
      onBotChange(data.bot);
      onFeedback(data.message);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <PanelCard
      eyebrow="Startup"
      title="Parametry startowe"
      description="Uklad zblizony do paneli hostingowych: wybierasz sposob uruchamiania i wskazujesz plik startowy bota."
      actions={
        <>
          <button
            type="button"
            onClick={handleDetect}
            disabled={busy === "detect"}
            className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-sky-500/40 hover:text-sky-200"
          >
            <ScanSearch size={16} className="mr-2" />
            {busy === "detect" ? "Wykrywanie..." : "Wykryj automatycznie"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy === "save"}
            className="button-base border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
          >
            <Save size={16} className="mr-2" />
            {busy === "save" ? "Zapisywanie..." : "Zapisz"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[220px,1fr]">
        <label className="rounded-[1.6rem] border border-[#243448] bg-[#0a1321] p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Tryb uruchamiania
          </span>
          <select
            value={runtimeMode}
            onChange={(event) => setRuntimeMode(event.target.value)}
            className="input-base mt-3"
          >
            <option value="node">node</option>
            <option value="npm">npm run start</option>
          </select>
        </label>

        <label className="rounded-[1.6rem] border border-[#243448] bg-[#0a1321] p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Plik startowy bota
          </span>
          <input
            type="text"
            value={entryFile}
            onChange={(event) => setEntryFile(event.target.value)}
            disabled={runtimeMode === "npm"}
            placeholder="index.js albo src/client.js"
            className="input-base mt-3"
          />
          <p className="mt-3 text-sm text-slate-400">
            Dla trybu <span className="font-mono text-slate-200">node</span> podaj
            sciezke wzgledna, np. <span className="font-mono text-slate-200">index.js</span>
            lub <span className="font-mono text-slate-200">src/client.js</span>.
            Dla <span className="font-mono text-slate-200">npm</span> pole nie jest wymagane.
          </p>
        </label>
      </div>

      <label className="mt-4 block rounded-[1.6rem] border border-[#243448] bg-[#0a1321] p-4">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Komenda przed startem
        </span>
        <input
          type="text"
          value={prestartCommand}
          onChange={(event) => setPrestartCommand(event.target.value)}
          placeholder="np. npm run build"
          className="input-base mt-3"
        />
        <p className="mt-3 text-sm text-slate-400">
          Ta komenda wykona sie przed kazdym startem i restartem bota.
          Dla bezpieczenstwa obslugiwane sa tylko:
          <span className="font-mono text-slate-200"> npm install</span>,
          <span className="font-mono text-slate-200"> npm run {'<skrypt>'}</span> albo
          <span className="font-mono text-slate-200"> node {'<plik>'}</span>.
          Zostaw puste, jesli nic nie ma sie odpalac przed startem.
        </p>
      </label>
    </PanelCard>
  );
}
