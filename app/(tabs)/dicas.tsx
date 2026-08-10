import { Brain, DollarSign, Lightbulb, Play, Puzzle, Ruler, Shield, Target, TrendingUp, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ImageBackground, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Transacao, useFinance } from '../_layout';

type Dica = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'Educação' | 'Investimento' | 'Comportamento' | 'Segurança' | 'Crédito';
  icone: React.ReactNode;
  conteudo: string[];
};

const DICAS: Dica[] = [
  {
    id: '1',
    titulo: 'Regra 50-30-20',
    descricao: 'Necessidades 50%, desejos 30%, poupança/investimento 20%. Simples e eficaz para qualquer renda.',
    categoria: 'Educação',
    icone: <Ruler size={28} color="#1A9E75" />,
    conteudo: [
      'A regra 50-30-20 é um método simples de orçamento criado pela senadora Elizabeth Warren.',
      '50% da sua renda deve ir para necessidades: moradia, contas, alimentação, transporte.',
      '30% para desejos: lazer, restaurantes, assinaturas, viagens.',
      '20% para poupança e investimentos: o famoso "pague-se primeiro".',
      'Dica: ajuste os percentuais conforme sua realidade, mas mantenha a disciplina de separar pelo menos 20% para poupar.',
    ],
  },
  {
    id: '2',
    titulo: 'Juros compostos',
    descricao: 'R$ 200/mês investidos a 10% ao ano por 10 anos viram mais de R$ 38.000. Comece cedo!',
    categoria: 'Investimento',
    icone: <TrendingUp size={28} color="#1A9E75" />,
    conteudo: [
      'Juros compostos são os "juros sobre juros": o rendimento do mês se soma ao valor e volta a render no mês seguinte.',
      'O grande segredo é o TEMPO. Quanto mais cedo você começa, maior o efeito da bola de neve.',
      'Exemplo: investir R$ 200/mês a 1% ao mês por 10 anos gera cerca de R$ 46.000, sendo R$ 24.000 de aportes e R$ 22.000 de juros.',
      'A constância vence o valor: R$ 50 todo mês rende mais que R$ 500 de vez em quando.',
      'Aplicação prática: invista de forma automática todo mês e não interrompa nos primeiros meses ruins.',
    ],
  },
  {
    id: '3',
    titulo: 'Compra por impulso',
    descricao: 'Espere 24h antes de qualquer compra não planejada. Você vai se surpreender com quantas vontades passam!',
    categoria: 'Comportamento',
    icone: <Brain size={28} color="#6A1B9A" />,
    conteudo: [
      'Compras por impulso são responsáveis por grande parte do descontrole financeiro.',
      'A regra das 24 horas: ao sentir vontade de comprar algo não planejado, espere um dia.',
      'Na maioria das vezes, a "vontade" passa e você percebe que não precisava daquilo.',
      'Dica extra: liste o que você quer comprar e revise a lista após 1 semana. Só compre o que ainda fizer sentido.',
      'Evite salvar cartão em lojas online e desinstale apps de compras se necessário.',
    ],
  },
  {
    id: '4',
    titulo: 'Fundo de emergência',
    descricao: 'Antes de investir, guarde de 3 a 6 meses de despesas em um local seguro e de fácil acesso.',
    categoria: 'Segurança',
    icone: <Shield size={28} color="#1A9E75" />,
    conteudo: [
      'O fundo de emergência é o seu colchão de segurança para imprevistos.',
      'Serve para: perda de emprego, problemas de saúde, consertos urgentes.',
      'O ideal é guardar de 3 a 6 meses das suas despesas mensais.',
      'Deixe esse dinheiro em um local seguro e de resgate rápido, como o Tesouro Selic ou CDB com liquidez diária.',
      'Regra de ouro: NUNCA use esse dinheiro para viagens, compras ou vontades.',
    ],
  },
  {
    id: '5',
    titulo: 'Como investir R$100/mês',
    descricao: 'CDB, Tesouro Direto e fundos são boas opções para começar com pouco dinheiro.',
    categoria: 'Investimento',
    icone: <DollarSign size={28} color="#1A9E75" />,
    conteudo: [
      'Não precisa de muito dinheiro para começar a investir. R$100/mês já fazem diferença.',
      'Tesouro Direto: título público, seguro e com opções para todos os perfis.',
      'CDB: emitido por bancos, com proteção do FGC até R$250 mil por instituição.',
      'Fundos de investimento: geridos por profissionais, com aporte inicial baixo.',
      'Comece pelo Tesouro Selic (mais seguro) e vá estudando para expandir sua carteira.',
    ],
  },
  {
    id: '6',
    titulo: 'Psicologia do dinheiro',
    descricao: 'Nossas emoções afetam nossas decisões financeiras. Entender isso é o primeiro passo.',
    categoria: 'Comportamento',
    icone: <Puzzle size={28} color="#6A1B9A" />,
    conteudo: [
      'Nossas decisões financeiras são 80% comportamento e apenas 20% conhecimento.',
      'Entenda seus gatilhos de consumo: estresse, ansiedade, comparação social.',
      'Crie barreiras: defina limites de gasto, use dinheiro em espécie, evite parcelamentos longos.',
      'Automatize suas finanças: poupe antes de gastar, com transferência automática.',
      'Celebre pequenas vitórias: cada meta alcançada reforça o hábito saudável.',
    ],
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
  const [dicaAberta, setDicaAberta] = useState<Dica | null>(null);

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

      {/* Lista de dicas (clicáveis) */}
      <Text style={styles.secaoTitulo}>Central de Aprendizado</Text>
      <Text style={styles.secaoSubtitulo}>Toque em um card para ver o conteúdo completo</Text>

      {DICAS.map(dica => (
        <TouchableOpacity
          key={dica.id}
          style={styles.dicaCard}
          onPress={() => setDicaAberta(dica)}
          activeOpacity={0.7}
        >
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
            <Text style={styles.verDetalhe}>Ver conteúdo completo ▸</Text>
          </View>
        </TouchableOpacity>
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

      {/* Modal de detalhes da dica */}
      <Modal
        visible={dicaAberta !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDicaAberta(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconeMesa}>
                {dicaAberta?.icone}
              </View>
              <Text style={styles.modalTitulo}>{dicaAberta?.titulo}</Text>
              <TouchableOpacity onPress={() => setDicaAberta(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={[styles.badge, { backgroundColor: dicaAberta ? CORES_CATEGORIA[dicaAberta.categoria] : '#E8F5E9', alignSelf: 'flex-start', marginBottom: 12 }]}>
              <Text style={[styles.badgeTexto, { color: dicaAberta ? CORES_TEXTO[dicaAberta.categoria] : '#2E7D32' }]}>
                {dicaAberta?.categoria}
              </Text>
            </View>

            <ScrollView style={styles.modalConteudo} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescricao}>{dicaAberta?.descricao}</Text>
              <View style={styles.modalDivisor} />
              {dicaAberta?.conteudo.map((item, idx) => (
                <View key={idx} style={styles.conteudoItem}>
                  <Text style={styles.conteudoBullet}>•</Text>
                  <Text style={styles.conteudoTexto}>{item}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.btnEntendi} onPress={() => setDicaAberta(null)}>
              <Text style={styles.btnEntendiTexto}>Entendi!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  marginBottom: 4,
  marginTop: 8,
},
secaoSubtitulo: {
  fontSize: 12,
  color: '#888',
  marginHorizontal: 16,
  marginBottom: 12,
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
    flexShrink: 0,
  },
  badgeTexto: { fontSize: 11, fontWeight: '600' },
dicaDescricao: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 4 },
verDetalhe: { fontSize: 12, color: '#1A9E75', fontWeight: '600', marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconeMesa: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1 },
  modalConteudo: { flexGrow: 0, maxHeight: '60%' },
  modalDescricao: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  modalDivisor: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  conteudoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  conteudoBullet: { fontSize: 14, color: '#1A9E75', marginRight: 8, fontWeight: 'bold' },
  conteudoTexto: { fontSize: 14, color: '#333', lineHeight: 20, flex: 1 },
  btnEntendi: {
    backgroundColor: '#1A9E75',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnEntendiTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
