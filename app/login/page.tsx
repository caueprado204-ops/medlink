import { Suspense } from "react";
import { LoginForm } from "./form";
import { Logo } from "@/components/shell/logo";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(420px,520px)]">
      <section className="hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
        <Logo light />
        <div className="max-w-md">
          <p className="text-2xl font-semibold leading-snug text-white">
            Escalas, equipes e operação da sua instituição de saúde em um só lugar.
          </p>
          <ul className="mt-6 space-y-2 text-[#C9D7E6]">
            <li>Plantões com regras de descanso, categoria e disponibilidade validadas antes de salvar.</li>
            <li>Profissionais confirmam presença e pedem substituição pelo celular.</li>
            <li>Cada alteração fica registrada no histórico de auditoria.</li>
          </ul>
        </div>
        <p className="text-sm text-[#8FA6BF]">Dados de cada instituição ficam isolados e protegidos.</p>
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <Suspense><LoginForm /></Suspense>
        </div>
      </section>
    </main>
  );
}
