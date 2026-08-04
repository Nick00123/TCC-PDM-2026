import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

type Props = {
  saldo: number;
  receitas: number;
  despesas: number;
};

export default function BalanceCard({ saldo, receitas, despesas }: Props) {
  // Função auxiliar para formatar em moeda brasileira (R$)
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.card}>
      {/* Saldo Total */}
      <Text style={styles.label}>Saldo Total</Text>
      <Text style={styles.saldo}>R$ {formatCurrency(saldo)}</Text>

      {/* Mini-cards (Receitas e Despesas) */}
      <View style={styles.row}>
        {/* Card Receitas */}
        <View style={styles.caixinha}>
          <View style={styles.iconCircle}>
            <ArrowUpRight color="#FFFFFF" size={18} />
          </View>
          <View style={styles.caixinhaTextos}>
            <Text style={styles.caixinhaLabel}>Receitas</Text>
            <Text style={styles.caixinhaValor}>R$ {formatCurrency(receitas)}</Text>
          </View>
        </View>

        {/* Card Despesas */}
        <View style={styles.caixinha}>
          <View style={styles.iconCircle}>
            <ArrowDownLeft color="#FFFFFF" size={18} />
          </View>
          <View style={styles.caixinhaTextos}>
            <Text style={styles.caixinhaLabel}>Despesas</Text>
            <Text style={styles.caixinhaValor}>R$ {formatCurrency(despesas)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#26A69A', // Verde Teal idêntico ao modelo
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
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
  caixinhaTextos: {
    flexDirection: 'column',
  },
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
  },
});