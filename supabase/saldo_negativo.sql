ALTER TABLE public.perfis
ADD COLUMN IF NOT EXISTS saldo_negativo_desde timestamptz NULL;
