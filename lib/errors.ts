// Tradução dos erros do banco para mensagens de interface.
// Códigos próprios: ML001 = alerta que exige justificativa; ML002 = restrição obrigatória.

export type Issue = { code: string; message: string };
export type Checks = { blocking: Issue[]; warnings: Issue[] };

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; kind: "blocking" | "warning" | "permission" | "validation" | "conflict" | "network" | "unknown"; message: string; checks?: Checks };

type PgError = { code?: string; message?: string; details?: string | null; hint?: string | null };

const GENERIC: Record<string, string> = {
  "42501": "Você não tem permissão para esta ação.",
  "23505": "Este registro já existe.",
  "23503": "Este registro está vinculado a outros dados e não pode ser alterado assim.",
  "23514": "A alteração não atende às regras do sistema.",
  "22023": "Confira os dados informados.",
  "22P02": "Formato de dado inválido.",
  P0002: "Registro não encontrado.",
};

export function parseChecks(details?: string | null): Checks | undefined {
  if (!details) return undefined;
  try {
    const parsed = JSON.parse(details);
    if (parsed && Array.isArray(parsed.blocking) && Array.isArray(parsed.warnings)) return parsed as Checks;
  } catch {
    /* detalhes não estruturados */
  }
  return undefined;
}

export function fromPgError(error: PgError | null | undefined): ActionResult<never> {
  if (!error) return { ok: false, kind: "unknown", message: "Não foi possível concluir a ação. Tente novamente." };
  const code = error.code ?? "";
  // Mensagens das funções do MedLink já estão em português e são seguras para exibir.
  const ours = /^(ML00\d|42501|23505|23514|22023|P0002|54000)$/.test(code) && error.message && !/^(new row|permission denied|duplicate key)/.test(error.message);
  const message = ours ? error.message! : GENERIC[code] ?? "Não foi possível concluir a ação. Tente novamente.";
  if (code === "ML001") return { ok: false, kind: "warning", message, checks: parseChecks(error.details) };
  if (code === "ML002") return { ok: false, kind: "blocking", message, checks: parseChecks(error.details) };
  if (code === "42501") return { ok: false, kind: "permission", message };
  if (code === "23505") return { ok: false, kind: "conflict", message };
  if (/^(22|23)/.test(code)) return { ok: false, kind: "validation", message };
  if (!code && /fetch|network/i.test(error.message ?? "")) {
    return { ok: false, kind: "network", message: "Sem conexão com o servidor. Verifique a internet e tente novamente." };
  }
  return { ok: false, kind: "unknown", message };
}

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}
export function invalid(message: string): ActionResult<never> {
  return { ok: false, kind: "validation", message };
}
