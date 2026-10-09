import { requirePerm } from "@/lib/session";
import { loadUnits } from "@/lib/queries";
import { PageHeader } from "@/components/ui/primitives";
import { UnitsManager } from "./manager";

export const metadata = { title: "Unidades" };

export default async function Unidades() {
  const ctx = await requirePerm("units.manage");
  const { units, services } = await loadUnits(ctx.current.id);
  return (
    <div>
      <PageHeader title="Unidades e serviços" description="Locais de atendimento e os serviços ou setores de cada um. Plantões são criados por unidade e, opcionalmente, por serviço." />
      <UnitsManager institutionId={ctx.current.id} units={units} services={services} />
    </div>
  );
}
