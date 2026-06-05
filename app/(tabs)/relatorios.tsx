import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useFinance, Transacao } from '../_layout';
import { VictoryChart, VictoryBar, VictoryGroup, VictoryAxis, VictoryTheme, VictoryLine } from 'victory-native';

type Aba = 'geral' | 'categorias' | 'tendencias';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function Relatorios() {
  const { transacoes, totalReceitas, totalDespesas } = useFinance();
  const [aba, setAba] = useState<Aba>('geral');
  const { width } = useWindowDimensions();
  const largura = width - 64;

  const economizado = totalReceitas - totalDespesas;
  const taxaPoupanca = totalReceitas > 0 ? ((economizado / totalReceitas) * 100).toFixed(1) : '0.0';

  // Dados por mês
  const dadosMeses = MESES.map((label, i) => {
    const receita = transacoes
      .filter((t: Transacao) => t.tipo === 'receita' && new Date(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);
    const despesa = transacoes
      .filter((t: Transacao) => t.tipo === 'despesa' && new Date(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);
    return { label, receita, despesa, economia: receita - despesa };
  });

  // Dados por categoria
  const categorias: { [key: string]: number } = {};
  transacoes
    .filter((t: Transacao) => t.tipo === 'despesa')
    .forEach((t: Transacao) => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    });

  return (
    <ScrollView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Relatórios</Text>
          <Text style={styles.subtitulo}>Análise financeira completa</Text>
        </View>
      </View>

      {/* 4 Cards */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Receitas</Text>
          <Text style={[styles.cardValor, { color: '#1A9E75' }]}>R$ {totalReceitas.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Despesas</Text>
          <Text style={[styles.cardValor, { color: '#F44336' }]}>R$ {totalDespesas.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Economizado</Text>
          <Text style={[styles.cardValor, { color: economizado >= 0 ? '#1A9E75' : '#F44336' }]}>
            R$ {economizado.toFixed(2)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Taxa de poupança</Text>
          <Text style={[styles.cardValor, { color: '#1A9E75' }]}>{taxaPoupanca}%</Text>
        </View>
      </View>

      {/* Abas */}
      <View style={styles.abas}>
        {([['geral', 'Visão Geral'], ['categorias', 'Categorias'], ['tendencias', 'Tendências']] as [Aba, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.aba, aba === key && styles.abaAtiva]}
            onPress={() => setAba(key)}
          >
            <Text style={[styles.abaTexto, aba === key && styles.abaTextoAtivo]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conteúdo da aba */}
      {aba === 'geral' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Receitas vs. Despesas (6 meses)</Text>
          <VictoryChart width={largura} height={220} theme={VictoryTheme.material} domainPadding={{ x: 30 }}>
            <VictoryAxis style={{ tickLabels: { fontSize: 9, fill: '#888' } }} />
            <VictoryAxis dependentAxis tickFormat={v => `R$${v}`} style={{ tickLabels: { fontSize: 9, fill: '#888' } }} />
            <VictoryGroup offset={10} colorScale={['#1A9E75', '#F44336']}>
              <VictoryBar data={dadosMeses.slice(0, 6)} x="label" y="receita" />
              <VictoryBar data={dadosMeses.slice(0, 6)} x="label" y="despesa" />
            </VictoryGroup>
          </VictoryChart>

          <Text style={styles.graficoTitulo}>Economia mensal</Text>
          <VictoryChart width={largura} height={200} theme={VictoryTheme.material}>
            <VictoryAxis style={{ tickLabels: { fontSize: 9, fill: '#888' } }} />
            <VictoryAxis dependentAxis tickFormat={v => `R$${v}`} style={{ tickLabels: { fontSize: 9, fill: '#888' } }} />
            <VictoryLine
              data={dadosMeses.slice(0, 6)}
              x="label"
              y="economia"
              style={{ data: { stroke: '#1A9E75', strokeWidth: 2 } }}
            />
          </VictoryChart>
        </View>
      )}

      {aba === 'categorias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Gastos por Categoria</Text>
          {Object.entries(categorias).map(([nome, valor]) => (
            <View key={nome} style={styles.categoriaItem}>
              <View style={styles.categoriaInfo}>
                <Text style={styles.categoriaNome}>{nome}</Text>
                <Text style={styles.categoriaValor}>R$ {valor.toFixed(2)}</Text>
              </View>
              <View style={styles.barraFundo}>
                <View style={[styles.barraFill, { width: `${Math.round((valor / totalDespesas) * 100)}%` }]} />
              </View>
              <Text style={styles.categoriaPct}>{Math.round((valor / totalDespesas) * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {aba === 'tendencias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Tendência de Economia</Text>
          <VictoryChart width={largura} height={220} theme={VictoryTheme.material}>
            <VictoryAxis style={{ tickLabels: { fontSize: 9, fill: '#888' } }} />
            <VictoryAxis dependentAxis tickFormat={v => `R$${v}`} style={{ tickLabels: { fontSize: 9, fill: '#888' } }} />
            <VictoryLine
              data={dadosMeses}
              x="label"
              y="economia"
              style={{ data: { stroke: '#1A9E75', strokeWidth: 2 } }}
            />
          </VictoryChart>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    marginBottom: 16,
  },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  cardValor: { fontSize: 18, fontWeight: 'bold' },
  abas: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
  },
  aba: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  abaAtiva: { backgroundColor: '#1A9E75' },
  abaTexto: { fontSize: 12, fontWeight: '600', color: '#888' },
  abaTextoAtivo: { color: '#fff' },
  graficoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  graficoTitulo: { fontSize: 15, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
  categoriaItem: { marginBottom: 16 },
  categoriaInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoriaNome: { fontSize: 14, fontWeight: '600' },
  categoriaValor: { fontSize: 14, color: '#888' },
  barraFundo: { backgroundColor: '#F0F0F0', borderRadius: 8, height: 8, overflow: 'hidden' },
  barraFill: { backgroundColor: '#1A9E75', height: 8 },
  categoriaPct: { fontSize: 12, color: '#888', marginTop: 2, textAlign: 'right' },
});