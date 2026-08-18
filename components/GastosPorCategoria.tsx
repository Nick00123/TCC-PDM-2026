import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { VictoryPie } from 'victory-native';
import type { Transacao } from '../types';

const CORES = ['#1A9E75', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#FF5722', '#607D8B'];

type Props = {
  transacoes: Transacao[];
};

export default function GastosPorCategoria({ transacoes }: Props) {
  const { width } = useWindowDimensions();

  // Tamanho do donut dimensionado conforme a tela (metade da largura disponível)
  const tamanhoPie = Math.min(width / 2.4, 170);

  const categorias: { [key: string]: number } = {};
  transacoes
    .filter((t: Transacao) => t.tipo === 'despesa')
    .forEach((t: Transacao) => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    });

  const total = Object.values(categorias).reduce((a, b) => a + b, 0);

  const dados = Object.entries(categorias).map(([nome, valor]) => ({
    x: nome,
    y: valor,
  }));

  const listaCategorias = Object.entries(categorias).map(([nome, valor], index) => {
    const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;
    return {
      nome,
      porcentagem,
      cor: CORES[index % CORES.length],
    };
  });

  if (dados.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Gastos por Categoria</Text>

<View style={styles.containerGrafico}>
        <View style={[styles.pieContainer, { width: tamanhoPie, height: tamanhoPie }]}>
          <VictoryPie
            data={dados}
            width={tamanhoPie}
            height={tamanhoPie}
            colorScale={CORES}
            innerRadius={tamanhoPie * 0.3}
            padding={0}
            labels={() => null}
          />
        </View>

        <View style={styles.legendaContainer}>
          {listaCategorias.map((item) => (
            <View key={item.nome} style={styles.itemLegenda}>
              <View style={styles.infoEsquerda}>
                <View style={[styles.indicadorCor, { backgroundColor: item.cor }]} />
                <Text style={styles.nomeCategoria} numberOfLines={1}>
                  {item.nome}
                </Text>
              </View>
              <Text style={styles.porcentagem}>{item.porcentagem}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  containerGrafico: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendaContainer: { flex: 1, marginLeft: 20, gap: 10 },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  indicadorCor: { width: 8, height: 8, borderRadius: 4 },
  nomeCategoria: { fontSize: 13, color: '#555555', fontWeight: '500' },
  porcentagem: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 20,
  },
});
