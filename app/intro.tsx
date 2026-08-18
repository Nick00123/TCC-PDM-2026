import { useRouter } from 'expo-router';
import { BookOpen, LineChart, PiggyBank, Sparkles, Target, Wallet } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obterSessaoValida } from '../utils/sessao';

const RECURSOS = [
  {
    icone: <Wallet size={22} color="#1A9E75" />,
    titulo: 'Controle Financeiro',
    descricao: 'Registre suas receitas e despesas',
  },
  {
    icone: <Target size={22} color="#F57F17" />,
    titulo: 'Metas de Economia',
    descricao: 'Realize seus sonhos com planejamento',
  },
  {
    icone: <LineChart size={22} color="#8E24AA" />,
    titulo: 'Relatórios Completos',
    descricao: 'Acompanhe sua evolução por gráficos',
  },
  {
    icone: <BookOpen size={22} color="#1565C0" />,
    titulo: 'Educação Financeira',
    descricao: 'Aprenda a cuidar do seu dinheiro',
  },
];

export default function Intro() {
  const router = useRouter();

  const irPara = async () => {
    const sessao = await obterSessaoValida();
    router.replace(sessao ? '/(tabs)' : '/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Logo + Título */}
      <View style={styles.top}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.titulo}>Bem-vindo ao EduFinance</Text>
        <Text style={styles.subtitulo}>
          Sua educação financeira na palma da mão. Aprenda, planeje e alcance
          seus sonhos.
        </Text>
      </View>

      {/* Recursos */}
      <View style={styles.cards}>
        {RECURSOS.map((r) => (
          <View key={r.titulo} style={styles.card}>
            <View style={styles.cardIcone}>{r.icone}</View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitulo}>{r.titulo}</Text>
              <Text style={styles.cardDescricao}>{r.descricao}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Text style={styles.ctaFrase}>
          <Sparkles size={16} color="#F7FFF7" /> {' '}
          Comece a transformar sua relação com o dinheiro hoje!
        </Text>

        <TouchableOpacity style={styles.btnEntrar} onPress={irPara} activeOpacity={0.8}>
          <Text style={styles.btnEntrarTexto}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCriar} onPress={irPara} activeOpacity={0.8}>
          <PiggyBank size={18} color="#1A9E75" />
          <Text style={styles.btnCriarTexto}>Criar minha conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7DC1A8' },
  content: { padding: 24, paddingBottom: 40 },
  top: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  logo: { width: 200, height: 160, marginBottom: 16 },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F7FFF7',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: 15,
    color: 'rgba(247,255,247,0.9)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  cards: { gap: 12, marginBottom: 28 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardIcone: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEF7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#1A202C' },
  cardDescricao: { fontSize: 13, color: '#718096', marginTop: 2 },
  ctaArea: { alignItems: 'center' },
  ctaFrase: {
    fontSize: 14,
    color: '#F7FFF7',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  btnEntrar: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnEntrarTexto: { color: '#1A9E75', fontSize: 17, fontWeight: '800' },
  btnCriar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF7F3',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1A9E75',
  },
  btnCriarTexto: { color: '#1A9E75', fontSize: 17, fontWeight: '800' },
});
