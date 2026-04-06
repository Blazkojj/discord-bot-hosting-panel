import { Link, NavLink } from "react-router-dom";
import { Bot, LayoutDashboard, LogOut, ShieldEllipsis } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function NavigationLink({ to, label, icon: Icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
            : "border-transparent bg-[#0b1320] text-slate-300 hover:border-[#2b4060] hover:text-white"
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export function AppShell({ title, subtitle, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#07101b] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="flex w-full shrink-0 flex-col rounded-[2rem] border border-[#243448] bg-[#0b1524] p-4 shadow-[0_25px_90px_rgba(4,10,20,0.35)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[290px]">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-[1.5rem] border border-[#243448] bg-[#0f1a2b] px-4 py-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-sky-500/12 text-sky-300">
              <ShieldEllipsis size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Panel klienta
              </p>
              <h1 className="truncate text-xl font-semibold tracking-tight text-white">
                FrostHost
              </h1>
            </div>
          </Link>

          <div className="mt-6 rounded-[1.5rem] border border-[#243448] bg-[#0f1a2b] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Zarzadzanie
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Uklad inspirowany panelem hostingu: pulpit, lista uslug i szczegoly serwera
              w logicznych sekcjach.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            <NavigationLink to="/dashboard" label="Pulpit" icon={LayoutDashboard} end />
            <NavigationLink to="/bots" label="Boty" icon={Bot} />
          </nav>

          <div className="mt-auto pt-6">
            <div className="rounded-[1.5rem] border border-[#243448] bg-[#0f1a2b] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Konto
              </p>
              <p className="mt-2 truncate text-sm font-medium text-white">{user?.email}</p>
              <p className="mt-1 text-sm text-slate-400">Autoryzowana sesja panelu klienta.</p>
              <button
                type="button"
                onClick={logout}
                className="button-base mt-4 w-full border-[#2e4669] bg-[#122033] text-slate-100 hover:border-red-400/35 hover:text-red-200"
              >
                <LogOut size={16} className="mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-5 pb-4">
          <header className="rounded-[2rem] border border-[#243448] bg-[#0d1828] px-5 py-6 shadow-[0_25px_90px_rgba(4,10,20,0.3)] sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Client area
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{subtitle}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[#2c4160] bg-[#101c2c] px-4 py-2 text-sm text-slate-300">
                  Bot hosting
                </span>
                <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
                  {user?.email}
                </span>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
