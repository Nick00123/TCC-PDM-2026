import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { endpointAuth, headersPublicos } from '../utils/sessao';

// Normaliza parâmetros que o Expo Router pode entregar como texto ou lista.
// Recebe um parâmetro de rota; retorna o primeiro valor ou undefined.
function obterPrimeiroParametro(valorDoParametro: string | string[] | undefined): string | undefined {
  // O Expo pode entregar um parâmetro sozinho ou dentro de uma lista.
  return Array.isArray(valorDoParametro) ? valorDoParametro[0] : valorDoParametro;
}

// Permite definir uma nova senha usando o token recebido no link de recuperação.
// Lê o token da rota/link e envia a nova senha ao endpoint de autenticação.
export default function RedefinirSenha() {
  const parametrosDaRota = useLocalSearchParams<{ access_token?: string | string[] }>();
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [tokenDoLink, setTokenDoLink] = useState<string | undefined>(
    obterPrimeiroParametro(parametrosDaRota.access_token)
  );

  useEffect(() => {
    // O token pode chegar pela URL que abriu o app ou por um link recebido depois.
    const atualizarTokenDoLink = (urlRecebida: string | null) => {
      if (!urlRecebida) return;
      const correspondenciaToken = /(?:[?#&])access_token=([^&]+)/.exec(urlRecebida);
      if (correspondenciaToken?.[1]) setTokenDoLink(decodeURIComponent(correspondenciaToken[1]));
    };

    Linking.getInitialURL().then(atualizarTokenDoLink).catch(() => undefined);
    const inscricaoDoLink = Linking.addEventListener('url', ({ url }) => atualizarTokenDoLink(url));
    return () => inscricaoDoLink.remove();
  }, []);

  const atualizarSenha = async () => {
    // Evito dois cliques tentando salvar a senha ao mesmo tempo.
    if (salvando) return;
    if (senha.length < 6) {
      Alert.alert('Senha inválida', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmacaoSenha) {
      Alert.alert('Senhas diferentes', 'Digite a mesma senha nos dois campos.');
      return;
    }

    // Esse token prova que a troca de senha veio do e-mail correto.
    const accessToken = tokenDoLink;
    if (!accessToken) {
      Alert.alert('Link inválido', 'Solicite um novo link de redefinição de senha.');
      return;
    }

    setSalvando(true);
    try {
      const respostaDaApi = await fetch(endpointAuth('user'), {
        method: 'PUT',
        headers: { ...headersPublicos(), Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ password: senha }),
      });

      if (!respostaDaApi.ok) {
        throw new Error(await respostaDaApi.text());
      }

      Alert.alert('Senha atualizada', 'Entre novamente usando sua nova senha.');
      router.replace('/login');
    } catch (detalhesErro) {
      console.error('Erro ao redefinir senha:', detalhesErro);
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
          value={confirmacaoSenha}
          onChangeText={setConfirmacaoSenha}
        />
        <Pressable style={styles.botao} onPress={atualizarSenha} disabled={salvando}>
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
