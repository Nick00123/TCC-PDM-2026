-- ═══════════════════════════════════════════════════════════════════
-- TABELA DE FEEDBACK / SUGESTÕES + RLS
-- Executar no SQL Editor do painel do Supabase.
--
-- Guarda as mensagens enviadas pelos usuários sobre o app.
-- Campos:
--   id          uuid (PK, gerado automaticamente)
--   usuario_id  uuid (FK -> auth.users.id)
--   mensagem    text (conteúdo do feedback)
--   categoria   text (ex: 'sugestao', 'bug', 'elogio')
--   criada_em   timestamptz (default now())
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem    text NOT NULL,
  categoria   text NOT NULL DEFAULT 'sugestao',
  criada_em   timestamptz NOT NULL DEFAULT now()
);

-- Índice para consultar feedbacks por data
CREATE INDEX IF NOT EXISTS feedback_criada_em_idx
  ON public.feedback (criada_em DESC);

-- ── RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;

-- Permitir que o usuário crie (insira) o próprio feedback
CREATE POLICY "feedback_insert_own"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- O usuário pode ver apenas os próprios feedbacks (opcional)
CREATE POLICY "feedback_select_own"
  ON public.feedback FOR SELECT
  USING (auth.uid() = usuario_id);

-- NOTA: Para os desenvolvedores visualizarem TODOS os feedbacks,
-- use o painel do Supabase (Table Editor) ou crie uma política/role
-- de leitura administrativa no painel.
