import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryTheme } from 'victory-native';
import { useFinance, Transacao } from '@/app/_layout';

export default function EvolucaoMensal() {
  const { width } = useWindowDimensions();
  const largura = width - 64;
   const { transacoes } = useFinance();

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const dados = meses.map((label, i) => {
  const receita = transacoes
    .filter((t: Transacao) => t.tipo === 'receita' && new Date(t.data).getMonth() === i)
    .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

  const despesa = transacoes
    .filter((t: Transacao) => t.tipo === 'despesa' && new Date(t.data).getMonth() === i)
    .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

  return { label, receita, despesa };
});

    return (
        <View style={styles.card}>
            <Text style={styles.titulo}>Evolução Mensal</Text>
            <VictoryChart
                width={largura}
                height={260}
                theme={VictoryTheme.material}
                domainPadding={{ x: 24, y: 16 }}
            >
                <VictoryAxis
                    style={{
                        axis: { stroke: '#ccc' },
                        tickLabels: { fill: '#888', fontSize: 10, padding: 6 },
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={(value) => `R$${value}`}
                    style={{
                        axis: { stroke: '#ccc' },
                        grid: { stroke: '#eee' },
                        tickLabels: { fill: '#888', fontSize: 10, padding: 6 },
                    }}
                />
                <VictoryGroup offset={16} colorScale={['#1a9e75', '#f44336']}>
                    <VictoryBar
                        data={dados}
                        x="label"
                        y="receita"
                    />
                    <VictoryBar
                        data={dados}
                        x="label"
                        y="despesa"
                    />
                </VictoryGroup>
            </VictoryChart>
        </View>
    );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 26,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});