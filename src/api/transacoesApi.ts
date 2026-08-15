import type { Transacao } from '../tipos';
import {
  endpointRest,
  headersAutenticados,
  obterUsuarioDaSessao,
} from './sessao';

export type ResultadoTransacao = {
  sucesso: boolean;
  mensagem: string;
};

export type ResultadoListagemTransacoes = {
  dados: Transacao[];
  mensagem: string;
};

/**
 * API de Transações
 * Opera sobre a tabela `transacoes` do Supabase.
 * Escopa os dados pelo usuário autenticado (`auth.uid()`).
 */
export const transacoesApi = {
  /** Retorna o id do usuário autenticado, ou null se não logado */
  async usuarioAutenticado(): Promise<string | null> {
    const usuario = await obterUsuarioDaSessao();
    return usuario?.id ?? null;
  },

  /** Lista todas as transações do usuário */
  async listar(): Promise<ResultadoListagemTransacoes> {
    try {
      const usuarioId = await this.usuarioAutenticado();

      if (!usuarioId) {
        return {
          dados: [],
          mensagem: 'Você precisa estar autenticado para carregar as transações.',
        };
      }

      const resposta = await fetch(
        endpointRest(
          `transacoes?select=*&usuario_id=eq.${encodeURIComponent(usuarioId)}&order=data.desc`
        ),
        { headers: await headersAutenticados() }
      );

      if (!resposta.ok) {
        console.error('Erro ao listar transações:', await resposta.text());
        return {
          dados: [],
          mensagem: 'Não foi possível carregar as transações. Tente novamente.',
        };
      }

      const lista = (await resposta.json()) as any[];
      const dados = lista.map((item: any): Transacao => ({
        id: item.id,
        descricao: item.descricao,
        categoria: item.categoria,
        valor: Number(item.valor),
        data: item.data,
        tipo: item.tipo,
      }));

      return { dados, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao listar transações:', error);
      return {
        dados: [],
        mensagem: 'Não foi possível carregar as transações. Tente novamente.',
      };
    }
  },

  /** Adiciona uma nova transação */
  async criar(nova: Omit<Transacao, 'id'>): Promise<ResultadoTransacao> {
    const usuarioId = await this.usuarioAutenticado();
    if (!usuarioId) {
      console.error('Erro ao criar transação: usuário não autenticado.');
      return {
        sucesso: false,
        mensagem: 'Você precisa estar autenticado para adicionar uma transação.',
      };
    }

    try {
      const resposta = await fetch(endpointRest('transacoes'), {
        method: 'POST',
        headers: await headersAutenticados(),
        body: JSON.stringify({
          usuario_id: usuarioId,
          descricao: nova.descricao,
          categoria: nova.categoria,
          valor: nova.valor,
          data: nova.data,
          tipo: nova.tipo,
        }),
      });

      if (!resposta.ok) {
        console.error('Erro ao criar transação:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível adicionar a transação. Tente novamente.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao criar transação:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível adicionar a transação. Tente novamente.',
      };
    }
  },

  /** Remove uma transação pelo id */
  async remover(id: string): Promise<ResultadoTransacao> {
    try {
      const usuarioId = await this.usuarioAutenticado();

      if (!usuarioId) {
        return {
          sucesso: false,
          mensagem: 'Você precisa estar autenticado para excluir uma transação.',
        };
      }

      const resposta = await fetch(
        endpointRest(
          `transacoes?id=eq.${encodeURIComponent(id)}&usuario_id=eq.${encodeURIComponent(usuarioId)}`
        ),
        {
          method: 'DELETE',
          headers: await headersAutenticados(),
        }
      );

      if (!resposta.ok) {
        console.error('Erro ao remover transação:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível excluir a transação. Tente novamente.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao remover transação:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível excluir a transação. Tente novamente.',
      };
    }
  },
};
