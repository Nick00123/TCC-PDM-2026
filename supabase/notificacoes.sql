-- ═══════════════════════════════════════════════════════════════════
-- TABELA DE NOTIFICAÇÕES + RLS
-- Executar no SQL Editor do painel do Supabase.
--
-- Cada notificação pertence a um usuário (auth.uid()).
-- Campos:
--   id          uuid (PK, gerado automaticamente)
--   usuario_id  uuid (FK -> auth.users.id)
--   titulo      text (ex: "Meta concluída!")
--   mensagem    text (detalhe da notificação)
--   tipo        text (ex: 'meta', 'alerta', 'dica', 'sistema')
--   lida        boolean (controle de leitura)
--   criada_em   timestamptz (default now())
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  mensagem    text NOT NULL,
  tipo        text NOT NULL DEFAULT 'sistema',
  lida        boolean NOT NULL DEFAULT false,
  criada_em   timestamptz NOT NULL DEFAULT now()
);

-- Índice para consultar notificações do usuário de forma eficiente
CREATE INDEX IF NOT EXISTS notificacoes_usuario_idx
  ON public.notificacoes (usuario_id, criada_em DESC);

-- ── RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notificacoes_select_own" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_insert_own" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_update_own" ON public.notificacoes;
DROP POLICY IF EXISTS "notificacoes_delete_own" ON public.notificacoes;

-- Ver somente as próprias notificações
CREATE POLICY "notificacoes_select_own"
  ON public.notificacoes FOR SELECT
  USING (auth.uid() = usuario_id);

-- Inserir somente se o usuario_id for o usuário autenticado
CREATE POLICY "notificacoes_insert_own"
  ON public.notificacoes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Atualizar (marcar como lida) somente as próprias
CREATE POLICY "notificacoes_update_own"
  ON public.notificacoes FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Excluir somente as próprias
CREATE POLICY "notificacoes_delete_own"
  ON public.notificacoes FOR DELETE
  USING (auth.uid() = usuario_id);
