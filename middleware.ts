import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC = [/^\/login/, /^\/auth\//, /^\/configurar/, /^\/_next/, /^\/favicon/];

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = req.nextUrl.pathname;
  // Sem banco configurado: serve a demonstração navegável (dados fictícios, salvos no navegador).
  if (!url || !key) {
    if (path === "/demo.html" || path.startsWith("/_next") || path.startsWith("/configurar")) return NextResponse.next();
    return NextResponse.rewrite(new URL("/demo.html", req.url));
  }

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: { name: string; value: string; options?: CookieOptions }[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !PUBLIC.some((re) => re.test(path))) {
    const to = req.nextUrl.clone();
    to.pathname = "/login";
    to.search = "";
    if (path !== "/") to.searchParams.set("next", path + req.nextUrl.search);
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
