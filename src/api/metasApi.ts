import type { Meta } from '../tipos';
import { formatarMoeda } from '../utils/formatacao';
import {
  endpointRest,
  headersAutenticados,
  obterUsuarioDaSessao,
} from './sessao';

export type ResultadoMeta = {
  sucesso: boolean;
  mensagem: string;
};

export type ResultadoListagemMetas = {
  dados: Meta[];
  mensagem: string;
};

/**
 * API de Metas
 * Encapsula todas as operações de CRUD da tabela `Metas`.
 */
export const metasApi = {
  /** Retorna o id do usuário autenticado, ou null se não logado */
  async usuarioAutenticado(): Promise<string | null> {
    const usuario = await obterUsuarioDaSessao();
    return usuario?.id ?? null;
  },

  /** Lista todas as metas do usuário (mais recentes primeiro) */
  async listar(): Promise<ResultadoListagemMetas> {
    try {
      const usuarioId = await this.usuarioAutenticado();

      if (!usuarioId) {
        return {
          dados: [],
          mensagem: 'Você precisa estar autenticado para carregar as metas.',
        };
      }

      const resposta = await fetch(
        endpointRest(
          `Metas?select=*&user_id=eq.${encodeURIComponent(usuarioId)}&order=created_at.desc`
        ),
        { headers: await headersAutenticados() }
      );

      if (!resposta.ok) {
        console.error('Erro ao listar metas:', await resposta.text());
        return {
          dados: [],
          mensagem: 'Não foi possível carregar as metas. Tente novamente mais tarde.',
        };
      }

      const dados = (await resposta.json()) as any[];

      return {
        dados: dados.map((item: any): Meta => ({
          id: item.id,
          titulo: item.titulo,
          atual: Number(item.valor_atual),
          total: Number(item.valor_objetivo),
        })),
        mensagem: '',
      };
    } catch (error) {
      console.error('Erro inesperado ao listar metas:', error);
      return {
        dados: [],
        mensagem: 'Não foi possível carregar as metas. Tente novamente mais tarde.',
      };
    }
  },

  /** Cria uma nova meta */
  async criar(titulo: string, total: number): Promise<ResultadoMeta> {
    const usuarioId = await this.usuarioAutenticado();
    if (!usuarioId) {
      console.error('Erro ao adicionar meta: usuário não autenticado.');
      return {
        sucesso: false,
        mensagem: 'Você precisa estar autenticado para criar uma meta.',
      };
    }

    try {
      const resposta = await fetch(endpointRest('Metas'), {
        method: 'POST',
        headers: await headersAutenticados(),
        body: JSON.stringify({
          user_id: usuarioId,
          titulo,
          valor_objetivo: total,
          valor_atual: 0,
        }),
      });

      if (!resposta.ok) {
        console.error('Erro ao adicionar meta:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível criar a meta. Tente novamente.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao adicionar meta:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível criar a meta. Tente novamente.',
      };
    }
  },

  /** Exclui uma meta pelo id */
  async excluir(id: string): Promise<ResultadoMeta> {
    try {
      const usuarioId = await this.usuarioAutenticado();

      if (!usuarioId) {
        return {
          sucesso: false,
          mensagem: 'Você precisa estar autenticado para excluir uma meta.',
        };
      }

      const resposta = await fetch(
        endpointRest(
          `Metas?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(usuarioId)}`
        ),
        {
          method: 'DELETE',
          headers: await headersAutenticados(),
        }
      );

      if (!resposta.ok) {
        console.error('Erro ao excluir meta:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível excluir a meta. Tente novamente.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao excluir meta:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível excluir a meta. Tente novamente.',
      };
    }
  },

  /** Deposita um valor em uma meta (soma ao valor atual) */
  async depositar(id: string, valor: number): Promise<ResultadoMeta> {
    if (!Number.isFinite(valor) || valor <= 0) {
      return { sucesso: false, mensagem: 'Informe um valor maior que zero.' };
    }

    const usuarioId = await this.usuarioAutenticado();

    if (!usuarioId) {
      return {
        sucesso: false,
        mensagem: 'Você precisa estar autenticado para depositar em uma meta.',
      };
    }

    try {
      const consulta = await fetch(
        endpointRest(
          `Metas?select=valor_atual,valor_objetivo&id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(usuarioId)}`
        ),
        { headers: await headersAutenticados() }
      );

      if (!consulta.ok) {
        console.error('Erro ao buscar meta para depósito:', await consulta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível consultar a meta. Tente novamente.',
        };
      }

      const registros = (await consulta.json()) as any[];
      const data = registros[0];

      if (!data) {
        return {
          sucesso: false,
          mensagem: 'Não foi possível consultar a meta. Tente novamente.',
        };
      }

    const valorAtual = Number(data.valor_atual);
    const valorObjetivo = Number(data.valor_objetivo);
    const restante = valorObjetivo - valorAtual;

    if (restante <= 0) {
      return { sucesso: false, mensagem: 'Esta meta já foi concluída.' };
    }

    if (valor > restante) {
      return {
        sucesso: false,
        mensagem: `Faltam R$ ${formatarMoeda(restante)} para concluir esta meta.`,
      };
    }

    const novoValor = valorAtual + valor;

      const resposta = await fetch(
        endpointRest(
          `Metas?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(usuarioId)}`
        ),
        {
          method: 'PATCH',
          headers: await headersAutenticados(),
          body: JSON.stringify({ valor_atual: novoValor }),
        }
      );

      if (!resposta.ok) {
        console.error('Erro ao depositar:', await resposta.text());
        return {
          sucesso: false,
          mensagem: 'Não foi possível realizar o depósito. Tente novamente.',
        };
      }

      return { sucesso: true, mensagem: '' };
    } catch (error) {
      console.error('Erro inesperado ao depositar:', error);
      return {
        sucesso: false,
        mensagem: 'Não foi possível realizar o depósito. Tente novamente.',
      };
    }
  },
};
