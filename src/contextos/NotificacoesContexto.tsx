import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { notificacoesApi } from '../api/notificacoesApi';
import type { Meta, Notificacao, Transacao } from '../tipos';
import { useAuth } from './AuthContexto';

type NotificacoesContextoType = {
  notificacoes: Notificacao[];
  naoLidas: number;
  carregando: boolean;
  recarregar: () => Promise<void>;
  marcarLida: (id: string) => Promise<void>;
  marcarTodasLidas: () => Promise<void>;
  excluir: (id: string) => Promise<void>;
};

const NotificacoesContexto = createContext<NotificacoesContextoType>(
  {} as NotificacoesContextoType
);

export const useNotificacoes = () => useContext(NotificacoesContexto);

type Props = {
  children: ReactNode;
  metas: Meta[];
  transacoes: Transacao[];
};

export function NotificacoesProvider({ children, metas, transacoes }: Props) {
  const { usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Guarda o id do usuário atual para descartar respostas antigas
  const userIdRef = useRef<string | null>(null);
  // Evita disparar notificações automáticas repetidas
  const metasAvisadasRef = useRef<Set<string>>(new Set());
  const avisouDespesaRef = useRef(false);

  async function recarregar() {
    const lista = await notificacoesApi.listar();
    if (userIdRef.current !== usuario?.id) return;
    setNotificacoes(lista);
    setCarregando(false);
  }

  // Carrega notificações quando o usuário muda
  useEffect(() => {
    userIdRef.current = usuario?.id ?? null;
    if (!usuario?.id) {
      setNotificacoes([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    recarregar();
    return () => {
      userIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  // Gera notificações automáticas com base em metas e transações
  useEffect(() => {
    if (!usuario?.id) return;
    if (carregando) return;

    // 1) Meta concluída
    metas
      .filter((m: Meta) => m.atual >= m.total && !metasAvisadasRef.current.has(m.id))
      .forEach((m: Meta) => {
        metasAvisadasRef.current.add(m.id);
        notificacoesApi.criar({
          titulo: '🎉 Meta concluída!',
          mensagem: `Parabéns! Você alcançou a meta "${m.titulo}".`,
          tipo: 'meta',
        }).then(() => recarregar());
      });

    // 2) Despesas maiores que receitas
    const totalReceitas = transacoes
      .filter((t: Transacao) => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);
    const totalDespesas = transacoes
      .filter((t: Transacao) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0);

    if (totalDespesas > totalReceitas && !avisouDespesaRef.current) {
      avisouDespesaRef.current = true;
      notificacoesApi.criar({
        titulo: '⚠️ Atenção aos gastos',
        mensagem: 'Suas despesas estão maiores que suas receitas. Considere revisar seu orçamento.',
        tipo: 'alerta',
      }).then(() => recarregar());
    } else if (totalDespesas <= totalReceitas) {
      avisouDespesaRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas, transacoes, carregando, usuario?.id]);

  async function marcarLida(id: string) {
    const ok = await notificacoesApi.marcarLida(id);
    if (ok) await recarregar();
  }

  async function marcarTodasLidas() {
    const ok = await notificacoesApi.marcarTodasLidas();
    if (ok) await recarregar();
  }

  async function excluir(id: string) {
    const ok = await notificacoesApi.excluir(id);
    if (ok) await recarregar();
  }

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <NotificacoesContexto.Provider
      value={{
        notificacoes,
        naoLidas,
        carregando,
        recarregar,
        marcarLida,
        marcarTodasLidas,
        excluir,
      }}
    >
      {children}
    </NotificacoesContexto.Provider>
  );
}
