import { CreditCard, DollarSign, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Transacao, useFinance } from '../_layout';

type Filtro = 'todos' | 'receitas' | 'despesas';
type TipoModal = 'receita' | 'despesa' | null;

const CATEGORIAS_RECEITA = ['Salário', 'Investimentos', 'Outros'];
const CATEGORIAS_DESPESA = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'];

const formatarData = (data: string) => {
  const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                  'julho','agosto','setembro','outubro','novembro','dezembro'];
  const [mes, dia] = data.split('-');
  return `${dia} de ${meses[parseInt(mes) - 1]}`;
};

export default function Transacoes() {
  const { transacoes, adicionarTransacao } = useFinance();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [modalTipo, setModalTipo] = useState<TipoModal>(null);

  // Estados do formulário
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  const transacoesFiltradas = transacoes
    .filter((t: Transacao) => {
      if (filtro === 'receitas') return t.tipo === 'receita';
      if (filtro === 'despesas') return t.tipo === 'despesa';
      return true;
    })
    .filter((t: Transacao) =>
      t.descricao.toLowerCase().includes(busca.toLowerCase())
    );

  const grupos: { [data: string]: Transacao[] } = {};
  transacoesFiltradas.forEach((t: Transacao) => {
    if (!grupos[t.data]) grupos[t.data] = [];
    grupos[t.data].push(t);
  });

  const limparForm = () => {
    setValor('');
    setDescricao('');
    setCategoria('');
    setData(new Date().toISOString().split('T')[0]);
    setModalTipo(null);
  };

  const salvar = () => {
    if (!valor || !descricao || !categoria || !modalTipo) return;
    adicionarTransacao({
      descricao,
      categoria,
      valor: parseFloat(valor.replace(',', '.')),
      data,
      tipo: modalTipo,
      icone: modalTipo === 'receita'
        ? <DollarSign size={28} color="#1A9E75" />
        : <CreditCard size={28} color="#F44336" />,
    });
    limparForm();
  };

  const categorias = modalTipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  return (
    <View style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Transações</Text>
        <View style={styles.headerBotoes}>
          <TouchableOpacity style={styles.btnReceita} onPress={() => setModalTipo('receita')}>
            <Plus size={14} color="#fff" />
            <Text style={styles.btnTexto}>Receita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDespesa} onPress={() => setModalTipo('despesa')}>
            <Plus size={14} color="#fff" />
            <Text style={styles.btnTexto}>Despesa</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.buscaContainer}>
        <TextInput
          style={styles.busca}
          placeholder="Buscar..."
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {(['todos', 'receitas', 'despesas'] as Filtro[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBotao, filtro === f && styles.filtroAtivo]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroTexto, filtro === f && styles.filtroTextoAtivo]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <ScrollView>
        {Object.entries(grupos).map(([data, items]) => (
          <View key={data}>
            <Text style={styles.dataLabel}>{formatarData(data)}</Text>
            {items.map((t: Transacao) => (
              <View key={t.id} style={styles.item}>
                <View style={styles.iconeWrap}>
                  {typeof t.icone === 'string' ? <Text style={styles.iconeText}>{t.icone}</Text> : t.icone}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDesc}>{t.descricao}</Text>
                  <Text style={styles.itemCat}>{t.categoria}</Text>
                </View>
                <Text style={[styles.itemValor, { color: t.tipo === 'receita' ? '#1A9E75' : '#F44336' }]}>
                  {t.tipo === 'receita' ? '+' : '-'}R$ {t.valor.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalTipo !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {/* Título do modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>
                {modalTipo === 'receita' ? 'Nova Receita' : 'Nova Despesa'}
              </Text>
              <TouchableOpacity onPress={limparForm}>
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Valor */}
            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.inputValor}
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
            />

            {/* Descrição */}
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Salário maio"
              value={descricao}
              onChangeText={setDescricao}
            />

            {/* Categorias */}
            <Text style={styles.label}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorias}>
              {categorias.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoriaChip, categoria === c && styles.categoriaChipAtivo]}
                  onPress={() => setCategoria(c)}
                >
                  <Text style={[styles.categoriaTexto, categoria === c && styles.categoriaTextoAtivo]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Botão salvar */}
            <TouchableOpacity
              style={[styles.btnSalvar, { backgroundColor: modalTipo === 'receita' ? '#1A9E75' : '#F44336' }]}
              onPress={salvar}
            >
              <Text style={styles.btnSalvarTexto}>
                ✓ Adicionar {modalTipo === 'receita' ? 'Receita' : 'Despesa'}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  headerBotoes: { flexDirection: 'row', gap: 8 },
  btnReceita: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A9E75',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  btnDespesa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  btnTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  buscaContainer: { padding: 16, backgroundColor: '#fff' },
  busca: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  filtros: { flexDirection: 'row', padding: 16, gap: 8 },
  filtroBotao: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filtroAtivo: { backgroundColor: '#1A9E75' },
  filtroTexto: { color: '#666', fontWeight: '600' },
  filtroTextoAtivo: { color: '#fff' },
  dataLabel: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  icone: { fontSize: 28, marginRight: 12 },
  iconeWrap: { width: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconeText: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 15, fontWeight: '600' },
  itemCat: { fontSize: 12, color: '#888', marginTop: 2 },
  itemValor: { fontSize: 15, fontWeight: 'bold' },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitulo: { fontSize: 18, fontWeight: 'bold' },
  label: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 6 },
  inputValor: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1A9E75',
    marginBottom: 20,
    padding: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  categorias: { marginBottom: 20 },
  categoriaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  categoriaChipAtivo: { backgroundColor: '#1A9E75' },
  categoriaTexto: { color: '#666', fontWeight: '600' },
  categoriaTextoAtivo: { color: '#fff' },
  btnSalvar: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSalvarTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});