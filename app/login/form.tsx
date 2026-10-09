"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { Button, Field } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get("erro") === "link" ? "O link de confirmação expirou ou já foi usado. Entre com e-mail e senha." : null);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim().toLowerCase();
    const password = String(f.get("password") || "");
    const name = String(f.get("name") || "").trim();
    setError(null);
    if (mode === "criar" && name.length < 3) return setError("Informe seu nome completo.");
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    setLoading(true);
    const supabase = getBrowserClient();
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(/confirm/i.test(error.message) ? "Confirme seu e-mail pelo link enviado antes de entrar." : "E-mail ou senha incorretos.");
          return;
        }
        const next = params.get("next");
        router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
        router.refresh();
      } else {
        const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${site}/auth/callback` },
        });
        if (error) {
          setError(/registered|exists/i.test(error.message) ? "Já existe uma conta com este e-mail. Entre com sua senha." : "Não foi possível criar a conta. Tente novamente.");
          return;
        }
        if (data.session) { router.replace("/"); router.refresh(); return; }
        setSent(email);
      }
    } catch {
      setError("Sem conexão com o servidor. Verifique a internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl">Confirme seu e-mail</h1>
        <p className="mt-2 text-ink-soft">Enviamos um link para <strong className="text-ink">{sent}</strong>. Abra o link para ativar a conta e depois entre com sua senha.</p>
        <Button className="mt-6" onClick={() => { setSent(null); setMode("entrar"); }}>Voltar para entrar</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl">{mode === "entrar" ? "Entrar na MedLink" : "Criar conta"}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {mode === "entrar" ? "Use o e-mail cadastrado pela sua instituição ou a sua conta de gestor." : "Gestores criam a instituição depois. Profissionais convidados usam o mesmo e-mail do convite."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {mode === "criar" && (
          <Field label="Nome completo" htmlFor="name" required>
            <input id="name" name="name" className="input" autoComplete="name" required />
          </Field>
        )}
        <Field label="E-mail" htmlFor="email" required>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </Field>
        <Field label="Senha" htmlFor="password" hint={mode === "criar" ? "Mínimo de 8 caracteres." : undefined} required>
          <input id="password" name="password" type="password" className="input" autoComplete={mode === "entrar" ? "current-password" : "new-password"} required minLength={8} />
        </Field>
        {error && <p role="alert" className="rounded border border-danger-line bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}
        <Button type="submit" variant="primary" loading={loading} className="w-full">
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        {mode === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
        <button type="button" className="font-medium text-teal underline-offset-2 hover:underline" onClick={() => { setMode(mode === "entrar" ? "criar" : "entrar"); setError(null); }}>
          {mode === "entrar" ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </div>
  );
}
