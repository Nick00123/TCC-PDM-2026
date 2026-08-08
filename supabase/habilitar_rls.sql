-- ═══════════════════════════════════════════════════════════════════
-- REATIVAR ROW LEVEL SECURITY (RLS) + POLÍTICAS POR USUÁRIO
-- Executar no SQL Editor do painel do Supabase.
--
-- Este script substitui o antigo `desabilitar_rls.sql`.
-- Agora o app usa autenticação real do Supabase (Auth), então
-- auth.uid() é preenchido e podemos proteger os dados por usuário.
--
-- Estrutura esperada:
--   transacoes.usuario_id (uuid, FK -> auth.users.id)
--   Metas.user_id         (uuid, FK -> auth.users.id)
--   perfis.id             (uuid, PK = auth.uid())
--   dicas                 (tabela pública, somente leitura)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) TRANSAÇÕES ────────────────────────────────────────────────
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transacoes_select_own" ON transacoes;
DROP POLICY IF EXISTS "transacoes_insert_own" ON transacoes;
DROP POLICY IF EXISTS "transacoes_update_own" ON transacoes;
DROP POLICY IF EXISTS "transacoes_delete_own" ON transacoes;

-- Ver somente as próprias transações
CREATE POLICY "transacoes_select_own"
  ON transacoes FOR SELECT
  USING (auth.uid() = usuario_id);

-- Inserir somente se o usuario_id for o usuário autenticado
CREATE POLICY "transacoes_insert_own"
  ON transacoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Atualizar somente as próprias
CREATE POLICY "transacoes_update_own"
  ON transacoes FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Excluir somente as próprias
CREATE POLICY "transacoes_delete_own"
  ON transacoes FOR DELETE
  USING (auth.uid() = usuario_id);

-- ── 2) METAS ─────────────────────────────────────────────────────
ALTER TABLE "Metas" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas_select_own" ON "Metas";
DROP POLICY IF EXISTS "metas_insert_own" ON "Metas";
DROP POLICY IF EXISTS "metas_update_own" ON "Metas";
DROP POLICY IF EXISTS "metas_delete_own" ON "Metas";

CREATE POLICY "metas_select_own"
  ON "Metas" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "metas_insert_own"
  ON "Metas" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "metas_update_own"
  ON "Metas" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "metas_delete_own"
  ON "Metas" FOR DELETE
  USING (auth.uid() = user_id);

-- ── 3) PERFIS ────────────────────────────────────────────────────
-- A chave `perfis.id` é igual a auth.uid() diretamente.
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfis_select_own" ON perfis;
DROP POLICY IF EXISTS "perfis_insert_own" ON perfis;
DROP POLICY IF EXISTS "perfis_update_own" ON perfis;

CREATE POLICY "perfis_select_own"
  ON perfis FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "perfis_insert_own"
  ON perfis FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "perfis_update_own"
  ON perfis FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 4) DICAS (pública, somente leitura) ──────────────────────────
ALTER TABLE dicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dicas_select_public" ON dicas;

-- Qualquer um (logado ou não) pode LER as dicas.
-- Ninguém pode inserir/atualizar/apagar via API anônima.
CREATE POLICY "dicas_select_public"
  ON dicas FOR SELECT
  USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- (OPCIONAL) Criação automática do perfil ao cadastrar usuário
-- Habilite o trigger abaixo se desejar que um registro em `perfis`
-- seja criado automaticamente quando um novo usuário se cadastrar.
-- ═══════════════════════════════════════════════════════════════════
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email, renda_mensal, plano)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.email,
    0,
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

