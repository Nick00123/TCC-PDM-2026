import { Stack } from 'expo-router';
import React from 'react';

import { AuthProvider } from '../src/contextos/AuthContexto';
import { FinanceProvider } from '../src/contextos/FinanceContexto';

export { useAuth } from '../src/contextos/AuthContexto';
export { useFinance } from '../src/contextos/FinanceContexto';
export type { Meta, Transacao, Usuario } from '../src/tipos';

export default function RootLayout() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="telalogin" />
          <Stack.Screen name="telainicial" />
          <Stack.Screen name="telainicial2" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </FinanceProvider>
    </AuthProvider>
  );
}
