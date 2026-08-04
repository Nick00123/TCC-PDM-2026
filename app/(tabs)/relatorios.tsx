import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  PieChart,
  TrendingUp,
  X,
} from 'lucide-react-native';
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryTheme,
} from 'victory-native';
import { Meta, Transacao, useFinance } from '../_layout';

type Aba = 'geral' | 'categorias' | 'tendencias';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COR_RECEITA = '#1a9e75';
const COR_DESPESA = '#e24b4a';
const CORES_CATEG = ['#1A9E75', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#FF5722', '#607D8B'];

const formatarEixoY = (valor: number) => {
  if (valor === 0) return 'R$0';
  if (Math.abs(valor) >= 1000) return `R$${(valor / 1000).toFixed(0)}k`;
  return `R$${Math.round(valor)}`;
};

const parseData = (data: string) => {
  const [year, month, day] = data.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Estilos corrigidos para evitar sobreposição de eixos no Victory
const estiloEixoX = {
  axis: { stroke: 'transparent' },
  ticks: { stroke: 'transparent' },
  tickLabels: { fill: '#8E8E93', fontSize: 10, padding: 5 },
  grid: { stroke: 'transparent' },
};

const estiloEixoY = {
  axis: { stroke: 'transparent' },
  ticks: { stroke: 'transparent' },
  grid: { stroke: '#F2F2F7', strokeDasharray: '0' },
  tickLabels: { fill: '#8E8E93', fontSize: 10, padding: 4 },
};

export default function Relatorios() {
  const { transacoes, metas } = useFinance();
  const [aba, setAba] = useState<Aba>('geral');
  const [semestre, setSemestre] = useState<1 | 2>(1);
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth());
  const [anoSelecionado] = useState<number>(new Date().getFullYear());
  
  // Estado para controlar o Modal Customizado do Calendário
  const [modalVisible, setModalVisible] = useState(false);

  const { width } = useWindowDimensions();
  // Ajuste do padding do container para evitar corte nas bordas do celular
  const larguraGrafico = width - 70;

  const transacoesFiltradas = transacoes.filter((t: Transacao) => {
    const d = parseData(t.data);
    return d.getMonth() === mesSelecionado && d.getFullYear() === anoSelecionado;
  });

  const totalReceitas = transacoesFiltradas
    .filter((t: Transacao) => t.tipo === 'receita')
    .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

  const totalDespesas = transacoesFiltradas
    .filter((t: Transacao) => t.tipo === 'despesa')
    .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

  const economizado = totalReceitas - totalDespesas;
  const taxaPoupanca = totalReceitas > 0
    ? ((economizado / totalReceitas) * 100).toFixed(1)
    : '0.0';

  const dadosMeses = MESES.map((label, i) => {
    const receita = transacoes
      .filter((t: Transacao) => t.tipo === 'receita' && parseData(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);
    const despesa = transacoes
      .filter((t: Transacao) => t.tipo === 'despesa' && parseData(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);
    return { x: i + 1, mes: label, receita, despesa, economia: receita - despesa };
  });

  const dadosSemestre = semestre === 1
    ? dadosMeses.slice(0, 6)
    : dadosMeses.slice(6, 12).map((d, i) => ({ ...d, x: i + 1 }));

  const maxValor = Math.max(...dadosSemestre.map((d) => Math.max(d.receita, d.despesa)), 100);
  const maxEcon = Math.max(...dadosMeses.map((d) => Math.abs(d.economia)), 100);

  const categMap: { [key: string]: number } = {};
  transacoesFiltradas
    .filter((t: Transacao) => t.tipo === 'despesa')
    .forEach((t: Transacao) => {
      categMap[t.categoria] = (categMap[t.categoria] || 0) + t.valor;
    });
  const dadosPie = Object.entries(categMap).map(([nome, valor]) => ({
    x: nome,
    y: valor,
  }));
  const temCateg = dadosPie.length > 0;

  const totalMeta = metas.reduce((acc: number, m: Meta) => acc + m.total, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Relatórios</Text>
          <Text style={styles.subtitulo}>Análise financeira completa</Text>
        </View>

        <TouchableOpacity 
          style={styles.badgeMes} 
          onPress={() => setModalVisible(true)} 
          activeOpacity={0.7}
        >
          <Text style={styles.badgeMesTexto}>{`${MESES[mesSelecionado]} de ${anoSelecionado}`}</Text>
          <CalendarIcon size={14} color="#666" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* ── GRID DE SUMÁRIO ── */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <View style={[styles.iconeCircle, { backgroundColor: '#E8F5E9' }]}>
            <ArrowUpRight size={16} color={COR_RECEITA} />
          </View>
          <Text style={styles.cardLabel}>Receitas</Text>
          <Text style={[styles.cardValor, { color: COR_RECEITA }]}>
            R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconeCircle, { backgroundColor: '#FFEBEE' }]}>
            <ArrowDownRight size={16} color={COR_DESPESA} />
          </View>
          <Text style={styles.cardLabel}>Despesas</Text>
          <Text style={[styles.cardValor, { color: COR_DESPESA }]}>
            R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconeCircle, { backgroundColor: '#E0F2FE' }]}>
            <TrendingUp size={16} color="#0284C7" />
          </View>
          <Text style={styles.cardLabel}>Economizado</Text>
          <Text style={[styles.cardValor, { color: economizado >= 0 ? COR_RECEITA : COR_DESPESA }]}>
            R$ {economizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.iconeCircle, { backgroundColor: '#F0FDFA' }]}>
            <PieChart size={16} color="#0D9488" />
          </View>
          <Text style={styles.cardLabel}>Taxa de poupança</Text>
          <Text style={[styles.cardValor, { color: COR_RECEITA }]}>{taxaPoupanca}%</Text>
        </View>
      </View>

      {/* ── SELETOR DE ABAS ── */}
      <View style={styles.abas}>
        {(
          [
            ['geral', 'Visão Geral'],
            ['categorias', 'Categorias'],
            ['tendencias', 'Tendências'],
          ] as [Aba, string][]
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.aba, aba === key && styles.abaAtiva]}
            onPress={() => setAba(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.abaTexto, aba === key && styles.abaTextoAtivo]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── VISÃO GERAL ── */}
      {aba === 'geral' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Receitas vs. Despesas (6 meses)</Text>

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
            width={larguraGrafico}
            height={220}
            theme={VictoryTheme.material}
            domain={{ y: [0, maxValor] }}
            padding={{ top: 10, bottom: 30, left: 45, right: 15 }}
          >
            <VictoryAxis
              tickValues={[1, 2, 3, 4, 5, 6]}
              tickFormat={(x) => dadosSemestre[x - 1]?.mes || ''}
              style={estiloEixoX}
            />
            <VictoryAxis dependentAxis tickFormat={formatarEixoY} style={estiloEixoY} />
              <VictoryArea
              data={dadosSemestre}
              x="x"
              y="receita"
              interpolation="monotoneX"
              style={{ data: { fill: 'rgba(26, 158, 117, 0.2)', stroke: COR_RECEITA, strokeWidth: 2 } }}
              labels={() => ''}
            />
            <VictoryArea
              data={dadosSemestre}
              x="x"
              y="despesa"
              interpolation="monotoneX"
              style={{ data: { fill: 'rgba(226, 75, 74, 0.18)', stroke: COR_DESPESA, strokeWidth: 2 } }}
              labels={() => ''}
            />
            <VictoryLine
              data={dadosSemestre}
              x="x"
              y="receita"
              interpolation="monotoneX"
              labels={() => ''}
              style={{ data: { stroke: COR_RECEITA, strokeWidth: 2 } }}
            />
            <VictoryLine
              data={dadosSemestre}
              x="x"
              y="despesa"
              interpolation="monotoneX"
              labels={() => ''}
              style={{ data: { stroke: COR_DESPESA, strokeWidth: 2 } }}
            />
          </VictoryChart>
        </View>
      )}

      {/* ── CATEGORIAS ── */}
      {aba === 'categorias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Despesas por Categoria</Text>
          <Text style={styles.graficoTitulo}>O gráfico mostra apenas despesas do mês selecionado</Text>

          {temCateg ? (
            <View style={styles.donutCenter}>
              <VictoryPie
                data={dadosPie}
                width={larguraGrafico}
                height={200}
                colorScale={CORES_CATEG}
                innerRadius={60}
                labels={() => ''}
                padding={15}
              />

              <View style={styles.categoriasCards}>
                {dadosPie.map((d, i) => (
                  <View key={d.x} style={styles.categoriaCard}>
                    <View style={[styles.categoriaDot, { backgroundColor: CORES_CATEG[i % CORES_CATEG.length] }]} />
                    <View style={styles.categoriaInfo}>
                      <Text style={styles.categoriaNome}>{d.x}</Text>
                      <Text style={styles.categoriaValor}>
                        R$ {d.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {totalDespesas > 0 ? ((d.y / totalDespesas) * 100).toFixed(1) : '0.0'}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.donutVazioWrap}>
              <VictoryPie
                data={[{ x: '', y: 1 }]}
                width={larguraGrafico}
                height={180}
                colorScale={['#E5E5EA']}
                innerRadius={60}
                labels={() => ''}
                padding={10}
              />
              <View style={styles.donutVazioLabel}>
                <Text style={styles.donutVazioTexto}>Sem{'\n'}dados</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── TENDÊNCIAS ── */}
      {aba === 'tendencias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Economia Mensal</Text>

          <VictoryChart
            width={larguraGrafico}
            height={220}
            theme={VictoryTheme.material}
            domain={{ y: [-maxEcon, Math.max(maxEcon, totalMeta > 0 ? totalMeta * 1.1 : 0)] }}
            padding={{ top: 10, bottom: 30, left: 45, right: 15 }}
          >
            <VictoryAxis
              tickValues={dadosMeses.map((d) => d.x)}
              tickFormat={MESES}
              style={estiloEixoX}
            />
            <VictoryAxis dependentAxis tickFormat={formatarEixoY} style={estiloEixoY} />
            <VictoryLine
              data={dadosMeses}
              x="x"
              y="economia"
              style={{ data: { stroke: COR_RECEITA, strokeWidth: 2.5 } }}
            />
          </VictoryChart>
        </View>
      )}

      {/* ── MODAL CUSTOMIZADO DO CALENDÁRIO ── */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Selecionar Mês</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.gridMeses}>
              {MESES.map((mes, index) => {
                const isSelected = index === mesSelecionado;
                return (
                  <TouchableOpacity
                    key={mes}
                    style={[styles.itemMes, isSelected && styles.itemMesAtivo]}
                    onPress={() => {
                      setMesSelecionado(index);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[styles.textoMes, isSelected && styles.textoMesAtivo]}>
                      {mes}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titulo: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  subtitulo: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  badgeMes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  badgeMesTexto: { fontSize: 12, color: '#3A3A3C', fontWeight: '500' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  iconeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  cardValor: { fontSize: 16, fontWeight: '700' },

  abas: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#EFEFF4',
    borderRadius: 20,
    padding: 3,
  },
  aba: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  abaAtiva: { backgroundColor: '#1A9E75' },
  abaTexto: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  abaTextoAtivo: { color: '#FFFFFF' },

  graficoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  graficoTitulo: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },

  legenda: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaCor: { width: 8, height: 8, borderRadius: 2 },
  legendaLabel: { fontSize: 11, color: '#8E8E93' },

  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  toggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', backgroundColor: '#FFFFFF' },
  toggleBtnAtivo: { backgroundColor: '#F0FDF4' },
  toggleText: { fontSize: 12, color: '#8E8E93' },
  toggleTextAtivo: { color: '#1A9E75', fontWeight: '600' },

  donutCenter: { alignItems: 'center', justifyContent: 'center' },
  donutVazioWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  donutVazioLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutVazioTexto: { fontSize: 12, color: '#AEAEB2', textAlign: 'center' },

  /* Cards de categorias abaixo do donut */
  categoriasCards: { marginTop: 16, width: '100%', gap: 8 },
  categoriaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  categoriaDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  categoriaInfo: { flex: 1 },
  categoriaNome: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  categoriaValor: { fontSize: 12, color: '#64748B', marginTop: 4 },

  /* Estilos do Modal de Calendário */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  gridMeses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  itemMes: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  itemMesAtivo: { backgroundColor: '#1A9E75' },
  textoMes: { fontSize: 13, fontWeight: '600', color: '#3A3A3C' },
  textoMesAtivo: { color: '#FFFFFF' },
});