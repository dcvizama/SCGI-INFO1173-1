import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DevLoginScreen from './placeholders/DevLoginScreen';
import LoginScreen from './placeholders/LoginScreen';
import ForgotPasswordScreen from './placeholders/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="DevLogin" screenOptions={{ headerShown: false }}>
      {/* Temporal: quitar DevLogin y apuntar Login a ../screens/auth cuando Débora entregue el suyo */}
      <Stack.Screen name="DevLogin" component={DevLoginScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Recuperar contraseña' }}
      />
    </Stack.Navigator>
  );
}
