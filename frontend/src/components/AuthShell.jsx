import { Cloud, MessageCircleMore, MoonStar } from "lucide-react";

function ServerRack({ delay = "", height = "h-72" }) {
  return (
    <div
      className={`relative ${height} rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(49,72,115,0.92),rgba(18,24,41,0.98))] shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${delay}`}
    >
      <div className="absolute inset-x-5 top-5 h-4 rounded-full bg-cyan-100/10" />
      <div className="absolute inset-x-6 top-12 bottom-6 rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(9,16,31,0.95),rgba(5,10,20,0.98))]">
        <div className="grid h-full grid-cols-6 gap-2 p-4">
          {Array.from({ length: 36 }).map((_, index) => (
            <span
              key={index}
              className={`rounded-full ${
                index % 5 === 0
                  ? "bg-emerald-300/90"
                  : index % 4 === 0
                    ? "bg-sky-300/90"
                    : "bg-orange-200/80"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-3 h-2 rounded-full bg-black/30 blur-sm" />
    </div>
  );
}

export function AuthShell({ title, subtitle, eyebrow, children, footer }) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1560px] lg:grid-cols-[minmax(420px,560px)_1fr]">
        <section className="relative flex items-center px-5 py-10 sm:px-8 lg:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_32%)]" />
          <div className="relative mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-600">
                <Cloud size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                  Client Area
                </p>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">
                  FrostHost
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                {eyebrow}
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900">{title}</h1>
              <p className="max-w-md text-base leading-7 text-slate-500">{subtitle}</p>
            </div>

            <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_rgba(18,32,56,0.08)] backdrop-blur-xl sm:p-8">
              {children}
            </div>

            {footer ? <div className="mt-6 text-sm text-slate-500">{footer}</div> : null}
          </div>
        </section>

        <aside className="hidden p-5 lg:block">
          <div className="relative h-full overflow-hidden rounded-[2.25rem] border border-[#2b3f5f] bg-[linear-gradient(180deg,#273654_0%,#1a2740_38%,#101827_100%)] px-8 py-7 text-white shadow-[0_35px_100px_rgba(8,14,28,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.18),transparent_30%)]" />
            <div className="relative flex items-center justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-sm text-white/90"
              >
                <MoonStar size={15} />
                Night mode
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900"
              >
                <MessageCircleMore size={15} />
                Spolecznosc
              </button>
            </div>

            <div className="relative mt-12 max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-200/80">
                Hosting panel
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                Zarzadzaj botami jak w nowoczesnym panelu klienta hostingu.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300/90">
                Podglad statusu, logi, pliki, startup i zmienne srodowiskowe sa
                zawsze pod reka w jednym miejscu.
              </p>
            </div>

            <div className="relative mt-14 flex h-[520px] items-end gap-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)] opacity-70" />
              <div className="absolute left-6 right-6 top-0 h-40">
                {Array.from({ length: 36 }).map((_, index) => (
                  <span
                    key={index}
                    className="absolute h-[3px] w-[3px] rounded-full bg-white/70"
                    style={{
                      top: `${(index * 29) % 140}px`,
                      left: `${(index * 57) % 100}%`,
                      opacity: 0.35 + ((index % 5) * 0.12)
                    }}
                  />
                ))}
              </div>
              <ServerRack height="h-[320px]" />
              <ServerRack delay="translate-y-8" height="h-[370px]" />
              <ServerRack delay="translate-y-16" height="h-[430px]" />
              <ServerRack delay="translate-y-10" height="h-[350px]" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
