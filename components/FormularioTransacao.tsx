import { X } from 'lucide-react-native';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  tipo: 'receita' | 'despesa' | null;
  valor: string;
  descricao: string;
  categoria: string;
  categorias: string[];
  salvando: boolean;
  setValor: (valor: string) => void;
  setDescricao: (valor: string) => void;
  setCategoria: (valor: string) => void;
  fechar: () => void;
  salvar: () => void;
};

export default function FormularioTransacao({ tipo, valor, descricao, categoria, categorias, salvando, setValor, setDescricao, setCategoria, fechar, salvar }: Props) {
  return (
    <Modal visible={tipo !== null} animationType="slide" transparent>
      <View style={styles.overlay}><View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{tipo === 'receita' ? 'Nova Receita' : 'Nova Despesa'}</Text>
          <TouchableOpacity onPress={fechar} disabled={salvando}><X size={22} color="#666" /></TouchableOpacity>
        </View>
        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput style={styles.inputValor} placeholder="0,00" keyboardType="decimal-pad" value={valor} onChangeText={setValor} />
        <Text style={styles.label}>Descrição</Text>
        <TextInput style={styles.input} placeholder="Ex: Mercado" value={descricao} onChangeText={setDescricao} />
        <Text style={styles.label}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorias}>
          {categorias.map((item) => (
            <TouchableOpacity key={item} style={[styles.chip, categoria === item && styles.chipAtivo]} onPress={() => setCategoria(item)}>
              <Text style={[styles.chipTexto, categoria === item && styles.chipTextoAtivo]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.salvar, { backgroundColor: tipo === 'receita' ? '#0D9488' : '#E11D48' }]} onPress={salvar} disabled={salvando}>
          <Text style={styles.salvarTexto}>{salvando ? 'Salvando...' : `✓ Adicionar ${tipo === 'receita' ? 'Receita' : 'Despesa'}`}</Text>
        </TouchableOpacity>
      </View></View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  inputValor: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },
  categorias: { marginBottom: 24 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginRight: 8 },
  chipAtivo: { backgroundColor: '#1E293B' },
  chipTexto: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  chipTextoAtivo: { color: '#fff' },
  salvar: { padding: 16, borderRadius: 12, alignItems: 'center' },
  salvarTexto: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
