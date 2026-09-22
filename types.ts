import type { LucideIcon } from 'lucide-react-native';

// Esses tipos ajudam o TypeScript a entender os dados usados no app.
export type Usuario = {
  // Identificador que vem do banco de dados.
  id: string;
  // Nome que aparece para a pessoa no app.
  nome: string;
  // E-mail usado para entrar na conta.
  email: string;
};

export type Transacao = {
  // Cada transação precisa ter um id próprio.
  id: string;
  // Texto explicando o que foi comprado ou recebido.
  descricao: string;
  // Categoria usada nos filtros e gráficos.
  categoria: string;
  // Valor da entrada ou da saída.
  valor: number;
  // Data da transação salva como texto.
  data: string;
  // Uma transação pode ser entrada ou saída.
  tipo: 'receita' | 'despesa';
};

export type Meta = {
  // Dados de uma meta financeira.
  id: string;
  titulo: string;
  // Quanto já foi guardado até agora.
  atual: number;
  // Quanto precisa guardar no total.
  total: number;
};

export type Notificacao = {
  // Dados que aparecem no sino da tela inicial.
  id: string;
  titulo: string;
  mensagem: string;
  // O tipo ajuda a decidir como mostrar a notificação.
  tipo: 'meta' | 'alerta' | 'dica' | 'sistema';
  // Fica true depois que a pessoa lê.
  lida: boolean;
  // Data em que a notificação foi criada.
  criadaEm: string;
};

export type Dica = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  conteudo: string;
  created_at: string;
};

export type Video = {
  id: string;
  titulo: string;
  canal: string;
  duracao: string;
  categoria: string;
  url: string;
  thumbnail?: string;
};

// Categorias que podem ser usadas no formulário de feedback.
export type CategoriaFeedback = 'sugestao' | 'bug' | 'elogio';

// Formato de cada opção de feedback que aparece na tela de perfil.
export type OpcaoFeedback = {
  chave: CategoriaFeedback;
  icone: LucideIcon;
  label: string;
};

// Abas disponíveis na tela de relatórios.
export type AbaRelatorio = 'geral' | 'categorias' | 'tendencias';

// Filtros usados para separar receitas e despesas.
export type FiltroTransacao = 'todos' | 'receitas' | 'despesas';
export type TipoModalTransacao = 'receita' | 'despesa' | null;

// Resposta padrão das ações que podem dar certo ou retornar uma mensagem.
export type ResultadoOperacao = {
  sucesso: boolean;
  mensagem: string;
};

// Dados financeiros que são enviados para gerar a análise personalizada.
export type ContextoAnalise = {
  receitas: number;
  despesas: number;
  metas: object[];
  dicasDisponiveis: object[];
};

// Dados usados para montar o HTML do relatório em PDF.
export type DadosRelatorio = {
  email: string;
  transacoes: Transacao[];
  metas: Meta[];
  logoDataUrl: string;
  dataGeracao?: Date;
};