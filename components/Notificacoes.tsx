/*import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react-native';
import { useNotificacoes } from '@/NotificacoesContext';

export default function TelaNotificacoes() {
  const { notificacoes, marcarComoLida } = useNotificacoes();

  return (
    <View style={styles.container}>
      <Text style={styles.tituloHeader}>Notificações</Text>

      {notificacoes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color="#CBD5E0" />
          <Text style={styles.emptyTexto}>Nenhuma notificação por enquanto.</Text>
        </View>
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.lida && styles.cardNaoLida]}>
              <View style={styles.iconArea}>
                {item.tipo === 'sucesso' && <CheckCircle size={22} color="#1A9E75" />}
                {item.tipo === 'alerta' && <AlertTriangle size={22} color="#F57F17" />}
                {item.tipo === 'info' && <Info size={22} color="#2196F3" />}
              </View>
              <View style={styles.textArea}>
                <Text style={styles.itemTitulo}>{item.titulo}</Text>
                <Text style={styles.itemMensagem}>{item.mensagem}</Text>
                <Text style={styles.itemData}>{item.data}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC', padding: 20 },
  tituloHeader: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginBottom: 16 },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12 },
  cardNaoLida: { borderLeftWidth: 4, borderLeftColor: '#1A9E75' },
  iconArea: { marginTop: 2 },
  textArea: { flex: 1 },
  itemTitulo: { fontSize: 15, fontWeight: 'bold', color: '#2D3748' },
  itemMensagem: { fontSize: 13, color: '#718096', marginTop: 2 },
  itemData: { fontSize: 11, color: '#A0AEC0', marginTop: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTexto: { color: '#A0AEC0', fontSize: 14 },
});*/