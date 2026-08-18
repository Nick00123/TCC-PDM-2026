import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type NovaMetaProps = { visivel: boolean; titulo: string; total: string; salvando: boolean; setTitulo: (valor: string) => void; setTotal: (valor: string) => void; salvar: () => void; fechar: () => void };

export function ModalNovaMeta({ visivel, titulo, total, salvando, setTitulo, setTotal, salvar, fechar }: NovaMetaProps) {
  return (
    <Modal visible={visivel} animationType="slide" transparent>
      <View style={styles.overlay}><View style={styles.card}>
        <Text style={styles.titulo}>Nova Meta</Text>
        <Text style={styles.label}>Nome da meta</Text>
        <TextInput style={styles.input} placeholder="Ex: Viagem para Europa" value={titulo} onChangeText={setTitulo} />
        <Text style={styles.label}>Valor necessário (R$)</Text>
        <TextInput style={styles.input} placeholder="Ex: 8000,00" keyboardType="decimal-pad" value={total} onChangeText={setTotal} />
        <TouchableOpacity style={styles.salvar} onPress={salvar} disabled={salvando}><Text style={styles.salvarTexto}>{salvando ? 'Salvando...' : 'Criar Meta'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelar} onPress={fechar} disabled={salvando}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
}

type DepositoProps = { visivel: boolean; valor: string; depositando: boolean; setValor: (valor: string) => void; confirmar: () => void; fechar: () => void };

export function ModalDeposito({ visivel, valor, depositando, setValor, confirmar, fechar }: DepositoProps) {
  return (
    <Modal visible={visivel} animationType="slide" transparent>
      <View style={styles.overlay}><View style={styles.card}>
        <Text style={styles.titulo}>Depositar</Text>
        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput style={styles.input} placeholder="0,00" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
        <TouchableOpacity style={styles.salvar} onPress={confirmar} disabled={depositando}><Text style={styles.salvarTexto}>{depositando ? 'Depositando...' : 'Confirmar'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelar} onPress={fechar} disabled={depositando}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 },
  salvar: { backgroundColor: '#1A9E75', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  salvarTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelar: { padding: 12, alignItems: 'center' },
  cancelarTexto: { color: '#888', fontSize: 15 },
});
