import EvolucaoMensal from '@/components/EvolucaoMensal';
import GastosPorCategoria from '@/components/GastosPorCategoria';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react-native';
import AcoesRapidas from '../../components/AcoesRapidas';
import BalanceCard from '../../components/BalanceCard';
import Cabecalho from '../../components/Cabecalho';
import MetaCard from '../../components/MetaCard';
import TransacaoItem from '../../components/TransacaoItem';
import type { Meta, Notificacao, Transacao } from '../../types';
import { headersAutenticados, obterUsuarioDaSessao } from '../../utils/sessao';
import { alterarNotificacoes, buscarMetas, buscarNotificacoes, buscarTransacoes, criarNotificacao } from '../../utils/requisicoes';

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Limite de itens exibidos na tela inicial para evitar poluição visual
const LIMITE_METAS = 5;
const LIMITE_TRANSACOES = 5;

export default function Home() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(true);
  const [erroTransacoes, setErroTransacoes] = useState<string | null>(null);
  const [erroNotificacoes, setErroNotificacoes] = useState<string | null>(null);
  const telaEmFoco = useIsFocused();

  async function carregarDados() {
    setCarregandoTransacoes(true);
    setCarregandoNotificacoes(true);
    try {
      const usuario = await obterUsuarioDaSessao();
      if (!usuario) { router.replace('/login'); return; }
      const headers = await headersAutenticados();
      const [listaTransacoes, listaMetas] = await Promise.all([
        buscarTransacoes(usuario.id, headers),
        buscarMetas(usuario.id, headers),
      ]);
      setTransacoes(listaTransacoes);
      setMetas(listaMetas);
      setErroTransacoes(null);

      try {
        const notificacoesPendentes = listaMetas
          .filter((meta) => meta.atual >= meta.total)
          .map((meta) => criarNotificacao({ usuario_id: usuario.id, titulo: 'Meta concluída!', mensagem: `Parabéns! Você alcançou a meta "${meta.titulo}".`, tipo: 'meta', lida: false, chave_evento: `meta_concluida:${meta.id}` }, headers));

        const receitas = listaTransacoes.filter((item) => item.tipo === 'receita').reduce((total, item) => total + item.valor, 0);
        const despesas = listaTransacoes.filter((item) => item.tipo === 'despesa').reduce((total, item) => total + item.valor, 0);
        if (despesas > receitas) {
          const hojeLocal = new Date();
          const dataAtual = `${hojeLocal.getFullYear()}-${String(hojeLocal.getMonth() + 1).padStart(2, '0')}-${String(hojeLocal.getDate()).padStart(2, '0')}`;
          notificacoesPendentes.push(criarNotificacao({ usuario_id: usuario.id, titulo: 'Atenção ao saldo', mensagem: 'Suas despesas estão maiores que suas receitas.', tipo: 'alerta', lida: false, chave_evento: `saldo_negativo:${dataAtual}` }, headers));
        }

        await Promise.all(notificacoesPendentes);
        setNotificacoes(await buscarNotificacoes(usuario.id, headers));
        setErroNotificacoes(null);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        setErroNotificacoes('Não foi possível carregar as notificações.');
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setErroTransacoes('Não foi possível carregar o resumo.');
    } finally {
      setCarregandoTransacoes(false);
      setCarregandoNotificacoes(false);
    }
  }

  useEffect(() => { if (telaEmFoco) carregarDados(); }, [telaEmFoco]);

  async function alterarNotificacao(caminho: string, metodo: 'PATCH' | 'DELETE') {
    const usuario = await obterUsuarioDaSessao();
    if (!usuario) return { sucesso: false, mensagem: 'Você precisa estar autenticado.' };
    const separador = caminho.includes('?') ? '&' : '?';
    await alterarNotificacoes(
      `${caminho}${separador}usuario_id=eq.${encodeURIComponent(usuario.id)}`,
      metodo,
      await headersAutenticados()
    );
    await carregarDados();
    return { sucesso: true, mensagem: '' };
  }

  async function marcarLida(id: string) { return alterarNotificacao(`notificacoes?id=eq.${encodeURIComponent(id)}`, 'PATCH'); }
  async function marcarTodasLidas() { return alterarNotificacao('notificacoes?lida=eq.false', 'PATCH'); }
  async function excluirNotificacao(id: string) { return alterarNotificacao(`notificacoes?id=eq.${encodeURIComponent(id)}`, 'DELETE'); }

  const totalReceitas = transacoes.filter((item) => item.tipo === 'receita').reduce((total, item) => total + item.valor, 0);
  const totalDespesas = transacoes.filter((item) => item.tipo === 'despesa').reduce((total, item) => total + item.valor, 0);
  const saldoTotal = totalReceitas - totalDespesas;

  const metasEmAndamento = metas.filter((meta: Meta) => meta.atual < meta.total);
  const metasVisiveis = metasEmAndamento.slice(0, LIMITE_METAS);
  const transacoesVisiveis = transacoes.slice(0, LIMITE_TRANSACOES);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Cabecalho notificacoes={notificacoes} carregando={carregandoNotificacoes} erro={erroNotificacoes} marcarLida={marcarLida} marcarTodasLidas={marcarTodasLidas} excluir={excluirNotificacao} />
      {carregandoTransacoes ? (
        <View style={styles.aviso}><Text style={styles.avisoTexto}>Carregando resumo financeiro...</Text></View>
      ) : erroTransacoes ? (
        <View style={styles.aviso}><Text style={styles.avisoTexto}>Resumo financeiro indisponível.</Text></View>
      ) : (
        <BalanceCard saldo={saldoTotal} receitas={totalReceitas} despesas={totalDespesas} />
      )}
      <AcoesRapidas />

      {metasEmAndamento.length > 0 && (
        <>
          {metasVisiveis.map((meta: Meta) => (
            <MetaCard key={meta.id} {...meta} />
          ))}
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
          {transacoesVisiveis.map((t: Transacao) => (
            <TransacaoItem key={t.id} {...t} />
          ))}
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
