# MedLink

Plataforma de gestão para instituições de saúde: escalas, equipes e operação. Esta é a **Etapa 1** (fundação + escalas). Arquitetura, decisões e próximas etapas estão em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

## Stack

Next.js 14 · TypeScript · Tailwind · Supabase (PostgreSQL, Auth, Storage). Hospedagem sugerida: Vercel.

## Como colocar no ar

### 1. Supabase

1. Crie um projeto em <https://supabase.com> (região São Paulo, `sa-east-1`, recomendada para dados de brasileiros).
2. No **SQL Editor**, execute em ordem os arquivos de `supabase/migrations/`:
   1. `20261008000001_base.sql`
   2. `20261008000002_escalas.sql`
   3. `20261008000003_storage.sql` (cria o bucket privado de documentos)
3. Em **Authentication → URL Configuration**:
   - *Site URL*: o domínio do app (ex.: `https://medlink.vercel.app`)
   - *Redirect URLs*: `https://SEU-DOMINIO/auth/callback` e `http://localhost:3000/auth/callback`
4. Em **Authentication → Providers → Email**, mantenha a confirmação de e-mail ativada. Convites só são aceitos depois que o e-mail é confirmado.
5. Para produção, configure SMTP próprio (Authentication → Emails); o envio padrão do Supabase tem limite baixo.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` (ou cadastre na Vercel):

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (chave `anon`/publishable) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do app |

A aplicação **não usa** a chave `service_role`. Toda leitura e escrita acontece com a sessão do usuário e é validada pelo banco (RLS + funções).

### 3. Rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

Crie sua conta, cadastre a instituição e, se quiser explorar, use **Criar dados de demonstração** no Painel (tudo fica marcado como demonstração e pode ser removido).

## Testes

```bash
npm test             # utilitários (datas/fuso, CNPJ, tradução de erros)
npm run typecheck
npm run build
npm run test:db      # regras e isolamento em um Postgres local descartável
```

`test:db` precisa de um PostgreSQL 15+ acessível via `PGHOST`/`PGPORT`/`PGUSER`. Ele cria o banco `medlink_test`, simula o esquema `auth` do Supabase e roda 65 verificações: isolamento entre instituições, permissões e escopo por unidade, sobreposição, descanso, férias, categoria, exceções justificadas, publicação, confirmação, substituição, candidatura, cancelamento, convites e auditoria.

## Perfis

| Perfil | Pode |
|---|---|
| Administrador institucional | tudo, inclusive permissões e dados da instituição |
| Gestor operacional | profissionais, escalas, publicação, solicitações, auditoria |
| Responsável técnico | ver profissionais e escalas, verificar documentos e validar cadastros |
| Consulta | ver escalas e indicadores |
| Profissional de saúde | Minha área: próprios plantões, confirmação, substituição, candidatura, disponibilidade |

As permissões dos perfis (exceto administrador) são configuráveis em **Equipe e acessos**. Gestores podem ser restritos a unidades específicas.

## Regras de escala

- **Bloqueios** (não podem ser ignorados): sobreposição de horário, categoria diferente da exigida, vagas cheias, profissional inativo ou com cadastro rejeitado, férias/licença/afastamento, plantão cancelado, duração acima do máximo.
- **Alertas** (exigem justificativa, registrada na auditoria): descanso abaixo do mínimo, carga semanal acima da referência, fora da disponibilidade informada, competências não registradas, unidade fora das informadas, cadastro ainda não validado, indisponibilidade marcada.

Os limites (descanso, carga semanal, duração máxima) ficam em **Configurações** e são pontos de partida, não parecer jurídico.

## Segurança e privacidade

- Isolamento por instituição no banco (RLS) e funções que validam permissão em cada escrita.
- Documentos em bucket privado com políticas por instituição/profissional e links temporários de 60 s.
- Auditoria imutável pela aplicação; cabeçalhos de segurança HTTP; nenhum segredo no cliente.
- Não use dados reais de pacientes em ambientes de demonstração. Este repositório não declara conformidade com a LGPD; ela depende de avaliação jurídica e dos processos da instituição.
