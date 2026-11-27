import { useAuth } from '../context/AuthContext';
import SupervisorInboxScreen from '../screens/incident/SupervisorInboxScreen';
import BandejaScreen from './placeholders/BandejaScreen';
import { normalizarRol, ROLES } from './permissions';

// Pestaña Bandeja (RF5, RF6). El Supervisor revisa, clasifica y asigna desde su
// bandeja de pendientes; el Reportante y el Técnico siguen sus incidencias en
// la bandeja general.
export default function BandejaPorRol() {
  const { user } = useAuth();
  const rol = normalizarRol(user?.rol?.nombre_rol ?? user?.rol);

  return rol === ROLES.SUPERVISOR ? <SupervisorInboxScreen /> : <BandejaScreen />;
}
