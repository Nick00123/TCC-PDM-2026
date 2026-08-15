import type { Notificacao } from '../tipos';
import {
  endpointRest,
  headersAutenticados,
  obterUsuarioDaSessao,
} from './sessao';

type NovaNotificacao = {
  titulo: string;
  mensagem: string;
  tipo: Notificacao['tipo'];

  // Identifica um evento que não pode gerar
  // a mesma notificação duas vezes.
  chaveEvento?: string;
};

export type ResultadoNotificacao = {
  sucesso: boolean;
  mensagem: string;
};

export type ResultadoListagemNotificacoes = {
  dados: Notificacao[];
  mensagem: string;
};

export const notificacoesApi = {

  /**
   * Retorna o id do usuário autenticado.
   */
  async usuarioAutenticado(): Promise<string | null> {
    const usuario = await obterUsuarioDaSessao();
    return usuario?.id ?? null;
  },

  /**
   * Lista as notificações do usuário.
   */
  async listar(usuarioId: string): Promise<ResultadoListagemNotificacoes> {
    try {
      const resposta = await fetch(
        endpointRest(
          `notificacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=criada_em.desc&limit=50`
        ),
        { headers: await headersAutenticados() }
      );

      if (!resposta.ok) {
        console.error('Erro ao listar notificações:', await resposta.text());
        return {
          dados: [],
          mensagem: 'Não foi possível carregar as notificações. Tente novamente mais tarde.',
        };
      }

      const dados = (await resposta.json()) as any[];

      return {
        dados: dados.map(
          (item: any): Notificacao => ({
            id: item.id,
            titulo: item.titulo,
            mensagem: item.mensagem,
            tipo: item.tipo,
            lida: item.lida,
            criadaEm: item.criada_em,
          })
        ),
        mensagem: '',
      };
    } catch (error) {
      console.error('Erro inesperado ao listar notificações:', error);
      return {
        dados: [],
        mensagem: 'Não foi possível carregar as notificações. Tente novamente mais tarde.',
      };
    }
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

    try {
      const resposta = await fetch(
        endpointRest('notificacoes?on_conflict=usuario_id,chave_evento'),
        {
          method: 'POST',
          headers: {
            ...(await headersAutenticados()),
            Prefer: 'resolution=ignore-duplicates,return=minimal',
          },
          body: JSON.stringify(registro),
        }
      );

      if (!resposta.ok) {
        console.error('Erro ao criar notificação:', await resposta.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro inesperado ao criar notificação:', error);
      return false;
    }
  },

  /**
   * Marca uma notificação como lida.
   */
  async marcarLida(
    id: string
  ): Promise<ResultadoNotificacao> {

    try {
      const usuarioId = await this.usuarioAutenticado();

      if (!usuarioId) {
        return {
          sucesso: false,
          mensagem: 'Você precisa estar autenticado para alterar a notificação.',
        };
      }

      const resposta = await fetch(
        endpointRest(
          `notificacoes?id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`
        ),
        {
          method: 'PATCH',
          headers: await headersAutenticados(),
          body: JSON.stringify({ lida: true }),
        }
      );

      if (!resposta.ok) {
        console.error('Erro ao marcar notificação como lida:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível marcar a notificação como lida.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao marcar notificação como lida:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível marcar a notificação como lida.',
      };
    }
  },

  /**
   * Marca todas as notificações do usuário como lidas.
   *
   * O RLS garante que somente as notificações
   * do usuário autenticado sejam alteradas.
   */
  async marcarTodasLidas(): Promise<ResultadoNotificacao> {

    try {
      const usuarioId = await this.usuarioAutenticado();

      if (!usuarioId) {
        return {
          sucesso: false,
          mensagem: 'Você precisa estar autenticado para alterar as notificações.',
        };
      }

      const resposta = await fetch(
        endpointRest(
          `notificacoes?lida=eq.false&usuario_id=eq.${encodeURIComponent(usuarioId)}`
        ),
        {
          method: 'PATCH',
          headers: await headersAutenticados(),
          body: JSON.stringify({ lida: true }),
        }
      );

      if (!resposta.ok) {
        console.error('Erro ao marcar todas como lidas:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível marcar todas as notificações como lidas.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao marcar todas como lidas:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível marcar todas as notificações como lidas.',
      };
    }
  },

  /**
   * Exclui uma notificação.
   */
  async excluir(
    id: string
  ): Promise<ResultadoNotificacao> {

    try {
      const usuarioId = await this.usuarioAutenticado();

      if (!usuarioId) {
        return {
          sucesso: false,
          mensagem: 'Você precisa estar autenticado para excluir a notificação.',
        };
      }

      const resposta = await fetch(
        endpointRest(
          `notificacoes?id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`
        ),
        {
          method: 'DELETE',
          headers: await headersAutenticados(),
        }
      );

      if (!resposta.ok) {
        console.error('Erro ao excluir notificação:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível excluir a notificação.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao excluir notificação:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível excluir a notificação.',
      };
    }
  },
};
