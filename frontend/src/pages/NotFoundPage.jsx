import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-panel max-w-xl rounded-[2rem] p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyber/80">404</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Strona nie istnieje</h1>
        <p className="mt-4 text-slate-400">
          Wygląda na to, że trafiłeś poza panel operatora.
        </p>
        <Link
          to="/dashboard"
          className="button-base mt-6 border-cyber/40 bg-cyber/10 text-cyber hover:bg-cyber/20"
        >
          Wróć do dashboardu
        </Link>
      </div>
    </div>
  );
}
