import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, RefreshCcw, ServerCrash, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { PanelCard } from "../components/PanelCard";
import { BotCard } from "../components/BotCard";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function SummaryTile({ label, value, hint }) {
  return (
    <div className="rounded-[1.5rem] border border-[#243448] bg-[#0a1321] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  );
}

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [bots, setBots] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState({});
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function loadBots() {
    const data = await api.get("/bots", token);
    setBots(data.items || []);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        await loadBots();
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
      loadBots().catch(() => null);
    }, 8000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);

  useEffect(() => {
    if (!location.state?.feedback) {
      return;
    }

    setFeedback(location.state.feedback);
    navigate(location.pathname, {
      replace: true,
      state: null
    });
  }, [location.pathname, location.state, navigate]);

  const onlineBots = useMemo(
    () => bots.filter((bot) => bot.status === "online").length,
    [bots]
  );

  async function handleCreateBot(event) {
    event.preventDefault();
    setError("");
    setFeedback("");

    try {
      const data = await api.post("/bots", { name }, token);
      setBots((current) => [data.bot, ...current]);
      setName("");
      setFeedback("Bot zostal utworzony i od razu dostal swoj katalog roboczy.");
      await loadBots();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleBotAction(botId, action) {
    if (
      action === "delete" &&
      !window.confirm("Na pewno usunac tego bota? Ta operacja kasuje pliki, logi i proces PM2.")
    ) {
      return;
    }

    setError("");
    setFeedback("");
    setBusyAction({
      botId,
      action
    });

    try {
      const data =
        action === "delete"
          ? await api.delete(`/bots/${botId}`, token)
          : await api.post(`/bots/${botId}/${action}`, {}, token);
      setFeedback(data.message);
      await loadBots();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction({});
    }
  }

  return (
    <AppShell
      title="Panel klienta hostingu botow"
      subtitle="Uklad wzorowany na panelach hostingowych: po lewej szybka nawigacja, a tutaj lista uslug, wdrozenie i operacje na instancjach."
    >
      <section className="grid gap-5 xl:grid-cols-[1.25fr,0.75fr]">
        <PanelCard
          eyebrow="Przeglad"
          title="Twoje uslugi"
          description="Szybki podglad wszystkich botow i ich stanu, tak jak w klasycznym panelu klienta hostingu."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryTile
              label="Wszystkie boty"
              value={bots.length}
              hint="Liczba aktywnych uslug na koncie."
            />
            <SummaryTile
              label="Online"
              value={onlineBots}
              hint="Instancje, ktore teraz odpowiadaja w PM2."
            />
            <SummaryTile
              label="Offline"
              value={Math.max(bots.length - onlineBots, 0)}
              hint="Boty zatrzymane albo jeszcze nieuruchomione."
            />
          </div>
        </PanelCard>

        <PanelCard
          eyebrow="Nowa usluga"
          title="Dodaj bota"
          description="Tworzenie nowej instancji zostawia Cie od razu w gotowym panelu uslugi z plikami, startupem i logami."
        >
          <form onSubmit={handleCreateBot} className="space-y-4">
            <input
              type="text"
              className="input-base"
              placeholder="Np. Ticket Core albo Music Bot"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="button-base w-full border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
            >
              <Plus size={16} className="mr-2" />
              Utworz nowa usluge
            </button>
          </form>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[1.4rem] border border-[#243448] bg-[#0a1321] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 text-sky-300" size={18} />
                <div>
                  <h3 className="text-sm font-semibold text-white">Gotowy flow po utworzeniu</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Upload plikow, startup, zmienne srodowiskowe i live logi sa juz pod reka.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-[#243448] bg-[#0a1321] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 text-emerald-300" size={18} />
                <div>
                  <h3 className="text-sm font-semibold text-white">Bezpieczne akcje</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Panel nie odpala dowolnych komend, tylko kontrolowane akcje backendu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PanelCard>
      </section>

      <PanelCard
        eyebrow="Lista uslug"
        title="Boty na koncie"
        description="Kazdy wpis zachowuje sie jak pozycja w panelu hostingu: status, parametry, szybkie akcje i przejscie do szczegolow serwera."
        actions={
          <button
            type="button"
            onClick={() => loadBots().catch((requestError) => setError(requestError.message))}
            className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-sky-500/40 hover:text-sky-200"
          >
            <RefreshCcw size={16} className="mr-2" />
            Odswiez
          </button>
        }
      >
        {feedback ? (
          <div className="mb-4 rounded-[1.2rem] border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {feedback}
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-[1.2rem] border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-[1.7rem] border border-[#243448] bg-[#0a1321]"
              />
            ))}
          </div>
        ) : bots.length ? (
          <div className="space-y-4">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                busyAction={busyAction.botId === bot.id ? busyAction.action : ""}
                onAction={handleBotAction}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.8rem] border border-dashed border-[#2b4060] bg-[#0a1321] px-6 py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-red-400/20 bg-red-400/10 text-red-200">
              <ServerCrash size={24} />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
              Nie masz jeszcze zadnej uslugi
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Utworz pierwszego bota, a panel od razu przygotuje katalog projektu,
              startup i miejsce na logi. Plik .env pojawi sie dopiero, gdy go dodasz lub zapiszesz.
            </p>
          </div>
        )}
      </PanelCard>
    </AppShell>
  );
}
