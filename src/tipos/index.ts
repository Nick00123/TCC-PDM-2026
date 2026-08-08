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
