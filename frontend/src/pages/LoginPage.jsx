import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "../components/AuthShell";

export function LoginPage() {
  const navigate = useNavigate();
  const { token, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Logowanie"
      title="Zaloguj sie"
      subtitle="Wejdz do panelu klienta i przejdz od razu do swoich botow, logow i konfiguracji serwerow."
      footer={
        <>
          Nie masz jeszcze konta?{" "}
          <Link to="/register" className="font-medium text-sky-600 transition hover:text-sky-500">
            Zaloz konto
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-500">
            Adres e-mail lub nazwa uzytkownika
          </span>
          <input
            type="email"
            className="input-base !border-slate-200 !bg-slate-50 !text-slate-900 placeholder:!text-slate-400 focus:!border-sky-400 focus:!ring-sky-400/20"
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-500">Haslo</span>
          <input
            type="password"
            className="input-base !border-slate-200 !bg-slate-50 !text-slate-900 placeholder:!text-slate-400 focus:!border-sky-400 focus:!ring-sky-400/20"
            placeholder="Wpisz haslo"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-slate-500">
            <input type="checkbox" className="rounded border-slate-300" />
            Zapamietaj mnie
          </label>
          <span className="font-medium text-sky-600">Bezpieczne logowanie</span>
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="button-base w-full !rounded-full !border-sky-500 !bg-sky-500 !py-3 !text-white hover:!bg-sky-600"
        >
          {submitting ? "Logowanie..." : "Zaloguj sie do panelu"}
        </button>
      </form>
    </AuthShell>
  );
}
