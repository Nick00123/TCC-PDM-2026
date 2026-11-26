import { useRouter } from 'expo-router';
import { Bot, FileText, LineChart, PiggyBank, Sparkles, Target, Wallet } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { estiloEntradaCascata, useAnimacaoCascata } from '../utils/animacoes';
import { obterSessaoValida } from '../utils/sessao';

const RECURSOS_APRESENTACAO = [
  {
    icone: <Wallet size={20} color="#1A9E75" />,
    titulo: 'Controle Financeiro',
    descricao: 'Registre receitas e despesas facilmente',
  },
  {
    icone: <Target size={20} color="#F57F17" />,
    titulo: 'Metas de Economia',
    descricao: 'Realize seus sonhos com planejamento',
  },
  {
    icone: <LineChart size={20} color="#8E24AA" />,
    titulo: 'Relatórios e Gráficos',
    descricao: 'Acompanhe sua evolução financeira',
  },
  {
    icone: <FileText size={20} color="#D97706" />,
    titulo: 'Exportação em PDF',
    descricao: 'Gere relatórios completos para download',
  },
  {
    icone: <Bot size={20} color="#2563EB" />,
    titulo: 'Assistente Inteligente',
    descricao: 'Dicas personalizadas com Inteligência Artificial',
  },
];

export default function Intro() {
  const router = useRouter();

  const { fadeAnimTop, animacoes } = useAnimacaoCascata(RECURSOS_APRESENTACAO.length, 200, 120);
  const [fadeAnimCta] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnimCta, {
      toValue: 1,
      duration: 600,
      delay: 200 + RECURSOS_APRESENTACAO.length * 120,
      useNativeDriver: true,
    }).start();
  }, [fadeAnimCta]);

  const continuarParaAutenticacao = async (modoAutenticacao: 'entrar' | 'criar') => {
    const sessaoAtiva = await obterSessaoValida();
    if (sessaoAtiva) {
      router.replace('/(tabs)');
      return;
    }
    router.replace({ pathname: '/login', params: { aba: modoAutenticacao } });
  };

  const translateYTop = fadeAnimTop.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Logo + Título Animado */}
      <Animated.View style={[styles.top, { opacity: fadeAnimTop, transform: [{ translateY: translateYTop }] }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/fundoTransparante.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.titulo}>EduFinance</Text>
        <Text style={styles.subtitulo}>
          Sua educação financeira inteligente na palma da mão. Aprenda, planeje e evolua.
        </Text>
      </Animated.View>

      {/* Cards de Recursos com Animação em Cascata */}
      <View style={styles.cardsGrid}>
        {RECURSOS_APRESENTACAO.map((recursoAtual, index) => {
          return (
            <Animated.View
              key={recursoAtual.titulo}
              style={[styles.card, estiloEntradaCascata(animacoes[index])]}
            >
              <View style={styles.cardIcone}>{recursoAtual.icone}</View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitulo}>{recursoAtual.titulo}</Text>
                <Text style={styles.cardDescricao}>{recursoAtual.descricao}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Área de Ação (CTA) Animada */}
      <Animated.View style={[styles.ctaArea, { opacity: fadeAnimCta }]}>
        <View style={styles.badgeIa}>
          <Sparkles size={14} color="#FFF" />
          <Text style={styles.badgeText}>Impulsionado por Inteligência Artificial</Text>
        </View>

        <TouchableOpacity
          style={styles.btnEntrar}
          onPress={() => continuarParaAutenticacao('entrar')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnEntrarTexto}>Entrar na minha conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnCriar}
          onPress={() => continuarParaAutenticacao('criar')}
          activeOpacity={0.85}
        >
          <PiggyBank size={18} color="#1A9E75" />
          <Text style={styles.btnCriarTexto}>Criar nova conta</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6CB299' },
  content: { padding: 20, paddingBottom: 36, paddingTop: 45 },
  top: { alignItems: 'center', marginBottom: 16 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  logo: { width: 55, height: 55 },
  titulo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F7FFF7',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: 13,
    color: 'rgba(247,255,247,0.85)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  cardsGrid: { gap: 8, marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F7F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitulo: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  cardDescricao: { fontSize: 11.5, color: '#718096', marginTop: 1 },
  ctaArea: { alignItems: 'center', width: '100%' },
  badgeIa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  btnEntrar: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnEntrarTexto: { color: '#1A9E75', fontSize: 16, fontWeight: '800' },
  btnCriar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5F0',
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#1A9E75',
  },
  btnCriarTexto: { color: '#1A9E75', fontSize: 16, fontWeight: '800' },
});