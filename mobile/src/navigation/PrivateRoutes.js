import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { IncidentProvider } from '../context/IncidentContext';
import { getTabsPermitidos, normalizarRol, puedeReportarIncidencia } from './permissions';
import { RUTAS } from './routes';
import AppTabs from './AppTabs';
import AccessDeniedScreen from '../screens/auth/AccessDeniedScreen';
// TEMPORAL: placeholder hasta que exista screens/incident/IncidentFormScreen.
import IncidentFormScreen from './placeholders/IncidentFormScreen';

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
  // y el formulario lo completa.
  return (
    <IncidentProvider>
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
      </Stack.Navigator>
    </IncidentProvider>
  );
}
