import { Check, Plus, Target, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModalDeposito, ModalNovaMeta } from '../../components/MetasModais';
import type { Meta } from '../../types';
import { formatarMoeda } from '../../utils/formatacao';
import { atualizarValorMeta, buscarMetas, consultarValoresMeta, criarMeta, excluirMeta as excluirMetaNoBanco } from '../../utils/requisicoes';
import { headersAutenticados, obterUsuarioDaSessao } from '../../utils/sessao';

export default function Metas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregandoMetas, setCarregandoMetas] = useState(true);
  const [erroMetas, setErroMetas] = useState<string | null>(null);
  const telaEmFoco = useIsFocused();
  const [metaSelecionada, setMetaSelecionada] = useState<string | null>(null);
  const [valorDeposito, setValorDeposito] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [total, setTotal] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [depositando, setDepositando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  async function carregarMetas() {
    setCarregandoMetas(true);
    try {
      const usuario = await obterUsuarioDaSessao();
      if (!usuario) throw new Error('Usuário não autenticado.');
      const lista = await buscarMetas(usuario.id, await headersAutenticados());
      setMetas(lista);
      setErroMetas(null);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      setErroMetas('Não foi possível carregar as metas.');
    } finally {
      setCarregandoMetas(false);
    }
  }

  useEffect(() => {
    if (telaEmFoco) carregarMetas();
  }, [telaEmFoco]);

  async function adicionarMeta(nome: string, objetivo: number) {
    const usuario = await obterUsuarioDaSessao();
    if (!usuario) return { sucesso: false, mensagem: 'Você precisa estar autenticado.' };
    await criarMeta(usuario.id, nome, objetivo, await headersAutenticados());
    await carregarMetas();
    return { sucesso: true, mensagem: '' };
  }

  async function excluirMeta(id: string) {
    const usuario = await obterUsuarioDaSessao();
    if (!usuario) return { sucesso: false, mensagem: 'Você precisa estar autenticado.' };
    await excluirMetaNoBanco(usuario.id, id, await headersAutenticados());
    await carregarMetas();
    return { sucesso: true, mensagem: '' };
  }

  async function depositar(id: string, valor: number) {
    const usuario = await obterUsuarioDaSessao();
    if (!usuario) return { sucesso: false, mensagem: 'Você precisa estar autenticado.' };
    const headers = await headersAutenticados();
    const registro = await consultarValoresMeta(usuario.id, id, headers);
    if (!registro) return { sucesso: false, mensagem: 'Não foi possível consultar a meta.' };
    const valorAnterior = Number(registro.valor_atual);
    const novoValor = valorAnterior + valor;
    await atualizarValorMeta(usuario.id, id, valorAnterior, novoValor, headers);
    await carregarMetas();
    return { sucesso: true, mensagem: '' };
  }

  const metasAndamento = (metas ?? []).filter(
    (m: Meta) => m.atual < m.total
  );

  const metasConcluidas = (metas ?? []).filter(
    (m: Meta) => m.atual >= m.total
  );

  const salvar = async () => {
    if (salvando) return;

    const tituloLimpo = titulo.trim();
    if (!tituloLimpo) {
      Alert.alert('Título obrigatório', 'Informe um título para a meta.');
      return;
    }

    if (!total.trim()) {
      Alert.alert('Valor obrigatório', 'Informe o valor necessário para a meta.');
      return;
    }

    const valor = Number(total.trim().replace(',', '.'));
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await adicionarMeta(tituloLimpo, valor);

      if (!resultado.sucesso) {
        Alert.alert('Erro ao criar meta', resultado.mensagem);
        return;
      }

      Alert.alert('Sucesso', 'Meta criada com sucesso!');
      setTitulo('');
      setTotal('');
      setModalAberto(false);
    } catch (error) {
      console.error('Erro inesperado ao criar meta:', error);
      Alert.alert('Erro ao criar meta', 'Não foi possível criar a meta. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = (id: string) => {
    if (excluindoId === id) return;

    Alert.alert('Excluir meta', 'Deseja realmente excluir esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setExcluindoId(id);
          try {
            const resultado = await excluirMeta(id);
            if (!resultado.sucesso) {
              Alert.alert('Erro ao excluir', resultado.mensagem);
            }
          } catch (error) {
            console.error('Erro inesperado ao excluir meta:', error);
            Alert.alert('Erro ao excluir', 'Não foi possível excluir a meta. Tente novamente.');
          } finally {
            setExcluindoId(null);
          }
        },
      },
    ]);
  };

  const confirmarDeposito = async () => {
    if (depositando || !metaSelecionada) return;

    if (!valorDeposito.trim()) {
      Alert.alert('Valor obrigatório', 'Informe o valor do depósito.');
      return;
    }

    const valor = Number(valorDeposito.trim().replace(',', '.'));
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert('Valor inválido', 'Informe um valor maior que zero.');
      return;
    }

    const meta = metas.find((item: Meta) => item.id === metaSelecionada);
    if (!meta) {
      Alert.alert('Meta não encontrada', 'Não foi possível localizar a meta selecionada.');
      return;
    }

    const restante = meta.total - meta.atual;
    if (restante <= 0) {
      Alert.alert('Meta concluída', 'Esta meta já foi concluída.');
      return;
    }

    if (valor > restante) {
      Alert.alert(
        'Valor acima do necessário',
        `Faltam R$ ${formatarMoeda(restante)} para concluir esta meta.`
      );
      return;
    }

    setDepositando(true);
    try {
      const resultado = await depositar(metaSelecionada, valor);
      if (!resultado.sucesso) {
        Alert.alert('Erro ao depositar', resultado.mensagem);
        return;
      }

      Alert.alert('Sucesso', 'Depósito realizado!');
      setValorDeposito('');
      setMetaSelecionada(null);
    } catch (error) {
      console.error('Erro inesperado ao depositar:', error);
      Alert.alert('Erro ao depositar', 'Não foi possível realizar o depósito. Tente novamente.');
    } finally {
      setDepositando(false);
    }
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

      {erroMetas && (
        <View style={styles.erroCard}>
          <Text style={styles.erroTexto}>{erroMetas}</Text>
        </View>
      )}

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
                    onPress={() => confirmarExclusao(meta.id)}
                    disabled={excluindoId === meta.id}
                  >
                    <Trash2 size={18} color="#ccc" />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressoBg}>
                  <View style={[styles.progressoFill, { width: `${pct}%` }]} />
                </View>

                <View style={styles.cardFooter}>
                  <View>
<Text style={styles.valorAtual}>R$ {formatarMoeda(meta.atual)}</Text>
                    <Text style={styles.valorTotal}>de R$ {formatarMoeda(meta.total)}</Text>
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
<Text style={styles.concluidaTexto}>Concluída! R$ {formatarMoeda(meta.total)}</Text>
                </View>
                <Check size={22} color="#1A9E75" />
              </View>
            </View>
          ))}
        </>
      )}

      {/* Vazio */}
      {!erroMetas && (metas ?? []).length === 0 && (
        <View style={styles.vazio}>
          <Target size={48} color="#1A9E75" />
          <Text style={styles.vazioTitulo}>Nenhuma meta ainda</Text>
          <Text style={styles.vazioSubtitulo}>Crie sua primeira meta e comece a economizar!</Text>
        </View>
      )}

      <ModalNovaMeta visivel={modalAberto} titulo={titulo} total={total} salvando={salvando} setTitulo={setTitulo} setTotal={setTotal} salvar={salvar} fechar={() => setModalAberto(false)} />
      <ModalDeposito visivel={metaSelecionada !== null} valor={valorDeposito} depositando={depositando} setValor={setValorDeposito} confirmar={confirmarDeposito} fechar={() => setMetaSelecionada(null)} />

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
  erroCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
  },
  erroTexto: { color: '#BE123C', fontSize: 13, textAlign: 'center' },
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
});
