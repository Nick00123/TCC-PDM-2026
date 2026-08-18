export type Usuario = {
  id: string;
  nome: string;
  email: string;
};

export type Transacao = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa';
};

export type Meta = {
  id: string;
  titulo: string;
  atual: number;
  total: number;
};

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'meta' | 'alerta' | 'dica' | 'sistema';
  lida: boolean;
  criadaEm: string;
};
