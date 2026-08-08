import { Bell } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CabecalhoProps = {
  notificacoesCount?: number;
  onPressNotificacoes?: () => void;
};

export default function Cabecalho({
  notificacoesCount = 0,
  onPressNotificacoes,
}: CabecalhoProps) {
  const handlePress = () => {
    if (onPressNotificacoes) {
      onPressNotificacoes();
    } else {
      console.log('Sininho clicado! (Adicione a navegação ou modal aqui futuramente)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.textosContainer}>
        <Text style={styles.subtitulo}>Bem-vindo ao</Text>
        <Text style={styles.titulo}>EduFinance</Text>
      </View>

      <TouchableOpacity
        style={styles.botaoNotificacao}
        onPress={handlePress}
        activeOpacity={0.6}
      >
        <Bell color="#4A5568" size={22} />
        {notificacoesCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>
              {notificacoesCount > 9 ? '9+' : notificacoesCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
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
