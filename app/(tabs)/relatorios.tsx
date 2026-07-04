import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { AlertTriangle, BarChart2, CheckCircle, DollarSign, Lightbulb, Target } from 'lucide-react-native';
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryLegend,
  VictoryLine,
  VictoryPie,
  VictoryTheme,
} from 'victory-native';
import { Meta, Transacao, useFinance } from '../_layout';

type Aba = 'geral' | 'categorias' | 'tendencias';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const COR_RECEITA = '#1a9e75';
const COR_DESPESA = '#e24b4a';
const COR_META    = '#FF9800';
const CORES_CATEG = ['#1A9E75','#FF9800','#2196F3','#F44336','#9C27B0','#FF5722','#607D8B'];

const formatarEixoY = (valor: number) => {
  if (valor === 0) return 'R$0';
  if (Math.abs(valor) >= 1000) return `R$${(valor / 1000).toFixed(1)}k`;
  return `R$${Math.round(valor)}`;
};

// Idênticos ao EvolucaoMensal
const estiloEixoX = {
  axis: { stroke: '#e0e0e0' },
  tickLabels: { fill: '#999', fontSize: 11, padding: 6, fontFamily: 'System' },
  grid: { stroke: 'transparent' },
};
const estiloEixoY = {
  axis: { stroke: 'transparent' },
  grid: { stroke: '#f0f0f0', strokeDasharray: '4,4' },
  tickLabels: { fill: '#999', fontSize: 10, padding: 6, fontFamily: 'System' },
};

function gerarInsight(dadosMeses: any[], totalReceitas: number, totalDespesas: number): React.ReactNode {
  const mesAtual   = new Date().getMonth();
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const atual    = dadosMeses[mesAtual];
  const anterior = dadosMeses[mesAnterior];

  if (atual.despesa === 0 && atual.receita === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <BarChart2 size={18} color="#1A9E75" />
        <Text style={{ marginLeft: 8 }}>Nenhuma transação registrada ainda este mês.</Text>
      </View>
    );
  }
  if (anterior.despesa === 0 && atual.despesa > 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Lightbulb size={18} color="#FFC107" />
        <Text style={{ marginLeft: 8 }}>{`Seus gastos em ${MESES[mesAtual]} foram de ${formatarEixoY(atual.despesa)}. Mantenha o controle!`}</Text>
      </View>
    );
  }
  if (anterior.despesa > 0) {
    const diff = atual.despesa - anterior.despesa;
    const pct  = Math.abs(Math.round((diff / anterior.despesa) * 100));
    if (diff < 0) return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <CheckCircle size={16} color="#4CAF50" />
        <Text style={{ marginLeft: 8 }}>{`Você gastou ${pct}% a menos que em ${MESES[mesAnterior]}. Ótimo trabalho!`}</Text>
      </View>
    );
    if (diff > 0) return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AlertTriangle size={16} color="#F44336" />
        <Text style={{ marginLeft: 8 }}>{`Você gastou ${pct}% a mais que em ${MESES[mesAnterior]}. Fique de olho!`}</Text>
      </View>
    );
  }
  const taxa = totalReceitas > 0
    ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100)
    : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <DollarSign size={16} color="#1A9E75" />
      <Text style={{ marginLeft: 8 }}>{`Taxa de poupança atual: ${taxa}%. ${taxa >= 20 ? 'Continue assim!' : 'Tente economizar mais!'}`}</Text>
    </View>
  );
}

function DonutVazio({ largura }: { largura: number }) {
  return (
    <View style={styles.donutVazioWrap}>
      <VictoryPie
        data={[{ x: '', y: 1 }]}
        width={largura * 0.5}
        height={180}
        colorScale={['#E0E0E0']}
        innerRadius={55}
        labels={() => ''}
        padding={10}
      />
      <View style={styles.donutVazioLabel}>
        <Text style={styles.donutVazioTexto}>Sem{'\n'}dados</Text>
      </View>
    </View>
  );
}

export default function Relatorios() {
  const { transacoes, totalReceitas, totalDespesas, metas } = useFinance();
  const [aba, setAba] = useState<Aba>('geral');
  const [semestre, setSemestre] = useState<1 | 2>(1);
  const { width } = useWindowDimensions();
  const largura = width - 64;

  const economizado  = totalReceitas - totalDespesas;
  const taxaPoupanca = totalReceitas > 0
    ? ((economizado / totalReceitas) * 100).toFixed(1)
    : '0.0';

  // Índice numérico como x — mesmo padrão do EvolucaoMensal
  const dadosMeses = MESES.map((label, i) => {
    const receita = transacoes
      .filter((t: Transacao) => t.tipo === 'receita' && new Date(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);
    const despesa = transacoes
      .filter((t: Transacao) => t.tipo === 'despesa' && new Date(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);
    return { x: i + 1, label, receita, despesa, economia: receita - despesa };
  });

  const dadosSemestre = semestre === 1
    ? dadosMeses.slice(0, 6)
    : dadosMeses.slice(6, 12).map((d, i) => ({ ...d, x: i + 1 }));
  const labelsSemestre = dadosSemestre.map((d) => d.label);

  const maxValor = Math.max(...dadosSemestre.map((d) => Math.max(d.receita, d.despesa)), 100);
  const maxEcon  = Math.max(...dadosMeses.map((d) => Math.abs(d.economia)), 100);

  const categMap: { [key: string]: number } = {};
  transacoes
    .filter((t: Transacao) => t.tipo === 'despesa')
    .forEach((t: Transacao) => {
      categMap[t.categoria] = (categMap[t.categoria] || 0) + t.valor;
    });
  const totalCateg = Object.values(categMap).reduce((a, b) => a + b, 0);
  const dadosPie   = Object.entries(categMap).map(([nome, valor]) => ({
    x: nome, y: valor,
    label: `${Math.round((valor / totalCateg) * 100)}%`,
  }));
  const legendaPie = Object.entries(categMap).map(([nome], i) => ({
    name: nome,
    symbol: { fill: CORES_CATEG[i % CORES_CATEG.length] },
  }));
  const temCateg = dadosPie.length > 0;

  const totalMeta = metas.reduce((acc: number, m: Meta) => acc + m.total, 0);
  const dadosMeta = dadosMeses.map((d) => ({ x: d.x, y: totalMeta > 0 ? totalMeta : null }));

  const insight = gerarInsight(dadosMeses, totalReceitas, totalDespesas);

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.titulo}>Relatórios</Text>
        <Text style={styles.subtitulo}>Análise financeira completa</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Receitas</Text>
          <Text style={[styles.cardValor, { color: COR_RECEITA }]}>R$ {totalReceitas.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Despesas</Text>
          <Text style={[styles.cardValor, { color: COR_DESPESA }]}>R$ {totalDespesas.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Economizado</Text>
          <Text style={[styles.cardValor, { color: economizado >= 0 ? COR_RECEITA : COR_DESPESA }]}>
            R$ {economizado.toFixed(2)}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Taxa de poupança</Text>
          <Text style={[styles.cardValor, { color: COR_RECEITA }]}>{taxaPoupanca}%</Text>
        </View>
      </View>

      <View style={styles.abas}>
        {([
          ['geral',      'Visão Geral'],
          ['categorias', 'Categorias'],
          ['tendencias', 'Tendências'],
        ] as [Aba, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.aba, aba === key && styles.abaAtiva]}
            onPress={() => setAba(key)}
          >
            <Text style={[styles.abaTexto, aba === key && styles.abaTextoAtivo]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── VISÃO GERAL ── */}
      {aba === 'geral' && (
        <View style={styles.graficoCard}>
          <View style={styles.insightBox}>
            {insight}
          </View>

          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, semestre === 1 && styles.toggleBtnAtivo]}
              onPress={() => setSemestre(1)}
            >
              <Text style={[styles.toggleText, semestre === 1 && styles.toggleTextAtivo]}>Jan–Jun</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, semestre === 2 && styles.toggleBtnAtivo]}
              onPress={() => setSemestre(2)}
            >
              <Text style={[styles.toggleText, semestre === 2 && styles.toggleTextAtivo]}>Jul–Dez</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.graficoTitulo}>Receitas vs. Despesas</Text>

          <View style={styles.legenda}>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: COR_RECEITA }]} />
              <Text style={styles.legendaLabel}>Receita</Text>
            </View>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: COR_DESPESA }]} />
              <Text style={styles.legendaLabel}>Despesa</Text>
            </View>
          </View>

          <VictoryChart
            width={largura}
            height={220}
            theme={VictoryTheme.material}
            domainPadding={{ x: 20 }}
            domain={{ y: [0, maxValor] }}
            padding={{ top: 10, bottom: 36, left: 52, right: 16 }}
          >
            <VictoryAxis
              tickValues={dadosSemestre.map((d) => d.x)}
              tickFormat={(_, i) => labelsSemestre[i] ?? ''}
              style={estiloEixoX}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={formatarEixoY}
              style={estiloEixoY}
            />
            <VictoryGroup offset={14} colorScale={[COR_RECEITA, COR_DESPESA]}>
              <VictoryBar
                data={dadosSemestre}
                x="x"
                y="receita"
                cornerRadius={{ top: 4 }}
                barWidth={12}
              />
              <VictoryBar
                data={dadosSemestre}
                x="x"
                y="despesa"
                cornerRadius={{ top: 4 }}
                barWidth={12}
              />
            </VictoryGroup>
          </VictoryChart>
        </View>
      )}

      {/* ── CATEGORIAS ── */}
      {aba === 'categorias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Gastos por Categoria</Text>

          {temCateg ? (
            <View style={styles.donutRow}>
              <View style={styles.donutWrap}>
                <VictoryPie
                  data={dadosPie}
                  width={largura * 0.5}
                  height={190}
                  colorScale={CORES_CATEG}
                  innerRadius={55}
                  labelRadius={72}
                  style={{ labels: { fontSize: 11, fill: '#fff', fontWeight: 'bold' } }}
                  padding={10}
                />
              </View>
              <VictoryLegend
                x={0}
                y={20}
                width={largura * 0.45}
                data={legendaPie}
                style={{ labels: { fontSize: 12, fill: '#555' } }}
              />
            </View>
          ) : (
            <DonutVazio largura={largura} />
          )}

          {temCateg && (
            <View style={{ marginTop: 8 }}>
              {Object.entries(categMap).map(([nome, valor], i) => (
                <View key={nome} style={styles.categoriaItem}>
                  <View style={styles.categoriaInfo}>
                    <View style={styles.categoriaEsq}>
                      <View style={[styles.categoriaDot, { backgroundColor: CORES_CATEG[i % CORES_CATEG.length] }]} />
                      <Text style={styles.categoriaNome}>{nome}</Text>
                    </View>
                    <Text style={styles.categoriaValor}>R$ {valor.toFixed(2)}</Text>
                  </View>
                  <View style={styles.barraFundo}>
                    <View
                      style={[
                        styles.barraFill,
                        {
                          width: `${Math.round((valor / totalCateg) * 100)}%`,
                          backgroundColor: CORES_CATEG[i % CORES_CATEG.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoriaPct}>{Math.round((valor / totalCateg) * 100)}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── TENDÊNCIAS ── */}
      {aba === 'tendencias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Tendência de Economia</Text>

          <View style={styles.legenda}>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: COR_RECEITA }]} />
              <Text style={styles.legendaLabel}>Economia real</Text>
            </View>
            {totalMeta > 0 && (
              <View style={styles.legendaItem}>
                <View style={[styles.legendaCorTracejada, { borderColor: COR_META }]} />
                <Text style={styles.legendaLabel}>Meta ({formatarEixoY(totalMeta)})</Text>
              </View>
            )}
          </View>

          <VictoryChart
            width={largura}
            height={240}
            theme={VictoryTheme.material}
            domain={{ y: [-maxEcon, Math.max(maxEcon, totalMeta > 0 ? totalMeta * 1.1 : 0)] }}
            padding={{ top: 10, bottom: 36, left: 52, right: 16 }}
          >
            <VictoryAxis
              tickValues={dadosMeses.map((d) => d.x)}
              tickFormat={MESES}
              style={estiloEixoX}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={formatarEixoY}
              style={estiloEixoY}
            />
            <VictoryLine
              data={dadosMeses}
              x="x"
              y="economia"
              style={{ data: { stroke: COR_RECEITA, strokeWidth: 2.5 } }}
            />
            {totalMeta > 0 && (
              <VictoryLine
                data={dadosMeta}
                x="x"
                y="y"
                style={{ data: { stroke: COR_META, strokeWidth: 1.5, strokeDasharray: '6,4' } }}
              />
            )}
          </VictoryChart>

          {totalMeta > 0 && (
            <View style={[
              styles.insightBox,
              { backgroundColor: economizado >= totalMeta ? '#e8f5f0' : '#fff8e1' },
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Target size={16} color="#1A9E75" />
                <Text style={[styles.insightTexto, { marginLeft: 8 }]}>
                  {economizado >= totalMeta
                    ? `Você já atingiu sua meta de ${formatarEixoY(totalMeta)}!`
                    : `Faltam ${formatarEixoY(totalMeta - economizado)} para atingir sua meta total.`}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F5F5' },
  header:       { backgroundColor: '#fff', padding: 20, paddingTop: 50, marginBottom: 16 },
  titulo:       { fontSize: 22, fontWeight: 'bold' },
  subtitulo:    { fontSize: 13, color: '#888', marginTop: 2 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginBottom: 16,
  },
  card: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  cardLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  cardValor:  { fontSize: 18, fontWeight: 'bold' },

  abas: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4,
  },
  aba:           { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  abaAtiva:      { backgroundColor: '#1A9E75' },
  abaTexto:      { fontSize: 12, fontWeight: '600', color: '#888' },
  abaTextoAtivo: { color: '#fff' },

  graficoCard: {
    backgroundColor: '#fff', borderRadius: 12,
    marginHorizontal: 16, marginBottom: 24, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  graficoTitulo: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },

  insightBox: {
    backgroundColor: '#f0faf6', borderRadius: 10,
    padding: 12, marginBottom: 14,
  },
  insightTexto: { fontSize: 13, color: '#333', lineHeight: 18 },

  legenda:     { flexDirection: 'row', gap: 16, marginBottom: 4 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaCor:  { width: 10, height: 10, borderRadius: 2 },
  legendaCorTracejada: {
    width: 16, height: 0,
    borderTopWidth: 2, borderStyle: 'dashed',
  },
  legendaLabel: { fontSize: 12, color: '#888' },

  toggle: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  toggleBtnAtivo: {
    backgroundColor: '#e8f5f0',
  },
  toggleText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  toggleTextAtivo: {
    color: '#1a9e75',
    fontWeight: '600',
  },

  donutRow:  { flexDirection: 'row', alignItems: 'center' },
  donutWrap: { position: 'relative' },

  donutVazioWrap:  { alignItems: 'flex-start', position: 'relative', marginBottom: 8 },
  donutVazioLabel: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  donutVazioTexto: { fontSize: 12, color: '#bbb', textAlign: 'center' },

  categoriaItem:  { marginBottom: 14 },
  categoriaInfo:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoriaEsq:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoriaDot:   { width: 8, height: 8, borderRadius: 4 },
  categoriaNome:  { fontSize: 14, fontWeight: '600' },
  categoriaValor: { fontSize: 14, color: '#888' },
  barraFundo: {
    backgroundColor: '#F0F0F0', borderRadius: 8,
    height: 8, overflow: 'hidden',
  },
  barraFill:    { height: 8, borderRadius: 8 },
  categoriaPct: { fontSize: 12, color: '#888', marginTop: 2, textAlign: 'right' },
});