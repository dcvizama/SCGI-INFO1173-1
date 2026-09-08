import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DevLoginScreen from '../screens/auth/DevLoginScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="DevLogin" screenOptions={{ headerShown: false }}>
      {/* Temporal: quitar DevLogin cuando LoginScreen esté implementada */}
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
