import type { Meta } from '../tipos';
import { supabase } from './supabaseCliente';

/**
 * API de Metas
 * Encapsula todas as operações de CRUD da tabela `Metas`.
 */
export const metasApi = {
  /** Retorna o id do usuário autenticado, ou null se não logado */
  async usuarioAutenticado(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },

  /** Lista todas as metas do usuário (mais recentes primeiro) */
  async listar(): Promise<Meta[]> {
    const { data, error } = await supabase
      .from('Metas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar metas:', error);
      return [];
    }

    return data?.map((item: any): Meta => ({
      id: item.id,
      titulo: item.titulo,
      atual: Number(item.valor_atual),
      total: Number(item.valor_objetivo),
    })) ?? [];
  },

  /** Cria uma nova meta */
  async criar(titulo: string, total: number): Promise<boolean> {
    const usuarioId = await this.usuarioAutenticado();
    if (!usuarioId) {
      console.error('Erro ao adicionar meta: usuário não autenticado.');
      return false;
    }

    const { error } = await supabase.from('Metas').insert({
      user_id: usuarioId,
      titulo,
      valor_objetivo: total,
      valor_atual: 0,
    });

    if (error) {
      console.error('Erro ao adicionar meta:', error);
      return false;
    }
    return true;
  },

  /** Exclui uma meta pelo id */
  async excluir(id: string): Promise<boolean> {
    const { error } = await supabase.from('Metas').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir meta:', error);
      return false;
    }
    return true;
  },

  /** Deposita um valor em uma meta (soma ao valor atual) */
  async depositar(id: string, valor: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('Metas')
      .select('valor_atual')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar meta para depósito:', error);
      return false;
    }

    const novoValor = Number(data.valor_atual) + valor;

    const { error: updateError } = await supabase
      .from('Metas')
      .update({ valor_atual: novoValor })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao depositar:', updateError);
      return false;
    }
    return true;
  },
};
