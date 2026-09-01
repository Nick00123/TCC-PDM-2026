import { Stack } from 'expo-router';


export const unstable_settings = {
  initialRouteName: 'intro',
};

export default function RootLayout() {
  return (
    <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          >
            <Stack.Screen name="intro" />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="reset" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
