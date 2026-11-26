import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
    Camera,
    Bug,
    ChevronRight,
    FileText,
    Lightbulb,
    LogOut,
    Send,
    Star,
    X,
    UserRoundPen,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Animated, Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { CategoriaFeedback, OpcaoFeedback, Usuario, TermoDeUso } from '../../types';
import { criarHtmlRelatorioPdf, obterLogoRelatorio } from '../../utils/relatorioPdf';
import { buscarMetas, buscarTransacoes, criarNotificacao, buscarTermosDeUso, salvarOuAtualizarPerfilUsuario, enviarFeedback as enviarFeedbackAoBanco } from '../../utils/requisicoes';
import {
    atualizarMetadadosUsuario,
    carregarSessao,
    endpointAuth,
    headersAutenticados,
    headersPublicos,
    obterUsuarioDaSessao,
    removerSessao,
} from '../../utils/sessao';
import { estiloEntradaCascata, useAnimacaoCascata, useAnimacaoModal } from '../../utils/animacoes';
import { enviarFotoPerfil, obterUrlFotoPerfil } from '../../utils/storagePerfil';

const CATEGORIAS_FEEDBACK: OpcaoFeedback[] = [
  { chave: 'sugestao', icone: Lightbulb, label: 'Sugestão' },
  { chave: 'bug', icone: Bug, label: 'Bug' },
  { chave: 'elogio', icone: Star, label: 'Elogio' },
];



// Exibe os dados da conta, suporte e ações do perfil.
// Carrega a sessão e executa ações de feedback, PDF e encerramento.
export default function Perfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [caminhoFotoPerfil, setCaminhoFotoPerfil] = useState<string | null>(null);
  const [urlFotoPerfil, setUrlFotoPerfil] = useState<string | null>(null);
  const [editarPerfilVisivel, setEditarPerfilVisivel] = useState(false);
  const [nomeEmEdicao, setNomeEmEdicao] = useState('');
  const [fotoSelecionada, setFotoSelecionada] = useState<ImagePickerAsset | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [feedback, setFeedback] = useState('');
  const [categoriaFeedback, setCategoriaFeedback] = useState<CategoriaFeedback>('sugestao');
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [termosVisiveis, setTermosVisiveis] = useState(false);
  const router = useRouter();

  const [termos, setTermos] = useState<TermoDeUso[]>([]);
  const [carregandoTermos, setCarregandoTermos] = useState(false);
  const [erroTermos, setErroTermos] = useState<string | null>(null);
  const { estiloAnimado: estiloTermosAnimado } = useAnimacaoModal(termosVisiveis);
  const { estiloAnimado: estiloEditarPerfilAnimado } = useAnimacaoModal(editarPerfilVisivel);
  const { animacoes: animacoesCartoesPerfil } = useAnimacaoCascata(4, 100, 80);

  // Busca os dados básicos da conta autenticada.
  const carregarDadosDoPerfil = useCallback(async () => {
    try {
      const usuarioDaSessao = await obterUsuarioDaSessao();
      if (!usuarioDaSessao) {
        router.replace('/login');
        return;
      }
      setUsuario({
        id: usuarioDaSessao.id,
        nome: usuarioDaSessao.user_metadata?.nome || usuarioDaSessao.email?.split('@')[0] || '',
        email: usuarioDaSessao.email || '',
      });
      const caminhoAvatar = usuarioDaSessao.user_metadata?.avatar_path ?? null;
      setCaminhoFotoPerfil(caminhoAvatar);
      setUrlFotoPerfil(caminhoAvatar ? await obterUrlFotoPerfil(caminhoAvatar) : null);
    } catch (detalhesErro) {
      console.error(detalhesErro);
      setUrlFotoPerfil(null);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void carregarDadosDoPerfil();
    }, [carregarDadosDoPerfil])
  );

  function abrirEdicaoPerfil() {
    setNomeEmEdicao(usuario?.nome ?? '');
    setFotoSelecionada(null);
    setEditarPerfilVisivel(true);
  }

  async function selecionarFotoPerfil() {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher uma imagem de perfil.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });
      if (!resultado.canceled) {
        setFotoSelecionada(resultado.assets[0]);
      }
    } catch (detalhesErro) {
      console.error('Erro ao escolher foto de perfil:', detalhesErro);
      Alert.alert('Erro', 'Não foi possível abrir a galeria de fotos.');
    }
  }

  async function salvarPerfil() {
    const nomeAtualizado = nomeEmEdicao.trim();
    if (!nomeAtualizado) {
      Alert.alert('Nome obrigatório', 'Informe seu nome para salvar as alterações.');
      return;
    }
    if (nomeAtualizado.length > 80) {
      Alert.alert('Nome muito longo', 'O nome deve ter no máximo 80 caracteres.');
      return;
    }
    if (!usuario || salvandoPerfil) return;
    const nomeFoiAlterado = nomeAtualizado !== usuario.nome;
    const fotoFoiAlterada = fotoSelecionada !== null;

    if (!nomeFoiAlterado && !fotoFoiAlterada) {
      setEditarPerfilVisivel(false);
      return;
    }

    setSalvandoPerfil(true);
    let nomeSalvo = false;
    try {
      const respostaPerfil = await salvarOuAtualizarPerfilUsuario(
        usuario.id,
        nomeAtualizado,
        await headersAutenticados()
      );
      if (!respostaPerfil.ok) {
        const detalheErro = await respostaPerfil.text();
        throw new Error(`Não foi possível salvar o nome do perfil (${respostaPerfil.status}): ${detalheErro}`);
      }

      const metadadosAtuais = {
        nome: nomeAtualizado,
        ...(caminhoFotoPerfil ? { avatar_path: caminhoFotoPerfil } : {}),
      };
      const usuarioAtualizado = await atualizarMetadadosUsuario(metadadosAtuais);
      nomeSalvo = true;

      setUsuario({
        ...usuario,
        nome: usuarioAtualizado.user_metadata?.nome ?? nomeAtualizado,
      });

      if (fotoSelecionada) {
        const caminhoAvatar = await enviarFotoPerfil(usuario.id, fotoSelecionada);
        await atualizarMetadadosUsuario({ ...metadadosAtuais, avatar_path: caminhoAvatar });
        setCaminhoFotoPerfil(caminhoAvatar);
        setUrlFotoPerfil(fotoSelecionada.uri);
      }

      const mensagemNotificacao = nomeFoiAlterado && fotoFoiAlterada
        ? 'Seu nome e sua foto de perfil foram atualizados com sucesso.'
        : nomeFoiAlterado
          ? 'Seu nome foi atualizado com sucesso.'
          : 'Sua foto de perfil foi atualizada com sucesso.';
      try {
        await criarNotificacao(
          {
            usuario_id: usuario.id,
            titulo: 'Perfil atualizado',
            mensagem: mensagemNotificacao,
            tipo: 'sistema',
            lida: false,
            chave_evento: `perfil_atualizado:${Date.now()}`,
          },
          await headersAutenticados()
        );
      } catch (detalhesErroNotificacao) {
        console.error('Erro ao registrar notificação de atualização do perfil:', detalhesErroNotificacao);
      }

      setEditarPerfilVisivel(false);
      Alert.alert('Perfil atualizado', 'Suas alterações foram salvas.');
    } catch (detalhesErro) {
      console.error('Erro ao atualizar perfil:', detalhesErro);
      Alert.alert(
        nomeSalvo ? 'Nome salvo; foto não enviada' : 'Não foi possível atualizar',
        detalhesErro instanceof Error ? detalhesErro.message : 'Tente novamente mais tarde.'
      );
    } finally {
      setSalvandoPerfil(false);
    }
  }

  // Avisa o Supabase que a sessão terminou e depois remove os dados locais.
  async function encerrarSessaoUsuario() {
    // Primeiro aviso o servidor e depois apago a sessão salva no celular.
    const sessao = await carregarSessao();
    try {
      if (sessao?.accessToken) {
        await fetch(endpointAuth('logout'), {
          method: 'POST',
          headers: { ...headersPublicos(), Authorization: `Bearer ${sessao.accessToken}` },
        });
      }
    } finally {
      await removerSessao();
    }
  }

  // Gera o relatório financeiro e disponibiliza o arquivo para compartilhamento.
  async function gerarRelatorioPdf() {
    if (!usuario || gerandoPdf) return;

    setGerandoPdf(true);
    try {
      // O PDF usa os mesmos dados que aparecem nas outras telas do app.
      const cabecalhosAutenticados = await headersAutenticados();
      const [transacoesRecebidas, metasRecebidas, logoDataUrl] = await Promise.all([
        buscarTransacoes(usuario.id, cabecalhosAutenticados),
        buscarMetas(usuario.id, cabecalhosAutenticados),
        obterLogoRelatorio(),
      ]);
      const htmlRelatorio = criarHtmlRelatorioPdf({
        email: usuario.email,
        transacoes: transacoesRecebidas,
        metas: metasRecebidas,
        logoDataUrl,
      });
      const arquivoPdf = await Print.printToFileAsync({ html: htmlRelatorio, base64: true });
      if (!arquivoPdf.base64) {
        throw new Error('O PDF foi gerado sem conteúdo para compartilhamento.');
      }

      // A URI temporária do expo-print pode não ser legível pelo expo-sharing
      // no Expo Go/Android. Este arquivo fica no cache autorizado do aplicativo.
      const arquivoPdfCompartilhavel = new File(
        Paths.cache,
        `relatorio-edufinance-${Date.now()}.pdf`
      );
      arquivoPdfCompartilhavel.create({ overwrite: true });
      await arquivoPdfCompartilhavel.write(arquivoPdf.base64, { encoding: 'base64' });

      try {
        await criarNotificacao(
          {
            usuario_id: usuario.id,
            titulo: 'Relatório gerado',
            mensagem: 'Seu relatório financeiro foi gerado com sucesso.',
            tipo: 'sistema',
            lida: false,
            chave_evento: `relatorio_gerado:${Date.now()}`,
          },
          cabecalhosAutenticados
        );
      } catch (detalhesErro) {
        console.error('Erro ao registrar notificação do relatório:', detalhesErro);
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(arquivoPdfCompartilhavel.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar relatório EduFinance',
        });
      } else {
        Alert.alert('Relatório gerado', `O arquivo foi salvo em ${arquivoPdfCompartilhavel.uri}`);
      }
    } catch (detalhesErro) {
      console.error('Erro ao gerar relatório:', detalhesErro);
      Alert.alert('Erro', 'Não foi possível gerar o relatório agora.');
    } finally {
      setGerandoPdf(false);
    }
  }

  async function abrirTermos() {
  setTermosVisiveis(true);
  // Se já carregou antes (ou está carregando), não busca de novo.
  if (termos.length > 0 || carregandoTermos) return;

  setCarregandoTermos(true);
  setErroTermos(null);
  try {
    setTermos(await buscarTermosDeUso(await headersAutenticados()));
  } catch (detalhesErro) {
    console.error(detalhesErro);
    setErroTermos('Não foi possível carregar os termos agora. Feche e tente novamente.');
  } finally {
    setCarregandoTermos(false);
  }
}

  // Valida e envia a mensagem de feedback associada ao usuário autenticado.
  const enviarFeedbackDoUsuario = async () => {
    // Não envio mensagem vazia nem deixo clicar duas vezes durante o envio.
    if (enviandoFeedback) return;
    const mensagemFeedback = feedback.trim();
    if (!mensagemFeedback) {
      Alert.alert('Atenção', 'Escreva sua mensagem antes de enviar.');
      return;
    }
    setEnviandoFeedback(true);

    try {
      const usuarioSessao = await obterUsuarioDaSessao();

      if (!usuarioSessao) {
        Alert.alert('Ops', 'Você precisa estar logado para enviar feedback.');
        return;
      }

      await enviarFeedbackAoBanco(
        usuarioSessao.id,
        mensagemFeedback,
        categoriaFeedback,
        await headersAutenticados()
      );

      setFeedback('');
      setFeedbackEnviado(true);
      setTimeout(() => setFeedbackEnviado(false), 4000);
      Alert.alert('Sucesso', 'Feedback enviado! Obrigado pela contribuição.');
    } catch (detalhesErro) {
      console.error('Erro inesperado ao enviar feedback:', detalhesErro);
      Alert.alert('Ops', 'Não foi possível enviar. Tente novamente.');
    } finally {
      setEnviandoFeedback(false);
    }
  };

  const coresTema = {
    container: { backgroundColor: '#F5F5F5' },
    sectionBg: '#fff',
    card: '#fff',
    text: '#222',
    subText: '#888',
    border: '#F5F5F5',
  };

  return (
    <ScrollView style={[styles.container, coresTema.container]}>
      {/* Card do usuário */}
      <Animated.View style={[styles.cardUsuario, estiloEntradaCascata(animacoesCartoesPerfil[0]), { backgroundColor: '#1A9E75' }]}>
        <View style={styles.avatar}>
          {urlFotoPerfil ? (
            <Image source={{ uri: urlFotoPerfil }} style={styles.avatarImagem} />
          ) : (
            <Text style={styles.avatarTexto}>{usuario?.nome ? usuario.nome[0].toUpperCase() : 'U'}</Text>
          )}
        </View>
        <View style={styles.dadosUsuario}>
          <Text style={styles.nomeUsuario}>{usuario?.nome || 'Usuário'}</Text>
          <Text style={styles.emailUsuario}>{usuario?.email || 'email@exemplo.com'}</Text>
        </View>
        <TouchableOpacity
          style={styles.botaoEditarPerfil}
          onPress={abrirEdicaoPerfil}
          disabled={!usuario}
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
        >
          <UserRoundPen size={19} color="#1A9E75" />
        </TouchableOpacity>
      </Animated.View>

      {/* Configurações */}
      <Text style={[styles.secaoTitulo, { color: coresTema.subText, marginTop: 24 }]}>CONFIGURAÇÕES</Text>
      <Animated.View style={[styles.secao, estiloEntradaCascata(animacoesCartoesPerfil[1]), { backgroundColor: coresTema.sectionBg, borderColor: coresTema.border }]}>
        <TouchableOpacity
          style={[styles.itemConfig, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}
          onPress={gerarRelatorioPdf}
          disabled={gerandoPdf || !usuario}
        >
          <View style={styles.itemEsquerda}>
            <FileText size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Relatório em PDF</Text>
              <Text style={[styles.itemSubtitulo, { color: coresTema.subText }]}>
                {gerandoPdf ? 'Gerando relatório...' : 'Gerar e compartilhar seu resumo financeiro'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.itemConfig, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}
          onPress={abrirTermos}
          accessibilityRole="button"
          accessibilityLabel="Abrir termos de uso e política de privacidade"
        >
          <View style={styles.itemEsquerda}>
            <FileText size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Termos de Uso e Política de Privacidade</Text>
              <Text style={[styles.itemSubtitulo, { color: coresTema.subText }]}>Leia nossos termos e políticas</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ccc" />
        </TouchableOpacity>
      </Animated.View>

      {/* Ajuda e suporte */}
      <Text style={[styles.secaoTitulo, { color: coresTema.subText }]}>AJUDA E SUPORTE</Text>
      <Animated.View style={[styles.secao, estiloEntradaCascata(animacoesCartoesPerfil[2]), { backgroundColor: coresTema.sectionBg, borderColor: coresTema.border, paddingBottom: 18 }]}>
        <View style={[styles.faqCard, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}>
          <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Perguntas Frequentes (FAQ)</Text>
          <Text style={[styles.faqText, { color: coresTema.subText }]}>• Como adicionar uma nova receita/despesa?</Text>
          <Text style={[styles.faqText, { color: coresTema.subText }]}>• Os meus dados financeiros estão seguros?</Text>
          <Text style={[styles.faqText, { color: coresTema.subText }]}>• Como funcionam os relatórios mensais?</Text>
          <Text style={[styles.faqText, { color: coresTema.subText }]}>• Como redefinir minha senha?</Text>
        </View>

        <Text style={[styles.itemTitulo, { marginHorizontal: 16, marginTop: 16, color: coresTema.text }]}>Canais de Contato</Text>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
            if (!email) {
              Alert.alert('Contato indisponível', 'O e-mail de suporte não está configurado.');
              return;
            }
            Linking.openURL(`mailto:${email}`).catch(() => {
              Alert.alert('Erro', 'Não foi possível abrir o aplicativo de e-mail.');
            });
          }}
        >
          <Text style={styles.contactButtonText}>Atendimento via Gmail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            const numero = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '');
            if (!numero) {
              Alert.alert('Contato indisponível', 'O número do WhatsApp não está configurado.');
              return;
            }
            Linking.openURL(`https://wa.me/${numero}`).catch(() => {
              Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
            });
          }}
        >
          <Text style={styles.contactButtonText}>Atendimento via WhatsApp</Text>
        </TouchableOpacity>

      </Animated.View>

      {/* Feedback */}
      <Text style={[styles.secaoTitulo, { color: coresTema.subText, marginTop: 24 }]}>FEEDBACK</Text>
      <Animated.View style={[styles.feedbackBox, estiloEntradaCascata(animacoesCartoesPerfil[3]), { backgroundColor: coresTema.card, borderColor: coresTema.border }]}>
        <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Enviar sugestão ou feedback</Text>
        <Text style={[styles.feedbackSubtitulo, { color: coresTema.subText }]}>
          Sua mensagem vai direto para os desenvolvedores do app.
        </Text>

        <View style={styles.categoriaRow}>
          {CATEGORIAS_FEEDBACK.map((cat) => {
            const ativa = categoriaFeedback === cat.chave;
            const Icone = cat.icone;
            const corIcone = ativa ? '#FFFFFF' : '#64748B';

            return (
              <TouchableOpacity
                key={cat.chave}
                style={[styles.categoriaChip, ativa && styles.categoriaChipAtivo]}
                onPress={() => setCategoriaFeedback(cat.chave)}
              >
                <Icone size={14} color={corIcone} />
                <Text style={[styles.categoriaTexto, ativa && styles.categoriaTextoAtivo]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.feedbackInput, { color: coresTema.text, borderColor: coresTema.border, backgroundColor: coresTema.sectionBg }]}
          placeholder="Escreva sua ideia de melhoria, sugestão ou relato de bug..."
          placeholderTextColor="#999"
          value={feedback}
          onChangeText={setFeedback}
          multiline
        />

        {feedbackEnviado && (
          <Text style={styles.feedbackSucesso}>✓ Feedback enviado com sucesso!</Text>
        )}

        <TouchableOpacity
          style={[styles.btnEnviarFeedback, { backgroundColor: '#1A9E75' }]}
          onPress={enviarFeedbackDoUsuario}
          disabled={enviandoFeedback}
        >
          <Send size={16} color="#fff" />
          <Text style={styles.btnEnviarFeedbackTexto}>
            {enviandoFeedback ? 'Enviando...' : 'Enviar Feedback'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Rodapé */}
      <Text style={[styles.versao, { color: coresTema.text }]}>⭐ EduFinance v1.0</Text>
      <Text style={[styles.subVersao, { color: coresTema.subText }]}>Feito para jovens que querem organizar as finanças</Text>

      <TouchableOpacity
        style={styles.btnSair}
        disabled={saindo}
        onPress={async () => {
          if (saindo) return;
          setSaindo(true);
          try {
            await encerrarSessaoUsuario();
            router.replace('/login');
          } catch (e) {
            console.error('Erro ao sair:', e);
            setSaindo(false);
          }
        }}
      >
        <LogOut size={18} color="#F44336" />
        <Text style={styles.btnSairTexto}>{saindo ? 'Saindo...' : 'Sair da Conta'}</Text>
      </TouchableOpacity>

      <Modal
        visible={editarPerfilVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setEditarPerfilVisivel(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.modalContainer, estiloEditarPerfilAnimado]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Editar perfil</Text>
              <TouchableOpacity
                onPress={() => setEditarPerfilVisivel(false)}
                disabled={salvandoPerfil}
                accessibilityRole="button"
                accessibilityLabel="Fechar edição do perfil"
              >
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editorPerfilConteudo}
              contentContainerStyle={styles.editorPerfilConteudoInterno}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={styles.seletorFoto}
                onPress={selecionarFotoPerfil}
                disabled={salvandoPerfil}
                accessibilityRole="button"
                accessibilityLabel="Escolher foto de perfil"
              >
                {fotoSelecionada ? (
                  <Image source={{ uri: fotoSelecionada.uri }} style={styles.fotoPreview} />
                ) : urlFotoPerfil ? (
                  <Image source={{ uri: urlFotoPerfil }} style={styles.fotoPreview} />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <Text style={styles.fotoPlaceholderTexto}>
                      {nomeEmEdicao.trim() ? nomeEmEdicao.trim()[0].toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.iconeCamera}>
                  <Camera size={17} color="#fff" />
                </View>
                <Text style={[styles.itemSubtitulo, { color: coresTema.subText }]}>Toque para escolher uma foto</Text>
              </TouchableOpacity>

              <Text style={[styles.labelCampo, { color: coresTema.subText }]}>Nome</Text>
              <TextInput
                style={[styles.campoNome, { color: coresTema.text, borderColor: coresTema.border, backgroundColor: coresTema.sectionBg }]}
                value={nomeEmEdicao}
                onChangeText={setNomeEmEdicao}
                placeholder="Seu nome"
                placeholderTextColor="#999"
                maxLength={80}
                autoCapitalize="words"
                editable={!salvandoPerfil}
                returnKeyType="done"
                onSubmitEditing={salvarPerfil}
              />
            </ScrollView>

            <View style={styles.acoesEditorPerfil}>
              <TouchableOpacity
                style={styles.botaoCancelarPerfil}
                onPress={() => setEditarPerfilVisivel(false)}
                disabled={salvandoPerfil}
                accessibilityRole="button"
              >
                <Text style={styles.botaoCancelarPerfilTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnEnviarFeedback, styles.botaoSalvarPerfil]}
                onPress={salvarPerfil}
                disabled={salvandoPerfil}
                accessibilityRole="button"
              >
                <Text style={styles.btnEnviarFeedbackTexto}>
                  {salvandoPerfil ? 'Salvando...' : 'Confirmar e salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={termosVisiveis}
        transparent
        animationType="fade"
        onRequestClose={() => setTermosVisiveis(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, estiloTermosAnimado]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Termos de Uso e Política de Privacidade</Text>
              <TouchableOpacity
                onPress={() => setTermosVisiveis(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar termos de uso"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalConteudo}
              showsVerticalScrollIndicator
              contentContainerStyle={styles.modalConteudoInterno}
            >
              {carregandoTermos && <ActivityIndicator color="#1A9E75" style={{ marginVertical: 24 }} />}
              {!carregandoTermos && erroTermos && <Text style={styles.termoTexto}>{erroTermos}</Text>}
              {!carregandoTermos && !erroTermos && termos.map((termo) => (
                <View key={termo.id} style={styles.termoItem}>
                  <Text style={styles.termoTitulo}>{termo.titulo}</Text>
                  <Text style={styles.termoTexto}>{termo.texto}</Text>
                </View>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.btnFecharTermos}
              onPress={() => setTermosVisiveis(false)}
              accessibilityRole="button"
            >
              <Text style={styles.btnFecharTermosTexto}>Fechar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  cardUsuario: {
    backgroundColor: '#1A9E75',
    padding: 24,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTexto: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  avatarImagem: { width: '100%', height: '100%', borderRadius: 28 },
  dadosUsuario: { flex: 1 },
  botaoEditarPerfil: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nomeUsuario: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  emailUsuario: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  secaoTitulo: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  secao: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  itemConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemTitulo: { fontSize: 15, fontWeight: '600' },
  itemSubtitulo: { fontSize: 12, color: '#888', marginTop: 2 },
  faqCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  faqText: { fontSize: 13, color: '#555', lineHeight: 20, marginTop: 8 },
  contactButton: {
    backgroundColor: '#1A9E75',
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  contactButtonText: { color: '#fff', fontWeight: '700' },
  feedbackBox: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  feedbackSubtitulo: { fontSize: 12, color: '#888', marginTop: 4 },
  categoriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoriaChipAtivo: { backgroundColor: '#1A9E75', borderColor: '#1A9E75' },
  categoriaTexto: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  categoriaTextoAtivo: { color: '#fff' },
  feedbackInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    textAlignVertical: 'top',
    color: '#333',
  },
  feedbackSucesso: {
    color: '#1A9E75',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  btnEnviarFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  btnEnviarFeedbackTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  versao: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#333' },
  subVersao: { textAlign: 'center', fontSize: 12, color: '#888', marginTop: 4 },
  btnSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  btnSairTexto: { color: '#F44336', fontSize: 15, fontWeight: '600' },
  seletorFoto: { alignItems: 'center', marginBottom: 20, gap: 8 },
  fotoPreview: { width: 88, height: 88, borderRadius: 44 },
  fotoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1A9E75',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoPlaceholderTexto: { color: '#fff', fontSize: 34, fontWeight: '700' },
  iconeCamera: {
    position: 'absolute',
    top: 58,
    left: '55%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1A9E75',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  labelCampo: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  campoNome: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  botaoSalvarPerfil: { flex: 1, backgroundColor: '#1A9E75', marginTop: 0, marginHorizontal: 0 },
  botaoCancelarPerfil: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  botaoCancelarPerfilTexto: { color: '#475569', fontSize: 15, fontWeight: '700' },
  acoesEditorPerfil: { flexDirection: 'row', gap: 10, marginTop: 16 },
  editorPerfilConteudo: { flexShrink: 1 },
  editorPerfilConteudoInterno: { paddingTop: 16, paddingBottom: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitulo: { flex: 1, color: '#222', fontSize: 18, fontWeight: '700' },
  modalConteudo: { flexShrink: 1 },
  modalConteudoInterno: { paddingTop: 16, paddingBottom: 8 },
  termoItem: { marginBottom: 18 },
  termoTitulo: { color: '#1A9E75', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  termoTexto: { color: '#475569', fontSize: 14, lineHeight: 21 },
  btnFecharTermos: {
    alignItems: 'center',
    backgroundColor: '#1A9E75',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 8,
  },
  btnFecharTermosTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
