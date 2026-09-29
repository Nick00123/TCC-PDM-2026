import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Botao from '../components/Botao';
import { enviarAutenticacao, salvarOuAtualizarPerfilUsuario } from '../utils/requisicoes';
import {
  criarSessao,
  headersAutenticados,
  salvarSessao,
} from '../utils/sessao';

// Converte mensagens técnicas da autenticação em textos compreensíveis para a pessoa.
// Recebe o corpo de erro da API; retorna uma mensagem pronta para Alert.
function formatarMensagemDeErro(detalhesErroRecebidos: any): string {
  // Transformo os erros técnicos da API em mensagens mais fáceis de entender.
  const mensagemRecebida = detalhesErroRecebidos?.msg || detalhesErroRecebidos?.error_description || detalhesErroRecebidos?.message || detalhesErroRecebidos?.error || '';
  const textoDoErro = `${detalhesErroRecebidos?.code || ''} ${mensagemRecebida}`.toLowerCase();

  if (textoDoErro.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (textoDoErro.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (textoDoErro.includes('already registered') || textoDoErro.includes('user_already_exists')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (textoDoErro.includes('at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (textoDoErro.includes('rate limit')) return 'Muitas tentativas. Aguarde e tente novamente.';
  if (textoDoErro.includes('weak_password')) return 'A senha é muito fraca.';

  return mensagemRecebida || 'Não foi possível concluir a operação. Tente novamente.';
}

// Gerencia login, cadastro e solicitação de redefinição de senha.
// Lê o modo inicial da rota e envia as ações de autenticação ao Supabase.
export default function Login() {
  const parametrosDaRota = useLocalSearchParams<{ aba?: string }>();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [modoAutenticacao, setModoAutenticacao] = useState<'entrar' | 'criar'>(
    parametrosDaRota.aba === 'criar' ? 'criar' : 'entrar'
  );
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [processandoAutenticacao, setProcessandoAutenticacao] = useState(false);
  const router = useRouter();

  // Valida os campos e executa login ou cadastro conforme a aba escolhida.
  const confirmarAutenticacao = async () => {
    // O mesmo botão faz login ou cadastro, dependendo da aba selecionada.
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha os campos!");
      return;
    }
    if (modoAutenticacao === 'criar' && !nomeCompleto.trim()) {
      Alert.alert('Erro', 'Preencha o nome!');
      return;
    }

    setProcessandoAutenticacao(true);

    try {
      const emailNormalizado = email.trim().toLowerCase();
      const { ok, corpo: dadosDaResposta } = await enviarAutenticacao(
        modoAutenticacao === 'entrar' ? 'token?grant_type=password' : 'signup',
        modoAutenticacao === 'entrar'
          ? { email: emailNormalizado, password: senha }
          : { email: emailNormalizado, password: senha, data: { nome: nomeCompleto.trim() } }
      );

      if (!ok) {
        Alert.alert(
          modoAutenticacao === 'entrar' ? 'Erro no login' : 'Erro no cadastro',
          formatarMensagemDeErro(dadosDaResposta)
        );
        return;
      }

      const sessao = criarSessao(dadosDaResposta);

      // No cadastro pode ser necessário confirmar o e-mail antes de ter uma sessão.
      if (!sessao) {
        if (modoAutenticacao === 'criar' && (dadosDaResposta.user || dadosDaResposta.id)) {
          Alert.alert(
            'Verifique seu e-mail',
            'Conta criada! Confirme o e-mail que enviamos para ativar o seu login.'
          );
          return;
        }

        Alert.alert(
          modoAutenticacao === 'entrar' ? 'Erro no login' : 'Erro no cadastro',
          'O servidor não retornou uma sessão válida.'
        );
        return;
      }

      await salvarSessao(sessao);

      if (modoAutenticacao === 'criar') {
        // Depois de criar a conta, salvo também o nome do perfil.
        const respostaDoPerfil = await salvarOuAtualizarPerfilUsuario(
          sessao.user.id,
          nomeCompleto.trim(),
          await headersAutenticados()
        );

        if (!respostaDoPerfil.ok) {
          console.error('Erro ao criar perfil:', await respostaDoPerfil.text());
          Alert.alert(
            'Conta criada',
            'Sua conta foi criada, mas não foi possível salvar os dados do perfil agora.'
          );
        }
      }

      router.replace('/(tabs)');
    } catch (detalhesErro) {
      Alert.alert(
        modoAutenticacao === 'entrar' ? 'Erro no login' : 'Erro no cadastro',
        formatarMensagemDeErro(detalhesErro)
      );
    } finally {
      setProcessandoAutenticacao(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../assets/images/fundoTransparante.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.titulo}>EduFinance</Text>
        <Text style={styles.subtitulo}>
          {modoAutenticacao === 'entrar' ? 'Que bom te ver de novo!' : 'Crie sua conta gratuita'}
        </Text>

        <View style={styles.card}>
          {/* Essa barra escolhe entre entrar e criar uma conta. */}
          <View style={styles.abas}>
            <Pressable
              style={[styles.aba, modoAutenticacao === 'entrar' && styles.abaAtiva]}
              onPress={() => setModoAutenticacao('entrar')}
            >
              <Text style={[styles.abaTexto, modoAutenticacao === 'entrar' && styles.abaTextoAtivo]}>
                Entrar
              </Text>
            </Pressable>

            <Pressable
              style={[styles.aba, modoAutenticacao === 'criar' && styles.abaAtiva]}
              onPress={() => setModoAutenticacao('criar')}
            >
              <Text style={[styles.abaTexto, modoAutenticacao === 'criar' && styles.abaTextoAtivo]}>
                Criar conta
              </Text>
            </Pressable>
          </View>

          {modoAutenticacao === 'entrar' ? (
            <View>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(textoDigitado) => setEmail(textoDigitado.trim())}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrap}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!mostrarSenha}
                  value={senha}
                  onChangeText={setSenha}
                />
                <Pressable onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.olho}>
                  {mostrarSenha
                    ? <EyeOff size={18} color="#94A3B8" />
                    : <Eye size={18} color="#94A3B8" />}
                </Pressable>
              </View>

              <Botao
                title={processandoAutenticacao ? 'Entrando...' : 'Acessar Conta'}
                onPress={confirmarAutenticacao}
                color="#1A9E75"
                textColor="#fff"
                style={styles.btn}
              />

              <Pressable
                style={styles.link}
                onPress={async () => {
                  if (!email) {
                    Alert.alert('Esqueci minha senha', 'Digite seu e-mail acima para receber o link de redefinição.');
                    return;
                  }
                  try {
                    const urlRetornoCodificada = encodeURIComponent(Linking.createURL('/reset'));
                    const { ok, corpo: dadosDaResposta } = await enviarAutenticacao(
                      `recover?redirect_to=${urlRetornoCodificada}`,
                      { email: email.trim().toLowerCase() }
                    );

                    if (!ok) {
                      Alert.alert('Erro', formatarMensagemDeErro(dadosDaResposta));
                      return;
                    }

                    Alert.alert('E-mail enviado!', `Enviamos um link de redefinição de senha para ${email}. Verifique sua caixa de entrada.`);
                  } catch {
                    Alert.alert('Erro', 'Não foi possível enviar o link. Tente novamente.');
                  }
                }}
              >
                <Text style={styles.linkTexto}>Esqueci minha senha</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Nome completo</Text>
              <View style={styles.inputWrap}>
                <User size={18} color="#94A3B8" style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="Como quer ser chamado?"
                  placeholderTextColor="#94A3B8"
                  value={nomeCompleto}
                  onChangeText={setNomeCompleto}
                />
              </View>

              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu melhor e-mail"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.label}>Crie uma senha</Text>
              <View style={styles.inputWrap}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!mostrarSenha}
                  value={senha}
                  onChangeText={setSenha}
                />
                <Pressable onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.olho}>
                  {mostrarSenha
                    ? <EyeOff size={18} color="#94A3B8" />
                    : <Eye size={18} color="#94A3B8" />}
                </Pressable>
              </View>

              <Botao
                title={processandoAutenticacao ? 'Cadastrando...' : 'Finalizar Cadastro'}
                onPress={confirmarAutenticacao}
                color="#1A9E75"
                textColor="#fff"
                style={styles.btn}
              />
            </View>
          )}
        </View>

        <Text style={styles.footerText}>Seus dados são privados e seguros</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7DC1A8',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 160,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F7FFF7',
    letterSpacing: -0.5,
  },
  subtitulo: {
    fontSize: 14,
    color: 'rgba(247,255,247,0.9)',
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  abas: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    marginBottom: 24,
    padding: 4,
  },
  aba: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  abaAtiva: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  abaTexto: {
    color: '#999',
    fontWeight: '600',
  },
  abaTextoAtivo: {
    color: '#1A9E75',
    fontWeight: '800',
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  inputIcone: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#212529',
  },
  olho: {
    padding: 4,
  },
  btn: {
    marginTop: 6,
  },
  footerText: {
    marginTop: 25,
    fontSize: 11,
    color: '#F7FFF7',
    opacity: 0.7,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  link: {
    marginTop: 14,
    alignSelf: 'center',
  },
  linkTexto: {
    color: '#1A9E75',
    fontSize: 14,
    fontWeight: '600',
  },
});
