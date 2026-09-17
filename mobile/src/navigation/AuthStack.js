import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from './placeholders/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

// Débora (RF1): se reemplaza el DevLoginScreen temporal por el LoginScreen
// definitivo (src/screens/auth/LoginScreen.js).
export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Recuperar contraseña' }}
      />
    </Stack.Navigator>
  );
}