import { X } from 'lucide-react-native';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visivel: boolean;
  meses: string[];
  mesSelecionado: number;
  selecionar: (indice: number) => void;
  fechar: () => void;
};

export default function SeletorMesModal({ visivel, meses, mesSelecionado, selecionar, fechar }: Props) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={styles.overlay}><View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Selecionar Mês</Text>
          <TouchableOpacity onPress={fechar}><X size={20} color="#8E8E93" /></TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {meses.map((mes, indice) => (
            <TouchableOpacity key={mes} style={[styles.item, indice === mesSelecionado && styles.itemAtivo]} onPress={() => selecionar(indice)}>
              <Text style={[styles.texto, indice === mesSelecionado && styles.textoAtivo]}>{mes}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  item: { flexBasis: '31%', flexGrow: 0, flexShrink: 1, marginBottom: 8, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F2F2F7', alignItems: 'center' },
  itemAtivo: { backgroundColor: '#1A9E75' },
  texto: { fontSize: 13, fontWeight: '600', color: '#3A3A3C' },
  textoAtivo: { color: '#FFFFFF' },
});
