import EvolucaoMensal from '@/src/componentes/EvolucaoMensal';
import GastosPorCategoria from '@/src/componentes/GastosPorCategoria';
import AcoesRapidas from '../../src/componentes/AcoesRapidas';
import BalanceCard from '../../src/componentes/BalanceCard';
import Cabecalho from '../../src/componentes/Cabecalho';
import MetaCard from '../../src/componentes/MetaCard';
import TransacaoItem from '../../src/componentes/TransacaoItem';
import { Meta, Transacao, useFinance } from '../_layout';

//import { useFinance } from '../_layout';
import { ScrollView, StyleSheet } from 'react-native';


export default function Home() {
  const { saldoTotal, totalReceitas, totalDespesas, transacoes, metas } = useFinance();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Cabecalho />
      <BalanceCard saldo={saldoTotal} receitas={totalReceitas} despesas={totalDespesas} />
      <AcoesRapidas />
      {metas.length > 0 && (
  <>
    {metas.map((meta: Meta) => (
      <MetaCard key={meta.id} {...meta} />
    ))}
  </>
   )}
      {transacoes.map((t: Transacao) => <TransacaoItem key={t.id} {...t} />)}
      <EvolucaoMensal />
      <GastosPorCategoria />
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
  secaoTitulo: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 12,
  marginTop: 4,
},
});