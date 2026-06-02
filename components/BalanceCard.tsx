import { Text, View, StyleSheet } from 'react-native';

// Recebe saldo, receitas e despesas como props
type Props = {
  saldo: number;
  receitas: number;
  despesas: number;
}

export default function BalanceCard({ saldo, receitas, despesas }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Saldo Total</Text>

      {/* Aqui aparece o valor real vindo das props */}
      <Text style={styles.saldo}>R$ {saldo}</Text>

      {/* Caixinhas lado a lado */}
      <View style={styles.row}>
        <View style={styles.caixinha}>
          <Text style={styles.caixinhaLabel}>↗ Receitas</Text>
          <Text style={styles.caixinhaValor}>R$ {receitas}</Text>
        </View>
        <View style={styles.caixinha}>
          <Text style={styles.caixinhaLabel}>↙ Despesas</Text>
          <Text style={styles.caixinhaValor}>R$ {despesas}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    card: { 
  backgroundColor: '#1a9e75', // ← verde
  padding: 20, // ← mais espaço
  borderRadius: 20,           // ← mais arredondado
},
label: {
  fontSize: 13,
  color: 'rgba(255,255,255,0.85)', // ← branco semitransparente
  marginBottom: 4,
},
saldo: {
  fontSize: 32,
  fontWeight: 'bold',
  color: '#fff',             // ← branco
  marginBottom: 20,
},
caixinha: {
  flex: 1,                   // ← em vez de width: '48%'
  backgroundColor: 'rgba(255,255,255,0.15)', // ← branco transparente
  padding: 12,
  borderRadius: 12,
},
caixinhaLabel: {
  fontSize: 11,
  color: 'rgba(255,255,255,0.8)', // ← branco
  marginBottom: 4,
},
caixinhaValor: {
  fontSize: 15,
  fontWeight: '600',
  color: '#fff',             // ← branco
},
row: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12, // ← espaço entre as caixinhas (se suportado) ou use margin
}

    });
