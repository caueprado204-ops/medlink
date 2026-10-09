"use client";
import { clearDemo, seedDemo } from "@/lib/actions/institution";
import { Button } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export function DemoControls({ institutionId, hasDemo }: { institutionId: string; hasDemo: boolean }) {
  const { run, pending } = useAction();
  if (hasDemo) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">Esta instituição tem dados de demonstração (marcados como “demo”).</p>
        <Button size="sm" variant="danger" loading={pending} onClick={() => {
          if (confirm("Remover todos os profissionais, serviços e plantões de demonstração?")) run(() => clearDemo(institutionId));
        }}>Remover dados de demonstração</Button>
      </div>
    );
  }
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <p className="text-sm text-ink-soft">Quer explorar antes? Gere profissionais e plantões fictícios, marcados como demonstração e removíveis depois.</p>
      <Button size="sm" loading={pending} onClick={() => run(() => seedDemo(institutionId))}>Criar dados de demonstração</Button>
    </div>
  );
}
