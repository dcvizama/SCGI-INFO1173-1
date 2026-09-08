import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './placeholders/HomeScreen';
import ScanScreen from './placeholders/ScanScreen';
import ProfileScreen from './placeholders/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Inicio: 'home-outline',
  Escanear: 'qr-code-outline',
  Perfil: 'person-outline',
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Escanear" component={ScanScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
