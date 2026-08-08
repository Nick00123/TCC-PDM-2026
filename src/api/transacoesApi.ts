import type { Transacao } from '../tipos';
import { supabase } from './supabaseCliente';

/**
 * API de Transações
 * Opera sobre a tabela `transacoes` do Supabase.
 * Escopa os dados pelo usuário autenticado (`auth.uid()`).
 */
export const transacoesApi = {
  /** Retorna o id do usuário autenticado, ou null se não logado */
  async usuarioAutenticado(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },

  /** Lista todas as transações do usuário */
  async listar(): Promise<Transacao[]> {
    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao listar transações:', error);
      return [];
    }

    return data?.map((item: any): Transacao => ({
      id: item.id,
      descricao: item.descricao,
      categoria: item.categoria,
      valor: Number(item.valor),
      data: item.data,
      tipo: item.tipo,
      icone: item.categoria,
    })) ?? [];
  },

  /** Adiciona uma nova transação */
  async criar(nova: Omit<Transacao, 'id'>): Promise<boolean> {
    const usuarioId = await this.usuarioAutenticado();
    if (!usuarioId) {
      console.error('Erro ao criar transação: usuário não autenticado.');
      return false;
    }

    const { error } = await supabase.from('transacoes').insert({
      usuario_id: usuarioId,
      descricao: nova.descricao,
      categoria: nova.categoria,
      valor: nova.valor,
      data: nova.data,
      tipo: nova.tipo,
    });

    if (error) {
      console.error('Erro ao criar transação:', error);
      return false;
    }
    return true;
  },

  /** Remove uma transação pelo id */
  async remover(id: string): Promise<boolean> {
    const { error } = await supabase.from('transacoes').delete().eq('id', id);

    if (error) {
      console.error('Erro ao remover transação:', error);
      return false;
    }
    return true;
  },
};
