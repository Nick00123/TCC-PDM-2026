import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../src/api/supabaseCliente';
import { usuarioApi } from '../src/api/usuarioApi';
import Botao from '../src/componentes/Botao';
import { useAuth } from './_layout';

export default function App() {
  const [gmail, setGmail] = useState('');
  const [senha, setSenha] = useState('');
  const { setUsuario } = useAuth();
  const [nome, setNome] = useState(''); // Estado para o nome no cadastro
  const [aba, setAba] = useState<'entrar' | 'criar'>('entrar');
  const router = useRouter();

  {/*const confirmar = () => {
    const acao = aba === 'entrar' ? 'Login' : 'Cadastro';
    Alert.alert('Sucesso!', `${acao} realizado com e-mail: ${gmail}`);
    router.push('/telainicial2');
  };*/}

const confirmar = async () => {
  if (!gmail || !senha) {
    Alert.alert("Erro", "Preencha os campos!");
    return;
  }

  if (aba === 'entrar') {
    const { usuario, mensagem } = await usuarioApi.entrar(gmail, senha);
    if (!usuario) {
      // Exibe o motivo real do Supabase (senha incorreta, e-mail não confirmado, etc.)
      Alert.alert("Erro no login", mensagem || "Não foi possível entrar.");
      return;
    }
    setUsuario(usuario);
    router.replace('/');
  } else {
    if (!nome) {
      Alert.alert("Erro", "Preencha o nome!");
      return;
    }
    const { usuario, mensagem } = await usuarioApi.cadastrar(nome, gmail, senha);
    if (!usuario) {
      // Se o e-mail precisa de confirmação, orientamos o usuário a confirmá-lo.
      Alert.alert(mensagem?.startsWith("Conta criada") ? "Verifique seu e-mail" : "Erro no cadastro", mensagem || "Não foi possível criar a conta.");
      return;
    }
    setUsuario(usuario);
    router.replace('/telainicial');
  }
};

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/logo.png')} 
        style={styles.logo} 
      />

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

        {/* --- CONTEÚDO DINÂMICO --- */}

        {aba === 'entrar' ? (
          // O QUE APARECE NA ABA ENTRAR
          <View>
<Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input}
              placeholder="Digite seu e-mail"
              value={gmail}
              onChangeText={(t) => setGmail(t.trim())}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Text style={styles.label}>Senha</Text>
            <TextInput 
              style={styles.input}
              placeholder="Digite sua senha"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
            
            <Botao title="Acessar Conta" onPress={confirmar} color="#7DC1A8" />

            <Pressable
              style={styles.link}
              onPress={async () => {
                if (!gmail) {
                  Alert.alert('Esqueci minha senha', 'Digite seu e-mail acima para receber o link de redefinição.');
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(gmail, {
                  redirectTo: 'com.edufinance.app://reset',
                });
                if (error) {
                  Alert.alert('Erro', 'Não foi possível enviar o link. Tente novamente.');
                } else {
                  Alert.alert('E-mail enviado!', `Enviamos um link de redefinição de senha para ${gmail}. Verifique sua caixa de entrada.`);
                }
              }}
            >
              <Text style={styles.linkTexto}>Esqueci minha senha</Text>
            </Pressable>
          </View>
        ) : (
          // O QUE APARECE NA ABA CRIAR CONTA
          <View>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput 
              style={styles.input}
              placeholder="Como quer ser chamado?"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input}
              placeholder="Seu melhor e-mail"
              value={gmail}
              onChangeText={setGmail}
            />

            <Text style={styles.label}>Crie uma senha</Text>
            <TextInput 
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />

            <Botao title="Finalizar Cadastro" onPress={confirmar} color="#7DC1A8" />
          </View>
        )}
      </View>

      <Text style={styles.footerText}>Seus dados são privados e seguros</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7DC1A8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
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
  },
  abaTexto: {
    color: '#999',
    fontWeight: '600',
  },
  abaTextoAtivo: {
    color: '#212529',
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    marginBottom: 15,
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
