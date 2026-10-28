import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './placeholders/HomeScreen';

import ScanScreen from '../screens/scanner';
import ProfileScreen from '../screens/auth/ProfileScreen';
import AssetDetailScreen from '../screens/asset/AssetDetailScreen';

const Tab = createBottomTabNavigator();

const PANTALLAS = {
  Inicio: { component: HomeScreen, icono: 'home-outline' },
  Escanear: { component: ScanScreen, icono: 'qr-code-outline' },
  Perfil: { component: ProfileScreen, icono: 'person-outline' },
};

// Se asigna un arreglo por defecto a "tabs" para evitar el error undefined.map
export default function AppTabs({ tabs = Object.keys(PANTALLAS) }) {
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

      {/* TEMPORAL: tab de prueba para ver AssetDetailScreen mientras
          Enzo conecta la navegación real desde el escáner QR. Quitar cuando
          esté conectado el flujo real. */}
      <Tab.Screen
        name="ActivoTest"
        component={AssetDetailScreen}
        options={{
          title: 'Activo (test)',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
