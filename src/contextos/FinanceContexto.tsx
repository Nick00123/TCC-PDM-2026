import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
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

  // Guarda o id do usuário "atual" para descartar respostas de um
  // usuário anterior (previne que dados de uma conta sobrescrevam a outra
  // ao fazer logout/login rápido — race condition).
  const userIdRef = useRef<string | null>(null);

const usuarioId = usuario?.id ?? null;

  // ── METAS ────────────────────────────────────────────────
  const carregarMetas = useCallback(async () => {
    setCarregandoMetas(true);
    const lista = await metasApi.listar();
    // Se o usuário mudou durante a busca, descarta o resultado e
    // garante que o estado de carregamento não fique travado em `true`.
    if (userIdRef.current !== usuarioId) {
      setCarregandoMetas(false);
      return;
    }
    setMetas(lista);
    setCarregandoMetas(false);
  }, [usuarioId]);

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
  const carregarTransacoes = useCallback(async () => {
    const lista = await transacoesApi.listar();
    if (userIdRef.current !== usuarioId) return;
    setTransacoes(lista);
  }, [usuarioId]);

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
    userIdRef.current = usuarioId;

    if (!usuarioId) {
      setTransacoes([]);
      setMetas([]);
      setCarregandoMetas(false);
      return;
    }
    carregarMetas();
    carregarTransacoes();
  }, [usuarioId, carregarMetas, carregarTransacoes]);

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
