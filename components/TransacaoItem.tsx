import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { formatarMoeda } from '../utils/formatacao';

type Props = {
  descricao: string;
  categoria: string;
  valor: number;
  tipo: 'receita' | 'despesa';
};

export default function TransacaoItem({ descricao, categoria, valor, tipo }: Props) {
  const isReceita = tipo === 'receita';
  const Icone = isReceita ? ArrowUpRight : ArrowDownLeft;

  return (
    <View style={styles.item}>
      <View style={[styles.iconeBox, { backgroundColor: isReceita ? '#DCFCE7' : '#FFE4E6' }]}>
        <Icone size={20} color={isReceita ? '#1a9e75' : '#e53935'} />
      </View>
      <View style={styles.info}>
        <Text style={styles.descricao}>{descricao}</Text>
        <Text style={styles.categoria}>{categoria}</Text>
      </View>
      <Text style={[styles.valor, { color: isReceita ? '#1a9e75' : '#e53935' }]}>
        {isReceita ? '+' : '-'}R$ {formatarMoeda(valor)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 19,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconeBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  descricao: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  categoria: { fontSize: 12, color: '#888' },
  valor: { fontSize: 16, fontWeight: '700' },
});
