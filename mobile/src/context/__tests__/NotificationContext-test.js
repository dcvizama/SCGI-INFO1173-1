import { act, renderHook } from '@testing-library/react-native';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { listarNotificaciones, marcarNotificacionLeida } from '../../services/notificationService';
import {
  cargaPush,
  notificacionAsignada,
  notificacionAsignadaLeida,
  notificacionCambioEstado,
  notificacionNueva,
} from '../../state/__fixtures__/notificaciones';

// leerCargaPush es la real: así se prueba que el contexto entiende la push de Expo.
jest.mock('../../services/notificationService', () => ({
  ...jest.requireActual('../../services/notificationService'),
  listarNotificaciones: jest.fn(),
  marcarNotificacionLeida: jest.fn(),
}));

const LISTA = [notificacionAsignada, notificacionCambioEstado];
const SIN_CONEXION = { mensaje: 'No pudimos conectarnos.', tipo: 'sin_conexion' };

const wrapper = ({ children }) => <NotificationProvider>{children}</NotificationProvider>;

async function montar() {
  const { result } = await renderHook(() => useNotifications(), { wrapper });
  return result;
}

async function montarConLista() {
  listarNotificaciones.mockResolvedValue(LISTA);
  const result = await montar();
  await act(async () => {
    await result.current.loadNotifications();
  });
  jest.clearAllMocks();
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NotificationContext: lista y no leídas', () => {
  it('parte vacío', async () => {
    const result = await montar();

    expect(result.current.notificaciones).toEqual([]);
    expect(result.current.noLeidas).toBe(0);
    expect(result.current.estadoNotificaciones).toBe('inactivo');
  });

  it('carga las notificaciones y cuenta las no leídas', async () => {
    listarNotificaciones.mockResolvedValue(LISTA);
    const result = await montar();

    let respuesta;
    await act(async () => {
      respuesta = await result.current.loadNotifications({ limite: 20 });
    });

    expect(listarNotificaciones).toHaveBeenCalledWith({ limite: 20 });
    expect(respuesta).toEqual(LISTA);
    expect(result.current.notificaciones).toEqual(LISTA);
    expect(result.current.noLeidas).toBe(1);
  });

  it('sin conexión guarda el mensaje de la API', async () => {
    listarNotificaciones.mockRejectedValue(SIN_CONEXION);
    const result = await montar();

    await act(async () => {
      await result.current.loadNotifications();
    });

    expect(result.current.estadoNotificaciones).toBe('error');
    expect(result.current.errorNotificaciones).toEqual(SIN_CONEXION);
  });

  it('refreshNotifications repite los últimos filtros', async () => {
    const result = await montarConLista();
    listarNotificaciones.mockResolvedValue(LISTA);

    await act(async () => {
      await result.current.loadNotifications({ leida: false });
    });
    await act(async () => {
      await result.current.refreshNotifications();
    });

    expect(listarNotificaciones).toHaveBeenLastCalledWith({ leida: false });
  });
});

describe('NotificationContext: marcar como leída', () => {
  it('marca la notificación y baja el contador', async () => {
    const result = await montarConLista();
    marcarNotificacionLeida.mockResolvedValue(notificacionAsignadaLeida);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.markAsRead(notificacionAsignada.id_notificacion);
    });

    expect(marcarNotificacionLeida).toHaveBeenCalledWith(notificacionAsignada.id_notificacion);
    expect(respuesta).toEqual(notificacionAsignadaLeida);
    expect(result.current.noLeidas).toBe(0);
  });

  it('si la API falla, la notificación vuelve a quedar sin leer', async () => {
    const result = await montarConLista();
    marcarNotificacionLeida.mockRejectedValue(SIN_CONEXION);

    let respuesta;
    await act(async () => {
      respuesta = await result.current.markAsRead(notificacionAsignada.id_notificacion);
    });

    expect(respuesta).toBeNull();
    expect(result.current.noLeidas).toBe(1);
    expect(result.current.errorNotificaciones).toEqual(SIN_CONEXION);
  });
});

describe('NotificationContext: push recibida', () => {
  it('una push nueva recarga la lista y devuelve la incidencia a abrir', async () => {
    const result = await montarConLista();
    listarNotificaciones.mockResolvedValue([notificacionNueva, ...LISTA]);

    let carga;
    await act(async () => {
      // Forma en que llega al pulsar la push (respuesta del listener de Expo).
      carga = await result.current.receivePush({
        notification: { request: { content: { data: cargaPush(notificacionNueva) } } },
      });
    });

    expect(carga).toEqual(cargaPush(notificacionNueva));
    expect(listarNotificaciones).toHaveBeenCalledTimes(1);
    expect(result.current.notificaciones[0]).toEqual(notificacionNueva);
    expect(result.current.noLeidas).toBe(2);
  });

  it('si la notificación ya estaba en la lista, no la vuelve a pedir', async () => {
    const result = await montarConLista();

    let carga;
    await act(async () => {
      carga = await result.current.receivePush(cargaPush(notificacionAsignada));
    });

    expect(carga.id_incidencia).toBe(notificacionAsignada.id_incidencia);
    expect(listarNotificaciones).not.toHaveBeenCalled();
  });

  it('ignora una push que no es del SCGI', async () => {
    const result = await montarConLista();

    let carga;
    await act(async () => {
      carga = await result.current.receivePush({ otra: 'app' });
    });

    expect(carga).toBeNull();
    expect(listarNotificaciones).not.toHaveBeenCalled();
  });
});

it('useNotifications falla fuera del NotificationProvider', async () => {
  const consola = jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(renderHook(() => useNotifications())).rejects.toThrow(
    'useNotifications debe usarse dentro de un NotificationProvider'
  );

  consola.mockRestore();
});
