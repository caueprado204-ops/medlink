"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { UnitRow } from "@/lib/queries";
import { Button } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/overlay";
import { ProfessionalForm } from "@/components/forms/professional-form";

export function NewProfessionalButton({ institutionId, units }: { institutionId: string; units: UnitRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Novo profissional</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Novo profissional" size="lg"
        description="O cadastro começa com validação pendente até a verificação dos documentos.">
        {open && <ProfessionalForm institutionId={institutionId} units={units} onDone={() => setOpen(false)} />}
      </Modal>
    </>
  );
}
