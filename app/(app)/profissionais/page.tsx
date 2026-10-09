import Link from "next/link";
import { requirePerm } from "@/lib/session";
import { getServerClient } from "@/lib/supabase/server";
import { loadUnits } from "@/lib/queries";
import { CATEGORIES, VALIDATION_STATUS, type Category, type ValidationStatus } from "@/lib/labels";
import { addDays, today } from "@/lib/time";
import { Badge, DemoBadge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { NewProfessionalButton } from "./new-button";

export const metadata = { title: "Profissionais" };

type Row = {
  id: string; full_name: string; category: Category; council: string | null; council_number: string | null; council_uf: string | null;
  validation_status: ValidationStatus; active: boolean; is_demo: boolean; user_id: string | null; email: string | null;
  documents: { expires_on: string | null; status: string }[];
};

export default async function Profissionais({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const ctx = await requirePerm("professionals.view");
  const supabase = getServerClient();
  const q = (searchParams.q ?? "").trim();
  let query = supabase
    .from("professionals")
    .select("id, full_name, category, council, council_number, council_uf, validation_status, active, is_demo, user_id, email, documents:professional_documents(expires_on, status)")
    .eq("institution_id", ctx.current.id)
    .order("full_name")
    .limit(500);
  if (q) {
    const safe = q.replace(/[%,()"\\*:]/g, " ").slice(0, 80);
    query = query.or(`full_name.ilike.%${safe}%,council_number.ilike.%${safe}%`);
  }
  if (searchParams.categoria) query = query.eq("category", searchParams.categoria);
  if (searchParams.validacao === "pendente") query = query.in("validation_status", ["pendente", "em_analise"]);
  else if (searchParams.validacao) query = query.eq("validation_status", searchParams.validacao);
  query = query.eq("active", searchParams.inativos !== "1");
  const [{ data, error }, { units }] = await Promise.all([query, loadUnits(ctx.current.id)]);
  if (error) throw new Error("Não foi possível carregar os profissionais.");

  const limit = addDays(today(ctx.tz), 30);
  let rows = (data ?? []) as unknown as Row[];
  const expiring = (r: Row) => r.documents.some((d) => d.expires_on && d.expires_on <= limit && d.status !== "rejeitado");
  if (searchParams.documentos === "vencendo") rows = rows.filter(expiring);
  const canManage = ctx.perms.has("professionals.manage");

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description="Cadastro da equipe assistencial, situação de validação e documentos."
        actions={canManage ? <NewProfessionalButton institutionId={ctx.current.id} units={units} /> : undefined}
      />
      <form className="panel mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto_auto]" role="search">
        <input name="q" defaultValue={q} className="input" placeholder="Nome ou número do registro" aria-label="Buscar por nome ou registro" />
        <select name="categoria" defaultValue={searchParams.categoria ?? ""} className="input" aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="validacao" defaultValue={searchParams.validacao ?? ""} className="input" aria-label="Validação">
          <option value="">Qualquer validação</option>
          {Object.entries(VALIDATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inativos" value="1" defaultChecked={searchParams.inativos === "1"} className="accent-teal" />Inativos</label>
        <button className="h-10 rounded border border-line bg-white px-4 text-sm font-medium hover:bg-canvas">Filtrar</button>
      </form>

      <div className="panel overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState title={q || Object.keys(searchParams).length ? "Nenhum profissional encontrado" : "Nenhum profissional cadastrado"}>
            {q || Object.keys(searchParams).length ? "Revise a busca ou os filtros." : "Cadastre a equipe para poder montar as escalas."}
          </EmptyState>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr>
              <th className="table-head">Nome</th><th className="table-head">Categoria</th><th className="table-head">Registro</th>
              <th className="table-head">Validação</th><th className="table-head">Acesso</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const v = VALIDATION_STATUS[r.validation_status];
                return (
                  <tr key={r.id} className="hover:bg-canvas">
                    <td className="table-cell">
                      <Link href={`/profissionais/${r.id}`} className="font-medium text-navy hover:underline">{r.full_name}</Link>
                      <span className="ml-2 inline-flex gap-1">{r.is_demo && <DemoBadge />}{expiring(r) && <Badge tone="amber">Documento vencendo</Badge>}</span>
                    </td>
                    <td className="table-cell">{CATEGORIES[r.category]}</td>
                    <td className="table-cell tabular-nums">{r.council_number ? `${r.council} ${r.council_number}/${r.council_uf}` : <span className="text-ink-faint">Não informado</span>}</td>
                    <td className="table-cell"><Badge tone={v.tone}>{v.label}</Badge></td>
                    <td className="table-cell">{r.user_id ? <span className="text-teal">Conta vinculada</span> : <span className="text-ink-faint">{r.email ? "Sem conta" : "Sem e-mail"}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
