import type { Dica } from '../tipos';
import { supabase } from './supabaseCliente';

/**
 * API de Dicas
 * Opera sobre a tabela `dicas` do Supabase (leitura pública).
 */
export const dicasApi = {
  /** Lista todas as dicas de educação financeira */
  async listar(): Promise<Dica[]> {
    const { data, error } = await supabase
      .from('dicas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar dicas:', error);
      return [];
    }

    return data?.map((item: any): Dica => ({
      id: item.id,
      titulo: item.titulo,
      descricao: item.descricao,
      categoria: item.categoria,
    })) ?? [];
  },
};
