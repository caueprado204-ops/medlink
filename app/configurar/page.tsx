export const metadata = { title: "Configuração" };

export default function Configurar() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl">Falta conectar o banco de dados</h1>
      <p className="mt-3 text-ink-soft">
        A MedLink precisa de um projeto Supabase para autenticação e dados. Defina as variáveis abaixo no ambiente
        (arquivo <code>.env.local</code> ou painel da Vercel) e aplique as migrações da pasta <code>supabase/migrations</code>.
      </p>
      <pre className="panel mt-6 overflow-x-auto p-4 text-sm">{`NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-publica-anon
NEXT_PUBLIC_SITE_URL=https://seu-dominio`}</pre>
      <p className="mt-4 text-sm text-ink-faint">O passo a passo completo está no README do projeto.</p>
    </main>
  );
}
