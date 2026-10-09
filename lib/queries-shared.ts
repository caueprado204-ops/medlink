import type { AssignmentStatus } from "./labels";

export const isActiveAssignment = (s: AssignmentStatus) =>
  s === "aguardando_confirmacao" || s === "confirmado" || s === "substituicao_solicitada";
