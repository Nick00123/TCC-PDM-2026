import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { metasApi } from '../api/metasApi';
import { relatoriosApi } from '../api/relatoriosApi';
import { transacoesApi } from '../api/transacoesApi';
import type { Meta, Transacao } from '../tipos';
import { useAuth } from './AuthContexto';

type FinanceContextoType = {
  transacoes: Transacao[];
  metas: Meta[];
  carregandoMetas: boolean;

  adicionarTransacao: (t: Omit<Transacao, 'id'>) => Promise<void>;
  removerTransacao: (id: string) => Promise<void>;

  carregarTransacoes: () => Promise<void>;
  adicionarMeta: (titulo: string, total: number) => Promise<void>;
  excluirMeta: (id: string) => Promise<void>;
  depositar: (id: string, valor: number) => Promise<void>;
  carregarMetas: () => Promise<void>;

  saldoTotal: number;
  totalReceitas: number;
  totalDespesas: number;
};

const FinanceContexto = createContext<FinanceContextoType>(
  {} as FinanceContextoType
);

export const useFinance = () => useContext(FinanceContexto);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregandoMetas, setCarregandoMetas] = useState(true);

  // ── METAS ────────────────────────────────────────────────
  async function carregarMetas() {
    setCarregandoMetas(true);
    const lista = await metasApi.listar();
    setMetas(lista);
    setCarregandoMetas(false);
  }

  async function adicionarMeta(titulo: string, total: number) {
    await metasApi.criar(titulo, total);
    await carregarMetas();
  }

  async function excluirMeta(id: string) {
    await metasApi.excluir(id);
    await carregarMetas();
  }

  async function depositar(id: string, valor: number) {
    await metasApi.depositar(id, valor);
    await carregarMetas();
  }

  // ── TRANSAÇÕES ───────────────────────────────────────────
  async function carregarTransacoes() {
    const lista = await transacoesApi.listar();
    setTransacoes(lista);
  }

  async function adicionarTransacao(t: Omit<Transacao, 'id'>) {
    const ok = await transacoesApi.criar(t);
    if (ok) await carregarTransacoes();
  }

  async function removerTransacao(id: string) {
    const ok = await transacoesApi.remover(id);
    if (ok) await carregarTransacoes();
  }

  // Carrega dados quando o usuário autenticado muda (login/logout)
  useEffect(() => {
    if (!usuario?.id) {
      setTransacoes([]);
      setMetas([]);
      setCarregandoMetas(false);
      return;
    }
    carregarMetas();
    carregarTransacoes();
  }, [usuario?.id]);

  // ── RESUMO ───────────────────────────────────────────────
  const { totalReceitas, totalDespesas, saldoTotal } =
    relatoriosApi.calcularResumo(transacoes);

  return (
    <FinanceContexto.Provider
      value={{
        transacoes,
        metas,

        adicionarTransacao,
        removerTransacao,

        carregarTransacoes,
        adicionarMeta,
        excluirMeta,
        depositar,
        carregarMetas,

        carregandoMetas,

        saldoTotal,
        totalReceitas,
        totalDespesas,
      }}
    >
      {children}
    </FinanceContexto.Provider>
  );
}
