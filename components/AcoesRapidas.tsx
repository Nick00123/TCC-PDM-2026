import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const acoes = [
  { label: 'Receita',   icone: '↗', cor: '#e8f5e9', rota: '/transacoes' },
  { label: 'Despesa',   icone: '↙', cor: '#fce4ec', rota: '/transacoes' },
  { label: 'Relatório', icone: '🧾', cor: '#ede7f6', rota: '/relatorios' },
  { label: 'Metas',     icone: '🎯', cor: '#fff8e1', rota: '/metas' },
];

export default function AcoesRapidas() {
  return (
    <View style={styles.container}>
      {acoes.map(acao => (
        <TouchableOpacity
          key={acao.label}
          style={[styles.botao, { backgroundColor: acao.cor }]}
          onPress={() => router.push(acao.rota as any)}
        >  
          <Text style={styles.icone}>{acao.icone}</Text>
          <Text style={styles.label}>{acao.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
  },
  botao: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  icone: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});