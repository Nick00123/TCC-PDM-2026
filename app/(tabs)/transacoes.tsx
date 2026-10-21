import { useFocusEffect } from 'expo-router';
import { ArrowDownRight, ArrowUpRight, Filter, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FormularioTransacao from '../../components/FormularioTransacao';
import type { FiltroTransacao, TipoModalTransacao, Transacao } from '../../types';
import { corDaCategoria, formatarData, normalizarData } from '../../utils/formatacao';
import { buscarTransacoes, criarTransacao, excluirTransacao } from '../../utils/requisicoes';
import { headersAutenticados, obterUsuarioDaSessao } from '../../utils/sessao';
import { useAnimacaoCascata } from '../../utils/animacoes';

const CATEGORIAS_RECEITA = ['Salário', 'Investimentos', 'Outros'];
const CATEGORIAS_DESPESA = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'];

// Confere se uma data ISO existe no calendário, incluindo meses com durações diferentes.
// Recebe a data em formato texto; retorna true quando seus componentes formam uma data real.
function validarDataIso(dataTexto: string): boolean {
  // Essa validação evita datas impossíveis, como 31 de fevereiro.
  const partesData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataTexto);
  if (!partesData) return false;

  const ano = Number(partesData[1]);
  const mes = Number(partesData[2]);
  const dia = Number(partesData[3]);
  const dataCriada = new Date(ano, mes - 1, dia);

  return dataCriada.getFullYear() === ano
    && dataCriada.getMonth() === mes - 1
    && dataCriada.getDate() === dia;
}

// Cria a data local de hoje no formato ISO usado pelo formulário.
// Não recebe argumentos; retorna uma string no formato AAAA-MM-DD.
function obterDataLocalAtual(): string {
  const dataAtual = new Date();
  return `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dataAtual.getDate()).padStart(2, '0')}`;
}

// Carrega, filtra, agrupa e permite gerenciar as transações do usuário.
// Os dados persistidos e as regras de validação são mantidos pelas operações existentes.
export default function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [erroTransacoes, setErroTransacoes] = useState<string | null>(null);
  const [filtroTransacoes, setFiltroTransacoes] = useState<FiltroTransacao>('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [tipoModalTransacao, setTipoModalTransacao] = useState<TipoModalTransacao>(null);

  const [valorTransacao, setValorTransacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dataTransacao, setDataTransacao] = useState(obterDataLocalAtual());
  const [salvando, setSalvando] = useState(false);
  const [excluindoTransacaoId, setExcluindoTransacaoId] = useState<string | null>(null);

  const carregarTransacoes = useCallback(async () => {
    // A lista é recarregada quando a aba volta a ficar visível.
    setCarregandoTransacoes(true);
    try {
      const usuario = await obterUsuarioDaSessao();
      if (!usuario) throw new Error('Usuário não autenticado.');
      const transacoesRecebidas = await buscarTransacoes(usuario.id, await headersAutenticados());
      setTransacoes(transacoesRecebidas);
      setErroTransacoes(null);
    } catch (detalhesErro) {
      console.error('Erro ao carregar transações:', detalhesErro);
      setErroTransacoes('Não foi possível carregar as transações.');
    } finally {
      setCarregandoTransacoes(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarTransacoes();
    }, [carregarTransacoes])
  );

  // Cria uma transação e atualiza a lista exibida após a resposta do banco.
  async function adicionarTransacao(novaTransacao: Omit<Transacao, 'id'>) {
    const usuario = await obterUsuarioDaSessao();
    if (!usuario) return { sucesso: false, mensagem: 'Você precisa estar autenticado.' };
    await criarTransacao(usuario.id, novaTransacao, await headersAutenticados());
    await carregarTransacoes();
    return { sucesso: true, mensagem: '' };
  }

  // Exclui a transação indicada e recarrega as transações do usuário.
  async function removerTransacao(transacaoId: string) {
    const usuario = await obterUsuarioDaSessao();
    if (!usuario) return { sucesso: false, mensagem: 'Você precisa estar autenticado.' };
    await excluirTransacao(usuario.id, transacaoId, await headersAutenticados());
    await carregarTransacoes();
    return { sucesso: true, mensagem: '' };
  }

  // Primeiro aplico o filtro escolhido e depois a busca pelo texto.
  const transacoesFiltradas = transacoes
    .filter((transacaoAtual: Transacao) => {
      if (filtroTransacoes === 'receitas') return transacaoAtual.tipo === 'receita';
      if (filtroTransacoes === 'despesas') return transacaoAtual.tipo === 'despesa';
      return true;
    })
    .filter((transacaoAtual: Transacao) =>
      transacaoAtual.descricao.toLowerCase().includes(termoBusca.toLowerCase())
    );

  // Esse saldo muda conforme o filtro e a busca atuais.
  const saldoFiltrado = transacoesFiltradas.reduce((saldoAcumulado: number, transacaoAtual: Transacao) => {
    return transacaoAtual.tipo === 'receita'
      ? saldoAcumulado + transacaoAtual.valor
      : saldoAcumulado - transacaoAtual.valor;
  }, 0);

  const totalReceitasFiltradas = transacoesFiltradas
    .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'receita')
    .reduce((somaValores: number, transacaoAtual: Transacao) => somaValores + transacaoAtual.valor, 0);

  const totalDespesasFiltradas = transacoesFiltradas
    .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'despesa')
    .reduce((somaValores: number, transacaoAtual: Transacao) => somaValores + transacaoAtual.valor, 0);

  const tituloResumo = filtroTransacoes === 'receitas' ? 'Receitas' : filtroTransacoes === 'despesas' ? 'Despesas' : 'Transações';
  const valorResumo = filtroTransacoes === 'receitas'
    ? totalReceitasFiltradas
    : filtroTransacoes === 'despesas'
    ? totalDespesasFiltradas
    : saldoFiltrado;
  const corResumo = filtroTransacoes === 'receitas' ? '#0D9488' : filtroTransacoes === 'despesas' ? '#E11D48' : (saldoFiltrado >= 0 ? '#0D9488' : '#E11D48');
  const valorResumoFormatado = filtroTransacoes === 'despesas'
    ? `-R$ ${valorResumo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : filtroTransacoes === 'receitas'
    ? `+R$ ${valorResumo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : valorResumo >= 0
    ? `+R$ ${valorResumo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : `-R$ ${Math.abs(valorResumo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const gruposPorData: { [data: string]: { itens: Transacao[]; totalDia: number } } = {};
  
  transacoesFiltradas.forEach((transacaoAtual: Transacao) => {
    if (!gruposPorData[transacaoAtual.data]) {
      gruposPorData[transacaoAtual.data] = { itens: [], totalDia: 0 };
    }
    gruposPorData[transacaoAtual.data].itens.push(transacaoAtual);
    gruposPorData[transacaoAtual.data].totalDia += transacaoAtual.tipo === 'receita' ? transacaoAtual.valor : -transacaoAtual.valor;
  });

  const limparFormularioTransacao = () => {
    setValorTransacao('');
    setDescricao('');
    setCategoria('');
    setDataTransacao(obterDataLocalAtual());
    setTipoModalTransacao(null);
  };

  // Valida e converte os campos antes de criar a transação.
  const salvarTransacao = async () => {
    // Converto o valor brasileiro para número antes de salvar.
    if (salvando || !tipoModalTransacao) return;

    if (!descricao.trim() || !categoria) {
      Alert.alert('Campos obrigatórios', 'Preencha a descrição e escolha uma categoria.');
      return;
    }

    const valorNumerico = Number(valorTransacao.trim().replace(',', '.'));
    if (!valorTransacao.trim() || !Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    const dataFormatada = normalizarData(dataTransacao);
    if (!validarDataIso(dataFormatada)) {
      Alert.alert('Data inválida', 'Informe uma data válida no formato AAAA-MM-DD, DD/MM/AAAA ou DD-MM-AAAA.');
      return;
    }

    setSalvando(true);
    try {
      const resultadoOperacao = await adicionarTransacao({
        descricao: descricao.trim(),
        categoria,
        valor: valorNumerico,
        data: dataFormatada,
        tipo: tipoModalTransacao,
      });

      if (!resultadoOperacao.sucesso) {
        Alert.alert('Erro ao adicionar', resultadoOperacao.mensagem);
        return;
      }

      limparFormularioTransacao();
    } catch (detalhesErro) {
      console.error('Erro inesperado ao adicionar transação:', detalhesErro);
      Alert.alert('Erro ao adicionar', 'Não foi possível adicionar a transação. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // Pede confirmação antes de remover uma transação do banco.
  const confirmarExclusao = (transacaoId: string) => {
    Alert.alert(
      'Excluir transação',
      'Deseja realmente excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setExcluindoTransacaoId(transacaoId);
            try {
              const resultadoOperacao = await removerTransacao(transacaoId);
              if (!resultadoOperacao.sucesso) {
                Alert.alert('Erro ao excluir', resultadoOperacao.mensagem);
              }
            } catch (detalhesErro) {
              console.error('Erro inesperado ao excluir transação:', detalhesErro);
              Alert.alert('Erro ao excluir', 'Não foi possível excluir a transação. Tente novamente.');
            } finally {
              setExcluindoTransacaoId(null);
            }
          },
        },
      ]
    );
  };

  // A lista de categorias muda conforme o tipo escolhido.
  const categoriasDisponiveis = tipoModalTransacao === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const gruposPorDataEntradas = Object.entries(gruposPorData);
  const { animacoes: animacoesGrupos } = useAnimacaoCascata(gruposPorDataEntradas.length, 0, 80);

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>{tituloResumo}</Text>
          <Text style={styles.saldoFiltrado}>
            {carregandoTransacoes ? (
              'Carregando...'
            ) : erroTransacoes ? (
              'Valores indisponíveis'
            ) : (
              <Text style={{ color: corResumo, fontWeight: 'bold' }}>{valorResumoFormatado}</Text>
            )}
          </Text>
        </View>

        <View style={styles.headerBotoes}>
          <TouchableOpacity style={styles.btnReceita} onPress={() => setTipoModalTransacao('receita')}>
            <Plus size={14} color="#fff" />
            <Text style={styles.btnTextoReceita}>Receita</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDespesa} onPress={() => setTipoModalTransacao('despesa')}>
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
          value={termoBusca}
          onChangeText={setTermoBusca}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtrosRow}>
        <View style={styles.filtros}>
          {(['todos', 'receitas', 'despesas'] as FiltroTransacao[]).map((filtroAtual) => (
            <TouchableOpacity
              key={filtroAtual}
              style={[styles.filtroBotao, filtroTransacoes === filtroAtual && styles.filtroAtivo]}
              onPress={() => setFiltroTransacoes(filtroAtual)}
            >
              <Text style={[styles.filtroTexto, filtroTransacoes === filtroAtual && styles.filtroTextoAtivo]}>
                {filtroAtual.charAt(0).toUpperCase() + filtroAtual.slice(1)}
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
        ) : gruposPorDataEntradas.map(([dataKey, grupoDoDia], indiceGrupo) => {
          const animacao = animacoesGrupos[indiceGrupo];
          return (
          <Animated.View
            key={dataKey}
            style={{
              opacity: animacao,
              transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <View style={styles.dataHeader}>
              <Text style={styles.dataLabel}>{formatarData(dataKey)}</Text>
              <Text style={[styles.dataTotal, { color: grupoDoDia.totalDia >= 0 ? '#0D9488' : '#E11D48' }]}>
                  {grupoDoDia.totalDia >= 0
                    ? `+R$ ${grupoDoDia.totalDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : `-R$ ${Math.abs(grupoDoDia.totalDia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </Text>
            </View>

{grupoDoDia.itens.map((transacaoAtual: Transacao) => (
              <View key={transacaoAtual.id} style={styles.item}>
<View style={[styles.iconeWrap, { backgroundColor: corDaCategoria(transacaoAtual.categoria, transacaoAtual.tipo) }]}>
                  {transacaoAtual.tipo === 'receita'
                    ? <ArrowUpRight size={20} color="#0D9488" />
                    : <ArrowDownRight size={20} color="#E11D48" />}
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDesc}>{transacaoAtual.descricao}</Text>
                  <Text style={styles.itemCat}>{transacaoAtual.categoria}</Text>
                </View>

                <Text style={[styles.itemValor, { color: transacaoAtual.tipo === 'receita' ? '#0D9488' : '#E11D48' }]}>
                  {transacaoAtual.tipo === 'receita' ? '+' : '-'}R$ {transacaoAtual.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>

                <TouchableOpacity 
                  onPress={() => confirmarExclusao(transacaoAtual.id)}
                  disabled={excluindoTransacaoId === transacaoAtual.id}
                  style={styles.btnLixeira}
                >
                  <Trash2 size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        );})}
      </ScrollView>

      <FormularioTransacao tipo={tipoModalTransacao} valor={valorTransacao} descricao={descricao} categoria={categoria} categorias={categoriasDisponiveis} salvando={salvando} setValor={setValorTransacao} setDescricao={setDescricao} setCategoria={setCategoria} fechar={limparFormularioTransacao} salvar={salvarTransacao} />

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
});
