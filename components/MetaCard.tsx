
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  titulo: string;
  atual: number;
  total: number;
}

export default function MetaCard({ titulo, atual, total }: Props) {
  const pct = Math.round((atual / total) * 100);

  return (
    <View style={styles.card}>

      {/* Linha com nome e percentual */}
      <View style={styles.row}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      {/* Barra de progresso */}
      <View style={styles.progressoBg}>
        <View style={[styles.progressoFill, { width: `${pct}%` }]} />
      </View>

      {/* Valores */}
      <View style={styles.row}>
        <Text style={styles.valores}>R$ {atual.toFixed(2)}</Text>
        <Text style={styles.valores}>R$ {total.toFixed(2)}</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  marginHorizontal: 16,
  marginBottom: 16,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pct: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressoBg: {
    backgroundColor: '#F0F0F0',
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressoFill: {
    backgroundColor: '#1A9E75',
    height: 8,
  },
  valores: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
});