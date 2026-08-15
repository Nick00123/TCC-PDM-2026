import { ArrowDownRight, ArrowUpRight, Filter, Plus, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFinance } from '../../src/contextos/FinanceContexto';
import type { Transacao } from '../../src/tipos';
import { corDaCategoria, formatarData, normalizarData } from '../../src/utils/formatacao';

type Filtro = 'todos' | 'receitas' | 'despesas';
type TipoModal = 'receita' | 'despesa' | null;

const CATEGORIAS_RECEITA = ['Salário', 'Investimentos', 'Outros'];
const CATEGORIAS_DESPESA = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'];

function dataValida(data: string) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!partes) return false;

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const dataCriada = new Date(ano, mes - 1, dia);

  return dataCriada.getFullYear() === ano
    && dataCriada.getMonth() === mes - 1
    && dataCriada.getDate() === dia;
}

export default function Transacoes() {
  const {
    transacoes,
    carregandoTransacoes,
    erroTransacoes,
    adicionarTransacao,
    removerTransacao,
  } = useFinance();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');
  const [modalTipo, setModalTipo] = useState<TipoModal>(null);

  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const transacoesFiltradas = transacoes
    .filter((t: Transacao) => {
      if (filtro === 'receitas') return t.tipo === 'receita';
      if (filtro === 'despesas') return t.tipo === 'despesa';
      return true;
    })
    .filter((t: Transacao) =>
      t.descricao.toLowerCase().includes(busca.toLowerCase())
    );

  const saldoFiltrado = transacoesFiltradas.reduce((acc: number, t: { tipo: string; valor: number; }) => {
    return t.tipo === 'receita' ? acc + t.valor : acc - t.valor;
  }, 0);

  const totalReceitasFiltradas = transacoesFiltradas
    .filter((t: Transacao) => t.tipo === 'receita')
    .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

  const totalDespesasFiltradas = transacoesFiltradas
    .filter((t: Transacao) => t.tipo === 'despesa')
    .reduce((acc: number, t: Transacao) => acc + t.valor, 0);

  const headerTitle = filtro === 'receitas' ? 'Receitas' : filtro === 'despesas' ? 'Despesas' : 'Transações';
  const headerValue = filtro === 'receitas'
    ? totalReceitasFiltradas
    : filtro === 'despesas'
    ? totalDespesasFiltradas
    : saldoFiltrado;
  const headerColor = filtro === 'receitas' ? '#0D9488' : filtro === 'despesas' ? '#E11D48' : (saldoFiltrado >= 0 ? '#0D9488' : '#E11D48');
  const headerDisplay = filtro === 'despesas'
    ? `-R$ ${headerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : filtro === 'receitas'
    ? `+R$ ${headerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : headerValue >= 0
    ? `+R$ ${headerValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : `-R$ ${Math.abs(headerValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const grupos: { [data: string]: { itens: Transacao[]; totalDia: number } } = {};
  
  transacoesFiltradas.forEach((t: Transacao) => {
    if (!grupos[t.data]) {
      grupos[t.data] = { itens: [], totalDia: 0 };
    }
    grupos[t.data].itens.push(t);
    grupos[t.data].totalDia += t.tipo === 'receita' ? t.valor : -t.valor;
  });

  const limparForm = () => {
    setValor('');
    setDescricao('');
    setCategoria('');
    setData(new Date().toISOString().split('T')[0]);
    setModalTipo(null);
  };

  const salvar = async () => {
    if (salvando || !modalTipo) return;

    if (!descricao.trim() || !categoria) {
      Alert.alert('Campos obrigatórios', 'Preencha a descrição e escolha uma categoria.');
      return;
    }

    const valorNumerico = Number(valor.trim().replace(',', '.'));
    if (!valor.trim() || !Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    const dataFormatada = normalizarData(data);
    if (!dataValida(dataFormatada)) {
      Alert.alert('Data inválida', 'Informe uma data válida no formato AAAA-MM-DD, DD/MM/AAAA ou DD-MM-AAAA.');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await adicionarTransacao({
        descricao: descricao.trim(),
        categoria,
        valor: valorNumerico,
        data: dataFormatada,
        tipo: modalTipo,
      });

      if (!resultado.sucesso) {
        Alert.alert('Erro ao adicionar', resultado.mensagem);
        return;
      }

      limparForm();
    } catch (error) {
      console.error('Erro inesperado ao adicionar transação:', error);
      Alert.alert('Erro ao adicionar', 'Não foi possível adicionar a transação. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = (id: string) => {
    Alert.alert(
      'Excluir transação',
      'Deseja realmente excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setExcluindoId(id);
            try {
              const resultado = await removerTransacao(id);
              if (!resultado.sucesso) {
                Alert.alert('Erro ao excluir', resultado.mensagem);
              }
            } catch (error) {
              console.error('Erro inesperado ao excluir transação:', error);
              Alert.alert('Erro ao excluir', 'Não foi possível excluir a transação. Tente novamente.');
            } finally {
              setExcluindoId(null);
            }
          },
        },
      ]
    );
  };

  const categorias = modalTipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>{headerTitle}</Text>
          <Text style={styles.saldoFiltrado}>
            {carregandoTransacoes ? (
              'Carregando...'
            ) : erroTransacoes ? (
              'Valores indisponíveis'
            ) : (
              <Text style={{ color: headerColor, fontWeight: 'bold' }}>{headerDisplay}</Text>
            )}
          </Text>
        </View>

        <View style={styles.headerBotoes}>
          <TouchableOpacity style={styles.btnReceita} onPress={() => setModalTipo('receita')}>
            <Plus size={14} color="#fff" />
            <Text style={styles.btnTextoReceita}>Receita</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDespesa} onPress={() => setModalTipo('despesa')}>
            <Plus size={14} color="#E11D48" />
            <Text style={styles.btnTextoDespesa}>Despesa</Text>
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
      <View style={styles.filtrosRow}>
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

        <View style={styles.contadorFiltro}>
          <Filter size={14} color="#94A3B8" />
          <Text style={styles.contadorTexto}>{transacoesFiltradas.length}</Text>
        </View>
      </View>

      {/* Lista */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {carregandoTransacoes ? (
          <Text style={styles.estadoLista}>Carregando transações...</Text>
        ) : erroTransacoes ? (
          <Text style={styles.estadoLista}>{erroTransacoes}</Text>
        ) : transacoes.length === 0 ? (
          <Text style={styles.estadoLista}>Nenhuma transação cadastrada.</Text>
        ) : transacoesFiltradas.length === 0 ? (
          <Text style={styles.estadoLista}>Nenhuma transação encontrada.</Text>
        ) : Object.entries(grupos).map(([dataKey, grupo]) => (
          <View key={dataKey}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataLabel}>{formatarData(dataKey)}</Text>
              <Text style={[styles.dataTotal, { color: grupo.totalDia >= 0 ? '#0D9488' : '#E11D48' }]}> 
                  {grupo.totalDia >= 0
                    ? `+R$ ${grupo.totalDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : `-R$ ${Math.abs(grupo.totalDia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </Text>
            </View>

{grupo.itens.map((t: Transacao) => (
              <View key={t.id} style={styles.item}>
<View style={[styles.iconeWrap, { backgroundColor: corDaCategoria(t.categoria, t.tipo) }]}>
                  {t.tipo === 'receita'
                    ? <ArrowUpRight size={20} color="#0D9488" />
                    : <ArrowDownRight size={20} color="#E11D48" />}
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDesc}>{t.descricao}</Text>
                  <Text style={styles.itemCat}>{t.categoria}</Text>
                </View>

                <Text style={[styles.itemValor, { color: t.tipo === 'receita' ? '#0D9488' : '#E11D48' }]}>
                  {t.tipo === 'receita' ? '+' : '-'}R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>

                <TouchableOpacity 
                  onPress={() => confirmarExclusao(t.id)}
                  disabled={excluindoId === t.id}
                  style={styles.btnLixeira}
                >
                  <Trash2 size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Modal de Adicionar */}
      <Modal visible={modalTipo !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>
                {modalTipo === 'receita' ? 'Nova Receita' : 'Nova Despesa'}
              </Text>
              <TouchableOpacity onPress={limparForm} disabled={salvando}>
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.inputValor}
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
            />

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Mercado"
              value={descricao}
              onChangeText={setDescricao}
            />

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

            <TouchableOpacity
              style={[styles.btnSalvar, { backgroundColor: modalTipo === 'receita' ? '#0D9488' : '#E11D48' }]}
              onPress={salvar}
              disabled={salvando}
            >
              <Text style={styles.btnSalvarTexto}>
                {salvando
                  ? 'Salvando...'
                  : `✓ Adicionar ${modalTipo === 'receita' ? 'Receita' : 'Despesa'}`}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#0F172A' },
  saldoFiltrado: { fontSize: 13, color: '#64748B', marginTop: 4 },
  headerBotoes: { flexDirection: 'row', gap: 8 },
  btnReceita: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  btnDespesa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  btnTextoReceita: { color: '#fff', fontSize: 13, fontWeight: '600' },
  btnTextoDespesa: { color: '#E11D48', fontSize: 13, fontWeight: '600' },
  buscaContainer: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff' },
  busca: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  filtrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filtros: { flexDirection: 'row', gap: 8 },
  filtroBotao: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filtroAtivo: { backgroundColor: '#0D9488' },
  filtroTexto: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  filtroTextoAtivo: { color: '#fff' },
  contadorFiltro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contadorTexto: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  estadoLista: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dataLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  dataTotal: { fontSize: 13, fontWeight: '600' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconeWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  itemCat: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  itemValor: { fontSize: 15, fontWeight: 'bold', marginRight: 12 },
  btnLixeira: { padding: 4 },
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
  label: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  inputValor: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0D9488',
    marginBottom: 20,
    padding: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  categoriaChipAtivo: { backgroundColor: '#0D9488' },
  categoriaTexto: { color: '#64748B', fontWeight: '600' },
  categoriaTextoAtivo: { color: '#fff' },
  btnSalvar: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSalvarTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
