import { redirect } from "next/navigation";
import { requireContext } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/primitives";
import { InstitutionSettings, type InstitutionFull } from "./form";

export const metadata = { title: "Configurações" };

export default async function Configuracoes() {
  const ctx = await requireContext();
  if (!ctx.perms.has("institution.manage")) redirect("/painel");
  const { data } = await getServerClient().from("institutions").select("id,name,legal_name,cnpj,type,modules,settings,phone,email").eq("id", ctx.current.id).single();
  return (
    <div>
      <PageHeader title="Configurações" description="Dados da instituição, módulos e regras usadas na validação das escalas." />
      <InstitutionSettings inst={data as InstitutionFull} />
    </div>
  );
}
