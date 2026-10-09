import { redirect } from "next/navigation";
import { getContext } from "@/lib/session";
import { Logo } from "@/components/shell/logo";
import { OnboardingForm } from "./form";

export const metadata = { title: "Bem-vindo" };

export default async function Welcome() {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  const hasInstitution = ctx.institutions.length > 0;
  return (
    <main className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <Logo />
        <form action="/auth/sair" method="post"><button className="text-sm text-ink-soft hover:text-navy">Sair</button></form>
      </header>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl">{hasInstitution ? "Cadastrar outra instituição" : `Olá, ${ctx.name.split(" ")[0]}`}</h1>
        {!hasInstitution && (
          <div className="mt-3 rounded-md border border-[#BAE0F7] bg-sky px-4 py-3 text-sm text-[#075985]">
            É profissional de saúde e foi convidado por uma instituição? Peça à gestão para cadastrar o seu e-mail
            (<strong>{ctx.email}</strong>) e enviar o convite. O acesso aparece aqui assim que for liberado.
          </div>
        )}
        <p className="mt-6 text-ink-soft">Para gestores: cadastre a instituição. Você poderá adicionar unidades, equipe e profissionais em seguida.</p>
        <OnboardingForm />
      </div>
    </main>
  );
}
