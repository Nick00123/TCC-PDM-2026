import { Brain, DollarSign, Play, Puzzle, RefreshCw, Ruler, Search, Shield, TrendingUp, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { ActivityIndicator, ImageBackground, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Meta, Transacao } from '../../types';
import { buscarMetas, buscarTransacoes, pedirAnalise } from '../../utils/requisicoes';
import { endpointRest, headersAutenticados, obterUsuarioDaSessao } from '../../utils/sessao';

type Dica = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  conteudo: string;
  created_at: string;
};

async function buscarDicas(): Promise<Dica[]> {
  const resposta = await fetch(endpointRest('dicas?select=*&order=created_at.desc'), {
    headers: await headersAutenticados(),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Não foi possível buscar as dicas (${resposta.status}): ${detalhe}`);
  }

  return (await resposta.json()) as Dica[];
}

function iconeDaDica(categoria: string, tamanho = 28) {
  const props = { size: tamanho, color: categoria === 'Comportamento' ? '#6A1B9A' : '#1A9E75' };
  const icones: Record<string, React.ReactNode> = {
    Educação: <Ruler {...props} />,
    Investimento: <TrendingUp {...props} />,
    Comportamento: <Brain {...props} />,
    Segurança: <Shield {...props} />,
    Crédito: <DollarSign {...props} />,
    Empreendedorismo: <Puzzle {...props} />,
  };
  return icones[categoria] ?? <DollarSign {...props} />;
}

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
  const [dicas, setDicas] = useState<Dica[]>([]);
  const [carregandoDicas, setCarregandoDicas] = useState(true);
  const [erroDicas, setErroDicas] = useState<string | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [analise, setAnalise] = useState('');
  const [carregandoAnalise, setCarregandoAnalise] = useState(true);
  const [erroAnalise, setErroAnalise] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [dicaAberta, setDicaAberta] = useState<Dica | null>(null);
  const telaEmFoco = useIsFocused();

  const carregarTela = useCallback(async () => {
    setCarregandoDicas(true);
    setCarregandoAnalise(true);
    setErroDicas(null);
    setErroAnalise(null);

    let dicasDoBanco: Dica[];
    try {
      dicasDoBanco = await buscarDicas();
      setDicas(dicasDoBanco);
    } catch (error) {
      console.error(error);
      setErroDicas('Não foi possível carregar as dicas. Toque em atualizar para tentar novamente.');
      setErroAnalise('A análise depende das dicas cadastradas e não pôde ser gerada agora.');
      setCarregandoDicas(false);
      setCarregandoAnalise(false);
      return;
    }
    setCarregandoDicas(false);

    try {
      const usuario = await obterUsuarioDaSessao();
      if (!usuario) throw new Error('Usuário não autenticado.');
      const headers = await headersAutenticados();
      const [listaTransacoes, listaMetas] = await Promise.all([
        buscarTransacoes(usuario.id, headers),
        buscarMetas(usuario.id, headers),
      ]);
      const metasAtivas = listaMetas.filter((meta) => meta.atual < meta.total);
      setTransacoes(listaTransacoes);
      setMetas(metasAtivas);

      const receitas = listaTransacoes
        .filter((item) => item.tipo === 'receita')
        .reduce((total, item) => total + item.valor, 0);
      const despesas = listaTransacoes
        .filter((item) => item.tipo === 'despesa')
        .reduce((total, item) => total + item.valor, 0);
      const dicasDisponiveis = dicasDoBanco.map(({ id, titulo, descricao, categoria }) => ({
        id,
        titulo,
        descricao,
        categoria,
      }));

      setAnalise(await pedirAnalise({ receitas, despesas, metas: metasAtivas, dicasDisponiveis }));
    } catch (error) {
      console.error(error);
      setErroAnalise('Não foi possível gerar sua análise agora. Toque em atualizar para tentar novamente.');
    } finally {
      setCarregandoAnalise(false);
    }
  }, []);

  useEffect(() => {
    if (telaEmFoco) carregarTela();
  }, [telaEmFoco, carregarTela]);

  const dicasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return dicas;
    return dicas.filter(({ titulo, descricao, categoria }) =>
      `${titulo} ${descricao} ${categoria}`.toLocaleLowerCase('pt-BR').includes(termo)
    );
  }, [busca, dicas]);

  const buscaAtiva = busca.trim().length > 0;
  const dicasVisiveis = buscaAtiva || mostrarTodas
    ? dicasFiltradas
    : dicasFiltradas.slice(0, 4);

  return (
    <ScrollView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Dicas & Educação</Text>
        <Text style={styles.subtitulo}>Baseadas no seu perfil financeiro</Text>
      </View>

      {/* Dica personalizada */}
      <View style={styles.dicaDestaque}>
        <View style={styles.destaqueCabecalho}>
          <Text style={styles.dicaDestaqueLabel}>✨ Para você agora</Text>
          <TouchableOpacity
            onPress={carregarTela}
            disabled={carregandoAnalise || carregandoDicas}
            accessibilityLabel="Atualizar análise financeira"
            accessibilityHint={`Reanalisa ${transacoes.length} transações e ${metas.length} metas ativas`}
          >
            <RefreshCw size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {carregandoAnalise ? (
          <View style={styles.carregandoDestaque}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.dicaDestaqueTexto}>Analisando seu momento financeiro...</Text>
          </View>
        ) : (
          <Text style={styles.dicaDestaqueTexto}>{erroAnalise ?? analise}</Text>
        )}
      </View>

      <View style={styles.buscaContainer}>
        <Search size={20} color="#64748B" />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar dicas por tema ou categoria"
          placeholderTextColor="#94A3B8"
          style={styles.buscaInput}
          returnKeyType="search"
        />
      </View>

      {/* Lista de dicas (clicáveis) */}
      <Text style={styles.secaoTitulo}>Central de Aprendizado</Text>
      <Text style={styles.secaoSubtitulo}>Toque em um card para ver o conteúdo completo</Text>

      {carregandoDicas && <ActivityIndicator color="#1A9E75" style={styles.carregandoLista} />}
      {!carregandoDicas && erroDicas && <Text style={styles.erroLista}>{erroDicas}</Text>}
      {!carregandoDicas && !erroDicas && dicasVisiveis.map(dica => (
        <TouchableOpacity
          key={dica.id}
          style={styles.dicaCard}
          onPress={() => setDicaAberta(dica)}
          activeOpacity={0.7}
        >
          <View style={styles.dicaIcone}>{iconeDaDica(dica.categoria)}</View>
          <View style={styles.dicaInfo}>
            <View style={styles.dicaHeaderRow}>
              <Text style={styles.dicaTitulo}>{dica.titulo}</Text>
              <View style={[styles.badge, { backgroundColor: CORES_CATEGORIA[dica.categoria] ?? '#F1F5F9' }]}>
                <Text style={[styles.badgeTexto, { color: CORES_TEXTO[dica.categoria] ?? '#475569' }]}>
                  {dica.categoria}
                </Text>
              </View>
            </View>
            <Text style={styles.dicaDescricao} numberOfLines={2}>{dica.descricao}</Text>
            <Text style={styles.verDetalhe}>Ver conteúdo completo ▸</Text>
          </View>
        </TouchableOpacity>
      ))}
      {!carregandoDicas && !erroDicas && dicasFiltradas.length === 0 && (
        <Text style={styles.semResultados}>Nenhuma dica encontrada.</Text>
      )}
      {!carregandoDicas && !erroDicas && !buscaAtiva && dicasFiltradas.length > 4 && (
        <TouchableOpacity
          style={styles.botaoVerMais}
          onPress={() => setMostrarTodas((valorAtual) => !valorAtual)}
          accessibilityRole="button"
          accessibilityLabel={mostrarTodas ? 'Ver menos dicas' : 'Ver mais dicas'}
        >
          <Text style={styles.botaoVerMaisTexto}>
            {mostrarTodas ? 'Ver menos' : 'Ver mais'}
          </Text>
        </TouchableOpacity>
      )}

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
                {dicaAberta ? iconeDaDica(dicaAberta.categoria) : null}
              </View>
              <Text style={styles.modalTitulo}>{dicaAberta?.titulo}</Text>
              <TouchableOpacity onPress={() => setDicaAberta(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={[styles.badge, { backgroundColor: dicaAberta ? (CORES_CATEGORIA[dicaAberta.categoria] ?? '#F1F5F9') : '#E8F5E9', alignSelf: 'flex-start', marginBottom: 12 }]}>
              <Text style={[styles.badgeTexto, { color: dicaAberta ? (CORES_TEXTO[dicaAberta.categoria] ?? '#475569') : '#2E7D32' }]}>
                {dicaAberta?.categoria}
              </Text>
            </View>

            <ScrollView style={styles.modalConteudo} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescricao}>{dicaAberta?.descricao}</Text>
              <View style={styles.modalDivisor} />
              {dicaAberta?.conteudo.split(/\r?\n/).filter(Boolean).map((item, idx) => (
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
  },
  destaqueCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  carregandoDestaque: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  buscaContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  buscaInput: { flex: 1, paddingVertical: 13, paddingHorizontal: 10, color: '#1E293B' },
  semResultados: { color: '#64748B', textAlign: 'center', marginVertical: 20 },
  botaoVerMais: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 12,
  },
  botaoVerMaisTexto: { color: '#1A9E75', fontSize: 14, fontWeight: '700' },
  carregandoLista: { marginVertical: 24 },
  erroLista: { color: '#B91C1C', textAlign: 'center', marginHorizontal: 24, marginVertical: 20 },
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
