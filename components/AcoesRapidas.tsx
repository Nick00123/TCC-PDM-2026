import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, TrendingDown, BarChart2, Target } from 'lucide-react-native';

const acoes = [
  { label: 'Receita',   icone: TrendingUp,   cor: '#e8f5e9', corIcone: '#1A9E75', rota: '/transacoes' },
  { label: 'Despesa',   icone: TrendingDown,  cor: '#fce4ec', corIcone: '#F44336', rota: '/transacoes' },
  { label: 'Relatório', icone: BarChart2,     cor: '#ede7f6', corIcone: '#7B1FA2', rota: '/relatorios' },
  { label: 'Metas',     icone: Target,        cor: '#fff8e1', corIcone: '#F57F17', rota: '/metas' },
];

export default function AcoesRapidas() {
  return (
    <View style={styles.container}>
      {acoes.map(acao => {
        const Icone = acao.icone;
        return (
          <TouchableOpacity
            key={acao.label}
            style={[styles.botao, { backgroundColor: acao.cor }]}
            onPress={() => router.push(acao.rota as any)}
          >
            <Icone size={24} color={acao.corIcone} />
            <Text style={styles.label}>{acao.label}</Text>
          </TouchableOpacity>
        );
      })}
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
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});