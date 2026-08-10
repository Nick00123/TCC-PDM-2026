import { Stack } from 'expo-router';
import React from 'react';

import { AuthProvider } from '../src/contextos/AuthContexto';
import { FinanceProvider, useFinance } from '../src/contextos/FinanceContexto';
import { NotificacoesProvider } from '../src/contextos/NotificacoesContexto';

export { useAuth } from '../src/contextos/AuthContexto';
export { useFinance } from '../src/contextos/FinanceContexto';
export type { Meta, Transacao, Usuario } from '../src/tipos';

export const unstable_settings = {
  initialRouteName: 'intro',
};

// Camada intermediária que acessa o FinanceContexto e injeta metas/transacoes
// no NotificacoesProvider (que precisa delas para gerar alertas automáticos).
function ProvidersComFinance({ children }: { children: React.ReactNode }) {
  const { metas, transacoes } = useFinance();
  return (
    <NotificacoesProvider metas={metas} transacoes={transacoes}>
      {children}
    </NotificacoesProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <ProvidersComFinance>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          >
            <Stack.Screen name="intro" />
            <Stack.Screen name="telalogin" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        </ProvidersComFinance>
      </FinanceProvider>
    </AuthProvider>
  );
}
