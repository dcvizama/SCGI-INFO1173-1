import { render, screen, fireEvent } from '@testing-library/react-native';
import AccionesTicket from '../AccionesTicket';
import { useIncident } from '../../../context/IncidentContext';
import { listarTransiciones } from '../../../services/incidentService';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { rol: 'Tecnico' } }),
}));
jest.mock('../../../context/IncidentContext', () => ({ useIncident: jest.fn() }));
jest.mock('../../../services/incidentService', () => ({
  ...jest.requireActual('../../../services/incidentService'),
  listarTransiciones: jest.fn(),
}));
jest.mock('../../../storage/secureStorage', () => ({}));

it('bloquea espacios y conserva el comentario si falla el cambio sin conexión', async () => {
  const updateIncidentStatus = jest.fn(async () => null);
  useIncident.mockReturnValue({ updateIncidentStatus, errorAccion: { mensaje: 'Sin conexión' } });
  listarTransiciones.mockResolvedValue([
    { id_estado_origen: 3, id_estado_destino: 4, roles_permitidos: ['TECNICO'] },
  ]);
  await render(<AccionesTicket ticket={{ estado: { id_estado: 3 } }} />);
  const campo = await screen.findByLabelText('Comentario obligatorio');
  const boton = screen.getByText('Cambiar a en diagnostico');
  await fireEvent.changeText(campo, '  ');
  await fireEvent.press(boton);
  expect(updateIncidentStatus).not.toHaveBeenCalled();
  await fireEvent.changeText(campo, 'Revisión iniciada');
  await fireEvent.press(boton);
  expect(updateIncidentStatus).toHaveBeenCalledWith(4, 'Revisión iniciada');
  expect(screen.getByDisplayValue('Revisión iniciada')).toBeTruthy();
  expect(screen.getByText('Sin conexión')).toBeTruthy();
});
