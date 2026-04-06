import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, RefreshCcw, Save, Square, Trash2, Wrench } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { PanelCard } from "../components/PanelCard";
import { StatusBadge } from "../components/StatusBadge";
import { FileUploadPanel } from "../components/FileUploadPanel";
import { EnvEditor } from "../components/EnvEditor";
import { LogViewer } from "../components/LogViewer";
import { ProjectWorkspace } from "../components/ProjectWorkspace";
import { SectionTabs } from "../components/SectionTabs";
import { StartupPanel } from "../components/StartupPanel";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useBotLogs } from "../hooks/useBotLogs";
import { formatBytes, formatDate, formatUptime } from "../lib/format";

function SummaryBlock({ label, value, hint }) {
  return (
    <div className="rounded-[1.5rem] border border-[#243448] bg-[#0a1321] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 break-all text-2xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}

const SECTION_ITEMS = [
  {
    id: "console",
    eyebrow: "Runtime",
    label: "Konsola",
    description: "Status procesu, logi i diagnostyka."
  },
  {
    id: "files",
    eyebrow: "Files",
    label: "Pliki",
    description: "Menedzer plikow i edycja kodu."
  },
  {
    id: "upload",
    eyebrow: "Deploy",
    label: "Upload",
    description: "ZIP, RAR, pojedyncze pliki i foldery."
  },
  {
    id: "startup",
    eyebrow: "Boot",
    label: "Parametry startowe",
    description: "Tryb uruchamiania i plik startowy."
  },
  {
    id: "env",
    eyebrow: "Secrets",
    label: "Zmienne srodowiskowe",
    description: "Sekrety trzymane tylko w .env."
  }
];

export function BotDetailsPage() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { entries, connected, error: logError } = useBotLogs(botId, token);
  const [bot, setBot] = useState(null);
  const [envRaw, setEnvRaw] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);

  async function loadBotDetails() {
    const [botData, envData] = await Promise.all([
      api.get(`/bots/${botId}`, token),
      api.get(`/bots/${botId}/env`, token)
    ]);

    setBot(botData.bot);
    setEnvRaw(envData.raw || "");
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        await loadBotDetails();
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    const interval = setInterval(() => {
      api
        .get(`/bots/${botId}/status`, token)
        .then((data) => {
          if (active) {
            setBot((current) => ({ ...current, ...data.bot }));
          }
        })
        .catch(() => null);
    }, 7000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [botId, token]);

  async function handleControl(action) {
    setBusy(action);
    setError("");
    setFeedback("");

    try {
      const data = await api.post(`/bots/${botId}/${action}`, {}, token);
      setBot(data.bot);
      setFeedback(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function handleUpload({ archiveFile, selectedFiles }) {
    setBusy("upload");
    setError("");
    setFeedback("");

    try {
      const formData = new FormData();

      if (archiveFile) {
        formData.append("archive", archiveFile);
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file, file.webkitRelativePath || file.name);
      });

      const data = await api.upload(`/bots/${botId}/upload`, formData, token);
      setBot(data.bot);
      setFeedback(data.message);
      setProjectRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function handleSaveEnv() {
    setBusy("env");
    setError("");
    setFeedback("");

    try {
      const data = await api.put(`/bots/${botId}/env`, { raw: envRaw }, token);
      setEnvRaw(data.raw);
      setFeedback(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function handleInstall() {
    setBusy("install");
    setError("");
    setFeedback("");

    try {
      const data = await api.post(`/bots/${botId}/install`, {}, token);
      setFeedback(data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteBot() {
    if (
      !window.confirm(
        "Na pewno usunac tego bota? Ta operacja usunie proces PM2, logi i caly katalog projektu."
      )
    ) {
      return;
    }

    setBusy("delete");
    setError("");
    setFeedback("");

    try {
      const data = await api.delete(`/bots/${botId}`, token);
      navigate("/bots", {
        replace: true,
        state: {
          feedback: data.message
        }
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <AppShell
      title={bot ? bot.name : "Panel serwera"}
      subtitle="Widok uslugi w stylu panelu hostingowego: szybkie akcje na gorze, a nizej osobne sekcje konsoli, plikow, startupu i zmiennych."
    >
      <div className="flex flex-wrap gap-3">
        <Link
          to="/bots"
          className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-sky-500/40 hover:text-sky-200"
        >
          <ArrowLeft size={16} className="mr-2" />
          Wroc do listy uslug
        </Link>
      </div>

      {feedback ? (
        <div className="rounded-[1.2rem] border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[1.2rem] border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading || !bot ? (
        <div className="grid gap-5">
          <div className="h-64 animate-pulse rounded-[2rem] border border-[#243448] bg-[#0d1828]" />
          <div className="h-96 animate-pulse rounded-[2rem] border border-[#243448] bg-[#0d1828]" />
        </div>
      ) : (
        <>
          <section className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
            <PanelCard
              eyebrow="Serwer"
              title="Podsumowanie uslugi"
              description="Najwazniejsze informacje i szybkie akcje, podobnie jak w panelach klienta hostingu."
              actions={
                <>
                  <StatusBadge status={bot.status} />
                  <button
                    type="button"
                    onClick={() => handleControl("start")}
                    disabled={busy === "start"}
                    className="button-base border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                  >
                    <Play size={16} className="mr-2" />
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={() => handleControl("stop")}
                    disabled={busy === "stop"}
                    className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-red-400/35 hover:text-red-200"
                  >
                    <Square size={16} className="mr-2" />
                    Stop
                  </button>
                  <button
                    type="button"
                    onClick={() => handleControl("restart")}
                    disabled={busy === "restart"}
                    className="button-base border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                  >
                    <RefreshCcw size={16} className="mr-2" />
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteBot}
                    disabled={busy === "delete"}
                    className="button-base border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/20"
                  >
                    <Trash2 size={16} className="mr-2" />
                    {busy === "delete" ? "Usuwanie..." : "Usun bota"}
                  </button>
                </>
              }
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryBlock label="CPU" value={`${bot.metrics?.cpu || 0}%`} />
                <SummaryBlock label="RAM" value={formatBytes(bot.metrics?.memory || 0)} />
                <SummaryBlock label="Uptime" value={formatUptime(bot.metrics?.uptime)} />
                <SummaryBlock
                  label="Startup"
                  value={bot.runtimeMode === "npm" ? "npm run start" : bot.entryFile || "brak"}
                />
                <SummaryBlock
                  label="Pre-start"
                  value={bot.prestartCommand || "brak"}
                  hint="Komenda wykonywana przed startem."
                />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <SummaryBlock label="Sciezka" value={bot.path} />
                <SummaryBlock
                  label="Metadane"
                  value={`Utworzono: ${formatDate(bot.createdAt)}`}
                  hint={`Ostatni upload: ${formatDate(bot.lastUploadedAt)}`}
                />
              </div>
            </PanelCard>

            <PanelCard
              eyebrow="Nawigacja"
              title="Sekcje serwera"
              description="Rozklad opcji przypomina panel hostingowy: konsola, pliki, upload, startup i zmienne maja stale miejsce."
            >
              <SectionTabs items={SECTION_ITEMS} />
            </PanelCard>
          </section>

          <section id="console">
            <PanelCard
              eyebrow="Konsola"
              title="Status procesu i logi"
              description="Live logi oraz biezace metryki PM2 w jednej sekcji, jak w klasycznym panelu serwera."
              actions={
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={busy === "install"}
                  className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-sky-500/40 hover:text-sky-200"
                >
                  <Wrench size={16} className="mr-2" />
                  {busy === "install" ? "Instalowanie..." : "npm install"}
                </button>
              }
            >
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                <SummaryBlock label="Status" value={bot.status} hint="Stan procesu PM2." />
                <SummaryBlock
                  label="Polaczenie live"
                  value={connected ? "podlaczone" : "offline"}
                  hint="Socket.IO dla nowych linii logow."
                />
                <SummaryBlock
                  label="Tryb runtime"
                  value={bot.runtimeMode || "node"}
                  hint="Sposob uruchamiania bota."
                />
                <SummaryBlock
                  label="Aktualizacja"
                  value={formatDate(bot.updatedAt)}
                  hint="Ostatnia zmiana wpisu uslugi."
                />
                <SummaryBlock
                  label="Entry"
                  value={bot.entryFile || "auto / npm"}
                  hint="Plik startowy albo skrypt npm."
                />
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-[#243448] bg-[#0a1321] p-4">
                <LogViewer entries={entries} connected={connected} error={logError} />
              </div>
            </PanelCard>
          </section>

          <section id="files">
            <ProjectWorkspace
              botId={botId}
              token={token}
              refreshSignal={projectRefreshKey}
              onFeedback={setFeedback}
              onError={setError}
            />
          </section>

          <section id="upload">
            <PanelCard
              eyebrow="Deploy"
              title="Wgrywanie plikow i archiwow"
              description="Tutaj wrzucisz projekt tak, jak w panelu hostingu: archiwum, pojedyncze pliki albo caly folder."
            >
              <FileUploadPanel onUpload={handleUpload} uploading={busy === "upload"} />
            </PanelCard>
          </section>

          <section id="startup">
            <StartupPanel
              botId={botId}
              token={token}
              bot={bot}
              onBotChange={setBot}
              onFeedback={setFeedback}
              onError={setError}
            />
          </section>

          <section id="env">
            <PanelCard
              eyebrow="Zmienne"
              title="Zmienne srodowiskowe"
              description="Sekrety sa przechowywane tylko w .env tego bota. Nie trafiaja do kodu ani do frontendowych plikow aplikacji."
              actions={
                <button
                  type="button"
                  onClick={handleSaveEnv}
                  disabled={busy === "env"}
                  className="button-base border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                >
                  <Save size={16} className="mr-2" />
                  {busy === "env" ? "Zapisywanie..." : "Zapisz .env"}
                </button>
              }
            >
              <EnvEditor
                value={envRaw}
                onChange={setEnvRaw}
                onSave={handleSaveEnv}
                saving={busy === "env"}
              />
            </PanelCard>
          </section>
        </>
      )}
    </AppShell>
  );
}
