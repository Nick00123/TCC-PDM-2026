import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { VictoryPie } from 'victory-native';
import type { Transacao } from '../types';

const CORES_CATEGORIAS = ['#1A9E75', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#FF5722', '#607D8B'];

type Props = {
  transacoes: Transacao[];
};

// Agrupa despesas por categoria e apresenta os totais em um gráfico de rosca.
// Recebe transações; não retorna dados, apenas renderiza o gráfico e sua legenda.
export default function GastosPorCategoria({ transacoes }: Props) {
  // O tamanho muda junto com a largura do celular.
  const { width } = useWindowDimensions();

  // Tamanho do donut dimensionado conforme a tela (metade da largura disponível)
  const tamanhoPie = Math.min(width / 2.4, 170);

  // Primeiro junto todas as despesas com o mesmo nome de categoria.
  const gastosPorCategoria: { [key: string]: number } = {};
  transacoes
    .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'despesa')
    .forEach((transacaoAtual: Transacao) => {
      gastosPorCategoria[transacaoAtual.categoria] = (gastosPorCategoria[transacaoAtual.categoria] || 0) + transacaoAtual.valor;
    });

  // Esse total serve para calcular a porcentagem de cada fatia.
  const totalGastos = Object.values(gastosPorCategoria).reduce((somaValores, valorCategoria) => somaValores + valorCategoria, 0);

  const dadosGrafico = Object.entries(gastosPorCategoria).map(([nomeCategoria, valorCategoria]) => ({
    x: nomeCategoria,
    y: valorCategoria,
  }));

  const categoriasParaLegenda = Object.entries(gastosPorCategoria).map(([nomeCategoria, valorCategoria], indiceCategoria) => {
    const porcentagem = totalGastos > 0 ? Math.round((valorCategoria / totalGastos) * 100) : 0;
    return {
      nome: nomeCategoria,
      porcentagem,
      cor: CORES_CATEGORIAS[indiceCategoria % CORES_CATEGORIAS.length],
    };
  });

  // Sem despesas, não tem gráfico para mostrar.
  if (dadosGrafico.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Gastos por Categoria</Text>

<View style={styles.containerGrafico}>
        <View style={[styles.pieContainer, { width: tamanhoPie, height: tamanhoPie }]}>
          <VictoryPie
            data={dadosGrafico}
            width={tamanhoPie}
            height={tamanhoPie}
            colorScale={CORES_CATEGORIAS}
            innerRadius={tamanhoPie * 0.3}
            padding={0}
            labels={() => null}
          />
        </View>

        <View style={styles.legendaContainer}>
          {categoriasParaLegenda.map((categoriaAtual) => (
            <View key={categoriaAtual.nome} style={styles.itemLegenda}>
              <View style={styles.infoEsquerda}>
                <View style={[styles.indicadorCor, { backgroundColor: categoriaAtual.cor }]} />
                <Text style={styles.nomeCategoria} numberOfLines={1}>
                  {categoriaAtual.nome}
                </Text>
              </View>
              <Text style={styles.porcentagem}>{categoriaAtual.porcentagem}%</Text>
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

/*
ARQUIVO: GastosPorCategoria.tsx

Responsabilidade:
Agrupar despesas por categoria e exibir sua proporção em um gráfico.

Principais elementos:
- GastosPorCategoria()
- preparação de dadosGrafico
- categoriasParaLegenda

Fluxo:
Transações -> soma por categoria -> porcentagens e cores -> gráfico e legenda

Conceitos usados:
- filter e forEach
- Object.entries e Object.values
- VictoryPie
- renderização condicional
*/
