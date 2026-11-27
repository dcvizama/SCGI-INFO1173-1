import { get, patch, post } from '../../api/client';
import {
  incidenciaAsignada,
  incidenciaClasificada,
  incidenciaProyector,
  ordenProyector,
  transicionesEstado,
} from '../fixtures/incidencias';
import { usuarioTecnico } from '../fixtures/usuarios';
import {
  ESTADOS,
  PRIORIDADES,
  accionesDisponibles,
  asignarIncidencia,
  cambiarEstadoIncidencia,
  clasificarIncidencia,
} from '../incidentService';

// Acuerdos con TI2 (Sprint 3): prioridad critica, clasificar también cambia la
// prioridad de una incidencia ya avanzada y asignar sin clasificar antes.

jest.mock('../../storage/secureStorage', () => ({ getToken: jest.fn(async () => null) }));

jest.mock('../../api/client', () => ({
  ...jest.requireActual('../../api/client'),
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

const ID = incidenciaProyector.id_incidencia;

beforeEach(() => {
  jest.clearAllMocks();
  get.mockReset();
  post.mockReset();
  patch.mockReset();
});

describe('prioridad critica', () => {
  it('PRIORIDADES va de menor a mayor e incluye critica', () => {
    expect(PRIORIDADES).toEqual(['baja', 'media', 'alta', 'critica']);
  });

  it('clasificarIncidencia acepta critica', async () => {
    patch.mockResolvedValueOnce({ ...incidenciaClasificada, prioridad: 'critica' });

    const incidencia = await clasificarIncidencia(ID, { prioridad: 'critica' });

    expect(patch).toHaveBeenCalledWith(`/incidencias/${ID}/clasificacion`, {
      prioridad: 'critica',
    });
    expect(incidencia.prioridad).toBe('critica');
  });

  it('sigue rechazando una prioridad que no existe, con el mensaje actualizado', async () => {
    await expect(clasificarIncidencia(ID, { prioridad: 'urgente' })).rejects.toMatchObject({
      tipo: 'datos',
      message: 'Elige una prioridad: baja, media, alta o crítica.',
    });
    expect(patch).not.toHaveBeenCalled();
  });
});

describe('clasificar una incidencia ya avanzada', () => {
  it('solo cambia la prioridad y devuelve la incidencia en su mismo estado', async () => {
    patch.mockResolvedValueOnce({ ...incidenciaAsignada, prioridad: 'critica' });

    const incidencia = await clasificarIncidencia(ID, {
      prioridad: 'critica',
      comentario: 'Hay clases toda la tarde en la sala.',
    });

    expect(incidencia.estado.id_estado).toBe(ESTADOS.ASIGNADA);
    expect(incidencia.prioridad).toBe('critica');
  });
});

describe('asignar sin clasificar', () => {
  it('asigna una incidencia Pendiente de revision con POST /ordenes-trabajo', async () => {
    expect(incidenciaProyector.estado.id_estado).toBe(ESTADOS.PENDIENTE_REVISION);
    post.mockResolvedValueOnce(ordenProyector);
    get.mockResolvedValueOnce(incidenciaAsignada);

    const { incidencia } = await asignarIncidencia(ID, usuarioTecnico.id_usuario);

    expect(post).toHaveBeenCalledWith('/ordenes-trabajo', {
      id_incidencia: ID,
      id_tecnico: usuarioTecnico.id_usuario,
    });
    expect(incidencia.estado.id_estado).toBe(ESTADOS.ASIGNADA);
  });

  it('el supervisor ve Asignada entre sus acciones desde Pendiente de revision', () => {
    const destinos = (rol) =>
      accionesDisponibles(transicionesEstado, ESTADOS.PENDIENTE_REVISION, rol).map(
        (t) => t.id_estado_destino
      );

    expect(destinos('SUPERVISOR')).toEqual([
      ESTADOS.CLASIFICADA,
      ESTADOS.ASIGNADA,
      ESTADOS.CERRADA,
    ]);
    expect(destinos('TECNICO')).toEqual([]);
    expect(destinos('REPORTANTE')).toEqual([]);
  });

  it('asignar sigue usando su propia ruta, no PATCH .../estado', async () => {
    await expect(
      cambiarEstadoIncidencia(ID, { id_estado: ESTADOS.ASIGNADA, comentario: 'Directo.' })
    ).rejects.toMatchObject({ tipo: 'datos' });
    expect(patch).not.toHaveBeenCalled();
  });
});
