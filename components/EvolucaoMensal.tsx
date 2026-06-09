import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, useWindowDimensions } from 'react-native';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryTheme } from 'victory-native';
import { useFinance, Transacao } from '@/app/_layout';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
               'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const COR_RECEITA = '#1a9e75';
const COR_DESPESA = '#e24b4a';

export default function EvolucaoMensal() {
  const { width } = useWindowDimensions();
  const largura = width - 64;
  const { transacoes } = useFinance();
  const [semestre, setSemestre] = useState<1 | 2>(1);

  // Usar índice numérico como x para evitar labels duplicadas do VictoryGroup (ó biblioteca chatinha)
  const dados = MESES.map((label, i) => {
    const receita = transacoes
      .filter((t: Transacao) => t.tipo === 'receita' && new Date(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

    const despesa = transacoes
      .filter((t: Transacao) => t.tipo === 'despesa' && new Date(t.data).getMonth() === i)
      .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

    return { x: i + 1, mes: label, receita, despesa };
  });

  const dadosSemestre = semestre === 1 ? dados.slice(0, 6) : dados.slice(6, 12);
  const labelsDoSemestre = dadosSemestre.map((d) => d.mes);

  // Calcular domínio Y real; forçar mínimo de 100 para evitar notação científica
  const maxValor = Math.max(
    ...dadosSemestre.map((d) => Math.max(d.receita, d.despesa)),
    100
  );

  const formatarEixoY = (valor: number) => {
    if (valor === 0) return 'R$0';
    if (valor >= 1000) return `R$${(valor / 1000).toFixed(1)}k`;
    return `R$${Math.round(valor)}`;
  };

  return (
    <View style={styles.card}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Evolução mensal</Text>

        {/* Toggle semestre */}
        <View style={styles.toggle}>
          <Pressable
            style={[styles.toggleBtn, semestre === 1 && styles.toggleBtnAtivo]}
            onPress={() => setSemestre(1)}
          >
            <Text style={[styles.toggleText, semestre === 1 && styles.toggleTextAtivo]}>
              Jan–Jun
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, semestre === 2 && styles.toggleBtnAtivo]}
            onPress={() => setSemestre(2)}
          >
            <Text style={[styles.toggleText, semestre === 2 && styles.toggleTextAtivo]}>
              Jul–Dez
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Legenda */}
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

      {/* Gráfico */}
      <VictoryChart
        width={largura}
        height={220}
        theme={VictoryTheme.material}
        domainPadding={{ x: 20 }}
        domain={{ y: [0, maxValor] }}
        padding={{ top: 10, bottom: 36, left: 52, right: 16 }}
      >
        {/* Eixo X: tickValues numéricos + tickFormat converte pra nome do mês */}
        <VictoryAxis
          tickValues={dadosSemestre.map((d) => d.x)}
          tickFormat={(_, i) => labelsDoSemestre[i] ?? ''}
          style={{
            axis: { stroke: '#e0e0e0' },
            tickLabels: { fill: '#999', fontSize: 11, padding: 6, fontFamily: 'System' },
            grid: { stroke: 'transparent' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={formatarEixoY}
          style={{
            axis: { stroke: 'transparent' },
            grid: { stroke: '#f0f0f0', strokeDasharray: '4,4' },
            tickLabels: { fill: '#999', fontSize: 10, padding: 6, fontFamily: 'System' },
          }}
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  toggle: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'transparent',
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
  legenda: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaCor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendaLabel: {
    fontSize: 12,
    color: '#888',
  },
});