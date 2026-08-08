import type { Transacao } from '../tipos';
import { transacoesApi } from './transacoesApi';

/**
 * API de Relatórios
 * Funções de agregação/dashboard baseadas nas transações.
 */
export const relatoriosApi = {
  /** Calcula totais de receitas, despesas e saldo */
  calcularResumo(transacoes: Transacao[]) {
    const totalReceitas = transacoes
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);

    const totalDespesas = transacoes
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0);

    return {
      totalReceitas,
      totalDespesas,
      saldoTotal: totalReceitas - totalDespesas,
    };
  },

  /** Agrupa despesas por categoria */
  despesasPorCategoria(transacoes: Transacao[]) {
    const mapa: { [chave: string]: number } = {};
    transacoes
      .filter((t) => t.tipo === 'despesa')
      .forEach((t) => {
        mapa[t.categoria] = (mapa[t.categoria] || 0) + t.valor;
      });
    return mapa;
  },

  /** Carrega transações e já retorna o resumo (exemplo de uso da API) */
  async gerarRelatorio() {
    const transacoes = await transacoesApi.listar();
    return {
      transacoes,
      resumo: this.calcularResumo(transacoes),
    };
  },
};
