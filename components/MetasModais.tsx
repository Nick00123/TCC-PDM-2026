import { Animated, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAnimacaoModal } from '../utils/animacoes';

type NovaMetaProps = { visivel: boolean; titulo: string; total: string; salvando: boolean; setTitulo: (valor: string) => void; setTotal: (valor: string) => void; salvar: () => void; fechar: () => void };

// Exibe o formulário para criar uma meta e envia as ações à tela por callbacks.
// Recebe os campos, estado e callbacks; não retorna os dados digitados.
export function ModalNovaMeta({ visivel, titulo, total, salvando, setTitulo, setTotal, salvar, fechar }: NovaMetaProps) {
  // Esse modal pega os dados necessários para criar uma meta nova.
  const { estiloAnimado } = useAnimacaoModal(visivel);

  return (
    <Modal visible={visivel} animationType="fade" transparent onRequestClose={fechar}>
      <View style={styles.overlay}><Animated.View style={[styles.card, estiloAnimado]}>
        <Text style={styles.titulo}>Nova Meta</Text>
        <Text style={styles.label}>Nome da meta</Text>
        <TextInput style={styles.input} placeholder="Ex: Viagem para Europa" value={titulo} onChangeText={setTitulo} />
        <Text style={styles.label}>Valor necessário (R$)</Text>
        <TextInput style={styles.input} placeholder="Ex: 8000,00" keyboardType="decimal-pad" value={total} onChangeText={setTotal} />
        <TouchableOpacity style={styles.salvar} onPress={salvar} disabled={salvando}><Text style={styles.salvarTexto}>{salvando ? 'Salvando...' : 'Criar Meta'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelar} onPress={fechar} disabled={salvando}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
      </Animated.View></View>
    </Modal>
  );
}

type DepositoProps = { visivel: boolean; valor: string; depositando: boolean; setValor: (valor: string) => void; confirmar: () => void; fechar: () => void };

// Exibe o campo para adicionar um depósito a uma meta já existente.
// Recebe o valor, estado e callbacks; não retorna os dados digitados.
export function ModalDeposito({ visivel, valor, depositando, setValor, confirmar, fechar }: DepositoProps) {
  // Esse outro modal serve só para colocar dinheiro em uma meta existente.
  const { estiloAnimado } = useAnimacaoModal(visivel);

  return (
    <Modal visible={visivel} animationType="fade" transparent onRequestClose={fechar}>
      <View style={styles.overlay}><Animated.View style={[styles.card, estiloAnimado]}>
        <Text style={styles.titulo}>Depositar</Text>
        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput style={styles.input} placeholder="0,00" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
        <TouchableOpacity style={styles.salvar} onPress={confirmar} disabled={depositando}><Text style={styles.salvarTexto}>{depositando ? 'Depositando...' : 'Confirmar'}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelar} onPress={fechar} disabled={depositando}><Text style={styles.cancelarTexto}>Cancelar</Text></TouchableOpacity>
      </Animated.View></View>
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
