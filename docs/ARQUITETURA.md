# MedLink — Arquitetura e plano de implementação

Documento de referência da reestruturação. Atualizado na entrega da Etapa 1 (outubro de 2026).

## 1. Diagnóstico da aplicação anterior

O código-fonte da versão publicada em `medlink-henna-eta.vercel.app` não estava disponível (não há repositório da MedLink na conta GitHub conectada). O que se sabe:

- As versões anteriores eram protótipos visuais (HTML de arquivo único e, depois, front-end publicado na Vercel).
- Autenticação, verificação de registro profissional, pagamentos, IA e notificações eram **simulados**; não havia banco de dados nem regras no servidor.
- O valor reaproveitável é o posicionamento, o texto e a direção de produto, não o código.

Decisão: **reconstrução sobre base nova**, já que não há funcionalidade real a preservar. Se o código antigo for localizado, o plano de migração (seção 5) indica o que aproveitar.

## 2. Funcionalidades

| Área | Situação na Etapa 1 |
|---|---|
| Autenticação (e-mail e senha, confirmação de e-mail) | Implementado |
| Instituições, CNPJ validado, unidades, serviços | Implementado |
| Perfis e permissões configuráveis, escopo por unidade | Implementado |
| Cadastro profissional, validação, documentos (armazenamento privado) | Implementado |
| Disponibilidade, preferências, férias/afastamentos (separados da escala) | Implementado |
| Escalas: dia, semana, mês e lista; filtros; arrastar para mover | Implementado |
| Plantões: criar, editar, duplicar, repetir, publicar, cancelar, histórico | Implementado |
| Regras: bloqueios obrigatórios × alertas com exceção justificada | Implementado |
| Área do profissional: confirmar, recusar, pedir substituição, candidatar-se | Implementado |
| Solicitações com aprovação e substituto validado | Implementado |
| Auditoria imutável e central de notificações internas | Implementado |
| Dados de demonstração identificados e removíveis | Implementado |
| Notificação por e-mail | Etapa 2 |
| Motor automático de escalas, banco de talentos, relatórios | Etapa 2 |
| Estoque, vacinas, temperatura | Etapa 3 |
| Home care, financeiro | Etapa 4 |

## 3. Arquitetura

- **Next.js 14 (App Router) + TypeScript + Tailwind**, hospedável na Vercel.
- **Supabase**: PostgreSQL, Auth e Storage. Sem serviços pagos adicionais.
- **Segurança no banco, não na interface.** Toda tabela tem `institution_id` e RLS. Leituras passam pelas políticas; escritas sensíveis (plantões, atribuições, solicitações, membros, permissões) só acontecem por funções `security definer` que verificam a permissão do usuário com `has_perm`/`has_unit_perm`. O cliente nunca usa a chave de serviço.
- **Uma única fonte de regras.** `assignment_checks()` calcula bloqueios e alertas; é usada pela pré-visualização na tela, pela atribuição, pela edição/movimentação e será usada pelo motor automático da Etapa 2. Uma futura camada de IA pode propor escalas, mas sempre passará por essa validação.
- **Auditoria por gatilho.** Um gatilho genérico grava cada inserção, alteração e exclusão com autor, diferença de campos, ação semântica e motivo. `audit_log` não aceita escrita pelo papel `authenticated`.
- **Concorrência.** Atribuições usam trava por profissional (`pg_advisory_xact_lock`) e `select … for update` no plantão, evitando dupla escala e vagas excedidas em cliques simultâneos.
- **Fuso horário.** Datas gravadas em `timestamptz`; regras de semana, disponibilidade e exibição usam o fuso da instituição (padrão `America/Sao_Paulo`).

### Estrutura de pastas

```
app/                 rotas (login, bem-vindo, (app)/painel, escalas, solicitacoes, profissionais, meu, unidades, equipe, auditoria, configuracoes, notificacoes)
components/ui        primitivas (botão, badge, modal, toast) e hook de ações
components/escalas   calendário, cartão de plantão, formulários e detalhes
components/forms     cadastro profissional, disponibilidade e ausências
lib/actions          server actions (validação com zod + chamada às funções do banco)
lib/                 sessão, rótulos, datas, erros, consultas
supabase/migrations  esquema, RLS, funções e armazenamento
tests/db             testes de regras e isolamento em Postgres real
tests/unit           testes de utilitários
```

## 4. Banco de dados (Etapa 1)

| Tabela | Conteúdo |
|---|---|
| `institutions` | dados cadastrais, CNPJ, tipo, módulos, regras (`settings`) |
| `units`, `services` | unidades e serviços/setores |
| `memberships` | vínculo usuário × instituição × perfil, com escopo opcional de unidades |
| `role_permissions` | permissões por perfil, por instituição (configuráveis; admin protegido) |
| `invitations` | convites de equipe e de profissionais, aceitos só após e-mail confirmado |
| `professionals`, `professional_units` | cadastro profissional e unidades de atuação |
| `professional_documents` | metadados de documentos; arquivo no bucket privado |
| `availability_slots`, `shift_preferences`, `absences` | disponibilidade, preferências e ausências (separadas da escala) |
| `shifts`, `shift_assignments` | plantões e atribuições, com exceções justificadas registradas |
| `change_requests` | substituição, cancelamento, alteração e candidatura |
| `audit_log`, `notifications` | histórico imutável e notificações internas |

Tabelas das próximas etapas (previstas): `opportunities`, `talent_profiles`, `applications`; `stock_items`, `lots`, `stock_movements`; `vaccines`, `vaccine_references`, `immunizations`, `cold_chain_readings`; `home_visits`; `payables`, `receivables`.

## 5. Plano de migração

Não há dados reais a migrar. Se o código do protótipo anterior for recuperado:
1. Aproveitar textos da página institucional numa rota pública separada (`/`), sem misturar com a aplicação autenticada.
2. O componente de verificação de registro profissional (CRM/COREN) pode virar um passo do fluxo de validação, mantendo a ressalva de que não existe API pública unificada dos conselhos.
3. Nada do estado simulado (login falso, dados fixos) deve ser reaproveitado.

## 6. Etapas

1. **Etapa 1 (entregue):** fundação, autenticação, instituições, permissões, profissionais, escalas manuais, calendário, área do profissional, solicitações, auditoria.
2. **Etapa 2:** motor determinístico de escalonamento (restrições obrigatórias como filtro, pontuação para equilíbrio de horas e preferências, explicação de vagas não preenchidas, aprovação antes de publicar); notificações por e-mail; banco de talentos com consentimento do profissional; relatórios de horas e cobertura.
3. **Etapa 3:** estoque com lotes e movimentações imutáveis; módulo de vacinas com referências versionadas e revisão técnica; registro de imunização com baixa de estoque transacional e estorno; monitoramento de temperatura sem liberação automática de produtos.
4. **Etapa 4:** home care (agenda por paciente, região e profissional) e financeiro operacional.

## 7. Riscos identificados

- **Regras trabalhistas:** descanso de 11h e carga de 44h são padrões configuráveis, não parecer jurídico. Validar com contratos e convenções das instituições-piloto.
- **Dados sensíveis (LGPD):** documentos pessoais já são privados; dados assistenciais (Etapas 3 e 4) exigirão separação adicional, registro de base legal e política de retenção. Não declarar conformidade sem avaliação jurídica.
- **Verificação de registro:** não há API pública unificada do CFM/COFEN; a validação é manual (documento verificado por responsável técnico).
- **E-mail transacional:** o Supabase envia e-mails de confirmação com limite baixo; para produção, configurar SMTP próprio.
- **Backups:** dependem do plano do Supabase; o gratuito não oferece recuperação ponto a ponto.
- **Escala do calendário:** consultas são limitadas a 2.000 plantões por período; instituições grandes podem exigir paginação por unidade.

## 8. Critérios de conclusão da Etapa 1

- Testes de banco passam: isolamento entre instituições, permissões, escopo por unidade, conflitos, exceções, publicação, confirmação, substituição, candidatura, cancelamento, convites e auditoria (`npm run test:db`).
- Testes unitários passam (`npm test`); `npm run typecheck` e `npm run build` sem erros.
- Fluxo completo validado no navegador: cadastro do gestor → instituição → profissionais → escala → publicação → profissional confirma e pede substituição → gestor aprova com substituto → auditoria.
- Nenhum botão sem ação; dados de demonstração sempre marcados.
