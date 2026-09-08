import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import PrivateRoutes from './PrivateRoutes';

// Temporal: en la tarea 4 esto sale de useAuth() del AuthContext.
const isSignedIn = false;

export default function AppNavigator() {
  return (
    <NavigationContainer>{isSignedIn ? <PrivateRoutes /> : <AuthStack />}</NavigationContainer>
  );
}