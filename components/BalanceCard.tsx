import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatarMoeda } from '../utils/formatacao';

type Props = {
  saldo: number;
  receitas: number;
  despesas: number;
};

export default function BalanceCard({ saldo, receitas, despesas }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Saldo Total</Text>
      <Text style={styles.saldo}>R$ {formatarMoeda(saldo)}</Text>

      <View style={styles.row}>
        <View style={styles.caixinha}>
          <View style={styles.iconCircle}>
            <ArrowUpRight color="#FFFFFF" size={18} />
          </View>
          <View style={styles.caixinhaTextos}>
            <Text style={styles.caixinhaLabel}>Receitas</Text>
            <Text style={styles.caixinhaValor}>R$ {formatarMoeda(receitas)}</Text>
          </View>
        </View>

        <View style={styles.caixinha}>
          <View style={styles.iconCircle}>
            <ArrowDownLeft color="#FFFFFF" size={18} />
          </View>
          <View style={styles.caixinhaTextos}>
            <Text style={styles.caixinhaLabel}>Despesas</Text>
            <Text style={styles.caixinhaValor}>R$ {formatarMoeda(despesas)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#26A69A',
    padding: 20,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  saldo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', gap: 12 },
  caixinha: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
caixinhaTextos: { flexDirection: 'column', flexShrink: 1 },
  caixinhaLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  caixinhaValor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
    flexShrink: 1,
  },
});
