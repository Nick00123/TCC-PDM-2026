import { Brain, DollarSign, Lightbulb, Play, Puzzle, Ruler, Shield, Target, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Transacao, useFinance } from '../_layout';

type Dica = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'Educação' | 'Investimento' | 'Comportamento' | 'Segurança' | 'Crédito';
  icone: React.ReactNode;
};

const DICAS: Dica[] = [
  {
    id: '1',
    titulo: 'Regra 50-30-20',
    descricao: 'Necessidades 50%, desejos 30%, poupança/investimento 20%. Simples e eficaz para qualquer renda.',
    categoria: 'Educação',
    icone: <Ruler size={28} color="#1A9E75" />,
  },
  {
    id: '2',
    titulo: 'Juros compostos',
    descricao: 'R$ 200/mês investidos a 10% ao ano por 10 anos viram mais de R$ 38.000. Comece cedo!',
    categoria: 'Investimento',
    icone: <TrendingUp size={28} color="#1A9E75" />,
  },
  {
    id: '3',
    titulo: 'Compra por impulso',
    descricao: 'Espere 24h antes de qualquer compra não planejada. Você vai se surpreender com quantas vontades passam!',
    categoria: 'Comportamento',
    icone: <Brain size={28} color="#6A1B9A" />,
  },
  {
    id: '4',
    titulo: 'Fundo de emergência',
    descricao: 'Antes de investir, guarde de 3 a 6 meses de despesas em um local seguro e de fácil acesso.',
    categoria: 'Segurança',
    icone: <Shield size={28} color="#1A9E75" />,
  },
  {
    id: '5',
    titulo: 'Como investir R$100/mês',
    descricao: 'CDB, Tesouro Direto e fundos são boas opções para começar com pouco dinheiro.',
    categoria: 'Investimento',
    icone: <DollarSign size={28} color="#1A9E75" />,
  },
  {
    id: '6',
    titulo: 'Psicologia do dinheiro',
    descricao: 'Nossas emoções afetam nossas decisões financeiras. Entender isso é o primeiro passo.',
    categoria: 'Comportamento',
    icone: <Puzzle size={28} color="#6A1B9A" />,
  },
];

type Video = {
  id: string;
  titulo: string;
  canal: string;
  duracao: string;
  categoria: string;
  url: string;
  thumbnail?: string;
};

const getYoutubeThumbnail = (url: string) => {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : undefined;
};

const VIDEOS: Video[] = [
  {
    id: '1',
    titulo: 'COMO ORGANIZAR SUAS FINANÇAS E GUARDAR DINHEIRO | Planejamento financeiro FÁCIL',
    canal: 'O Primo Rico',
    duracao: '17 min',
    categoria: 'Orçamento',
    url: 'https://www.youtube.com/watch?v=in0XbfQEm2A',
  },
  {
    id: '2',
    titulo: 'EduFinance: Regra 50-30-20',
    canal: 'TCC-teste',
    duracao: '7 min',
    categoria: 'Planejamento',
    url: 'https://youtu.be/aMgegLLLY9A',
  },
  {
    id: '3',
    titulo: 'Tesouro Direto para iniciantes: do Selic ao Renda+! Como investir?',
    canal: 'Me Poupe!',
    duracao: '12 min',
    categoria: 'Investimento',
    url: 'https://www.youtube.com/watch?v=y2sBkIX72-g',
  },
  {
    id: '4',
    titulo: 'Como sair das DIVIDAS! (com sacrifícios e dicas REAIS...)',
    canal: 'O Primo Rico',
    duracao: '13 min',
    categoria: 'Dívidas',
    url: 'https://www.youtube.com/watch?v=8zj0GJKTWwE',
  },
];

const CORES_CATEGORIA: { [key: string]: string } = {
  Educação: '#E3F2FD',
  Investimento: '#E8F5E9',
  Comportamento: '#F3E5F5',
  Segurança: '#E8F5E9',
  Crédito: '#FFF3E0',
};

const CORES_TEXTO: { [key: string]: string } = {
  Educação: '#1565C0',
  Investimento: '#2E7D32',
  Comportamento: '#6A1B9A',
  Segurança: '#1A9E75',
  Crédito: '#E65100',
};

export default function Dicas() {
  const { transacoes, totalReceitas, totalDespesas } = useFinance();

  // Lógica da dica personalizada
  const getDicaPersonalizada = () => {
    if (totalDespesas > totalReceitas) {
      return {
        titulo: 'Atenção aos seus gastos!',
        descricao: 'Suas despesas estão maiores que suas receitas. Tente reduzir gastos não essenciais e crie um orçamento mensal.',
        icone: <Target size={22} color="#fff" />,
      };
    }

    // Categoria com mais gastos
    const categorias: { [key: string]: number } = {};
    transacoes
      .filter((t: Transacao) => t.tipo === 'despesa')
      .forEach((t: Transacao) => {
        categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
      });

    const maiorCategoria = Object.entries(categorias).sort((a, b) => b[1] - a[1])[0];

    if (maiorCategoria) {
      const [nome, valor] = maiorCategoria;
      const pct = Math.round((valor / totalDespesas) * 100);
      if (pct > 50) {
        return {
          titulo: `Você gasta muito com ${nome}`,
          descricao: `${pct}% das suas despesas são com ${nome}. Tente diversificar seus gastos e verificar onde pode economizar.`,
          icone: <Lightbulb size={22} color="#fff" />,
        };
      }
    }

    const economia = totalReceitas - totalDespesas;
    if (economia > 0) {
      return {
        titulo: 'Você está economizando!',
        descricao: `Parabéns! Você economizou R$ ${economia.toFixed(2)} este mês. Que tal investir esse valor no Tesouro Direto?`,
        icone: <Target size={22} color="#fff" />,
      };
    }

    return {
      titulo: 'Fundo de emergência',
      descricao: 'Antes de investir, guarde de 3 a 6 meses de despesas em um local seguro e de fácil acesso.',
      icone: <Shield size={22} color="#fff" />,
    };
  };

  const dicaPersonalizada = getDicaPersonalizada();

  return (
    <ScrollView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Dicas & Educação</Text>
        <Text style={styles.subtitulo}>Baseadas no seu perfil financeiro</Text>
      </View>

      {/* Dica personalizada */}
      <View style={styles.dicaDestaque}>
        <Text style={styles.dicaDestaqueLabel}>✨ Para você agora</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={styles.dicaIcone}>{dicaPersonalizada.icone}</View>
          <Text style={styles.dicaDestaqueTitulo}>{dicaPersonalizada.titulo}</Text>
        </View>
        <Text style={styles.dicaDestaqueTexto}>{dicaPersonalizada.descricao}</Text>
      </View>

      {/* Lista de dicas */}
      <Text style={styles.secaoTitulo}>Central de Aprendizado</Text>

      {DICAS.map(dica => (
        <View key={dica.id} style={styles.dicaCard}>
          <View style={styles.dicaIcone}>{dica.icone}</View>
          <View style={styles.dicaInfo}>
            <View style={styles.dicaHeaderRow}>
              <Text style={styles.dicaTitulo}>{dica.titulo}</Text>
              <View style={[styles.badge, { backgroundColor: CORES_CATEGORIA[dica.categoria] }]}>
                <Text style={[styles.badgeTexto, { color: CORES_TEXTO[dica.categoria] }]}>
                  {dica.categoria}
                </Text>
              </View>
            </View>
            <Text style={styles.dicaDescricao} numberOfLines={2}>{dica.descricao}</Text>
            {/* <Text style={styles.dicaTempo}>{dica.tempo}</Text> */}
          </View>
        </View>
      ))}

      {/* Seção de vídeos */}
    <Text style={styles.secaoTitulo}>Aprenda com Vídeos</Text>

<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosScroll}>
  {VIDEOS.map(video => (
    <TouchableOpacity
      key={video.id}
      style={styles.videoCard}
      onPress={() => Linking.openURL(video.url)}
    >
      {/* Thumbnail */}
      <ImageBackground
        source={{ uri: video.thumbnail || getYoutubeThumbnail(video.url) }}
        style={styles.thumbnail}
        imageStyle={styles.thumbnailImage}
        resizeMode="cover"
      >
        <View style={styles.playOverlay}>
          <Play size={28} color="#fff" fill="#fff" />
        </View>
      </ImageBackground>

      {/* Info */}
      <View style={styles.videoInfo}>
        <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.badgeTexto, { color: '#2E7D32' }]}>{video.categoria}</Text>
        </View>
        <Text style={styles.videoTitulo} numberOfLines={2}>{video.titulo}</Text>
        <Text style={styles.videoCanal}>{video.canal}</Text>
        <Text style={styles.videoDuracao}>⏱ {video.duracao}</Text>
      </View>
    </TouchableOpacity>
  ))}
</ScrollView>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    marginBottom: 16,
  },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 2 },
  dicaDestaque: {
    backgroundColor: '#1A9E75',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
  },
  dicaDestaqueLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 8,
  },
  dicaDestaqueTitulo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dicaDestaqueTexto: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  secaoTitulo: {
  fontSize: 16,
  fontWeight: 'bold',
  marginHorizontal: 16,
  marginBottom: 12,
  marginTop: 8,
},
videosScroll: { paddingLeft: 16, marginBottom: 24 },
videoCard: {
  backgroundColor: '#fff',
  borderRadius: 16,
  marginRight: 12,
  width: 200,
  overflow: 'hidden',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
},
thumbnail: {
  backgroundColor: '#1A9E75',
  height: 110,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
thumbnailImage: {
  width: '100%',
  height: '100%',
},
playOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.2)',
},
videoInfo: { padding: 12 },
videoTitulo: { fontSize: 13, fontWeight: 'bold', marginVertical: 4 },
videoCanal: { fontSize: 12, color: '#888' },
videoDuracao: { fontSize: 11, color: '#aaa', marginTop: 4 },
  dicaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dicaIcone: { width: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dicaInfo: { flex: 1 },
  dicaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dicaTitulo: { fontSize: 15, fontWeight: 'bold', flex: 1, marginRight: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeTexto: { fontSize: 11, fontWeight: '600' },
  dicaDescricao: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 4 },
  dicaTempo: { fontSize: 11, color: '#aaa' },
});