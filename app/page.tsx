import { redirect } from "next/navigation";
import { getContext, homeFor } from "@/lib/session";

export default async function Home() {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  redirect(homeFor(ctx));
}
