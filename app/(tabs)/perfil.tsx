import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
    Bug,
    ChevronRight,
    FileText,
    HelpCircle,
    Lightbulb,
    LogOut,
    Send,
    Shield,
    Star,
    Target,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { CategoriaFeedback, OpcaoFeedback, Usuario } from '../../types';
import { criarHtmlRelatorioPdf, obterLogoRelatorio } from '../../utils/relatorioPdf';
import { buscarMetas, buscarResumoFinanceiroUsuario, buscarTransacoes, criarNotificacao, enviarFeedback as enviarFeedbackAoBanco } from '../../utils/requisicoes';
import {
    carregarSessao,
    endpointAuth,
    headersAutenticados,
    headersPublicos,
    obterUsuarioDaSessao,
    removerSessao,
} from '../../utils/sessao';

const CATEGORIAS_FEEDBACK: OpcaoFeedback[] = [
  { chave: 'sugestao', icone: Lightbulb, label: 'Sugestão' },
  { chave: 'bug', icone: Bug, label: 'Bug' },
  { chave: 'elogio', icone: Star, label: 'Elogio' },
];

// Exibe os dados da conta, resumo financeiro, suporte e ações do perfil.
// Carrega dados da sessão e executa ações de feedback, PDF e encerramento.
export default function Perfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [erroTransacoes, setErroTransacoes] = useState<string | null>(null);
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [categoriaFeedback, setCategoriaFeedback] = useState<CategoriaFeedback>('sugestao');
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const router = useRouter();

  // Busca o usuário autenticado e soma suas receitas e despesas.
  const carregarDadosDoPerfil = useCallback(async () => {
    // Busco os dados do usuário e o resumo financeiro para esta tela.
    setCarregandoTransacoes(true);
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
      const transacoesDoResumo = await buscarResumoFinanceiroUsuario(usuarioDaSessao.id, await headersAutenticados());
      setTotalReceitas(
        transacoesDoResumo
          .filter((transacaoAtual: any) => transacaoAtual.tipo === 'receita')
          .reduce((somaValores: number, transacaoAtual: any) => somaValores + Number(transacaoAtual.valor), 0)
      );
      setTotalDespesas(
        transacoesDoResumo
          .filter((transacaoAtual: any) => transacaoAtual.tipo === 'despesa')
          .reduce((somaValores: number, transacaoAtual: any) => somaValores + Number(transacaoAtual.valor), 0)
      );
      setErroTransacoes(null);
    } catch (detalhesErro) {
      console.error(detalhesErro);
      setErroTransacoes('Resumo indisponível');
    } finally {
      setCarregandoTransacoes(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void carregarDadosDoPerfil();
    }, [carregarDadosDoPerfil])
  );

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
      arquivoPdfCompartilhavel.write(arquivoPdf.base64, { encoding: 'base64' });

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

  // Escolho as cores da tela conforme o tema marcado.
  const coresTema = temaEscuro
    ? {
        container: { backgroundColor: '#0F172A' },
        sectionBg: '#1E293B',
        card: '#1E293B',
        text: '#F8FAFC',
        subText: '#CBD5E1',
        border: '#334155',
      }
    : {
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
      <View style={[styles.cardUsuario, { backgroundColor: '#1A9E75' }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {usuario?.nome ? usuario.nome[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.nomeUsuario}>{usuario?.nome || 'Usuário'}</Text>
          <Text style={styles.emailUsuario}>{usuario?.email || 'email@exemplo.com'}</Text>
        </View>
      </View>

      {/* Resumo financeiro */}
      <View style={[styles.resumo, { backgroundColor: coresTema.card }]}>
        {carregandoTransacoes || erroTransacoes ? (
          <Text style={styles.resumoEstado}>
            {carregandoTransacoes ? 'Carregando resumo...' : 'Resumo indisponível'}
          </Text>
        ) : (
          <>
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoValor, { color: '#1A9E75' }]}>R$ {totalReceitas.toFixed(2)}</Text>
              <Text style={[styles.resumoLabel, { color: coresTema.subText }]}>Receitas</Text>
            </View>
            <View style={styles.divisor} />
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoValor, { color: '#F44336' }]}>R$ {totalDespesas.toFixed(2)}</Text>
              <Text style={[styles.resumoLabel, { color: coresTema.subText }]}>Despesas</Text>
            </View>
          </>
        )}
      </View>

      {/* Configurações */}
      <Text style={[styles.secaoTitulo, { color: coresTema.subText }]}>CONFIGURAÇÕES</Text>
      <View style={[styles.secao, { backgroundColor: coresTema.sectionBg, borderColor: coresTema.border }]}>
        <View style={[styles.itemConfig, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}>
          <View style={styles.itemEsquerda}>
            <Target size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Aparência / Tema</Text>
              <Text style={[styles.itemSubtitulo, { color: coresTema.subText }]}>Alternar entre Modo Claro e Modo Escuro</Text>
            </View>
          </View>
          <Switch
            value={temaEscuro}
            onValueChange={(value) => setTemaEscuro(value)}
            trackColor={{ true: '#1A9E75' }}
          />
        </View>

        <TouchableOpacity
          style={[styles.itemConfig, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}
          onPress={gerarRelatorioPdf}
          disabled={gerandoPdf || carregandoTransacoes || !usuario}
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

        <View style={[styles.itemConfig, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}>
          <View style={styles.itemEsquerda}>
            <FileText size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Termos de Uso e Política de Privacidade</Text>
              <Text style={[styles.itemSubtitulo, { color: coresTema.subText }]}>Leia nossos termos e políticas</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ccc" />
        </View>

        <View style={[styles.itemConfig, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}>
          <View style={styles.itemEsquerda}>
            <Shield size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Backup na Nuvem</Text>
              <Text style={[styles.itemSubtitulo, { color: coresTema.subText }]}>Status da última sincronização dos dados</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Ajuda e suporte */}
      <Text style={[styles.secaoTitulo, { color: coresTema.subText }]}>AJUDA E SUPORTE</Text>
      <View style={[styles.secao, { backgroundColor: coresTema.sectionBg, borderColor: coresTema.border }]}>
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
          <Text style={styles.contactButtonText}>Fale Conosco</Text>
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

        <View style={[styles.feedbackBox, { backgroundColor: coresTema.card, borderColor: coresTema.border }]}>
          <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Feedback / Enviar Sugestão</Text>
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
            placeholder="Escreva sua ideia de melhoria"
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
        </View>

        <View style={[styles.itemConfig, { backgroundColor: coresTema.card, borderBottomColor: coresTema.border }]}>
          <View style={styles.itemEsquerda}>
            <HelpCircle size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: coresTema.text }]}>Reportar um Problema (Bug)</Text>
              <Text style={[styles.itemSubtitulo, { color: coresTema.subText }]}>Avisar se algo travou ou não está funcionando</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ccc" />
        </View>
      </View>

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
  nomeUsuario: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  emailUsuario: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  resumo: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    marginBottom: 16,
  },
  resumoItem: { flex: 1, alignItems: 'center' },
  resumoEstado: { flex: 1, color: '#64748B', textAlign: 'center' },
  resumoValor: { fontSize: 18, fontWeight: 'bold', color: '#1A9E75' },
  resumoLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  divisor: { width: 1, backgroundColor: '#F0F0F0' },
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
});

/*
ARQUIVO: app/(tabs)/perfil.tsx

Responsabilidade:
Exibir dados do usuário, resumo financeiro, suporte e configurações da conta.

Principais elementos:
- Perfil()
- carregarDadosDoPerfil()
- gerarRelatorioPdf()
- enviarFeedbackDoUsuario()
- encerrarSessaoUsuario()

Fluxo:
Sessão -> resumo e opções do perfil -> ações de PDF, feedback ou logout

Conceitos usados:
- useState e useFocusEffect
- Promise.all
- impressão e compartilhamento de arquivo
- callbacks assíncronos
*/
