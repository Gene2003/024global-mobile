import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ headerShown: true, title: 'Login', headerBackTitle: 'Back' }} />
        <Stack.Screen name="register" options={{ headerShown: true, title: 'Register', headerBackTitle: 'Back' }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Product', headerBackTitle: 'Back' }} />
        <Stack.Screen name="contact-vendor" options={{ headerShown: true, title: 'Contact Vendor', headerBackTitle: 'Back' }} />
        <Stack.Screen name="transporter" options={{ headerShown: true, title: 'Transporters', headerBackTitle: 'Back' }} />
        <Stack.Screen name="contact-service-provider" options={{ headerShown: true, title: 'Contact Provider', headerBackTitle: 'Back' }} />
      </Stack>
    </>
  );
}
