import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { IncidentProvider } from '../context/IncidentContext';
import { NotificationProvider } from '../context/NotificationContext';
import {
  getTabsPermitidos,
  normalizarRol,
  puedeReportarIncidencia,
  puedeVerBandeja,
} from './permissions';
import { RUTAS } from './routes';
import AppTabs from './AppTabs';
import AccessDeniedScreen from '../screens/auth/AccessDeniedScreen';
import IncidentFormScreen from '../screens/incident/IncidentFormScreen';
import IncidentTrackingScreen from '../screens/incident/IncidentTrackingScreen';
import HistorialFallasScreen from '../screens/asset/AssetFaultHistoryScreen';
const Stack = createNativeStackNavigator();

export default function PrivateRoutes() {
  const { user } = useAuth();

  // El contrato OpenAPI entrega el rol anidado: usuario.rol.nombre_rol
  const rolCrudo = user?.rol?.nombre_rol ?? user?.rol;
  const rol = normalizarRol(rolCrudo);
  const tabs = getTabsPermitidos(rol);

  if (!rol || tabs.length === 0) {
    return <AccessDeniedScreen rol={rolCrudo} />;
  }

  // Los tabs quedan como primera pantalla del stack. El formulario de reporte se
  // abre encima, a pantalla completa y con botón atrás (Android e iOS, RNF6).
  // IncidentProvider envuelve ambos: la ficha (en los tabs) inicia el reporte
  // y el formulario lo completa. Lo mismo con la bandeja (tab) y el seguimiento
  // de una incidencia, que se abre encima de los tabs. NotificationProvider
  // alimenta la pestaña Notificaciones y su distintivo de no leídas (RF8).
  return (
    <IncidentProvider>
      <NotificationProvider>
        <Stack.Navigator>
          <Stack.Screen name={RUTAS.TABS} options={{ headerShown: false }}>
            {() => <AppTabs tabs={tabs} />}
          </Stack.Screen>
          {puedeReportarIncidencia(rol) && (
            <Stack.Screen
              name={RUTAS.REPORTAR_INCIDENCIA}
              component={IncidentFormScreen}
              options={{ title: 'Reportar incidencia' }}
            />
          )}
          {puedeVerBandeja(rol) && (
            <Stack.Screen
              name={RUTAS.SEGUIMIENTO_INCIDENCIA}
              component={IncidentTrackingScreen}
              options={{ title: 'Seguimiento' }}
            />
          )}
          {/* Historial de fallas del activo: se abre desde la ficha (RF2, RF6). */}
          <Stack.Screen
            name={RUTAS.HISTORIAL_FALLAS}
            component={HistorialFallasScreen}
            options={{ title: 'Historial de fallas' }}
          />
        </Stack.Navigator>
      </NotificationProvider>
    </IncidentProvider>
  );
}
