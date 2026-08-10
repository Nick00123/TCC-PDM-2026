import type { Notificacao } from '../tipos';
import { supabase } from './supabaseCliente';

type NovaNotificacao = {
  titulo: string;
  mensagem: string;
  tipo: Notificacao['tipo'];

  // Identifica um evento que não pode gerar
  // a mesma notificação duas vezes.
  chaveEvento?: string;
};

export const notificacoesApi = {

  /**
   * Retorna o id do usuário autenticado.
   */
  async usuarioAutenticado(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error(
        'Erro ao obter usuário autenticado:',
        error
      );

      return null;
    }

    return data.user?.id ?? null;
  },

  /**
   * Lista as notificações do usuário.
   */
  async listar(): Promise<Notificacao[]> {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .order('criada_em', {
        ascending: false,
      })
      .limit(50);

    if (error) {
      console.error(
        'Erro ao listar notificações:',
        error
      );

      return [];
    }

    return (
      data?.map(
        (item: any): Notificacao => ({
          id: item.id,
          titulo: item.titulo,
          mensagem: item.mensagem,
          tipo: item.tipo,
          lida: item.lida,
          criadaEm: item.criada_em,
        })
      ) ?? []
    );
  },

  /**
   * Cria uma notificação.
   *
   * Quando chaveEvento é informada, o banco garante
   * que o mesmo evento não seja inserido duas vezes.
   */
  async criar(
    nova: NovaNotificacao
  ): Promise<boolean> {

    const usuarioId =
      await this.usuarioAutenticado();

    if (!usuarioId) {
      console.error(
        'Erro ao criar notificação: usuário não autenticado.'
      );

      return false;
    }

    const registro = {
      usuario_id: usuarioId,
      titulo: nova.titulo,
      mensagem: nova.mensagem,
      tipo: nova.tipo,
      lida: false,
      chave_evento: nova.chaveEvento ?? null,
    };

    const { error } = await supabase
      .from('notificacoes')
      .upsert(
        registro,
        {
          onConflict: 'usuario_id,chave_evento',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error(
        'Erro ao criar notificação:',
        error
      );

      return false;
    }

    return true;
  },

  /**
   * Cria várias notificações de uma vez.
   */
  async criarVarias(
    novas: NovaNotificacao[]
  ): Promise<boolean> {

    const usuarioId =
      await this.usuarioAutenticado();

    if (!usuarioId) {
      console.error(
        'Erro ao criar notificações: usuário não autenticado.'
      );

      return false;
    }

    const linhas = novas.map((n) => ({
      usuario_id: usuarioId,
      titulo: n.titulo,
      mensagem: n.mensagem,
      tipo: n.tipo,
      lida: false,
      chave_evento: n.chaveEvento ?? null,
    }));

    const { error } = await supabase
      .from('notificacoes')
      .upsert(
        linhas,
        {
          onConflict: 'usuario_id,chave_evento',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error(
        'Erro ao criar notificações:',
        error
      );

      return false;
    }

    return true;
  },

  /**
   * Marca uma notificação como lida.
   */
  async marcarLida(
    id: string
  ): Promise<boolean> {

    const { error } = await supabase
      .from('notificacoes')
      .update({
        lida: true,
      })
      .eq('id', id);

    if (error) {
      console.error(
        'Erro ao marcar notificação como lida:',
        error
      );

      return false;
    }

    return true;
  },

  /**
   * Marca todas as notificações do usuário como lidas.
   *
   * O RLS garante que somente as notificações
   * do usuário autenticado sejam alteradas.
   */
  async marcarTodasLidas(): Promise<boolean> {

    const { error } = await supabase
      .from('notificacoes')
      .update({
        lida: true,
      })
      .eq('lida', false);

    if (error) {
      console.error(
        'Erro ao marcar todas como lidas:',
        error
      );

      return false;
    }

    return true;
  },

  /**
   * Exclui uma notificação.
   */
  async excluir(
    id: string
  ): Promise<boolean> {

    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Erro ao excluir notificação:',
        error
      );

      return false;
    }

    return true;
  },
};