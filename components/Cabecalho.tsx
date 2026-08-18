import { Bell } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NotificacoesModal from './NotificacoesModal';
import type { Notificacao } from '../types';

type Resultado = { sucesso: boolean; mensagem: string };

type Props = {
  notificacoes: Notificacao[];
  carregando: boolean;
  erro: string | null;
  marcarLida: (id: string) => Promise<Resultado>;
  marcarTodasLidas: () => Promise<Resultado>;
  excluir: (id: string) => Promise<Resultado>;
};

export default function Cabecalho({
  notificacoes,
  carregando,
  erro,
  marcarLida,
  marcarTodasLidas,
  excluir,
}: Props) {
  const naoLidas = notificacoes.filter((item) => !item.lida).length;
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.textosContainer}>
        <Text style={styles.subtitulo}>Bem-vindo ao</Text>
        <Text style={styles.titulo}>EduFinance</Text>
      </View>

      <TouchableOpacity
        style={styles.botaoNotificacao}
        onPress={() => setModalAberto(true)}
        activeOpacity={0.6}
      >
        <Bell color="#4A5568" size={22} />
        {naoLidas > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>
              {naoLidas > 9 ? '9+' : naoLidas}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <NotificacoesModal
        visivel={modalAberto}
        onFechar={() => setModalAberto(false)}
        notificacoes={notificacoes}
        carregando={carregando}
        erro={erro}
        marcarLida={marcarLida}
        marcarTodasLidas={marcarTodasLidas}
        excluir={excluir}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  textosContainer: { justifyContent: 'center' },
  subtitulo: { fontSize: 14, color: '#718096', fontWeight: '400' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#1A202C', marginTop: 2 },
  botaoNotificacao: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E53E3E',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
});
