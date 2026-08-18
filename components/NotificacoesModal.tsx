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
import type { Notificacao } from '../types';

type Resultado = { sucesso: boolean; mensagem: string };

type Props = {
  visivel: boolean;
  onFechar: () => void;
  notificacoes: Notificacao[];
  carregando: boolean;
  erro: string | null;
  marcarLida: (id: string) => Promise<Resultado>;
  marcarTodasLidas: () => Promise<Resultado>;
  excluir: (id: string) => Promise<Resultado>;
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

function formatarTempo(criadaEm: string): string {
  const data = new Date(criadaEm);
  if (isNaN(data.getTime())) return '';
  const agora = new Date();
  const diff = agora.getTime() - data.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min atrás`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `${horas} h atrás`;
  const dias = Math.floor(horas / 24);
  return `${dias} d atrás`;
}

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
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const lerNotificacao = async (item: Notificacao) => {
    if (item.lida || marcandoId === item.id) return;

    setMarcandoId(item.id);
    try {
      const resultado = await marcarLida(item.id);
      if (!resultado.sucesso) {
        Alert.alert('Erro', resultado.mensagem);
      }
    } catch (error) {
      console.error('Erro inesperado ao marcar notificação:', error);
      Alert.alert('Erro', 'Não foi possível marcar a notificação como lida.');
    } finally {
      setMarcandoId(null);
    }
  };

  const lerTodas = async () => {
    if (marcandoTodas) return;

    setMarcandoTodas(true);
    try {
      const resultado = await marcarTodasLidas();
      if (!resultado.sucesso) {
        Alert.alert('Erro', resultado.mensagem);
      }
    } catch (error) {
      console.error('Erro inesperado ao marcar todas como lidas:', error);
      Alert.alert('Erro', 'Não foi possível marcar todas as notificações como lidas.');
    } finally {
      setMarcandoTodas(false);
    }
  };

  const confirmarExclusao = (id: string) => {
    if (excluindoId === id) return;

    Alert.alert('Excluir notificação', 'Deseja realmente excluir esta notificação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setExcluindoId(id);
          try {
            const resultado = await excluir(id);
            if (!resultado.sucesso) {
              Alert.alert('Erro', resultado.mensagem);
            }
          } catch (error) {
            console.error('Erro inesperado ao excluir notificação:', error);
            Alert.alert('Erro', 'Não foi possível excluir a notificação.');
          } finally {
            setExcluindoId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Notificacao }) => {
    const estilo = CORES_TIPO[item.tipo] || CORES_TIPO.sistema;
    const icone = ICONES_TIPO[item.tipo] || ICONES_TIPO.sistema;

    return (
      <View
        style={[styles.item, !item.lida && styles.itemNaoLida]}
      >
        <TouchableOpacity
          style={styles.itemConteudo}
          onPress={() => lerNotificacao(item)}
          disabled={item.lida || marcandoId === item.id}
          activeOpacity={0.7}
        >
          <View style={[styles.iconeBox, { backgroundColor: estilo.fundo }]}>
            {icone}
          </View>
          <View style={styles.info}>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.mensagem} numberOfLines={3}>
              {item.mensagem}
            </Text>
            <Text style={styles.tempo}>{formatarTempo(item.criadaEm)}</Text>
          </View>
          {!item.lida && <View style={styles.pontoNaoLida} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => confirmarExclusao(item.id)}
          disabled={excluindoId === item.id}
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
              {notificacoes.some((n) => !n.lida) && (
                <TouchableOpacity
                  style={styles.btnLerTodas}
                  onPress={lerTodas}
                  disabled={marcandoTodas}
                >
                  <CheckCheck size={16} color="#1A9E75" />
                  <Text style={styles.btnLerTodasTexto}>
                    {marcandoTodas ? 'Marcando...' : 'Ler todas'}
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
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
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
