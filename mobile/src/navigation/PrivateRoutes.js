import { useAuth } from '../context/AuthContext';
import { getTabsPermitidos, normalizarRol } from './permissions';
import AppTabs from './AppTabs';
import AccessDeniedScreen from '../screens/auth/AccessDeniedScreen';

export default function PrivateRoutes() {
  const { user } = useAuth();

  // El contrato OpenAPI entrega el rol anidado: usuario.rol.nombre_rol
  const rolCrudo = user?.rol?.nombre_rol ?? user?.rol;
  const rol = normalizarRol(rolCrudo);
  const tabs = getTabsPermitidos(rol);

  if (!rol || tabs.length === 0) {
    return <AccessDeniedScreen rol={rolCrudo} />;
  }

  return <AppTabs tabs={tabs} />;
}
