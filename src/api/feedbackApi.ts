import { supabase } from './supabaseCliente';

export type CategoriaFeedback = 'sugestao' | 'bug' | 'elogio';

export type Feedback = {
  id: string;
  usuario_id: string;
  mensagem: string;
  categoria: CategoriaFeedback;
  criada_em: string;
};

/**
 * API de Feedback / Sugestões
 * Opera sobre a tabela `feedback` do Supabase.
 * Usuários podem enviar mensagens; desenvolvedores as leem via painel.
 */
export const feedbackApi = {
  /** Retorna o id do usuário autenticado, ou null se não logado */
  async usuarioAutenticado(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },

  /**
   * Envia um feedback do usuário.
   * Retorna { sucesso: boolean; mensagem: string }.
   */
  async enviar(
    mensagem: string,
    categoria: CategoriaFeedback = 'sugestao'
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const texto = mensagem.trim();
    if (!texto) {
      return { sucesso: false, mensagem: 'Escreva algo antes de enviar.' };
    }

    const usuarioId = await this.usuarioAutenticado();
    if (!usuarioId) {
      return {
        sucesso: false,
        mensagem: 'Você precisa estar logado para enviar feedback.',
      };
    }

    const { error } = await supabase.from('feedback').insert({
      usuario_id: usuarioId,
      mensagem: texto,
      categoria,
    });

    if (error) {
      console.error('Erro ao enviar feedback:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível enviar. Tente novamente.',
      };
    }

    return { sucesso: true, mensagem: 'Feedback enviado! Obrigado pela contribuição.' };
  },

  /** Lista os feedbacks do próprio usuário (opcional) */
  async listarMeus(): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('criada_em', { ascending: false });

    if (error) {
      console.error('Erro ao listar feedbacks:', error);
      return [];
    }

    return (
      data?.map((item: any): Feedback => ({
        id: item.id,
        usuario_id: item.usuario_id,
        mensagem: item.mensagem,
        categoria: item.categoria,
        criada_em: item.criada_em,
      })) ?? []
    );
  },
};
