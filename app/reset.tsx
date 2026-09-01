import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { endpointAuth, headersPublicos } from '../utils/sessao';

function primeiroParametro(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default function RedefinirSenha() {
  const parametros = useLocalSearchParams<{ access_token?: string | string[] }>();
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [tokenDoLink, setTokenDoLink] = useState<string | undefined>(
    primeiroParametro(parametros.access_token)
  );

  useEffect(() => {
    const extrairToken = (url: string | null) => {
      if (!url) return;
      const resultado = /(?:[?#&])access_token=([^&]+)/.exec(url);
      if (resultado?.[1]) setTokenDoLink(decodeURIComponent(resultado[1]));
    };

    Linking.getInitialURL().then(extrairToken).catch(() => undefined);
    const inscricao = Linking.addEventListener('url', ({ url }) => extrairToken(url));
    return () => inscricao.remove();
  }, []);

  const redefinir = async () => {
    if (salvando) return;
    if (senha.length < 6) {
      Alert.alert('Senha inválida', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      Alert.alert('Senhas diferentes', 'Digite a mesma senha nos dois campos.');
      return;
    }

    const accessToken = tokenDoLink;
    if (!accessToken) {
      Alert.alert('Link inválido', 'Solicite um novo link de redefinição de senha.');
      return;
    }

    setSalvando(true);
    try {
      const resposta = await fetch(endpointAuth('user'), {
        method: 'PUT',
        headers: { ...headersPublicos(), Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password: senha }),
      });

      if (!resposta.ok) {
        throw new Error(await resposta.text());
      }

      Alert.alert('Senha atualizada', 'Entre novamente usando sua nova senha.');
      router.replace('/login');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a senha. Solicite um novo link.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Redefinir senha</Text>
        <Text style={styles.subtitulo}>Escolha uma nova senha para sua conta.</Text>
        <TextInput
          style={styles.input}
          placeholder="Nova senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar nova senha"
          secureTextEntry
          value={confirmacao}
          onChangeText={setConfirmacao}
        />
        <Pressable style={styles.botao} onPress={redefinir} disabled={salvando}>
          <Text style={styles.botaoTexto}>{salvando ? 'Salvando...' : 'Atualizar senha'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7DC1A8',
    justifyContent: 'center',
    padding: 24,
  },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitulo: { color: '#64748B', marginTop: 6, marginBottom: 20 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  botao: { backgroundColor: '#1A9E75', borderRadius: 12, padding: 15, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '700' },
});
