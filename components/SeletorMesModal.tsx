import { X } from 'lucide-react-native';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visivel: boolean;
  meses: string[];
  mesSelecionado: number;
  selecionar: (indice: number) => void;
  fechar: () => void;
};

// Exibe os meses disponíveis e informa à tela qual índice foi selecionado.
// Recebe a lista de meses e callbacks; não retorna dados diretamente.
export default function SeletorMesModal({ visivel, meses, mesSelecionado, selecionar, fechar }: Props) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={styles.overlay}><View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Selecionar Mês</Text>
          <TouchableOpacity onPress={fechar}><X size={20} color="#8E8E93" /></TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {/* Os meses ficam em uma grade para ocupar menos espaço. */}
          {meses.map((nomeMes, indiceMes) => (
            <TouchableOpacity key={nomeMes} style={[styles.item, indiceMes === mesSelecionado && styles.itemAtivo]} onPress={() => selecionar(indiceMes)}>
              <Text style={[styles.texto, indiceMes === mesSelecionado && styles.textoAtivo]}>{nomeMes}</Text>
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

/*
ARQUIVO: SeletorMesModal.tsx

Responsabilidade:
Permitir selecionar um mês em uma janela modal.

Principais elementos:
- SeletorMesModal()
- callback selecionar()

Fluxo:
Lista de meses recebida -> toque no mês -> índice enviado à tela

Conceitos usados:
- props tipadas
- map para montar a grade
- callback de seleção
*/
