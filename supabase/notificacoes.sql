-- ═══════════════════════════════════════════════════════════════════
-- TABELA DE NOTIFICAÇÕES + CONTROLE DE DUPLICIDADE
-- ═══════════════════════════════════════════════════════════════════
--
-- Cada notificação pertence a um usuário.
--
-- chave_evento:
--   Identifica o evento que gerou a notificação.
--
-- Exemplos:
--   meta_concluida:ID_DA_META
--   alerta_despesas_maiores
--
-- Para notificações que não precisam de controle de duplicidade,
-- chave_evento pode ficar NULL.
--
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 1. CRIA A TABELA CASO ELA AINDA NÃO EXISTA
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  mensagem    text NOT NULL,
  tipo        text NOT NULL DEFAULT 'sistema',
  lida        boolean NOT NULL DEFAULT false,
  criada_em   timestamptz NOT NULL DEFAULT now()
);


-- ───────────────────────────────────────────────────────────────────
-- 2. ADICIONA A COLUNA DE CONTROLE DE EVENTO
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE public.notificacoes
ADD COLUMN IF NOT EXISTS chave_evento text;


-- ───────────────────────────────────────────────────────────────────
-- 3. ÍNDICE PARA CONSULTAR AS NOTIFICAÇÕES
-- ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS notificacoes_usuario_idx
  ON public.notificacoes (usuario_id, criada_em DESC);


-- ───────────────────────────────────────────────────────────────────
-- 4. LIMPA DUPLICATAS ANTIGAS
-- ───────────────────────────────────────────────────────────────────
--
-- Mantém apenas a notificação mais antiga quando existem
-- notificações exatamente iguais do mesmo usuário.
--
-- Isso limpa as duplicatas que já foram criadas pelo código antigo.
--
-- ───────────────────────────────────────────────────────────────────

DELETE FROM public.notificacoes a
USING public.notificacoes b
WHERE a.usuario_id = b.usuario_id
  AND a.titulo = b.titulo
  AND a.mensagem = b.mensagem
  AND a.tipo = b.tipo
  AND a.criada_em > b.criada_em;


-- ───────────────────────────────────────────────────────────────────
-- 5. ASSOCIA NOTIFICAÇÕES ANTIGAS DE METAS À META CORRESPONDENTE
-- ───────────────────────────────────────────────────────────────────
--
-- O código antigo não salvava o ID da meta.
--
-- Como a mensagem tinha o título da meta, tentamos recuperar essa
-- relação automaticamente.
--
-- Exemplo:
--
-- "Parabéns! Você alcançou a meta "Viagem"."
--
-- será associado à meta cujo título é "Viagem".
--
-- ───────────────────────────────────────────────────────────────────

UPDATE public.notificacoes n
SET chave_evento = 'meta_concluida:' || m.id::text
FROM public.metas m
WHERE n.tipo = 'meta'
  AND n.chave_evento IS NULL
  AND n.mensagem = 'Parabéns! Você alcançou a meta "' || m.titulo || '".';


-- ───────────────────────────────────────────────────────────────────
-- 6. DEFINE A CHAVE DAS NOTIFICAÇÕES DE ALERTA DE DESPESAS
-- ───────────────────────────────────────────────────────────────────

UPDATE public.notificacoes
SET chave_evento = 'alerta_despesas_maiores'
WHERE tipo = 'alerta'
  AND titulo = '⚠️ Atenção aos gastos'
  AND mensagem = 'Suas despesas estão maiores que suas receitas.'
  AND chave_evento IS NULL;


-- ───────────────────────────────────────────────────────────────────
-- 7. REMOVE POSSÍVEIS DUPLICATAS DE EVENTO
-- ───────────────────────────────────────────────────────────────────
--
-- Caso existam várias notificações antigas relacionadas ao mesmo
-- evento, mantém somente a mais antiga.
--
-- ───────────────────────────────────────────────────────────────────

DELETE FROM public.notificacoes a
USING public.notificacoes b
WHERE a.usuario_id = b.usuario_id
  AND a.chave_evento IS NOT NULL
  AND a.chave_evento = b.chave_evento
  AND a.criada_em > b.criada_em;


-- ───────────────────────────────────────────────────────────────────
-- 8. CRIA RESTRIÇÃO PARA IMPEDIR DUPLICIDADE
-- ───────────────────────────────────────────────────────────────────
--
-- Um mesmo usuário não poderá possuir duas notificações com a
-- mesma chave_evento.
--
-- Notificações com chave_evento NULL continuam permitidas.
--
-- ───────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS notificacoes_usuario_evento_unique
  ON public.notificacoes (usuario_id, chave_evento)
  WHERE chave_evento IS NOT NULL;


-- ───────────────────────────────────────────────────────────────────
-- 9. RLS
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;


-- Remove políticas antigas, caso existam.

DROP POLICY IF EXISTS "notificacoes_select_own"
  ON public.notificacoes;

DROP POLICY IF EXISTS "notificacoes_insert_own"
  ON public.notificacoes;

DROP POLICY IF EXISTS "notificacoes_update_own"
  ON public.notificacoes;

DROP POLICY IF EXISTS "notificacoes_delete_own"
  ON public.notificacoes;


-- Ver somente as próprias notificações.

CREATE POLICY "notificacoes_select_own"
  ON public.notificacoes
  FOR SELECT
  USING (auth.uid() = usuario_id);


-- Inserir somente notificações do próprio usuário.

CREATE POLICY "notificacoes_insert_own"
  ON public.notificacoes
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);


-- Atualizar somente as próprias notificações.

CREATE POLICY "notificacoes_update_own"
  ON public.notificacoes
  FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);


-- Excluir somente as próprias notificações.

CREATE POLICY "notificacoes_delete_own"
  ON public.notificacoes
  FOR DELETE
  USING (auth.uid() = usuario_id);












  -- ============================================================
-- CORREÇÃO DAS NOTIFICAÇÕES AUTOMÁTICAS
-- Impede notificações duplicadas para o mesmo evento.
-- ============================================================

-- 1. Adiciona uma chave que identifica o evento da notificação.
--    Ela pode ficar NULL para notificações que não precisam
--    de controle de duplicidade.

ALTER TABLE public.notificacoes
ADD COLUMN IF NOT EXISTS chave_evento text;


-- 2. Cria uma restrição única por usuário + evento.
--
--    Exemplo:
--
--    usuario_id = A
--    chave_evento = "meta_concluida:123"
--
--    Só poderá existir uma linha assim para esse usuário.

CREATE UNIQUE INDEX IF NOT EXISTS
notificacoes_usuario_chave_evento_unique
ON public.notificacoes (usuario_id, chave_evento)
WHERE chave_evento IS NOT NULL;


-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "notificacoes_select_own"
ON public.notificacoes;

DROP POLICY IF EXISTS "notificacoes_insert_own"
ON public.notificacoes;

DROP POLICY IF EXISTS "notificacoes_update_own"
ON public.notificacoes;

DROP POLICY IF EXISTS "notificacoes_delete_own"
ON public.notificacoes;


-- Ver somente as próprias notificações
CREATE POLICY "notificacoes_select_own"
ON public.notificacoes
FOR SELECT
USING (auth.uid() = usuario_id);


-- Inserir somente notificações do próprio usuário
CREATE POLICY "notificacoes_insert_own"
ON public.notificacoes
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);


-- Atualizar somente as próprias notificações
CREATE POLICY "notificacoes_update_own"
ON public.notificacoes
FOR UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);


-- Excluir somente as próprias notificações
CREATE POLICY "notificacoes_delete_own"
ON public.notificacoes
FOR DELETE
USING (auth.uid() = usuario_id);
