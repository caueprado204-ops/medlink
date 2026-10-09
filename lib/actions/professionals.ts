"use server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { fromPgError, invalid, ok, type ActionResult } from "@/lib/errors";
import { list, rpc, revalidateAll, str } from "./_rpc";

const categories = [
  "medico", "enfermeiro", "tecnico_enfermagem", "auxiliar_enfermagem", "fisioterapeuta",
  "farmaceutico", "nutricionista", "psicologo", "fonoaudiologo", "biomedico", "outro",
] as const;

const schema = z.object({
  full_name: z.string().min(3, "Informe o nome completo.").max(160),
  email: z.string().email("E-mail inválido.").nullable(),
  phone: z.string().max(40).nullable(),
  category: z.enum(categories, { errorMap: () => ({ message: "Selecione a categoria profissional." }) }),
  council: z.string().max(20).nullable(),
  council_number: z.string().max(30).nullable(),
  council_uf: z.string().regex(/^[A-Za-z]{2}$/, "UF do registro com 2 letras.").nullable(),
  education: z.string().max(1000).nullable(),
  experience: z.string().max(2000).nullable(),
  region: z.string().max(160).nullable(),
  notes: z.string().max(2000).nullable(),
  competencies: z.array(z.string().max(80)).max(40),
  certifications: z.array(z.string().max(120)).max(40),
});

function parse(form: FormData) {
  return schema.safeParse({
    full_name: str(form.get("full_name")) ?? "",
    email: str(form.get("email"))?.toLowerCase() ?? null,
    phone: str(form.get("phone")),
    category: form.get("category"),
    council: str(form.get("council"))?.toUpperCase() ?? null,
    council_number: str(form.get("council_number")),
    council_uf: str(form.get("council_uf")),
    education: str(form.get("education")),
    experience: str(form.get("experience")),
    region: str(form.get("region")),
    notes: str(form.get("notes")),
    competencies: list(str(form.get("competencies"))),
    certifications: list(str(form.get("certifications"))),
  });
}

export async function saveProfessional(institutionId: string, id: string | null, form: FormData): Promise<ActionResult<string>> {
  const parsed = parse(form);
  if (!parsed.success) return invalid(parsed.error.issues[0].message);
  const v = { ...parsed.data, council_uf: parsed.data.council_uf?.toUpperCase() ?? null };
  if (v.council_number && (!v.council || !v.council_uf)) return invalid("Informe conselho e UF junto com o número do registro.");
  const supabase = getServerClient();
  const q = id
    ? supabase.from("professionals").update(v).eq("id", id).select("id")
    : supabase.from("professionals").insert({ ...v, institution_id: institutionId }).select("id");
  const { data, error } = await q;
  if (error) {
    if (error.code === "23505") return invalid("Já existe um profissional com este registro no conselho.");
    return fromPgError(error);
  }
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para editar profissionais." };
  // vínculo com unidades
  const units = form.getAll("units").map(String).filter(Boolean);
  const pid = data[0].id as string;
  if (form.has("units_present")) {
    const { error: delErr } = await supabase.from("professional_units").delete().eq("professional_id", pid);
    if (delErr) return fromPgError(delErr);
    if (units.length) {
      const { error: insErr } = await supabase.from("professional_units")
        .insert(units.map((u) => ({ professional_id: pid, unit_id: u, institution_id: institutionId })));
      if (insErr) return fromPgError(insErr);
    }
  }
  revalidateAll();
  return ok(pid, id ? "Cadastro atualizado." : "Profissional cadastrado.");
}

export async function setProfessionalActive(id: string, active: boolean): Promise<ActionResult> {
  const { data, error } = await getServerClient().from("professionals").update({ active }).eq("id", id).select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para editar profissionais." };
  revalidateAll();
  return ok(null, active ? "Profissional reativado." : "Profissional desativado. Plantões futuros não são alterados automaticamente.");
}

export async function setValidationStatus(id: string, status: string): Promise<ActionResult> {
  if (!["pendente", "em_analise", "validado", "rejeitado"].includes(status)) return invalid("Situação inválida.");
  const { data, error } = await getServerClient().from("professionals").update({ validation_status: status }).eq("id", id).select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para validar cadastros." };
  revalidateAll();
  return ok(null, "Situação de validação atualizada.");
}

export async function inviteProfessional(id: string): Promise<ActionResult<string>> {
  const res = await rpc<string>("invite_professional", { p_professional: id });
  if (!res.ok) return res;
  const msg = res.data === "vinculado"
    ? "Conta vinculada. O profissional já vê os plantões na Minha área."
    : res.data === "ja_vinculado" ? "Este cadastro já está vinculado a uma conta."
    : "Convite registrado. O vínculo acontece quando o profissional criar a conta com este e-mail e confirmá-lo.";
  return ok(res.data, msg);
}

/* --------------------------------------------------------------- Documentos */
const BUCKET = "documentos-profissionais";
const MAX_BYTES = 10 * 1024 * 1024;
const MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function uploadDocument(institutionId: string, professionalId: string, form: FormData): Promise<ActionResult> {
  const kind = str(form.get("kind"));
  const expires = str(form.get("expires_on"));
  const file = form.get("file");
  if (!kind) return invalid("Informe o tipo de documento.");
  if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) return invalid("Data de validade inválida.");
  const supabase = getServerClient();
  let filePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return invalid("Arquivo acima de 10 MB.");
    if (!MIME.includes(file.type)) return invalid("Envie PDF, JPG, PNG ou WEBP.");
    const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
    filePath = `${institutionId}/${professionalId}/${crypto.randomUUID()}-${safe}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(filePath, file, { contentType: file.type, upsert: false });
    if (upErr) return { ok: false, kind: "unknown", message: "Não foi possível enviar o arquivo. Confira se o armazenamento está configurado." };
  }
  const { error } = await supabase.from("professional_documents").insert({
    institution_id: institutionId, professional_id: professionalId, kind, expires_on: expires, file_path: filePath,
  });
  if (error) {
    if (filePath) await supabase.storage.from(BUCKET).remove([filePath]);
    return fromPgError(error);
  }
  revalidateAll();
  return ok(null, "Documento enviado. Ele fica como “enviado” até ser verificado.");
}

export async function setDocumentStatus(docId: string, status: "verificado" | "rejeitado" | "enviado"): Promise<ActionResult> {
  const { data, error } = await getServerClient().from("professional_documents").update({ status }).eq("id", docId).select("id");
  if (error) return fromPgError(error);
  if (!data?.length) return { ok: false, kind: "permission", message: "Você não tem permissão para verificar documentos." };
  revalidateAll();
  return ok(null, status === "verificado" ? "Documento verificado." : status === "rejeitado" ? "Documento rejeitado." : "Verificação desfeita.");
}

export async function documentLink(path: string): Promise<ActionResult<string>> {
  // URL temporária (60 s); o acesso é validado pelas políticas do armazenamento.
  const { data, error } = await getServerClient().storage.from(BUCKET).createSignedUrl(path, 60);
  if (error || !data) return { ok: false, kind: "permission", message: "Não foi possível abrir o documento." };
  return ok(data.signedUrl);
}
