import { useAuth } from '../context/AuthContext';
import { getTabsPermitidos, normalizarRol } from './permissions';
import AppTabs from './AppTabs';
import AccessDeniedScreen from './placeholders/AccessDeniedScreen';

export default function PrivateRoutes() {
  const { user } = useAuth();

  // El rol viene del payload del JWT, decodificado en AuthContext.
  const rol = normalizarRol(user?.rol);
  const tabs = getTabsPermitidos(rol);

  if (!rol || tabs.length === 0) {
    return <AccessDeniedScreen rol={user?.rol} />;
  }

  return <AppTabs tabs={tabs} />;
}
