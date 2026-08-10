import type { ReactNode } from 'react';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  rendaMensal: number;
  plano: 'free' | 'premium';
};

export type Transacao = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa';
  icone: string | ReactNode;
};

export type Meta = {
  id: string;
  titulo: string;
  atual: number;
  total: number;
};

export type Dica = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
};

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'meta' | 'alerta' | 'dica' | 'sistema';
  lida: boolean;
  criadaEm: string;

  // Identifica o evento que originou a notificação.
  // É opcional porque nem toda notificação precisa estar
  // relacionada a uma meta ou evento específico.
  chaveEvento?: string | null;
};