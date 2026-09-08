import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './placeholders/HomeScreen';
import ScanScreen from './placeholders/ScanScreen';
import ProfileScreen from './placeholders/ProfileScreen';

const Tab = createBottomTabNavigator();

const PANTALLAS = {
  Inicio: { component: HomeScreen, icono: 'home-outline' },
  Escanear: { component: ScanScreen, icono: 'qr-code-outline' },
  Perfil: { component: ProfileScreen, icono: 'person-outline' },
};

export default function AppTabs({ tabs }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={PANTALLAS[route.name].icono} color={color} size={size} />
        ),
      })}
    >
      {tabs.map((nombre) => (
        <Tab.Screen key={nombre} name={nombre} component={PANTALLAS[nombre].component} />
      ))}
    </Tab.Navigator>
  );
}
