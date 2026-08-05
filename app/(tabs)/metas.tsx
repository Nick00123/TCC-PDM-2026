import { Check, Plus, Target, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { Meta, useFinance } from '../_layout';

export default function Metas() {
  const {
  metas,
  adicionarMeta,
  depositar,
  excluirMeta,
  carregandoMetas,
} = useFinance();
  const [metaSelecionada, setMetaSelecionada] = useState<string | null>(null);
  const [valorDeposito, setValorDeposito] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [total, setTotal] = useState('');




const metasAndamento = (metas ?? []).filter(
    (m: Meta) => m.atual < m.total
);

const metasConcluidas = (metas ?? []).filter(
    (m: Meta) => m.atual >= m.total
);

  const salvar = async () => {

  if (!titulo.trim()) return;

  if (!total.trim()) return;

  const valor = Number(total.replace(',', '.'));

  if (isNaN(valor)) return;

  await adicionarMeta(titulo, valor);

Alert.alert('Sucesso', 'Meta criada com sucesso!');

  setTitulo('');
  setTotal('');
  setModalAberto(false);

};

if (carregandoMetas) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Carregando metas...</Text>
    </View>
  );
}


  return (
    <ScrollView style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Metas de Economia</Text>
          <Text style={styles.subtitulo}>Realize seus sonhos com planejamento</Text>
        </View>
        <TouchableOpacity style={styles.btnNova} onPress={() => setModalAberto(true)}>
          <Plus size={16} color="#fff" />
          <Text style={styles.btnNovaTexto}>Nova Meta</Text>
        </TouchableOpacity>
      </View>

      {/* Em andamento */}
      {metasAndamento.length > 0 && (
        <>
          <Text style={styles.secaoTitulo}>EM ANDAMENTO</Text>
          {metasAndamento.map((meta: Meta) => {
            const pct =
  meta.total > 0
    ? Math.min(Math.round((meta.atual / meta.total) * 100), 100)
    : 0;
            return (
              <View key={meta.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.metaTitulo}>{meta.titulo}</Text>
                  <TouchableOpacity
  onPress={async () => {
    await excluirMeta(meta.id);
  }}
>
                    <Trash2 size={18} color="#ccc" />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressoBg}>
                  <View style={[styles.progressoFill, { width: `${pct}%` }]} />
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.valorAtual}>R$ {meta.atual.toFixed(2)}</Text>
                    <Text style={styles.valorTotal}>de R$ {meta.total.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.pct}>{pct}%</Text>
                </View>

                <TouchableOpacity style={styles.btnDepositar} onPress={() => setMetaSelecionada(meta.id)}>
                  <Text style={styles.btnDepositarTexto}>+ Depositar</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </>
      )}

      {/* Concluídas */}
      {metasConcluidas.length > 0 && (
        <>
          <Text style={styles.secaoTitulo}>CONCLUÍDAS</Text>
          {metasConcluidas.map((meta: Meta) => (
            <View key={meta.id} style={[styles.card, styles.cardConcluida]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.metaTitulo}>{meta.titulo}</Text>
                  <Text style={styles.concluidaTexto}>Concluída! R$ {meta.total.toFixed(2)}</Text>
                </View>
                <Check size={22} color="#1A9E75" />
              </View>
            </View>
          ))}
        </>
      )}

      {/* Vazio */}
      {(metas ?? []).length === 0 && (
        <View style={styles.vazio}>
          <Target size={48} color="#1A9E75" />
          <Text style={styles.vazioTitulo}>Nenhuma meta ainda</Text>
          <Text style={styles.vazioSubtitulo}>Crie sua primeira meta e comece a economizar!</Text>
        </View>
      )}

      {/* Modal nova meta */}
      <Modal visible={modalAberto} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Nova Meta</Text>

            <Text style={styles.label}>Nome da meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Viagem para Europa"
              value={titulo}
              onChangeText={setTitulo}
            />

            <Text style={styles.label}>Valor necessário (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 8000,00"
              keyboardType="decimal-pad"
              value={total}
              onChangeText={setTotal}
            />

            <TouchableOpacity style={styles.btnSalvar} onPress={salvar}>
              <Text style={styles.btnSalvarTexto}>Criar Meta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalAberto(false)}>
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal depositar */}
      <Modal visible={metaSelecionada !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Depositar</Text>

            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={valorDeposito}
              onChangeText={setValorDeposito}
            />

            <TouchableOpacity
              style={styles.btnSalvar}
              onPress={async () => {
    if (!valorDeposito || !metaSelecionada) return;

    const valor = Number(valorDeposito.replace(',', '.'));

if (isNaN(valor) || valor <= 0) {
    return;
}

await depositar(metaSelecionada, valor);

Alert.alert('Sucesso', 'Depósito realizado!');

    setValorDeposito('');
    setMetaSelecionada(null);
}}
            >
              <Text style={styles.btnSalvarTexto}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCancelar} onPress={() => setMetaSelecionada(null)}>
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  subtitulo: { fontSize: 13, color: '#888', marginTop: 2 },
  btnNova: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A9E75',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  btnNovaTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secaoTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardConcluida: { opacity: 0.8 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaTitulo: { fontSize: 16, fontWeight: 'bold' },
  progressoBg: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    height: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressoFill: { backgroundColor: '#1A9E75', height: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  valorAtual: { fontSize: 15, fontWeight: 'bold' },
  valorTotal: { fontSize: 12, color: '#888' },
  pct: { fontSize: 20, fontWeight: 'bold', color: '#1A9E75' },
  btnDepositar: {
    borderWidth: 1.5,
    borderColor: '#1A9E75',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  btnDepositarTexto: { color: '#1A9E75', fontWeight: '600' },
  concluidaTexto: { fontSize: 13, color: '#1A9E75', marginTop: 2 },
  vazio: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  vazioIcone: { fontSize: 48, marginBottom: 16 },
  vazioTitulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  vazioSubtitulo: { fontSize: 14, color: '#888', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  btnSalvar: {
    backgroundColor: '#1A9E75',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnSalvarTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnCancelar: { padding: 12, alignItems: 'center' },
  btnCancelarTexto: { color: '#888', fontSize: 15 },
});