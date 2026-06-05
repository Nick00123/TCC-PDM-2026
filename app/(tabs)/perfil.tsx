import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useFinance, useAuth } from '../_layout';
import { ChevronRight, LogOut, Bell, FileText, Target, Shield, HelpCircle } from 'lucide-react-native';

export default function Perfil() {
  const { totalReceitas, totalDespesas } = useFinance();
  const { usuario, logout } = useAuth();
  const [notificacoes, setNotificacoes] = useState(true);
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>

      {/* Card do usuário */}
      <View style={styles.cardUsuario}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {usuario?.nome ? usuario.nome[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.nomeUsuario}>{usuario?.nome || 'Usuário'}</Text>
          <Text style={styles.emailUsuario}>{usuario?.email || 'email@exemplo.com'}</Text>
        </View>
      </View>

      {/* Resumo financeiro */}
      <View style={styles.resumo}>
        <View style={styles.resumoItem}>
          <Text style={styles.resumoValor}>R$ {totalReceitas.toFixed(2)}</Text>
          <Text style={styles.resumoLabel}>Receitas</Text>
        </View>
        <View style={styles.divisor} />
        <View style={styles.resumoItem}>
          <Text style={[styles.resumoValor, { color: '#F44336' }]}>R$ {totalDespesas.toFixed(2)}</Text>
          <Text style={styles.resumoLabel}>Despesas</Text>
        </View>
      </View>

      {/* Configurações */}
      <Text style={styles.secaoTitulo}>CONFIGURAÇÕES</Text>
      <View style={styles.secao}>

        <View style={styles.itemConfig}>
          <View style={styles.itemEsquerda}>
            <Bell size={20} color="#1A9E75" />
            <View>
              <Text style={styles.itemTitulo}>Notificações</Text>
              <Text style={styles.itemSubtitulo}>Alertas de orçamento</Text>
            </View>
          </View>
          <Switch
            value={notificacoes}
            onValueChange={setNotificacoes}
            trackColor={{ true: '#1A9E75' }}
          />
        </View>

        {[
          { icon: <FileText size={20} color="#1A9E75" />, titulo: 'Relatórios', sub: 'Ver histórico completo' },
          { icon: <Target size={20} color="#1A9E75" />, titulo: 'Metas de economia', sub: 'Gerenciar seus objetivos' },
          { icon: <Shield size={20} color="#1A9E75" />, titulo: 'Privacidade', sub: 'Dados e segurança' },
          { icon: <HelpCircle size={20} color="#1A9E75" />, titulo: 'Ajuda & Suporte', sub: 'FAQ e contato' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.itemConfig}>
            <View style={styles.itemEsquerda}>
              {item.icon}
              <View>
                <Text style={styles.itemTitulo}>{item.titulo}</Text>
                <Text style={styles.itemSubtitulo}>{item.sub}</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Rodapé */}
      <Text style={styles.versao}>⭐ EduFinance v1.0</Text>
      <Text style={styles.subVersao}>Feito para jovens que querem organizar as finanças</Text>

      <TouchableOpacity style={styles.btnSair} onPress={() => {
        logout();
        router.replace('/telalogin');
      }}>
        <LogOut size={18} color="#F44336" />
        <Text style={styles.btnSairTexto}>Sair da Conta</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  cardUsuario: {
    backgroundColor: '#1A9E75',
    padding: 24,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTexto: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  nomeUsuario: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  emailUsuario: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  resumo: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    marginBottom: 16,
  },
  resumoItem: { flex: 1, alignItems: 'center' },
  resumoValor: { fontSize: 18, fontWeight: 'bold', color: '#1A9E75' },
  resumoLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  divisor: { width: 1, backgroundColor: '#F0F0F0' },
  secaoTitulo: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  secao: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  itemConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemTitulo: { fontSize: 15, fontWeight: '600' },
  itemSubtitulo: { fontSize: 12, color: '#888', marginTop: 2 },
  versao: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#333' },
  subVersao: { textAlign: 'center', fontSize: 12, color: '#888', marginTop: 4 },
  btnSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  btnSairTexto: { color: '#F44336', fontSize: 15, fontWeight: '600' },
});