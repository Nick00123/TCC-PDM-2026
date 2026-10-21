import EvolucaoMensal from '@/components/EvolucaoMensal';
import GastosPorCategoria from '@/components/GastosPorCategoria';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import AcoesRapidas from '../../components/AcoesRapidas';
import BalanceCard from '../../components/BalanceCard';
import Cabecalho from '../../components/Cabecalho';
import MetaCard from '../../components/MetaCard';
import TransacaoItem from '../../components/TransacaoItem';
import type { Meta, Notificacao, Transacao } from '../../types';
import { alterarNotificacoes, buscarMetas, buscarNotificacoes, buscarTransacoes, criarNotificacao } from '../../utils/requisicoes';
import { headersAutenticados, obterUsuarioDaSessao } from '../../utils/sessao';

import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAnimacaoCascata } from '../../utils/animacoes';

// Mostro poucos itens na home para ela não ficar cheia demais.
const LIMITE_METAS = 5;
const LIMITE_TRANSACOES = 5;

// Reúne o resumo financeiro, metas, notificações e transações recentes.
// Carrega dados da sessão atual e apresenta os componentes da tela inicial.
export default function Home() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(true);
  const [erroTransacoes, setErroTransacoes] = useState<string | null>(null);
  const [erroNotificacoes, setErroNotificacoes] = useState<string | null>(null);
  const carregarResumoInicio = useCallback(async () => {
    // A home busca tudo que precisa para montar o resumo de uma vez.
    setCarregandoTransacoes(true);
    setCarregandoNotificacoes(true);
    try {
      const usuario = await obterUsuarioDaSessao();
      if (!usuario) { router.replace('/login'); return; }
      const cabecalhosAutenticados = await headersAutenticados();
      const [transacoesRecebidas, metasRecebidas] = await Promise.all([
        buscarTransacoes(usuario.id, cabecalhosAutenticados),
        buscarMetas(usuario.id, cabecalhosAutenticados),
      ]);
      setTransacoes(transacoesRecebidas);
      setMetas(metasRecebidas);
      setErroTransacoes(null);

      try {
        // Essas notificações são criadas só quando acontece uma situação importante.
        const notificacoesPendentes = metasRecebidas
          .filter((metaAtual) => metaAtual.atual >= metaAtual.total)
          .map((metaAtual) => criarNotificacao({ usuario_id: usuario.id, titulo: 'Meta concluída!', mensagem: `Parabéns! Você alcançou a meta "${metaAtual.titulo}".`, tipo: 'meta', lida: false, chave_evento: `meta_concluida:${metaAtual.id}` }, cabecalhosAutenticados));

        const receitas = transacoesRecebidas.filter((transacaoAtual) => transacaoAtual.tipo === 'receita').reduce((somaValores, transacaoAtual) => somaValores + transacaoAtual.valor, 0);
        const despesas = transacoesRecebidas.filter((transacaoAtual) => transacaoAtual.tipo === 'despesa').reduce((somaValores, transacaoAtual) => somaValores + transacaoAtual.valor, 0);
        if (despesas > receitas) {
          const hojeLocal = new Date();
          const dataAtual = `${hojeLocal.getFullYear()}-${String(hojeLocal.getMonth() + 1).padStart(2, '0')}-${String(hojeLocal.getDate()).padStart(2, '0')}`;
          notificacoesPendentes.push(criarNotificacao({ usuario_id: usuario.id, titulo: 'Atenção ao saldo', mensagem: 'Suas despesas estão maiores que suas receitas.', tipo: 'alerta', lida: false, chave_evento: `saldo_negativo:${dataAtual}` }, cabecalhosAutenticados));
        }

        await Promise.all(notificacoesPendentes);
        setNotificacoes(await buscarNotificacoes(usuario.id, cabecalhosAutenticados));
        setErroNotificacoes(null);
      } catch (detalhesErro) {
        console.error('Erro ao carregar notificações:', detalhesErro);
        setErroNotificacoes('Não foi possível carregar as notificações.');
      }
    } catch (detalhesErro) {
      console.error('Erro ao carregar dashboard:', detalhesErro);
      setErroTransacoes('Não foi possível carregar o resumo.');
    } finally {
      setCarregandoTransacoes(false);
      setCarregandoNotificacoes(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarResumoInicio();
    }, [carregarResumoInicio])
  );

  // Acrescenta o usuário à consulta e recarrega a home após a alteração.
  async function alterarNotificacaoDoUsuario(urlConsulta: string, metodoHttp: 'PATCH' | 'DELETE') {
    const usuario = await obterUsuarioDaSessao();
    if (!usuario) return { sucesso: false, mensagem: 'Você precisa estar autenticado.' };
    const separadorConsulta = urlConsulta.includes('?') ? '&' : '?';
    await alterarNotificacoes(
      `${urlConsulta}${separadorConsulta}usuario_id=eq.${encodeURIComponent(usuario.id)}`,
      metodoHttp,
      await headersAutenticados()
    );
    await carregarResumoInicio();
    return { sucesso: true, mensagem: '' };
  }

  async function marcarLida(notificacaoId: string) { return alterarNotificacaoDoUsuario(`notificacoes?id=eq.${encodeURIComponent(notificacaoId)}`, 'PATCH'); }
  async function marcarTodasLidas() { return alterarNotificacaoDoUsuario('notificacoes?lida=eq.false', 'PATCH'); }
  async function excluirNotificacao(notificacaoId: string) { return alterarNotificacaoDoUsuario(`notificacoes?id=eq.${encodeURIComponent(notificacaoId)}`, 'DELETE'); }

  const totalReceitas = transacoes.filter((transacaoAtual) => transacaoAtual.tipo === 'receita').reduce((somaValores, transacaoAtual) => somaValores + transacaoAtual.valor, 0);
  const totalDespesas = transacoes.filter((transacaoAtual) => transacaoAtual.tipo === 'despesa').reduce((somaValores, transacaoAtual) => somaValores + transacaoAtual.valor, 0);
  // O saldo é tudo que entrou menos tudo que saiu.
  const saldoTotal = totalReceitas - totalDespesas;

  const metasEmAndamento = metas.filter((metaAtual: Meta) => metaAtual.atual < metaAtual.total);
  const metasVisiveis = metasEmAndamento.slice(0, LIMITE_METAS);
  const transacoesVisiveis = transacoes.slice(0, LIMITE_TRANSACOES);
  const { fadeAnimTop, animacoes: animacoesMetas } = useAnimacaoCascata(metasVisiveis.length);
  const { animacoes: animacoesTransacoes } = useAnimacaoCascata(transacoesVisiveis.length);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Cabecalho notificacoes={notificacoes} carregando={carregandoNotificacoes} erro={erroNotificacoes} marcarLida={marcarLida} marcarTodasLidas={marcarTodasLidas} excluir={excluirNotificacao} />
      {carregandoTransacoes ? (
        <View style={styles.aviso}><Text style={styles.avisoTexto}>Carregando resumo financeiro...</Text></View>
      ) : erroTransacoes ? (
        <View style={styles.aviso}><Text style={styles.avisoTexto}>Resumo financeiro indisponível.</Text></View>
      ) : (
        <Animated.View style={{ opacity: fadeAnimTop }}>
          <BalanceCard saldo={saldoTotal} receitas={totalReceitas} despesas={totalDespesas} />
        </Animated.View>
      )}
      <AcoesRapidas />

      {/* Mostro só as metas abertas e deixo um botão para ver o restante. */}
      {metasEmAndamento.length > 0 && (
        <>
          {metasVisiveis.map((metaAtual: Meta, indiceMeta) => {
            const animacao = animacoesMetas[indiceMeta];
            return (
              <Animated.View
                key={metaAtual.id}
                style={{
                  opacity: animacao,
                  transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                }}
              >
                <MetaCard {...metaAtual} />
              </Animated.View>
            );
          })}
          {metasEmAndamento.length > LIMITE_METAS && (
            <TouchableOpacity
              style={styles.verMais}
              onPress={() => router.push('/metas')}
              activeOpacity={0.7}
            >
              <Text style={styles.verMaisTexto}>
                Ver todas as metas ({metasEmAndamento.length})
              </Text>
              <ChevronRight size={16} color="#1A9E75" />
            </TouchableOpacity>
          )}
        </>
      )}

      {!carregandoTransacoes && !erroTransacoes && transacoes.length > 0 && (
        <>
          {transacoesVisiveis.map((transacaoAtual: Transacao, indiceTransacao) => {
            const animacao = animacoesTransacoes[indiceTransacao];
            return (
              <Animated.View
                key={transacaoAtual.id}
                style={{
                  opacity: animacao,
                  transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                }}
              >
                <TransacaoItem {...transacaoAtual} />
              </Animated.View>
            );
          })}
          {transacoes.length > LIMITE_TRANSACOES && (
            <TouchableOpacity
              style={styles.verMais}
              onPress={() => router.push('/transacoes')}
              activeOpacity={0.7}
            >
              <Text style={styles.verMaisTexto}>
                Ver todas as transações ({transacoes.length})
              </Text>
              <ChevronRight size={16} color="#1A9E75" />
            </TouchableOpacity>
          )}
        </>
      )}

      {!carregandoTransacoes && !erroTransacoes && (
        <>
          <EvolucaoMensal transacoes={transacoes} />
          <GastosPorCategoria transacoes={transacoes} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 32,
  },
  aviso: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  avisoTexto: { color: '#64748B', fontSize: 14 },
  verMais: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginBottom: 16,
  },
  verMaisTexto: {
    color: '#1A9E75',
    fontSize: 14,
    fontWeight: '600',
  },
});
