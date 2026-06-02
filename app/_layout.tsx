import { Stack } from 'expo-router';
import React, { createContext, useContext, useState } from 'react';

// --- TIPOS ---
export type Usuario = {
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
  icone: string;
};

export type Meta = {
  id: string;
  titulo: string;
  atual: number;
  total: number;
};

// --- CONTEXTS ---
export const AuthContext = createContext<any>({});
export const FinanceContext = createContext<any>({});

// --- HOOKS ---
export const useAuth = () => useContext(AuthContext);
export const useFinance = () => useContext(FinanceContext);

// --- LAYOUT ---
export default function RootLayout() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([
  { id: '1', descricao: 'Aluguel', categoria: 'Moradia', valor: 1500, data: '2026-05-01', tipo: 'despesa', icone: '🏠' },
  { id: '2', descricao: 'Mercado', categoria: 'Alimentação', valor: 800, data: '2026-05-05', tipo: 'despesa', icone: '🛒' },
  { id: '3', descricao: 'Uber', categoria: 'Transporte', valor: 200, data: '2026-05-10', tipo: 'despesa', icone: '🚗' },
  { id: '4', descricao: 'Salário', categoria: 'Receita', valor: 3000, data: '2026-05-01', tipo: 'receita', icone: '💰' },
]);
  const [metas, setMetas] = useState<Meta[]>([]);

  const logout = () => setUsuario(null);

  const adicionarTransacao = (t: Omit<Transacao, 'id'>) =>
    setTransacoes(prev => [...prev, { ...t, id: Date.now().toString() }]);

  const adicionarMeta = (m: Omit<Meta, 'id'>) =>
    setMetas(prev => [...prev, { ...m, id: Date.now().toString() }]);

  const totalReceitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoTotal = totalReceitas - totalDespesas;

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout }}>
      <FinanceContext.Provider value={{
        transacoes, metas,
        adicionarTransacao, adicionarMeta,
        saldoTotal, totalReceitas, totalDespesas,
      }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="telalogin" />
          <Stack.Screen name="telainicial" />
          <Stack.Screen name="telainicial2" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </FinanceContext.Provider>
    </AuthContext.Provider>
  );
};
