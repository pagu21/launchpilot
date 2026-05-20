"use client";

import { ArrowLeft, Lock, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    setMessage("");
    if (!supabase) {
      setMessage("Configura NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    if (mode === "recover") {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setMessage(error?.message ?? "Email di recupero inviata.");
      return;
    }

    const action =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await action;
    setMessage(error?.message ?? "Operazione completata.");
  }

  return (
    <main className="grid min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[1fr_440px]">
        <div className="flex min-h-[620px] flex-col justify-between bg-slate-950 p-8 text-white">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla dashboard
          </Link>
          <div>
            <div className="mb-6 rounded-lg bg-white p-4">
              <Image
                src="/launch-pilot-logo.png"
                alt="Launch Pilot - Il futuro del tuo ristorante inizia qui"
                width={420}
                height={210}
                priority
                className="h-auto w-full max-w-sm object-contain"
              />
            </div>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight">
              Launch Pilot protegge ogni studio per cliente e progetto.
            </h1>
            <p className="mt-4 max-w-md text-slate-300">
              Accesso con Supabase Auth, ruoli Super Admin/Cliente e Row Level
              Security sul database PostgreSQL.
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
              Area clienti
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              {mode === "login"
                ? "Accedi"
                : mode === "register"
                  ? "Crea account"
                  : "Recupera password"}
            </h2>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                <Mail className="h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-w-0 flex-1 py-3 outline-none"
                />
              </div>
            </label>
            {mode !== "recover" ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password
                <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-w-0 flex-1 py-3 outline-none"
                  />
                </div>
              </label>
            ) : null}
            <button
              onClick={submit}
              className="rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              {mode === "login"
                ? "Accedi"
                : mode === "register"
                  ? "Registrati"
                  : "Invia recupero"}
            </button>
            {message ? (
              <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">
                {message}
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-2 text-sm">
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-left font-semibold text-blue-700"
            >
              {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
            </button>
            <button
              onClick={() => setMode("recover")}
              className="text-left font-semibold text-slate-500"
            >
              Password dimenticata
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
