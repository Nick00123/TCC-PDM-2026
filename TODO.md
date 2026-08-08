# TODO — Login real com Supabase Auth + RLS seguro + fix usuario_id

## Descobertas
- Login atual era local (AuthContexto), sem Supabase Auth real.
- `usuarioApi.ts` já tinha os métodos, mas nunca eram usados na tela de login.
- RLS estava DESABILITADO (`supabase/desabilitar_rls.sql`) => dados expostos.
- Colunas: `transacoes.usuario_id`, `Metas.user_id`, `perfis.id = auth.uid()`.

## Etapas — Código (concluídas)

- [x] 1. Adicionar `id` ao tipo `Usuario` (`src/tipos/index.ts`)
- [x] 2. `usuarioApi.ts`: retornar `id` do usuário autenticado em `entrar`/`cadastrar`
- [x] 3. `AuthContexto.tsx`: hidratar sessão via `getSession`/`onAuthStateChange` e `logout()` com `signOut`
- [x] 4. `app/telalogin.tsx`: usar `usuarioApi.entrar`/`cadastrar` no lugar do `setUsuario` local
- [x] 5. `perfilApi.ts`: incluir `id` no objeto retornado
- [x] 6. `FinanceContexto.tsx`: carregar dados somente quando houver usuário autenticado (`usuario.id`)
- [x] 7. `transacoesApi.ts`: incluir `usuario_id` no insert (corrige o erro 23502)
- [x] 8. `metasApi.ts`: incluir `user_id` no insert

## Etapas — SQL

- [x] 9. Criar `supabase/habilitar_rls.sql` (reaativar RLS + políticas por usuário)
- [x] 10. Substituir `supabase/desabilitar_rls.sql` por aviso de depreciação

## Ação manual pendente
- [x] 11. **EXECUTAR** `supabase/habilitar_rls.sql` no SQL Editor do painel do Supabase (📌 IMPORTANTE! Sem isso, o RLS continua desligado e as policies do app ficam sem efeito).
- [ ] 12. Confirmar que o provedor **Email** está habilitado (já confirmado pelo usuário) e que a "Confirm email" ativa não impede o login de contas já confirmadas.

