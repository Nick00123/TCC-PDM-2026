import type { Usuario } from '../tipos';
import { supabase } from './supabaseCliente';

/**
 * API de Perfil
 * Opera sobre a tabela `perfis` do Supabase.
 */
export const perfilApi = {
  /** Busca o perfil de um usuário */
  async buscar(usuarioId: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', usuarioId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

return {
      id: data.id,
      nome: data.nome,
      email: data.id,
      rendaMensal: Number(data.renda_mensal),
      plano: data.plano,
    };
  },

  /** Atualiza dados do perfil */
  async atualizar(
    usuarioId: string,
    dados: Partial<Pick<Usuario, 'nome' | 'rendaMensal' | 'plano'>>
  ): Promise<boolean> {
    const { error } = await supabase.from('perfis').update({
      ...(dados.nome !== undefined && { nome: dados.nome }),
      ...(dados.rendaMensal !== undefined && { renda_mensal: dados.rendaMensal }),
      ...(dados.plano !== undefined && { plano: dados.plano }),
    }).eq('id', usuarioId);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
    return true;
  },
};
