import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { notificacoesApi } from '../api/notificacoesApi';

import type {
  Meta,
  Notificacao,
  Transacao,
} from '../tipos';

import { useAuth } from './AuthContexto';


type NotificacoesContextoType = {
  notificacoes: Notificacao[];
  naoLidas: number;
  carregando: boolean;

  recarregar: () => Promise<void>;

  marcarLida: (
    id: string
  ) => Promise<void>;

  marcarTodasLidas: () => Promise<void>;

  excluir: (
    id: string
  ) => Promise<void>;
};


const NotificacoesContexto =
  createContext(
    {} as NotificacoesContextoType
  );


export const useNotificacoes =
  () => useContext(NotificacoesContexto);


type Props = {
  children: ReactNode;
  metas: Meta[];
  transacoes: Transacao[];
};


export function NotificacoesProvider({
  children,
  metas,
  transacoes,
}: Props) {

  const { usuario } = useAuth();

  const [
    notificacoes,
    setNotificacoes,
  ] = useState<Notificacao[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);


  /*
   * Guarda o usuário atual.
   *
   * Isso evita que uma resposta antiga de uma conta
   * sobrescreva os dados de outra conta.
   */
  const userIdRef =
    useRef<string | null>(null);


  /*
   * Guarda quais metas já foram processadas
   * durante a execução atual do aplicativo.
   *
   * A proteção REAL contra duplicação fica no banco,
   * através da chave_evento.
   */
  const metasAvisadasRef =
    useRef<Set<string>>(new Set());


  /*
   * Controle da notificação de despesas maiores
   * que receitas.
   */
  const avisouDespesaRef =
    useRef(false);


  /*
   * Impede que duas verificações automáticas
   * sejam executadas simultaneamente.
   */
  const verificandoRef =
    useRef(false);


  /*
   * Recarrega as notificações do usuário.
   *
   * useCallback é usado para que a função tenha
   * uma referência estável e possa ser usada
   * corretamente como dependência dos useEffects.
   */
  const recarregar = useCallback(
    async () => {

      const usuarioAtual =
        usuario?.id ?? null;


      if (!usuarioAtual) {
        setNotificacoes([]);
        return;
      }


      const lista =
        await notificacoesApi.listar();


      /*
       * Se o usuário mudou enquanto a consulta
       * estava acontecendo, descarta a resposta.
       */
      if (
        userIdRef.current !== usuarioAtual
      ) {
        return;
      }


      setNotificacoes(lista);

    },
    [usuario?.id]
  );


  /*
   * Carrega as notificações quando o usuário
   * entra ou sai da conta.
   */
  useEffect(() => {

    const usuarioId =
      usuario?.id ?? null;


    userIdRef.current =
      usuarioId;


    /*
     * Ao trocar de usuário, limpamos os controles
     * temporários da conta anterior.
     */
    metasAvisadasRef.current.clear();

    avisouDespesaRef.current = false;

    verificandoRef.current = false;


    if (!usuarioId) {

      setNotificacoes([]);

      setCarregando(false);

      return;
    }


    let ativo = true;


    setCarregando(true);


    async function carregar() {

      const lista =
        await notificacoesApi.listar();


      if (!ativo) {
        return;
      }


      if (
        userIdRef.current !== usuarioId
      ) {
        return;
      }


      setNotificacoes(lista);

      setCarregando(false);
    }


    carregar();


    return () => {
      ativo = false;
    };

  }, [usuario?.id]);


  /*
   * Verifica e cria notificações automáticas.
   */
  useEffect(() => {

    if (!usuario?.id) {
      return;
    }


    /*
     * Ainda estamos carregando as notificações
     * iniciais.
     */
    if (carregando) {
      return;
    }


    /*
     * Evita duas verificações simultâneas.
     */
    if (verificandoRef.current) {
      return;
    }


    verificandoRef.current = true;


    async function verificarNotificacoes() {

      try {

        /*
         * ====================================================
         * 1. METAS CONCLUÍDAS
         * ====================================================
         */

        const metasConcluidas =
          metas.filter(
            (m: Meta) =>
              m.atual >= m.total
          );


        for (
          const meta of metasConcluidas
        ) {

          /*
           * Chave permanente do evento.
           *
           * Exemplo:
           *
           * meta_concluida:550e8400-e29b-41d4-a716-446655440000
           *
           * Essa chave é o que impede a duplicação
           * mesmo depois de fechar e abrir o aplicativo.
           */
          const chaveEvento =
            `meta_concluida:${meta.id}`;


          /*
           * Se já verificamos essa meta nesta
           * execução do aplicativo, não precisamos
           * mandar outra requisição.
           */
          if (
            metasAvisadasRef.current.has(
              meta.id
            )
          ) {
            continue;
          }


          console.log(
            '🔔 Verificando meta concluída:',
            meta.titulo
          );


          const criada =
            await notificacoesApi.criar({

              titulo:
                '🎉 Meta concluída!',

              mensagem:
                `Parabéns! Você alcançou a meta "${meta.titulo}".`,

              tipo:
                'meta',

              chaveEvento,
            });


          if (criada) {

            console.log(
              '✅ Notificação de meta processada:',
              meta.titulo
            );


            metasAvisadasRef.current.add(
              meta.id
            );
          }

        }


        /*
         * ====================================================
         * 2. DESPESAS MAIORES QUE RECEITAS
         * ====================================================
         */

        const totalReceitas =
          transacoes
            .filter(
              (t: Transacao) =>
                t.tipo === 'receita'
            )
            .reduce(
              (acc, t) =>
                acc + t.valor,
              0
            );


        const totalDespesas =
          transacoes
            .filter(
              (t: Transacao) =>
                t.tipo === 'despesa'
            )
            .reduce(
              (acc, t) =>
                acc + t.valor,
              0
            );


        if (
          totalDespesas >
            totalReceitas &&
          !avisouDespesaRef.current
        ) {

          console.log(
            '⚠️ Criando alerta de despesas...'
          );


          const criada =
            await notificacoesApi.criar({

              titulo:
                '⚠️ Atenção aos gastos',

              mensagem:
                'Suas despesas estão maiores que suas receitas. Considere revisar seu orçamento.',

              tipo:
                'alerta',
            });


          if (criada) {

            avisouDespesaRef.current =
              true;

          }

        }


        /*
         * Se a situação voltar ao normal,
         * permitimos um novo alerta futuramente.
         */
        else if (
          totalDespesas <=
          totalReceitas
        ) {

          avisouDespesaRef.current =
            false;

        }

      } catch (error) {

        console.error(
          'Erro ao verificar notificações automáticas:',
          error
        );

      } finally {

        verificandoRef.current =
          false;

      }


      /*
       * Atualiza a lista depois de verificar
       * as notificações automáticas.
       */
      await recarregar();

    }


    verificarNotificacoes();

  }, [
    metas,
    transacoes,
    carregando,
    usuario?.id,
    recarregar,
  ]);


  /*
   * Marca uma notificação como lida.
   */
  async function marcarLida(
    id: string
  ) {

    const ok =
      await notificacoesApi.marcarLida(
        id
      );


    if (ok) {
      await recarregar();
    }
  }


  /*
   * Marca todas as notificações como lidas.
   */
  async function marcarTodasLidas() {

    const ok =
      await notificacoesApi.marcarTodasLidas();


    if (ok) {
      await recarregar();
    }
  }


  /*
   * Exclui uma notificação.
   */
  async function excluir(
    id: string
  ) {

    const ok =
      await notificacoesApi.excluir(
        id
      );


    if (ok) {
      await recarregar();
    }
  }


  /*
   * Conta quantas notificações ainda
   * não foram lidas.
   */
  const naoLidas =
    notificacoes.filter(
      (n) => !n.lida
    ).length;


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