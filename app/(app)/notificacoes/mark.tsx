"use client";
import { markNotificationsRead } from "@/lib/actions/institution";
import { Button } from "@/components/ui/primitives";
import { useAction } from "@/components/ui/use-action";

export function MarkAllRead() {
  const { run, pending } = useAction();
  return <Button size="sm" loading={pending} onClick={() => run(() => markNotificationsRead(null), { successMessage: "Notificações marcadas como lidas." })}>Marcar todas como lidas</Button>;
}
