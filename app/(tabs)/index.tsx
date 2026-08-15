import EvolucaoMensal from '@/src/componentes/EvolucaoMensal';
import GastosPorCategoria from '@/src/componentes/GastosPorCategoria';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import AcoesRapidas from '../../src/componentes/AcoesRapidas';
import BalanceCard from '../../src/componentes/BalanceCard';
import Cabecalho from '../../src/componentes/Cabecalho';
import MetaCard from '../../src/componentes/MetaCard';
import TransacaoItem from '../../src/componentes/TransacaoItem';
import { useFinance } from '../../src/contextos/FinanceContexto';
import type { Meta, Transacao } from '../../src/tipos';

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Limite de itens exibidos na tela inicial para evitar poluição visual
const LIMITE_METAS = 5;
const LIMITE_TRANSACOES = 5;

export default function Home() {
  const {
    saldoTotal,
    totalReceitas,
    totalDespesas,
    transacoes,
    carregandoTransacoes,
    erroTransacoes,
    metas,
  } = useFinance();

  const metasEmAndamento = metas.filter((meta: Meta) => meta.atual < meta.total);
  const metasVisiveis = metasEmAndamento.slice(0, LIMITE_METAS);
  const transacoesVisiveis = transacoes.slice(0, LIMITE_TRANSACOES);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Cabecalho />
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
