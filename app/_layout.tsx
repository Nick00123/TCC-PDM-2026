import { Stack } from 'expo-router';

import { AuthProvider } from '../src/contextos/AuthContexto';
import { FinanceProvider } from '../src/contextos/FinanceContexto';
import { NotificacoesProvider } from '../src/contextos/NotificacoesContexto';

export const unstable_settings = {
  initialRouteName: 'intro',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <NotificacoesProvider>
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
        </NotificacoesProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
