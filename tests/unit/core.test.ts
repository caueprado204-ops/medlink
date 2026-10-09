import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidCnpj, formatCnpj } from "../../lib/cnpj";
import { addDays, startOfWeek, viewRange, shiftView, toInstant, localTime, localDate, hoursBetween } from "../../lib/time";
import { fromPgError } from "../../lib/errors";

test("CNPJ: dígitos verificadores", () => {
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11.222.333/0001-80"), false);
  assert.equal(isValidCnpj("00000000000000"), false);
  assert.equal(formatCnpj("11222333000181"), "11.222.333/0001-81");
});

test("calendário: semana começa na segunda e mês cobre semanas inteiras", () => {
  assert.equal(startOfWeek("2026-10-08"), "2026-10-05");
  assert.equal(startOfWeek("2026-10-11"), "2026-10-05");
  const m = viewRange("mes", "2026-10-15");
  assert.equal(m.start, "2026-09-28");
  assert.equal(m.days.length % 7, 0);
  assert.equal(shiftView("mes", "2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("fuso horário: horário local de São Paulo ida e volta", () => {
  const iso = toInstant("2026-10-12", "07:00");
  assert.equal(iso, "2026-10-12T10:00:00.000Z");
  assert.equal(localTime(iso), "07:00");
  assert.equal(localDate("2026-10-13T02:30:00Z"), "2026-10-12");
  assert.equal(hoursBetween("2026-10-12T10:00:00Z", "2026-10-12T16:00:00Z", 15), 5.75);
});

test("erros do banco viram mensagens e tipos de interface", () => {
  const w = fromPgError({ code: "ML001", message: "Esta alteração gera alertas.", details: '{"blocking":[],"warnings":[{"code":"descanso","message":"x"}]}' });
  assert.equal(w.ok, false);
  if (!w.ok) { assert.equal(w.kind, "warning"); assert.equal(w.checks?.warnings.length, 1); }
  const rls = fromPgError({ code: "42501", message: "new row violates row-level security policy for table \"units\"" });
  if (!rls.ok) { assert.equal(rls.kind, "permission"); assert.equal(rls.message, "Você não tem permissão para esta ação."); }
  const unknown = fromPgError({ code: "XX000", message: "internal: connection to 10.0.0.1 failed" });
  if (!unknown.ok) assert.ok(!unknown.message.includes("10.0.0.1"), "não expõe detalhes internos");
});
