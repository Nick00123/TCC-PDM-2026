import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { VictoryPie, VictoryLegend } from 'victory-native';
import { useFinance, Transacao } from '@/app/_layout';

const CORES = ['#1A9E75', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#FF5722', '#607D8B'];

export default function GastosPorCategoria() {
  const { transacoes } = useFinance();
  const { width } = useWindowDimensions();

  const categorias: { [key: string]: number } = {};
  transacoes
    .filter((t: Transacao) => t.tipo === 'despesa')
    .forEach((t: Transacao) => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    });

  const total = Object.values(categorias).reduce((a, b) => a + b, 0);

  const dados = Object.entries(categorias).map(([nome, valor], i) => ({
    x: nome,
    y: valor,
    label: `${Math.round((valor / total) * 100)}%`,
  }));

  const legenda = Object.entries(categorias).map(([nome], i) => ({
    name: nome,
    symbol: { fill: CORES[i % CORES.length] },
  }));

  if (dados.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Gastos por Categoria</Text>
      <View style={styles.row}>
        <VictoryPie
          data={dados}
          width={width * 0.45}
          height={180}
          colorScale={CORES}
          innerRadius={50}
          labelRadius={70}
          style={{
            labels: { fontSize: 11, fill: '#fff', fontWeight: 'bold' },
          }}
          padding={10}
        />
        <VictoryLegend
          x={0}
          y={20}
          width={width * 0.45}
          data={legenda}
          style={{
            labels: { fontSize: 12, fill: '#555' },
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});