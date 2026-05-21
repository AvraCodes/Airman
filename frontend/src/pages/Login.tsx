import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const DEMO_ACCOUNTS = [
  { email: "admin@airman.local",      password: "admin",       label: "Admin" },
  { email: "dispatcher@airman.local", password: "dispatcher",  label: "Dispatcher" },
  { email: "instructor@airman.local", password: "instructor",  label: "Instructor" },
  { email: "cfi@airman.local",        password: "cfi",         label: "CFI" },
  { email: "cadet@airman.local",      password: "cadet",       label: "Cadet" },
  { email: "mo@airman.local",         password: "mo",          label: "Maint. Officer" },
];

export function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      setError("Invalid email or password. Check the demo accounts below.");
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-950 via-slate-900 to-cyan-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-600 shadow-lg mb-4">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Skynet</h1>
          <p className="text-sky-300 text-sm mt-1">Flight Operations Module</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 border border-red-400/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-sky-200 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@airman.local"
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-200 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-sky-300 mb-3 font-medium uppercase tracking-wide">Demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/15 px-2 py-1.5 text-xs text-white/80 hover:text-white transition-colors text-center"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
