import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
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
import {
  criarSessao,
  headersAutenticados,
  salvarSessao,
} from '../utils/sessao';
import Botao from '../components/Botao';
import { enviarAutenticacao, salvarPerfil } from '../utils/requisicoes';

function mensagemDeErro(erro: any): string {
  const mensagem = erro?.msg || erro?.error_description || erro?.message || erro?.error || '';
  const texto = `${erro?.code || ''} ${mensagem}`.toLowerCase();

  if (texto.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (texto.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (texto.includes('already registered') || texto.includes('user_already_exists')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (texto.includes('at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (texto.includes('rate limit')) return 'Muitas tentativas. Aguarde e tente novamente.';
  if (texto.includes('weak_password')) return 'A senha é muito fraca.';

  return mensagem || 'Não foi possível concluir a operação. Tente novamente.';
}

export default function App() {
  const [gmail, setGmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [aba, setAba] = useState<'entrar' | 'criar'>('entrar');
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const confirmar = async () => {
    if (!gmail || !senha) {
      Alert.alert("Erro", "Preencha os campos!");
      return;
    }
    if (aba === 'criar' && !nome.trim()) {
      Alert.alert('Erro', 'Preencha o nome!');
      return;
    }

    setCarregando(true);

    try {
      const email = gmail.trim().toLowerCase();
      const { ok, corpo: dados } = await enviarAutenticacao(
        aba === 'entrar' ? 'token?grant_type=password' : 'signup',
        aba === 'entrar'
          ? { email, password: senha }
          : { email, password: senha, data: { nome: nome.trim() } }
      );

      if (!ok) {
        Alert.alert(
          aba === 'entrar' ? 'Erro no login' : 'Erro no cadastro',
          mensagemDeErro(dados)
        );
        return;
      }

      const sessao = criarSessao(dados);

      if (!sessao) {
        if (aba === 'criar' && (dados.user || dados.id)) {
          Alert.alert(
            'Verifique seu e-mail',
            'Conta criada! Confirme o e-mail que enviamos para ativar o seu login.'
          );
          return;
        }

        Alert.alert(
          aba === 'entrar' ? 'Erro no login' : 'Erro no cadastro',
          'O servidor não retornou uma sessão válida.'
        );
        return;
      }

      await salvarSessao(sessao);

      if (aba === 'criar') {
        const perfilResposta = await salvarPerfil(
          sessao.user.id,
          nome.trim(),
          await headersAutenticados()
        );

        if (!perfilResposta.ok) {
          console.error('Erro ao criar perfil:', await perfilResposta.text());
          Alert.alert(
            'Conta criada',
            'Sua conta foi criada, mas não foi possível salvar os dados do perfil agora.'
          );
        }
      }

      router.replace('/(tabs)');
    } catch (erro) {
      Alert.alert(
        aba === 'entrar' ? 'Erro no login' : 'Erro no cadastro',
        mensagemDeErro(erro)
      );
    } finally {
      setCarregando(false);
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
          source={require('../assets/images/logo.edufinance.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.titulo}>EduFinance</Text>
        <Text style={styles.subtitulo}>
          {aba === 'entrar' ? 'Que bom te ver de novo!' : 'Crie sua conta gratuita'}
        </Text>

        <View style={styles.card}>
          {/* Barra de Seleção de Abas */}
          <View style={styles.abas}>
            <Pressable
              style={[styles.aba, aba === 'entrar' && styles.abaAtiva]}
              onPress={() => setAba('entrar')}
            >
              <Text style={[styles.abaTexto, aba === 'entrar' && styles.abaTextoAtivo]}>
                Entrar
              </Text>
            </Pressable>

            <Pressable
              style={[styles.aba, aba === 'criar' && styles.abaAtiva]}
              onPress={() => setAba('criar')}
            >
              <Text style={[styles.abaTexto, aba === 'criar' && styles.abaTextoAtivo]}>
                Criar conta
              </Text>
            </Pressable>
          </View>

          {aba === 'entrar' ? (
            <View>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#94A3B8"
                  value={gmail}
                  onChangeText={(t) => setGmail(t.trim())}
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
                  secureTextEntry={!verSenha}
                  value={senha}
                  onChangeText={setSenha}
                />
                <Pressable onPress={() => setVerSenha(!verSenha)} style={styles.olho}>
                  {verSenha
                    ? <EyeOff size={18} color="#94A3B8" />
                    : <Eye size={18} color="#94A3B8" />}
                </Pressable>
              </View>

              <Botao
                title={carregando ? 'Entrando...' : 'Acessar Conta'}
                onPress={confirmar}
                color="#1A9E75"
                textColor="#fff"
                style={styles.btn}
              />

              <Pressable
                style={styles.link}
                onPress={async () => {
                  if (!gmail) {
                    Alert.alert('Esqueci minha senha', 'Digite seu e-mail acima para receber o link de redefinição.');
                    return;
                  }
                  try {
                    const redirectTo = encodeURIComponent('com.edufinance.app://reset');
                    const { ok, corpo: dados } = await enviarAutenticacao(
                      `recover?redirect_to=${redirectTo}`,
                      { email: gmail.trim().toLowerCase() }
                    );

                    if (!ok) {
                      Alert.alert('Erro', mensagemDeErro(dados));
                      return;
                    }

                    Alert.alert('E-mail enviado!', `Enviamos um link de redefinição de senha para ${gmail}. Verifique sua caixa de entrada.`);
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
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcone} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu melhor e-mail"
                  placeholderTextColor="#94A3B8"
                  value={gmail}
                  onChangeText={setGmail}
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
                  secureTextEntry={!verSenha}
                  value={senha}
                  onChangeText={setSenha}
                />
                <Pressable onPress={() => setVerSenha(!verSenha)} style={styles.olho}>
                  {verSenha
                    ? <EyeOff size={18} color="#94A3B8" />
                    : <Eye size={18} color="#94A3B8" />}
                </Pressable>
              </View>

              <Botao
                title={carregando ? 'Cadastrando...' : 'Finalizar Cadastro'}
                onPress={confirmar}
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
