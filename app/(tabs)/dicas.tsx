import { useFocusEffect } from 'expo-router';
import { Brain, DollarSign, Play, Puzzle, RefreshCw, Ruler, Search, Shield, TrendingUp, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Dica, Meta, Transacao, Video } from '../../types';
import { buscarMetas, buscarTransacoes, executarRequisicaoRest, solicitarAnaliseFinanceiraDaIA, buscarVideos } from '../../utils/requisicoes';
import { headersAutenticados, obterUsuarioDaSessao } from '../../utils/sessao';
import { useAnimacaoCascata, useAnimacaoModal } from '../../utils/animacoes';

// Busca as dicas cadastradas no Supabase para alimentar a central de aprendizado.
// Não recebe argumentos; retorna as dicas tipadas ou lança erro quando a API falha.
async function buscarDicas(): Promise<Dica[]> {
  // As dicas ficam salvas no banco para poderem ser atualizadas sem mudar o app.
  const respostaDaApi = await executarRequisicaoRest('dicas?select=*&order=created_at.desc', {
    headers: await headersAutenticados(),
  });

  if (!respostaDaApi.ok) {
    const detalhesErro = await respostaDaApi.text();
    throw new Error(`Não foi possível buscar as dicas (${respostaDaApi.status}): ${detalhesErro}`);
  }

  return (await respostaDaApi.json()) as Dica[];
}


// Escolhe o componente de ícone correspondente à categoria da dica.
// Recebe a categoria e o tamanho; retorna o ícone associado.
function iconeDaDica(categoria: string, tamanho = 28) {
  // Cada categoria tem um ícone para ficar mais fácil reconhecer o assunto.
  const propriedadesIcone = { size: tamanho, color: categoria === 'Comportamento' ? '#6A1B9A' : '#1A9E75' };
  const icones: Record<string, React.ReactNode> = {
    Educação: <Ruler {...propriedadesIcone} />,
    Investimento: <TrendingUp {...propriedadesIcone} />,
    Comportamento: <Brain {...propriedadesIcone} />,
    Segurança: <Shield {...propriedadesIcone} />,
    Crédito: <DollarSign {...propriedadesIcone} />,
    Empreendedorismo: <Puzzle {...propriedadesIcone} />,
  };
  return icones[categoria] ?? <DollarSign {...propriedadesIcone} />;
}

// Extrai o identificador do vídeo e monta a URL de sua miniatura no YouTube.
const obterMiniaturaDoYoutube = (urlVideo: string) => {
  // O próprio YouTube fornece uma imagem usando o id do vídeo.
  const correspondenciaVideo = urlVideo.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return correspondenciaVideo ? `https://img.youtube.com/vi/${correspondenciaVideo[1]}/hqdefault.jpg` : undefined;
};



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

// Carrega dicas, dados financeiros e análise personalizada para a tela.
// Usa refs para evitar chamadas repetidas durante o intervalo de atualização.
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
  const [videos, setVideos] = useState<Video[]>([]);
const [erroVideos, setErroVideos] = useState<string | null>(null);

  const carregamentoDaTelaEmAndamento = useRef(false);
  const ultimoCarregamento = useRef(0);

const carregarVideos = useCallback(async () => {
  try {
    setVideos(await buscarVideos(await headersAutenticados()));
    setErroVideos(null);
  } catch (detalhesErro) {
    console.error(detalhesErro);
    setErroVideos('Não foi possível carregar os vídeos.');
  }
}, []);

  // Evita chamadas simultâneas e reutiliza os dados até o intervalo de cache expirar.
  const carregarConteudoDaTela = useCallback(async (forcar = false) => {
    // Evito várias chamadas seguidas quando a pessoa entra e sai da tela.
    if (carregamentoDaTelaEmAndamento.current) return;
    if (!forcar && Date.now() - ultimoCarregamento.current < 30_000) return;
    carregamentoDaTelaEmAndamento.current = true;
    setCarregandoDicas(true);
    setCarregandoAnalise(true);
    setErroDicas(null);
    setErroAnalise(null);

    void carregarVideos();

    let dicasRecebidas: Dica[];
    try {
      dicasRecebidas = await buscarDicas();
      setDicas(dicasRecebidas); 
    } catch (detalhesErro) {
      console.error(detalhesErro);
      setErroDicas('Não foi possível carregar as dicas. Toque em atualizar para tentar novamente.');
      setErroAnalise('A análise depende das dicas cadastradas e não pôde ser gerada agora.');
      setCarregandoDicas(false);
      setCarregandoAnalise(false);
      carregamentoDaTelaEmAndamento.current = false;
      ultimoCarregamento.current = Date.now();
      return;
    }
    setCarregandoDicas(false);

    try {
      const usuario = await obterUsuarioDaSessao();
      if (!usuario) throw new Error('Usuário não autenticado.');
      const cabecalhosAutenticados = await headersAutenticados();
      const [transacoesRecebidas, metasRecebidas] = await Promise.all([
        buscarTransacoes(usuario.id, cabecalhosAutenticados),
        buscarMetas(usuario.id, cabecalhosAutenticados),
      ]);
      const metasAtivas = metasRecebidas.filter((metaAtual) => metaAtual.atual < metaAtual.total);
      setTransacoes(transacoesRecebidas);
      setMetas(metasAtivas);

      // Monto um resumo simples para a análise financeira personalizada.
      const receitas = transacoesRecebidas
        .filter((transacaoAtual) => transacaoAtual.tipo === 'receita')
        .reduce((somaValores, transacaoAtual) => somaValores + transacaoAtual.valor, 0);
      const despesas = transacoesRecebidas
        .filter((transacaoAtual) => transacaoAtual.tipo === 'despesa')
        .reduce((somaValores, transacaoAtual) => somaValores + transacaoAtual.valor, 0);
      const dicasDisponiveis = dicasRecebidas.map(({ id, titulo, descricao, categoria }) => ({
        id,
        titulo,
        descricao,
        categoria,
      }));

      if (transacoesRecebidas.length === 0) {
          setAnalise('Bem-vindo ao EduFinance! Registre sua primeira receita ou despesa na aba Transações e eu preparo uma análise personalizada para você.');
          return;
        }

      setAnalise(await solicitarAnaliseFinanceiraDaIA({ receitas, despesas, metas: metasAtivas, dicasDisponiveis }));
    } catch (detalhesErro) {
      console.error(detalhesErro);
      setErroAnalise('Não foi possível gerar sua análise agora. Toque em atualizar para tentar novamente.');
    } finally {
      setCarregandoAnalise(false);
      carregamentoDaTelaEmAndamento.current = false;
      ultimoCarregamento.current = Date.now();
    }
  }, [carregarVideos]);

  // Recarrega os dados toda vez que a tela entra em foco no Expo Router
  useFocusEffect(
    useCallback(() => {
      carregarConteudoDaTela();
    }, [carregarConteudoDaTela])
  );

  // A busca olha no título, descrição e categoria da dica.
  const dicasFiltradas = useMemo(() => {
    const termoBuscaNormalizado = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termoBuscaNormalizado) return dicas;
    return dicas.filter(({ titulo, descricao, categoria }) =>
      `${titulo} ${descricao} ${categoria}`.toLocaleLowerCase('pt-BR').includes(termoBuscaNormalizado)
    );
  }, [busca, dicas]);

  const buscaAtiva = busca.trim().length > 0;
  const dicasVisiveis = buscaAtiva || mostrarTodas
    ? dicasFiltradas
    : dicasFiltradas.slice(0, 4);
  const { animacoes: animacoesDicas } = useAnimacaoCascata(dicasVisiveis.length, 0, 80);
  const { animacoes: animacoesVideos } = useAnimacaoCascata(videos.length, 0, 80);
  const { estiloAnimado: estiloModalAnimado } = useAnimacaoModal(dicaAberta !== null);

  return (
    <ScrollView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Dicas & Educação</Text>
        <Text style={styles.subtitulo}>Baseadas no seu perfil financeiro</Text>
      </View>

      {/* Essa análise usa as transações e metas atuais do usuário. */}
      {/* Dica personalizada */}
      <View style={styles.dicaDestaque}>
        <View style={styles.destaqueCabecalho}>
          <Text style={styles.dicaDestaqueLabel}>✨ Para você agora</Text>
          <TouchableOpacity
            onPress={() => carregarConteudoDaTela(true)}
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
      {!carregandoDicas && !erroDicas && dicasVisiveis.map((dicaAtual, indiceDica) => {
        const animacao = animacoesDicas[indiceDica];
        return (
          <Animated.View
            key={dicaAtual.id}
            style={{
              opacity: animacao,
              transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <TouchableOpacity
              style={styles.dicaCard}
              onPress={() => setDicaAberta(dicaAtual)}
              activeOpacity={0.7}
            >
              <View style={styles.dicaIcone}>{iconeDaDica(dicaAtual.categoria)}</View>
              <View style={styles.dicaInfo}>
                <View style={styles.dicaHeaderRow}>
                  <Text style={styles.dicaTitulo}>{dicaAtual.titulo}</Text>
                  <View style={[styles.badge, { backgroundColor: CORES_CATEGORIA[dicaAtual.categoria] ?? '#F1F5F9' }]}>
                    <Text style={[styles.badgeTexto, { color: CORES_TEXTO[dicaAtual.categoria] ?? '#475569' }]}>
                      {dicaAtual.categoria}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dicaDescricao} numberOfLines={2}>{dicaAtual.descricao}</Text>
                <Text style={styles.verDetalhe}>Ver conteúdo completo ▸</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
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
      {erroVideos && <Text style={styles.erroLista}>{erroVideos}</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videosScroll}>
        {videos.map((videoAtual, indiceVideo) => {
          const animacao = animacoesVideos[indiceVideo];
          return (
          <Animated.View
            key={videoAtual.id}
            style={{
              opacity: animacao,
              transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
          <TouchableOpacity
            style={styles.videoCard}
            onPress={() => Linking.openURL(videoAtual.url)}
          >
            {/* Thumbnail */}
            <ImageBackground
              source={{ uri: videoAtual.thumbnail || obterMiniaturaDoYoutube(videoAtual.url) }}
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
                <Text style={[styles.badgeTexto, { color: '#2E7D32' }]}>{videoAtual.categoria}</Text>
              </View>
              <Text style={styles.videoTitulo} numberOfLines={2}>{videoAtual.titulo}</Text>
              <Text style={styles.videoCanal}>{videoAtual.canal}</Text>
              <Text style={styles.videoDuracao}>⏱ {videoAtual.duracao}</Text>
            </View>
          </TouchableOpacity>
          </Animated.View>
        );})}
      </ScrollView>

      {/* Modal de detalhes da dica */}
      <Modal
        visible={dicaAberta !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDicaAberta(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, estiloModalAnimado]}>
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
              {dicaAberta?.conteudo.split(/\r?\n/).filter(Boolean).map((paragrafo, indiceParagrafo) => (
                <View key={indiceParagrafo} style={styles.conteudoItem}>
                  <Text style={styles.conteudoBullet}>•</Text>
                  <Text style={styles.conteudoTexto}>{paragrafo}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.btnEntendi} onPress={() => setDicaAberta(null)}>
              <Text style={styles.btnEntendiTexto}>Entendi!</Text>
            </TouchableOpacity>
          </Animated.View>
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
