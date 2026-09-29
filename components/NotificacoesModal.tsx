import { Bell, BellRing, CheckCheck, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Notificacao, ResultadoOperacao } from '../types';

type Props = {
  visivel: boolean;
  onFechar: () => void;
  notificacoes: Notificacao[];
  carregando: boolean;
  erro: string | null;
  marcarLida: (id: string) => Promise<ResultadoOperacao>;
  marcarTodasLidas: () => Promise<ResultadoOperacao>;
  excluir: (id: string) => Promise<ResultadoOperacao>;
};

const CORES_TIPO: { [key: string]: { fundo: string; cor: string } } = {
  meta: { fundo: '#E8F5E9', cor: '#1A9E75' },
  alerta: { fundo: '#FFEBEE', cor: '#E11D48' },
  dica: { fundo: '#E3F2FD', cor: '#1565C0' },
  sistema: { fundo: '#F3E5F5', cor: '#6A1B9A' },
};

const ICONES_TIPO: { [key: string]: React.ReactNode } = {
  meta: <CheckCheck size={18} color="#1A9E75" />,
  alerta: <BellRing size={18} color="#E11D48" />,
  dica: <Bell size={18} color="#1565C0" />,
  sistema: <Bell size={18} color="#6A1B9A" />,
};

// Converte a data de criação em um intervalo legível, como "5 min atrás".
// Recebe a data em texto; retorna o tempo decorrido ou uma string vazia se for inválida.
function formatarTempoDecorrido(dataCriacao: string): string {
  const dataNotificacao = new Date(dataCriacao);
  if (isNaN(dataNotificacao.getTime())) return '';
  const dataAtual = new Date();
  const diferencaEmMs = dataAtual.getTime() - dataNotificacao.getTime();
  const minutosDecorridos = Math.floor(diferencaEmMs / 60000);
  if (minutosDecorridos < 1) return 'agora';
  if (minutosDecorridos < 60) return `${minutosDecorridos} min atrás`;
  const horasDecorridas = Math.floor(minutosDecorridos / 60);
  if (horasDecorridas < 24) return `${horasDecorridas} h atrás`;
  const diasDecorridos = Math.floor(horasDecorridas / 24);
  return `${diasDecorridos} d atrás`;
}

// Apresenta notificações e permite marcá-las como lidas ou excluí-las.
// Recebe dados e callbacks da tela; não retorna dados, apenas executa as ações solicitadas.
export default function NotificacoesModal({
  visivel,
  onFechar,
  notificacoes,
  carregando,
  erro,
  marcarLida,
  marcarTodasLidas,
  excluir,
}: Props) {
  // Esses estados impedem repetir uma ação enquanto ela ainda está carregando.
  const [marcandoNotificacaoId, setMarcandoNotificacaoId] = useState<string | null>(null);
  const [marcandoTodasNotificacoes, setMarcandoTodasNotificacoes] = useState(false);
  const [excluindoNotificacaoId, setExcluindoNotificacaoId] = useState<string | null>(null);

  // Chama a ação da tela apenas se a notificação ainda não estiver sendo processada.
  const marcarNotificacaoComoLida = async (notificacaoAtual: Notificacao) => {
    // Notificação já lida não precisa chamar a API outra vez.
    if (notificacaoAtual.lida || marcandoNotificacaoId === notificacaoAtual.id) return;

    setMarcandoNotificacaoId(notificacaoAtual.id);
    try {
      const resultadoOperacao = await marcarLida(notificacaoAtual.id);
      if (!resultadoOperacao.sucesso) {
        Alert.alert('Erro', resultadoOperacao.mensagem);
      }
    } catch (detalhesErro) {
      console.error('Erro inesperado ao marcar notificação:', detalhesErro);
      Alert.alert('Erro', 'Não foi possível marcar a notificação como lida.');
    } finally {
      setMarcandoNotificacaoId(null);
    }
  };

  // Solicita à tela que marque todas as notificações como lidas.
  const marcarTodasComoLidas = async () => {
    if (marcandoTodasNotificacoes) return;

    setMarcandoTodasNotificacoes(true);
    try {
      const resultadoOperacao = await marcarTodasLidas();
      if (!resultadoOperacao.sucesso) {
        Alert.alert('Erro', resultadoOperacao.mensagem);
      }
    } catch (detalhesErro) {
      console.error('Erro inesperado ao marcar todas como lidas:', detalhesErro);
      Alert.alert('Erro', 'Não foi possível marcar todas as notificações como lidas.');
    } finally {
      setMarcandoTodasNotificacoes(false);
    }
  };

  // Confirma a exclusão antes de executar o callback recebido da tela.
  const confirmarExclusao = (notificacaoId: string) => {
    // Peço confirmação porque essa ação apaga a notificação.
    if (excluindoNotificacaoId === notificacaoId) return;

    Alert.alert('Excluir notificação', 'Deseja realmente excluir esta notificação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setExcluindoNotificacaoId(notificacaoId);
          try {
            const resultadoOperacao = await excluir(notificacaoId);
            if (!resultadoOperacao.sucesso) {
              Alert.alert('Erro', resultadoOperacao.mensagem);
            }
          } catch (detalhesErro) {
            console.error('Erro inesperado ao excluir notificação:', detalhesErro);
            Alert.alert('Erro', 'Não foi possível excluir a notificação.');
          } finally {
            setExcluindoNotificacaoId(null);
          }
        },
      },
    ]);
  };

  // Constrói a linha de uma notificação usando o tipo para escolher ícone e cores.
  const renderizarNotificacao = ({ item: notificacaoAtual }: { item: Notificacao }) => {
    const estiloNotificacao = CORES_TIPO[notificacaoAtual.tipo] || CORES_TIPO.sistema;
    const iconeNotificacao = ICONES_TIPO[notificacaoAtual.tipo] || ICONES_TIPO.sistema;

    return (
      <View
        style={[styles.item, !notificacaoAtual.lida && styles.itemNaoLida]}
      >
        <TouchableOpacity
          style={styles.itemConteudo}
          onPress={() => marcarNotificacaoComoLida(notificacaoAtual)}
          disabled={notificacaoAtual.lida || marcandoNotificacaoId === notificacaoAtual.id}
          activeOpacity={0.7}
        >
          <View style={[styles.iconeBox, { backgroundColor: estiloNotificacao.fundo }]}>
            {iconeNotificacao}
          </View>
          <View style={styles.info}>
            <Text style={styles.titulo}>{notificacaoAtual.titulo}</Text>
            <Text style={styles.mensagem} numberOfLines={3}>
              {notificacaoAtual.mensagem}
            </Text>
            <Text style={styles.tempo}>{formatarTempoDecorrido(notificacaoAtual.criadaEm)}</Text>
          </View>
          {!notificacaoAtual.lida && <View style={styles.pontoNaoLida} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => confirmarExclusao(notificacaoAtual.id)}
          disabled={excluindoNotificacaoId === notificacaoAtual.id}
          style={styles.btnExcluir}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={16} color="#CCC" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onFechar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.tituloHeader}>Notificações</Text>
              <Text style={styles.subtituloHeader}>
                {notificacoes.length} no total
              </Text>
            </View>
            <View style={styles.headerBotoes}>
              {notificacoes.some((notificacaoAtual) => !notificacaoAtual.lida) && (
                <TouchableOpacity
                  style={styles.btnLerTodas}
                  onPress={marcarTodasComoLidas}
                  disabled={marcandoTodasNotificacoes}
                >
                  <CheckCheck size={16} color="#1A9E75" />
                  <Text style={styles.btnLerTodasTexto}>
                    {marcandoTodasNotificacoes ? 'Marcando...' : 'Ler todas'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onFechar} style={styles.btnFechar}>
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {carregando ? (
            <View style={styles.vazio}>
              <ActivityIndicator size="large" color="#1A9E75" />
              <Text style={styles.vazioTexto}>Carregando notificações...</Text>
            </View>
          ) : erro ? (
            <View style={styles.vazio}>
              <Bell size={40} color="#E11D48" />
              <Text style={styles.vazioTitulo}>Não foi possível carregar</Text>
              <Text style={styles.vazioTexto}>{erro}</Text>
            </View>
          ) : notificacoes.length === 0 ? (
            <View style={styles.vazio}>
              <Bell size={40} color="#CCC" />
              <Text style={styles.vazioTitulo}>Nenhuma notificação</Text>
              <Text style={styles.vazioTexto}>
                Aqui aparecerão alertas sobre suas metas e finanças.
              </Text>
            </View>
          ) : (
            <FlatList
              data={notificacoes}
              keyExtractor={(notificacaoAtual) => notificacaoAtual.id}
              renderItem={renderizarNotificacao}
              contentContainerStyle={styles.lista}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tituloHeader: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  subtituloHeader: { fontSize: 12, color: '#888', marginTop: 2 },
  headerBotoes: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnLerTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  btnLerTodasTexto: { color: '#1A9E75', fontSize: 12, fontWeight: '600' },
  btnFechar: { padding: 4 },
  lista: { padding: 16 },
  item: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F1F1',
  },
  itemConteudo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  itemNaoLida: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  iconeBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  titulo: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  mensagem: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
  tempo: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  pontoNaoLida: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A9E75',
    marginLeft: 8,
    alignSelf: 'center',
  },
  btnExcluir: { padding: 4, marginLeft: 8, alignSelf: 'center' },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  vazioTitulo: { fontSize: 17, fontWeight: 'bold', color: '#333', marginTop: 12 },
  vazioTexto: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8 },
});
