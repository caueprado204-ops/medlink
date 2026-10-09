"use client";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { inviteMember, revokeInvitation, setMemberActive, setRolePermissions } from "@/lib/actions/org";
import { PERMISSIONS, ROLES, type Permission, type Role } from "@/lib/labels";
import type { UnitRow } from "@/lib/queries";
import { Badge, Button, Field, SectionTitle, cx } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { useAction } from "@/components/ui/use-action";

export type Member = { id: string; role: Role; unit_ids: string[] | null; active: boolean; self: boolean; name: string | null; email: string };
export type Invite = { id: string; email: string; role: Role; unit_ids: string[] | null; created_at: string; professional_id: string | null };

export function TeamManager({ institutionId, members, invites, units, canGrantAdmin }: { institutionId: string; members: Member[]; invites: Invite[]; units: UnitRow[]; canGrantAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const { run, pending } = useAction();
  const unitName = (ids: string[] | null) => (ids?.length ? ids.map((id) => units.find((u) => u.id === id)?.name ?? "Unidade").join(", ") : "Todas as unidades");

  return (
    <section className="panel">
      <SectionTitle action={<Button size="sm" variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>Dar acesso</Button>}>Pessoas com acesso</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr><th className="table-head">Pessoa</th><th className="table-head">Perfil</th><th className="table-head">Unidades</th><th className="table-head" /></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className={cx(!m.active && "text-ink-faint")}>
                <td className="table-cell"><span className="block font-medium">{m.name ?? m.email}{m.self && <span className="ml-1.5 text-xs font-normal text-ink-faint">(você)</span>}</span>{m.name && <span className="text-xs text-ink-faint">{m.email}</span>}</td>
                <td className="table-cell">{ROLES[m.role]} {!m.active && <Badge className="ml-1">Inativo</Badge>}</td>
                <td className="table-cell">{m.role === "professional" ? "—" : unitName(m.unit_ids)}</td>
                <td className="table-cell text-right">
                  {!m.self && (
                    <Button size="sm" variant="ghost" loading={pending}
                      onClick={() => { if (!m.active || confirm(`Desativar o acesso de ${m.name ?? m.email} como ${ROLES[m.role]}?`)) run(() => setMemberActive(m.id, !m.active)); }}>
                      {m.active ? "Desativar" : "Reativar"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {invites.map((i) => (
              <tr key={i.id}>
                <td className="table-cell"><span className="block">{i.email}</span><span className="text-xs text-ink-faint">Convite aguardando cadastro</span></td>
                <td className="table-cell">{ROLES[i.role]}</td>
                <td className="table-cell">{i.role === "professional" ? "—" : unitName(i.unit_ids)}</td>
                <td className="table-cell text-right"><Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => revokeInvitation(i.id))}>Cancelar convite</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <InviteForm institutionId={institutionId} units={units} canGrantAdmin={canGrantAdmin} onClose={() => setOpen(false)} />}
    </section>
  );
}

function InviteForm({ institutionId, units, canGrantAdmin, onClose }: { institutionId: string; units: UnitRow[]; canGrantAdmin: boolean; onClose: () => void }) {
  const { run, pending } = useAction();
  const [error, setError] = useState<string | null>(null);
  const roles = (Object.keys(ROLES) as Role[]).filter((r) => r !== "professional" && (canGrantAdmin || r !== "institution_admin"));
  return (
    <Modal open onClose={onClose} title="Dar acesso à equipe"
      description="Se a pessoa já tem conta confirmada com este e-mail, o acesso vale na hora. Caso contrário, é liberado quando ela criar a conta."
      footer={<><Button onClick={onClose}>Cancelar</Button><Button type="submit" form="invite-form" variant="primary" loading={pending}>Conceder acesso</Button></>}>
      <form id="invite-form" className="space-y-4"
        action={(f) => run(() => inviteMember(institutionId, f), { onOk: onClose, onError: (r) => { setError(r.message); return true; } })}>
        <Field label="E-mail" htmlFor="inv-email" required><input id="inv-email" name="email" type="email" className="input" required /></Field>
        <Field label="Perfil" htmlFor="inv-role" required>
          <select id="inv-role" name="role" className="input" required defaultValue="operations_manager">
            {roles.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
          </select>
        </Field>
        {units.length > 1 && (
          <fieldset>
            <legend className="label">Restringir a unidades</legend>
            <p className="hint mb-2 mt-0">Sem seleção = todas as unidades.</p>
            <div className="flex flex-wrap gap-2">
              {units.map((u) => <label key={u.id} className="flex items-center gap-2 rounded border border-line px-2.5 py-1.5 text-sm"><input type="checkbox" name="units" value={u.id} className="accent-teal" />{u.name}</label>)}
            </div>
          </fieldset>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </form>
    </Modal>
  );
}

const EDITABLE_ROLES: Role[] = ["operations_manager", "technical_lead", "viewer"];

export function PermissionMatrix({ institutionId, matrix, editable }: { institutionId: string; matrix: Record<string, Permission[]>; editable: boolean }) {
  const [state, setState] = useState(matrix);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const { run, pending } = useAction();
  const perms = Object.keys(PERMISSIONS) as Permission[];
  const roles: Role[] = ["institution_admin", ...EDITABLE_ROLES];

  function toggle(role: Role, p: Permission) {
    setState((s) => {
      const cur = new Set(s[role] ?? []);
      cur.has(p) ? cur.delete(p) : cur.add(p);
      return { ...s, [role]: Array.from(cur) };
    });
    setDirty((d) => new Set(d).add(role));
  }

  let lastGroup = "";
  return (
    <section className="panel">
      <SectionTitle action={editable && dirty.size > 0 ? (
        <Button size="sm" variant="primary" loading={pending}
          onClick={() => run(async () => {
            for (const r of Array.from(dirty)) { const res = await setRolePermissions(institutionId, r, state[r] ?? []); if (!res.ok) return res; }
            return { ok: true as const, data: null, message: "Permissões atualizadas." };
          }, { onOk: () => setDirty(new Set()) })}>Salvar permissões</Button>
      ) : undefined}>Permissões por perfil</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr><th className="table-head">Permissão</th>{roles.map((r) => <th key={r} className="table-head text-center">{ROLES[r]}</th>)}</tr></thead>
          <tbody>
            {perms.map((p) => {
              const g = PERMISSIONS[p].group;
              const header = g !== lastGroup ? ((lastGroup = g), <tr key={`g-${g}`}><td colSpan={roles.length + 1} className="bg-canvas px-4 py-1.5 text-xs font-medium text-ink-soft">{g}</td></tr>) : null;
              return [header, (
                <tr key={p}>
                  <td className="table-cell">{PERMISSIONS[p].label}</td>
                  {roles.map((r) => (
                    <td key={r} className="table-cell text-center">
                      <input type="checkbox" className="h-4 w-4 accent-teal" aria-label={`${PERMISSIONS[p].label}: ${ROLES[r]}`}
                        checked={(state[r] ?? []).includes(p)} disabled={!editable || r === "institution_admin"} onChange={() => toggle(r, p)} />
                    </td>
                  ))}
                </tr>
              )];
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-xs text-ink-faint">O administrador institucional sempre tem todas as permissões. Profissionais de saúde acessam apenas a Minha área.</p>
    </section>
  );
}
