import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  icone?: string | ReactNode;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: 'receita' | 'despesa';
}

export default function TransacaoItem({ icone, descricao, categoria, valor, tipo }: Props) {
  return (
    <View style={styles.item}>
      <View style={styles.iconeBox}>
        <Text style={styles.icone}>{icone}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.descricao}>{descricao}</Text>
        <Text style={styles.categoria}>{categoria}</Text>
      </View>
      {/* Valor muda de cor dependendo do tipo */}
      <Text style={[styles.valor, { color: tipo === 'receita' ? '#1a9e75' : '#e53935' }]}>
        {tipo === 'receita' ? '+' : '-'}R$ {valor.toFixed(2)}
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconeBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icone: {
    fontSize: 24,
    color: '#1a9e75',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  descricao: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  categoria: {
    fontSize: 12,
    color: '#888',
  },
  valor: {
    fontSize: 16,
    fontWeight: '700',
  },    
});