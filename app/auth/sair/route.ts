import { NextResponse, type NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  await getServerClient().auth.signOut();
  const res = NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  res.cookies.delete("ml_inst");
  return res;
}
