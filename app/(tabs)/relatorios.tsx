import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useAnimacaoCascata } from '../../utils/animacoes';

import {
    ArrowDownRight,
    ArrowUpRight,
    Calendar as CalendarIcon,
    PieChart,
    TrendingUp,
} from 'lucide-react-native';
import {
    VictoryArea,
    VictoryAxis,
    VictoryChart,
    VictoryLine,
    VictoryPie,
    VictoryTheme,
} from 'victory-native';
import SeletorMesModal from '../../components/SeletorMesModal';
import type { AbaRelatorio, Transacao } from '../../types';
import { buscarTransacoes } from '../../utils/requisicoes';
import { headersAutenticados, obterUsuarioDaSessao } from '../../utils/sessao';

const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COR_RECEITA = '#1a9e75';
const COR_DESPESA = '#e24b4a';
const CORES_CATEGORIAS = ['#1A9E75', '#FF9800', '#2196F3', '#F44336', '#9C27B0', '#FF5722', '#607D8B'];

function estiloCartao(animacao: Animated.Value) {
  return {
    opacity: animacao,
    transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };
}

const formatarValorEixoY = (valor: number) => {
  // Deixo os valores do eixo menores para não ocupar tanto espaço.
  if (valor === 0) return 'R$0';
  if (Math.abs(valor) >= 1000) return `R$${(valor / 1000).toFixed(0)}k`;
  return `R$${Math.round(valor)}`;
};

// Divide uma data ISO em ano e índice do mês para os filtros do relatório.
const separarAnoEMes = (dataTexto: string) => {
  // Transformo a data em números que facilitam os filtros do relatório.
  const [ano, mes] = dataTexto.split('-').map(Number);
  return { ano, mes: mes - 1 };
};

// Estilos corrigidos para evitar sobreposição de eixos no Victory
const estiloEixoX = {
  axis: { stroke: 'transparent' },
  ticks: { stroke: 'transparent' },
  tickLabels: { fill: '#8E8E93', fontSize: 10, padding: 5 },
  grid: { stroke: 'transparent' },
};

const estiloEixoY = {
  axis: { stroke: 'transparent' },
  ticks: { stroke: 'transparent' },
  grid: { stroke: '#F2F2F7', strokeDasharray: '0' },
  tickLabels: { fill: '#8E8E93', fontSize: 10, padding: 4 },
};

// Carrega transações e prepara os resumos e gráficos do período selecionado.
// Mantém o estado de navegação, período, carregamento e erro desta tela.
export default function Relatorios() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [erroTransacoes, setErroTransacoes] = useState<string | null>(null);

  const carregarTransacoes = useCallback(async () => {
    // O relatório sempre usa as transações mais recentes do usuário.
    setCarregandoTransacoes(true);
    try {
      const usuario = await obterUsuarioDaSessao();
      if (!usuario) throw new Error('Usuário não autenticado.');
      const transacoesRecebidas = await buscarTransacoes(usuario.id, await headersAutenticados());
      setTransacoes(transacoesRecebidas);
      setErroTransacoes(null);
    } catch (detalhesErro) { console.error(detalhesErro); setErroTransacoes('Não foi possível carregar as transações.'); }
    finally { setCarregandoTransacoes(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarTransacoes();
    }, [carregarTransacoes])
  );
  const [abaSelecionada, setAbaSelecionada] = useState<AbaRelatorio>('geral');
  const [semestre, setSemestre] = useState<1 | 2>(1);
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth());
  const anoSelecionado = new Date().getFullYear();
  
  // Estado para controlar o Modal Customizado do Calendário
  const [seletorMesVisivel, setSeletorMesVisivel] = useState(false);

  const { width } = useWindowDimensions();
  // Ajuste do padding do container para evitar corte nas bordas do celular
  const larguraGrafico = width - 70;

  // Primeiro filtro pelo ano atual e depois pelo mês escolhido.
  const transacoesDoAno = transacoes.filter((transacaoAtual: Transacao) => {
    const { ano } = separarAnoEMes(transacaoAtual.data);
    return ano === anoSelecionado;
  });

  const transacoesFiltradas = transacoesDoAno.filter((transacaoAtual: Transacao) => {
    const { mes } = separarAnoEMes(transacaoAtual.data);
    return mes === mesSelecionado;
  });

  // Os cards de resumo mostram apenas o mês selecionado.
  const totalReceitas = transacoesFiltradas
    .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'receita')
    .reduce((somaValores: number, transacaoAtual: Transacao) => somaValores + transacaoAtual.valor, 0);

  const totalDespesas = transacoesFiltradas
    .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'despesa')
    .reduce((somaValores: number, transacaoAtual: Transacao) => somaValores + transacaoAtual.valor, 0);

  const economizado = totalReceitas - totalDespesas;
  const taxaPoupanca = totalReceitas > 0
    ? ((economizado / totalReceitas) * 100).toFixed(1)
    : '0.0';

  // Esses dados alimentam os gráficos de evolução e tendência.
  const dadosPorMes = NOMES_MESES.map((nomeMes, indiceMes) => {
    const receita = transacoesDoAno
      .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'receita' && separarAnoEMes(transacaoAtual.data).mes === indiceMes)
      .reduce((somaValores: number, transacaoAtual: Transacao) => somaValores + transacaoAtual.valor, 0);
    const despesa = transacoesDoAno
      .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'despesa' && separarAnoEMes(transacaoAtual.data).mes === indiceMes)
      .reduce((somaValores: number, transacaoAtual: Transacao) => somaValores + transacaoAtual.valor, 0);
    return { x: indiceMes + 1, mes: nomeMes, receita, despesa, economia: receita - despesa };
  });

  const dadosSemestre = semestre === 1
    ? dadosPorMes.slice(0, 6)
    : dadosPorMes.slice(6, 12).map((dadosDoMes, indiceMes) => ({ ...dadosDoMes, x: indiceMes + 1 }));

  const valorMaximoGrafico = Math.max(...dadosSemestre.map((dadosDoMes) => Math.max(dadosDoMes.receita, dadosDoMes.despesa)), 100);
  const variacaoMaximaEconomia = Math.max(...dadosPorMes.map((dadosDoMes) => Math.abs(dadosDoMes.economia)), 100);

  const despesasPorCategoria: { [key: string]: number } = {};
  transacoesFiltradas
    .filter((transacaoAtual: Transacao) => transacaoAtual.tipo === 'despesa')
    .forEach((transacaoAtual: Transacao) => {
      despesasPorCategoria[transacaoAtual.categoria] = (despesasPorCategoria[transacaoAtual.categoria] || 0) + transacaoAtual.valor;
    });
  const dadosGraficoCategorias = Object.entries(despesasPorCategoria).map(([nomeCategoria, valorCategoria]) => ({
    x: nomeCategoria,
    y: valorCategoria,
  }));
  const temDadosCategorias = dadosGraficoCategorias.length > 0;
  const { animacoes: animacoesResumo } = useAnimacaoCascata(4, 0, 80);
  const { animacoes: animacoesCategorias } = useAnimacaoCascata(dadosGraficoCategorias.length, 0, 60);
  const { fadeAnimTop: fadeAnimAba } = useAnimacaoCascata(0, 0, 120, abaSelecionada);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Relatórios</Text>
          <Text style={styles.subtitulo}>Análise financeira completa</Text>
        </View>

        <TouchableOpacity 
          style={styles.badgeMes} 
          onPress={() => setSeletorMesVisivel(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.badgeMesTexto}>{`${NOMES_MESES[mesSelecionado]} de ${anoSelecionado}`}</Text>
          <CalendarIcon size={14} color="#666" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {carregandoTransacoes ? (
        <Text style={styles.estadoDados}>Carregando dados financeiros...</Text>
      ) : erroTransacoes ? (
        <Text style={styles.estadoDados}>Relatórios indisponíveis no momento.</Text>
      ) : (
        <>
      {/* ── GRID DE SUMÁRIO ── */}
      <View style={styles.grid}>
        <Animated.View style={[styles.card, estiloCartao(animacoesResumo[0])]}>
          <View style={[styles.iconeCircle, { backgroundColor: '#E8F5E9' }]}>
            <ArrowUpRight size={16} color={COR_RECEITA} />
          </View>
          <Text style={styles.cardLabel}>Receitas</Text>
          <Text style={[styles.cardValor, { color: COR_RECEITA }]}>
            R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.card, estiloCartao(animacoesResumo[1])]}>
          <View style={[styles.iconeCircle, { backgroundColor: '#FFEBEE' }]}>
            <ArrowDownRight size={16} color={COR_DESPESA} />
          </View>
          <Text style={styles.cardLabel}>Despesas</Text>
          <Text style={[styles.cardValor, { color: COR_DESPESA }]}>
            R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.card, estiloCartao(animacoesResumo[2])]}>
          <View style={[styles.iconeCircle, { backgroundColor: '#E0F2FE' }]}>
            <TrendingUp size={16} color="#0284C7" />
          </View>
          <Text style={styles.cardLabel}>Economizado</Text>
          <Text style={[styles.cardValor, { color: economizado >= 0 ? COR_RECEITA : COR_DESPESA }]}>
            R$ {economizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.card, estiloCartao(animacoesResumo[3])]}>
          <View style={[styles.iconeCircle, { backgroundColor: '#F0FDFA' }]}>
            <PieChart size={16} color="#0D9488" />
          </View>
          <Text style={styles.cardLabel}>Taxa de poupança</Text>
          <Text style={[styles.cardValor, { color: COR_RECEITA }]}>{taxaPoupanca}%</Text>
        </Animated.View>
      </View>

      {/* As três abas mostram jeitos diferentes de olhar os mesmos dados. */}
      <View style={styles.abas}>
        {(
          [
            ['geral', 'Visão Geral'],
            ['categorias', 'Categorias'],
            ['tendencias', 'Tendências'],
          ] as [AbaRelatorio, string][]
          ).map(([identificadorAba, tituloAba]) => (
          <TouchableOpacity
            key={identificadorAba}
            style={[styles.aba, abaSelecionada === identificadorAba && styles.abaAtiva]}
            onPress={() => setAbaSelecionada(identificadorAba)}
            activeOpacity={0.7}
          >
            <Text style={[styles.abaTexto, abaSelecionada === identificadorAba && styles.abaTextoAtivo]}>{tituloAba}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.View style={{ opacity: fadeAnimAba }}>
      {/* ── VISÃO GERAL ── */}
      {abaSelecionada === 'geral' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Receitas vs. Despesas (6 meses)</Text>

          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, semestre === 1 && styles.toggleBtnAtivo]}
              onPress={() => setSemestre(1)}
            >
              <Text style={[styles.toggleText, semestre === 1 && styles.toggleTextAtivo]}>Jan–Jun</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, semestre === 2 && styles.toggleBtnAtivo]}
              onPress={() => setSemestre(2)}
            >
              <Text style={[styles.toggleText, semestre === 2 && styles.toggleTextAtivo]}>Jul–Dez</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legenda}>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: COR_RECEITA }]} />
              <Text style={styles.legendaLabel}>Receita</Text>
            </View>
            <View style={styles.legendaItem}>
              <View style={[styles.legendaCor, { backgroundColor: COR_DESPESA }]} />
              <Text style={styles.legendaLabel}>Despesa</Text>
            </View>
          </View>

          <VictoryChart
            width={larguraGrafico}
            height={220}
            theme={VictoryTheme.material}
            domain={{ y: [0, valorMaximoGrafico] }}
            padding={{ top: 10, bottom: 30, left: 45, right: 15 }}
          >
            <VictoryAxis
              tickValues={[1, 2, 3, 4, 5, 6]}
              tickFormat={(x) => dadosSemestre[x - 1]?.mes || ''}
              style={estiloEixoX}
            />
            <VictoryAxis dependentAxis tickFormat={formatarValorEixoY} style={estiloEixoY} />
              <VictoryArea
              data={dadosSemestre}
              x="x"
              y="receita"
              interpolation="monotoneX"
              style={{ data: { fill: 'rgba(26, 158, 117, 0.2)', stroke: COR_RECEITA, strokeWidth: 2 } }}
              labels={() => ''}
            />
            <VictoryArea
              data={dadosSemestre}
              x="x"
              y="despesa"
              interpolation="monotoneX"
              style={{ data: { fill: 'rgba(226, 75, 74, 0.18)', stroke: COR_DESPESA, strokeWidth: 2 } }}
              labels={() => ''}
            />
            <VictoryLine
              data={dadosSemestre}
              x="x"
              y="receita"
              interpolation="monotoneX"
              labels={() => ''}
              style={{ data: { stroke: COR_RECEITA, strokeWidth: 2 } }}
            />
            <VictoryLine
              data={dadosSemestre}
              x="x"
              y="despesa"
              interpolation="monotoneX"
              labels={() => ''}
              style={{ data: { stroke: COR_DESPESA, strokeWidth: 2 } }}
            />
          </VictoryChart>
        </View>
      )}

      {/* ── CATEGORIAS ── */}
      {abaSelecionada === 'categorias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Despesas por Categoria</Text>
          <Text style={styles.graficoTitulo}>O gráfico mostra apenas despesas do mês selecionado</Text>

          {temDadosCategorias ? (
            <View style={styles.donutCenter}>
              <VictoryPie
                data={dadosGraficoCategorias}
                width={larguraGrafico}
                height={200}
                colorScale={CORES_CATEGORIAS}
                innerRadius={60}
                labels={() => ''}
                padding={15}
              />

              <View style={styles.categoriasCards}>
                {dadosGraficoCategorias.map((dadosCategoria, indiceCategoria) => {
                  const animacao = animacoesCategorias[indiceCategoria];
                  return (
                  <Animated.View
                    key={dadosCategoria.x}
                    style={[
                      styles.categoriaCard,
                      {
                        opacity: animacao,
                        transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                      },
                    ]}
                  >
                    <View style={[styles.categoriaDot, { backgroundColor: CORES_CATEGORIAS[indiceCategoria % CORES_CATEGORIAS.length] }]} />
                    <View style={styles.categoriaInfo}>
                      <Text style={styles.categoriaNome}>{dadosCategoria.x}</Text>
                      <Text style={styles.categoriaValor}>
                        R$ {dadosCategoria.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {totalDespesas > 0 ? ((dadosCategoria.y / totalDespesas) * 100).toFixed(1) : '0.0'}%
                      </Text>
                    </View>
                  </Animated.View>
                );})}
              </View>
            </View>
          ) : (
            <View style={styles.donutVazioWrap}>
              <VictoryPie
                data={[{ x: '', y: 1 }]}
                width={larguraGrafico}
                height={180}
                colorScale={['#E5E5EA']}
                innerRadius={60}
                labels={() => ''}
                padding={10}
              />
              <View style={styles.donutVazioLabel}>
                <Text style={styles.donutVazioTexto}>Sem{'\n'}dados</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── TENDÊNCIAS ── */}
      {abaSelecionada === 'tendencias' && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Economia Mensal</Text>

          <VictoryChart
            width={larguraGrafico}
            height={220}
            theme={VictoryTheme.material}
            domain={{ y: [-variacaoMaximaEconomia, variacaoMaximaEconomia] }}
            padding={{ top: 10, bottom: 30, left: 45, right: 15 }}
          >
            <VictoryAxis
              tickValues={dadosPorMes.map((dadosDoMes) => dadosDoMes.x)}
              tickFormat={NOMES_MESES}
              style={estiloEixoX}
            />
            <VictoryAxis dependentAxis tickFormat={formatarValorEixoY} style={estiloEixoY} />
            <VictoryLine
              data={dadosPorMes}
              x="x"
              y="economia"
              style={{ data: { stroke: COR_RECEITA, strokeWidth: 2.5 } }}
            />
          </VictoryChart>
        </View>
      )}
      </Animated.View>
        </>
      )}

      <SeletorMesModal visivel={seletorMesVisivel} meses={NOMES_MESES} mesSelecionado={mesSelecionado} fechar={() => setSeletorMesVisivel(false)} selecionar={(indice) => { setMesSelecionado(indice); setSeletorMesVisivel(false); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  estadoDados: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titulo: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  subtitulo: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  badgeMes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  badgeMesTexto: { fontSize: 12, color: '#3A3A3C', fontWeight: '500' },

grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  card: {
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  iconeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  cardValor: { fontSize: 16, fontWeight: '700' },

  abas: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#EFEFF4',
    borderRadius: 20,
    padding: 3,
  },
  aba: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  abaAtiva: { backgroundColor: '#1A9E75' },
  abaTexto: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  abaTextoAtivo: { color: '#FFFFFF' },

  graficoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  graficoTitulo: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },

  legenda: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaCor: { width: 8, height: 8, borderRadius: 2 },
  legendaLabel: { fontSize: 11, color: '#8E8E93' },

  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  toggleBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', backgroundColor: '#FFFFFF' },
  toggleBtnAtivo: { backgroundColor: '#F0FDF4' },
  toggleText: { fontSize: 12, color: '#8E8E93' },
  toggleTextAtivo: { color: '#1A9E75', fontWeight: '600' },

  donutCenter: { alignItems: 'center', justifyContent: 'center' },
  donutVazioWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  donutVazioLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutVazioTexto: { fontSize: 12, color: '#AEAEB2', textAlign: 'center' },

  /* Cards de categorias abaixo do donut */
  categoriasCards: { marginTop: 16, width: '100%', gap: 8 },
  categoriaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  categoriaDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  categoriaInfo: { flex: 1 },
  categoriaNome: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  categoriaValor: { fontSize: 12, color: '#64748B', marginTop: 4 },

});
