import { requirePerm } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { loadProfessionalsLite } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { RequestList, type RequestRow } from "./list";

export const metadata = { title: "Solicitações" };

const SELECT =
  "id, kind, status, reason, created_at, decided_at, decision_note, suggested_professional_id," +
  "professional:professionals!change_requests_professional_id_institution_id_fkey(id, full_name, category)," +
  "shift:shifts(id, starts_at, ends_at, category, unit:units(name), service:services(name))";

export default async function Solicitacoes() {
  const ctx = await requirePerm("requests.decide");
  const supabase = getServerClient();
  const [{ data: pending, error }, { data: recent }, professionals] = await Promise.all([
    supabase.from("change_requests").select(SELECT).eq("institution_id", ctx.current.id).eq("status", "pendente").order("created_at"),
    supabase.from("change_requests").select(SELECT).eq("institution_id", ctx.current.id).neq("status", "pendente").order("decided_at", { ascending: false }).limit(20),
    loadProfessionalsLite(ctx.current.id),
  ]);
  if (error) throw new Error("Não foi possível carregar as solicitações.");

  return (
    <div>
      <PageHeader title="Solicitações" description="Pedidos de substituição, cancelamento e alteração feitos pelos profissionais, e candidaturas a vagas abertas." />
      <section className="panel mb-6">
        {(pending ?? []).length === 0 ? (
          <EmptyState title="Nenhuma solicitação pendente">Quando um profissional pedir substituição ou se candidatar a uma vaga, o pedido aparece aqui.</EmptyState>
        ) : (
          <RequestList rows={pending as unknown as RequestRow[]} tz={ctx.tz} professionals={professionals} decidable />
        )}
      </section>
      {(recent ?? []).length > 0 && (
        <>
          <h2 className="mb-3 text-lg">Analisadas recentemente</h2>
          <section className="panel"><RequestList rows={recent as unknown as RequestRow[]} tz={ctx.tz} professionals={professionals} /></section>
        </>
      )}
    </div>
  );
}
