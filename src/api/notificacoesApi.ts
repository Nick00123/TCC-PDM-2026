import type { Notificacao } from '../tipos';
import { supabase } from './supabaseCliente';

type NovaNotificacao = {
  titulo: string;
  mensagem: string;
  tipo: Notificacao['tipo'];
};

/**
 * API de Notificações
 * Opera sobre a tabela `notificacoes` do Supabase.
 * Escopa os dados pelo usuário autenticado (`auth.uid()`).
 */
export const notificacoesApi = {
  /** Retorna o id do usuário autenticado, ou null se não logado */
  async usuarioAutenticado(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },

  /** Lista as notificações do usuário (mais recentes primeiro) */
  async listar(): Promise<Notificacao[]> {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .order('criada_em', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Erro ao listar notificações:', error);
      return [];
    }

    return data?.map((item: any): Notificacao => ({
      id: item.id,
      titulo: item.titulo,
      mensagem: item.mensagem,
      tipo: item.tipo,
      lida: item.lida,
      criadaEm: item.criada_em,
    })) ?? [];
  },

  /** Cria uma nova notificação para o usuário autenticado */
  async criar(nova: NovaNotificacao): Promise<boolean> {
    const usuarioId = await this.usuarioAutenticado();
    if (!usuarioId) {
      console.error('Erro ao criar notificação: usuário não autenticado.');
      return false;
    }

    const { error } = await supabase.from('notificacoes').insert({
      usuario_id: usuarioId,
      titulo: nova.titulo,
      mensagem: nova.mensagem,
      tipo: nova.tipo,
      lida: false,
    });

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return false;
    }
    return true;
  },

  /** Cria várias notificações de uma vez (ex.: boas-vindas) */
  async criarVarias(novas: NovaNotificacao[]): Promise<boolean> {
    const usuarioId = await this.usuarioAutenticado();
    if (!usuarioId) {
      console.error('Erro ao criar notificações: usuário não autenticado.');
      return false;
    }

    const linhas = novas.map((n) => ({
      usuario_id: usuarioId,
      titulo: n.titulo,
      mensagem: n.mensagem,
      tipo: n.tipo,
      lida: false,
    }));

    const { error } = await supabase.from('notificacoes').insert(linhas);

    if (error) {
      console.error('Erro ao criar notificações:', error);
      return false;
    }
    return true;
  },

  /** Marca uma notificação como lida */
  async marcarLida(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);

    if (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
    return true;
  },

  /** Marca todas as notificações como lidas */
  async marcarTodasLidas(): Promise<boolean> {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('lida', false);

    if (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      return false;
    }
    return true;
  },

  /** Exclui uma notificação pelo id */
  async excluir(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir notificação:', error);
      return false;
    }
    return true;
  },
};
