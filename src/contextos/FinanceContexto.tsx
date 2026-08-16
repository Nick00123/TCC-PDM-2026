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
import type { ResultadoMeta } from '../api/metasApi';
import { transacoesApi } from '../api/transacoesApi';
import type { ResultadoTransacao } from '../api/transacoesApi';
import type { Meta, Transacao } from '../tipos';
import { useAuth } from './AuthContexto';

type FinanceContextoType = {
  transacoes: Transacao[];
  transacoesUsuarioId: string | null;
  carregandoTransacoes: boolean;
  erroTransacoes: string | null;
  metas: Meta[];
  metasUsuarioId: string | null;
  carregandoMetas: boolean;
  erroMetas: string | null;

  adicionarTransacao: (t: Omit<Transacao, 'id'>) => Promise<ResultadoTransacao>;
  removerTransacao: (id: string) => Promise<ResultadoTransacao>;

  adicionarMeta: (titulo: string, total: number) => Promise<ResultadoMeta>;
  excluirMeta: (id: string) => Promise<ResultadoMeta>;
  depositar: (id: string, valor: number) => Promise<ResultadoMeta>;

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
  const [transacoesUsuarioId, setTransacoesUsuarioId] = useState<string | null>(null);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [erroTransacoes, setErroTransacoes] = useState<string | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metasUsuarioId, setMetasUsuarioId] = useState<string | null>(null);
  const [carregandoMetas, setCarregandoMetas] = useState(true);
  const [erroMetas, setErroMetas] = useState<string | null>(null);

  // Guarda o id do usuário "atual" para descartar respostas de um
  // usuário anterior (previne que dados de uma conta sobrescrevam a outra
  // ao fazer logout/login rápido — race condition).
  const userIdRef = useRef<string | null>(null);

const usuarioId = usuario?.id ?? null;

  // ── METAS ────────────────────────────────────────────────
  const carregarMetas = useCallback(async () => {
    setCarregandoMetas(true);
    const resultado = await metasApi.listar();
    // Se o usuário mudou durante a busca, descarta o resultado e
    // não altera o carregamento que agora pertence à nova conta.
    if (userIdRef.current !== usuarioId) {
      return;
    }
    if (resultado.mensagem) {
      setErroMetas(resultado.mensagem);
    } else {
      setMetas(resultado.dados);
      setMetasUsuarioId(usuarioId);
      setErroMetas(null);
    }
    setCarregandoMetas(false);
  }, [usuarioId]);

  async function adicionarMeta(titulo: string, total: number) {
    const resultado = await metasApi.criar(titulo, total);
    if (resultado.sucesso) await carregarMetas();
    return resultado;
  }

  async function excluirMeta(id: string) {
    const resultado = await metasApi.excluir(id);
    if (resultado.sucesso) await carregarMetas();
    return resultado;
  }

  async function depositar(id: string, valor: number) {
    const resultado = await metasApi.depositar(id, valor);
    if (resultado.sucesso) await carregarMetas();
    return resultado;
  }

  // ── TRANSAÇÕES ───────────────────────────────────────────
  const carregarTransacoes = useCallback(async () => {
    setCarregandoTransacoes(true);
    const resultado = await transacoesApi.listar();
    if (userIdRef.current !== usuarioId) return;
    if (resultado.mensagem) {
      setErroTransacoes(resultado.mensagem);
    } else {
      setTransacoes(resultado.dados);
      setTransacoesUsuarioId(usuarioId);
      setErroTransacoes(null);
    }
    setCarregandoTransacoes(false);
  }, [usuarioId]);

  async function adicionarTransacao(t: Omit<Transacao, 'id'>) {
    const resultado = await transacoesApi.criar(t);
    if (resultado.sucesso) await carregarTransacoes();
    return resultado;
  }

  async function removerTransacao(id: string) {
    const resultado = await transacoesApi.remover(id);
    if (resultado.sucesso) await carregarTransacoes();
    return resultado;
  }

  // Carrega dados quando o usuário autenticado muda (login/logout)
  useEffect(() => {
    userIdRef.current = usuarioId;
    setTransacoesUsuarioId(null);
    setMetasUsuarioId(null);
    setTransacoes([]);
    setMetas([]);
    setErroTransacoes(null);
    setErroMetas(null);

    if (!usuarioId) {
      setCarregandoTransacoes(false);
      setCarregandoMetas(false);
      return;
    }

    setCarregandoTransacoes(true);
    setCarregandoMetas(true);
    carregarMetas();
    carregarTransacoes();
  }, [usuarioId, carregarMetas, carregarTransacoes]);

  // ── RESUMO ───────────────────────────────────────────────
  const transacoesPublicadas =
    transacoesUsuarioId === usuarioId ? transacoes : [];
  const metasPublicadas =
    metasUsuarioId === usuarioId ? metas : [];

  const totalReceitas = transacoesPublicadas
    .filter((transacao) => transacao.tipo === 'receita')
    .reduce((total, transacao) => total + transacao.valor, 0);

  const totalDespesas = transacoesPublicadas
    .filter((transacao) => transacao.tipo === 'despesa')
    .reduce((total, transacao) => total + transacao.valor, 0);

  const saldoTotal = totalReceitas - totalDespesas;

  return (
    <FinanceContexto.Provider
      value={{
        transacoes: transacoesPublicadas,
        transacoesUsuarioId,
        carregandoTransacoes,
        erroTransacoes,
        metas: metasPublicadas,
        metasUsuarioId,

        adicionarTransacao,
        removerTransacao,

        adicionarMeta,
        excluirMeta,
        depositar,
        carregandoMetas,
        erroMetas,

        saldoTotal,
        totalReceitas,
        totalDespesas,
      }}
    >
      {children}
    </FinanceContexto.Provider>
  );
}
