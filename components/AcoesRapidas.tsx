import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, BarChart2, Target } from 'lucide-react-native';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { estiloEntradaCascata, useAnimacaoCascata } from '../utils/animacoes';

const acoesRapidas = [
  { label: 'Receita', icone: ArrowDownLeft, cor: '#E6F4EA', corIcone: '#1A9E75', rota: '/transacoes' },
  { label: 'Despesa', icone: ArrowUpRight, cor: '#FCE8E6', corIcone: '#E53935', rota: '/transacoes' },
  { label: 'Relatório', icone: BarChart2, cor: '#F3E8FF', corIcone: '#8E24AA', rota: '/relatorios' },
  { label: 'Metas', icone: Target, cor: '#FEF7E0', corIcone: '#F57F17', rota: '/metas' },
];

// Exibe atalhos de navegação para as principais áreas do aplicativo.
// Não recebe props nem retorna dados; renderiza os botões de ação rápida.
export default function AcoesRapidas() {
  const { animacoes } = useAnimacaoCascata(acoesRapidas.length, 100, 70);

  return (
    <View style={styles.container}>
      {acoesRapidas.map((acao, indice) => {
        const Icone = acao.icone;
        return (
          <Animated.View key={acao.label} style={[styles.itemWrapper, estiloEntradaCascata(animacoes[indice])]}>
            <TouchableOpacity
              style={styles.item}
              onPress={() => router.push(acao.rota as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.boxIcone, { backgroundColor: acao.cor }]}>
                <Icone size={22} color={acao.corIcone} />
              </View>
              <Text style={styles.label}>{acao.label}</Text>
            </TouchableOpacity>
          </Animated.View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemWrapper: { flex: 1 },
  item: { alignItems: 'center', flex: 1 },
  boxIcone: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
});
