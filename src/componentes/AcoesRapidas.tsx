import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, BarChart2, Target } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const acoes = [
  { label: 'Receita', icone: ArrowDownLeft, cor: '#E6F4EA', corIcone: '#1A9E75', rota: '/transacoes' },
  { label: 'Despesa', icone: ArrowUpRight, cor: '#FCE8E6', corIcone: '#E53935', rota: '/transacoes' },
  { label: 'Relatório', icone: BarChart2, cor: '#F3E8FF', corIcone: '#8E24AA', rota: '/relatorios' },
  { label: 'Metas', icone: Target, cor: '#FEF7E0', corIcone: '#F57F17', rota: '/metas' },
];

export default function AcoesRapidas() {
  return (
    <View style={styles.container}>
      {acoes.map((acao) => {
        const Icone = acao.icone;
        return (
          <TouchableOpacity
            key={acao.label}
            style={styles.item}
            onPress={() => router.push(acao.rota as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.boxIcone, { backgroundColor: acao.cor }]}>
              <Icone size={22} color={acao.corIcone} />
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
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
