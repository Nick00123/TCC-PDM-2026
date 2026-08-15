import { useRouter } from 'expo-router';
import { ChevronRight, FileText, HelpCircle, LogOut, Send, Shield, Target } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  endpointRest,
  headersAutenticados,
  obterUsuarioDaSessao,
} from '../../src/api/sessao';
import { useAuth } from '../../src/contextos/AuthContexto';
import { useFinance } from '../../src/contextos/FinanceContexto';

type CategoriaFeedback = 'sugestao' | 'bug' | 'elogio';

const CATEGORIAS_FEEDBACK: { chave: CategoriaFeedback; label: string }[] = [
  { chave: 'sugestao', label: '💡 Sugestão' },
  { chave: 'bug', label: '🐞 Bug' },
  { chave: 'elogio', label: '⭐ Elogio' },
];

export default function Perfil() {
  const { totalReceitas, totalDespesas, carregandoTransacoes, erroTransacoes } = useFinance();
  const { usuario, logout } = useAuth();
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [categoriaFeedback, setCategoriaFeedback] = useState<CategoriaFeedback>('sugestao');
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const router = useRouter();

  const enviarFeedback = async () => {
    if (enviandoFeedback) return;
    const texto = feedback.trim();
    if (!texto) {
      Alert.alert('Atenção', 'Escreva sua mensagem antes de enviar.');
      return;
    }
    setEnviandoFeedback(true);

    try {
      const usuario = await obterUsuarioDaSessao();

      if (!usuario) {
        Alert.alert('Ops', 'Você precisa estar logado para enviar feedback.');
        return;
      }

      const resposta = await fetch(endpointRest('feedback'), {
        method: 'POST',
        headers: await headersAutenticados(),
        body: JSON.stringify({
          usuario_id: usuario.id,
          mensagem: texto,
          categoria: categoriaFeedback,
        }),
      });

      if (!resposta.ok) {
        console.error('Erro ao enviar feedback:', await resposta.text());
        Alert.alert('Ops', 'Não foi possível enviar. Tente novamente.');
        return;
      }

      setFeedback('');
      setFeedbackEnviado(true);
      setTimeout(() => setFeedbackEnviado(false), 4000);
      Alert.alert('Sucesso', 'Feedback enviado! Obrigado pela contribuição.');
    } catch (error) {
      console.error('Erro inesperado ao enviar feedback:', error);
      Alert.alert('Ops', 'Não foi possível enviar. Tente novamente.');
    } finally {
      setEnviandoFeedback(false);
    }
  };

  const theme = {
    container: { backgroundColor: '#F5F5F5' },
    sectionBg: '#fff',
    card: '#fff',
    text: '#222',
    subText: '#888',
    border: '#F5F5F5',
  };

  return (
    <ScrollView style={[styles.container, theme.container]}>

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
      <View style={[styles.resumo, { backgroundColor: theme.card }]}>
        {carregandoTransacoes || erroTransacoes ? (
          <Text style={styles.resumoEstado}>
            {carregandoTransacoes ? 'Carregando resumo...' : 'Resumo indisponível'}
          </Text>
        ) : (
          <>
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoValor, { color: '#1A9E75' }]}>R$ {totalReceitas.toFixed(2)}</Text>
              <Text style={[styles.resumoLabel, { color: theme.subText }]}>Receitas</Text>
            </View>
            <View style={styles.divisor} />
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoValor, { color: '#F44336' }]}>R$ {totalDespesas.toFixed(2)}</Text>
              <Text style={[styles.resumoLabel, { color: theme.subText }]}>Despesas</Text>
            </View>
          </>
        )}
      </View>

      {/* Configurações */}
      <Text style={[styles.secaoTitulo, { color: theme.subText }]}>CONFIGURAÇÕES</Text>
      <View style={[styles.secao, { backgroundColor: theme.sectionBg, borderColor: theme.border }]}>
        <View style={[styles.itemConfig, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.itemEsquerda}>
            <Target size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: theme.text }]}>Aparência / Tema</Text>
              <Text style={[styles.itemSubtitulo, { color: theme.subText }]}>Alternar entre Modo Claro e Modo Escuro</Text>
            </View>
          </View>
          <Switch
            value={temaEscuro}
            onValueChange={(value) => setTemaEscuro(value)}
            trackColor={{ true: '#1A9E75' }}
          />
        </View>

        <View style={[styles.itemConfig, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.itemEsquerda}>
            <FileText size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: theme.text }]}>Termos de Uso e Política de Privacidade</Text>
              <Text style={[styles.itemSubtitulo, { color: theme.subText }]}>Leia nossos termos e políticas</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ccc" />
        </View>

        <View style={[styles.itemConfig, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.itemEsquerda}>
            <Shield size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: theme.text }]}>Backup na Nuvem</Text>
              <Text style={[styles.itemSubtitulo, { color: theme.subText }]}>Status da última sincronização dos dados</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Ajuda e suporte */}
      <Text style={styles.secaoTitulo}>AJUDA E SUPORTE</Text>
      <View style={[styles.secao, { backgroundColor: theme.sectionBg, borderColor: theme.border }]}>
        <View style={[styles.faqCard, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.itemTitulo, { color: theme.text }]}>Perguntas Frequentes (FAQ)</Text>
          <Text style={[styles.faqText, { color: theme.subText }]}>• Como adicionar uma nova receita/despesa?</Text>
          <Text style={[styles.faqText, { color: theme.subText }]}>• Os meus dados financeiros estão seguros?</Text>
          <Text style={[styles.faqText, { color: theme.subText }]}>• Como funcionam os relatórios mensais?</Text>
          <Text style={[styles.faqText, { color: theme.subText }]}>• Como redefinir minha senha?</Text>
        </View>

        <Text style={[styles.itemTitulo, { marginHorizontal: 16, marginTop: 16, color: theme.text }]}>Canais de Contato</Text>
        <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL('mailto:nicolas.lima@academico.ifpb.edu.br')}>
          <Text style={styles.contactButtonText}>Fale Conosco</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Linking.openURL('https://wa.me/5583996807389')}
        >
          <Text style={styles.contactButtonText}>Atendimento via WhatsApp</Text>
        </TouchableOpacity>

<View style={[styles.feedbackBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.itemTitulo, { color: theme.text }]}>Feedback / Enviar Sugestão</Text>
          <Text style={[styles.feedbackSubtitulo, { color: theme.subText }]}>
            Sua mensagem vai direto para os desenvolvedores do app.
          </Text>

          {/* Seleção de categoria */}
          <View style={styles.categoriaRow}>
            {CATEGORIAS_FEEDBACK.map((cat) => {
              const ativa = categoriaFeedback === cat.chave;
              return (
                <TouchableOpacity
                  key={cat.chave}
                  style={[styles.categoriaChip, ativa && styles.categoriaChipAtivo]}
                  onPress={() => setCategoriaFeedback(cat.chave)}
                >
                  <Text style={[styles.categoriaTexto, ativa && styles.categoriaTextoAtivo]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={[styles.feedbackInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.sectionBg }]}
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
            onPress={enviarFeedback}
            disabled={enviandoFeedback}
          >
            <Send size={16} color="#fff" />
            <Text style={styles.btnEnviarFeedbackTexto}>
              {enviandoFeedback ? 'Enviando...' : 'Enviar Feedback'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.itemConfig, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.itemEsquerda}>
            <HelpCircle size={20} color="#1A9E75" />
            <View>
              <Text style={[styles.itemTitulo, { color: theme.text }]}>Reportar um Problema (Bug)</Text>
              <Text style={[styles.itemSubtitulo, { color: theme.subText }]}>Avisar se algo travou ou não está funcionando</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ccc" />
        </View>
      </View>

      {/* Rodapé */}
      <Text style={[styles.versao, { color: theme.text }]}>⭐ EduFinance v1.0</Text>
      <Text style={[styles.subVersao, { color: theme.subText }]}>Feito para jovens que querem organizar as finanças</Text>

      <TouchableOpacity
        style={styles.btnSair}
        disabled={saindo}
        onPress={async () => {
          if (saindo) return;
          setSaindo(true);
          try {
            await logout();
            router.replace('/telalogin');
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
