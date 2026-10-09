// Vocabulário da interface. Mantém o mesmo nome para a mesma coisa em todas as telas.

export type InstitutionType =
  | "clinica_vacinacao" | "clinica_medica" | "clinica_multiprofissional" | "home_care"
  | "servico_enfermagem" | "centro_ambulatorial" | "outra";
export type Role = "institution_admin" | "operations_manager" | "technical_lead" | "professional" | "viewer";
export type Category =
  | "medico" | "enfermeiro" | "tecnico_enfermagem" | "auxiliar_enfermagem" | "fisioterapeuta"
  | "farmaceutico" | "nutricionista" | "psicologo" | "fonoaudiologo" | "biomedico" | "outro";
export type ShiftStatus =
  | "rascunho" | "publicado" | "aguardando_confirmacao" | "confirmado" | "descoberto" | "substituicao_solicitada" | "cancelado";
export type AssignmentStatus = "aguardando_confirmacao" | "confirmado" | "substituicao_solicitada" | "recusado" | "removido";
export type ValidationStatus = "pendente" | "em_analise" | "validado" | "rejeitado";
export type RequestKind = "substituicao" | "cancelamento" | "alteracao" | "candidatura";
export type RequestStatus = "pendente" | "aprovada" | "recusada" | "cancelada";
export type AbsenceKind = "indisponivel" | "ferias" | "afastamento" | "licenca";
export type Permission =
  | "institution.manage" | "units.manage" | "members.manage" | "settings.manage"
  | "professionals.view" | "professionals.manage" | "documents.verify"
  | "shifts.view" | "shifts.manage" | "shifts.publish" | "requests.decide"
  | "reports.view" | "audit.view";

export const INSTITUTION_TYPES: Record<InstitutionType, string> = {
  clinica_vacinacao: "Clínica de vacinação",
  clinica_medica: "Clínica médica",
  clinica_multiprofissional: "Clínica multiprofissional",
  home_care: "Empresa de home care",
  servico_enfermagem: "Serviço de enfermagem",
  centro_ambulatorial: "Centro ambulatorial",
  outra: "Outra instituição de saúde",
};

export const MODULES: { id: string; label: string; available: boolean; description: string }[] = [
  { id: "escalas", label: "Escalas", available: true, description: "Plantões, calendário, confirmações e substituições" },
  { id: "profissionais", label: "Profissionais", available: true, description: "Cadastro, documentos e disponibilidade" },
  { id: "banco_talentos", label: "Banco de talentos", available: false, description: "Oportunidades e candidaturas entre instituições" },
  { id: "estoque", label: "Estoque", available: false, description: "Itens, lotes, validades e movimentações" },
  { id: "vacinas", label: "Vacinas", available: false, description: "Catálogo, registros de imunização e temperatura" },
  { id: "home_care", label: "Home care", available: false, description: "Atendimentos domiciliares e rotas" },
  { id: "financeiro", label: "Financeiro", available: false, description: "Contas a pagar e a receber" },
];

export const ROLES: Record<Role, string> = {
  institution_admin: "Administrador institucional",
  operations_manager: "Gestor operacional",
  technical_lead: "Responsável técnico",
  professional: "Profissional de saúde",
  viewer: "Consulta",
};

export const CATEGORIES: Record<Category, string> = {
  medico: "Médico(a)",
  enfermeiro: "Enfermeiro(a)",
  tecnico_enfermagem: "Técnico(a) de enfermagem",
  auxiliar_enfermagem: "Auxiliar de enfermagem",
  fisioterapeuta: "Fisioterapeuta",
  farmaceutico: "Farmacêutico(a)",
  nutricionista: "Nutricionista",
  psicologo: "Psicólogo(a)",
  fonoaudiologo: "Fonoaudiólogo(a)",
  biomedico: "Biomédico(a)",
  outro: "Outra categoria",
};

export const COUNCIL_BY_CATEGORY: Partial<Record<Category, string>> = {
  medico: "CRM", enfermeiro: "COREN", tecnico_enfermagem: "COREN", auxiliar_enfermagem: "COREN",
  fisioterapeuta: "CREFITO", farmaceutico: "CRF", nutricionista: "CRN", psicologo: "CRP",
  fonoaudiologo: "CRFa", biomedico: "CRBM",
};

export type Tone = "neutral" | "teal" | "navy" | "amber" | "danger" | "sky" | "mint";

export const SHIFT_STATUS: Record<ShiftStatus, { label: string; tone: Tone }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  publicado: { label: "Publicado", tone: "sky" },
  aguardando_confirmacao: { label: "Aguardando confirmação", tone: "amber" },
  confirmado: { label: "Confirmado", tone: "teal" },
  descoberto: { label: "Descoberto", tone: "danger" },
  substituicao_solicitada: { label: "Substituição solicitada", tone: "amber" },
  cancelado: { label: "Cancelado", tone: "neutral" },
};

export const ASSIGNMENT_STATUS: Record<AssignmentStatus, { label: string; tone: Tone }> = {
  aguardando_confirmacao: { label: "Aguardando confirmação", tone: "amber" },
  confirmado: { label: "Confirmado", tone: "teal" },
  substituicao_solicitada: { label: "Pediu substituição", tone: "amber" },
  recusado: { label: "Recusou", tone: "neutral" },
  removido: { label: "Removido", tone: "neutral" },
};

export const VALIDATION_STATUS: Record<ValidationStatus, { label: string; tone: Tone }> = {
  pendente: { label: "Validação pendente", tone: "amber" },
  em_analise: { label: "Em análise", tone: "sky" },
  validado: { label: "Validado", tone: "teal" },
  rejeitado: { label: "Rejeitado", tone: "danger" },
};

export const REQUEST_KIND: Record<RequestKind, string> = {
  substituicao: "Substituição",
  cancelamento: "Cancelamento",
  alteracao: "Alteração",
  candidatura: "Candidatura",
};

export const REQUEST_STATUS: Record<RequestStatus, { label: string; tone: Tone }> = {
  pendente: { label: "Pendente", tone: "amber" },
  aprovada: { label: "Aprovada", tone: "teal" },
  recusada: { label: "Recusada", tone: "danger" },
  cancelada: { label: "Retirada", tone: "neutral" },
};

export const ABSENCE_KIND: Record<AbsenceKind, string> = {
  indisponivel: "Indisponível",
  ferias: "Férias",
  afastamento: "Afastamento",
  licenca: "Licença",
};

export const PERMISSIONS: Record<Permission, { label: string; group: string }> = {
  "institution.manage": { label: "Editar dados da instituição", group: "Instituição" },
  "units.manage": { label: "Gerenciar unidades e serviços", group: "Instituição" },
  "members.manage": { label: "Gerenciar equipe de acesso", group: "Instituição" },
  "settings.manage": { label: "Configurar regras e permissões", group: "Instituição" },
  "professionals.view": { label: "Ver profissionais", group: "Profissionais" },
  "professionals.manage": { label: "Cadastrar e editar profissionais", group: "Profissionais" },
  "documents.verify": { label: "Verificar documentos e validar cadastros", group: "Profissionais" },
  "shifts.view": { label: "Ver escalas", group: "Escalas" },
  "shifts.manage": { label: "Criar e editar plantões", group: "Escalas" },
  "shifts.publish": { label: "Publicar escalas", group: "Escalas" },
  "requests.decide": { label: "Aprovar solicitações", group: "Escalas" },
  "reports.view": { label: "Ver indicadores", group: "Relatórios" },
  "audit.view": { label: "Ver histórico de auditoria", group: "Relatórios" },
};

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export const AUDIT_ACTIONS: Record<string, string> = {
  insert: "Criou", update: "Alterou", delete: "Excluiu",
  "institution.create": "Criou a instituição",
  "shift.create": "Criou plantão", "shift.update": "Editou plantão", "shift.move": "Moveu plantão",
  "shift.duplicate": "Duplicou plantão", "shift.series": "Criou série de plantões", "shift.publish": "Publicou",
  "shift.cancel": "Cancelou plantão", "shift.assign": "Escalou profissional", "shift.unassign": "Removeu profissional",
  "shift.confirm": "Confirmou presença", "shift.decline": "Recusou plantão",
  "request.create": "Abriu solicitação", "request.apply": "Candidatou-se", "request.approve": "Aprovou solicitação",
  "request.reject": "Recusou solicitação", "request.withdraw": "Retirou solicitação",
  "member.invite": "Convidou membro", "member.accept_invite": "Aceitou convite",
  "member.activate": "Reativou acesso", "member.deactivate": "Desativou acesso",
  "professional.invite": "Convidou profissional", "settings.permissions": "Alterou permissões",
  "demo.seed": "Criou dados de demonstração", "demo.clear": "Removeu dados de demonstração",
};

export const AUDIT_ENTITIES: Record<string, string> = {
  institutions: "Instituição", units: "Unidade", services: "Serviço", memberships: "Acesso",
  role_permissions: "Permissão", invitations: "Convite", professionals: "Profissional",
  professional_units: "Unidade do profissional", professional_documents: "Documento", absences: "Ausência",
  shifts: "Plantão", shift_assignments: "Escala do profissional", change_requests: "Solicitação",
};
