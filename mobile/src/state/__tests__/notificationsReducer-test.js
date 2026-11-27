import {
  ACCIONES_NOTIFICACIONES,
  contarNoLeidas,
  ESTADOS_NOTIFICACIONES,
  estadoInicialNotificaciones,
  notificationsReducer,
} from '../notificationsReducer';
import {
  notificacionAsignada,
  notificacionAsignadaLeida,
  notificacionCambioEstado,
} from '../__fixtures__/notificaciones';

const LISTA = [notificacionAsignada, notificacionCambioEstado];
const ID = notificacionAsignada.id_notificacion;
const ERROR = { mensaje: 'No pudimos conectarnos.', tipo: 'sin_conexion' };

function aplicar(...acciones) {
  return acciones.reduce(notificationsReducer, estadoInicialNotificaciones);
}

const cargando = (solicitud, filtros = {}) => ({
  type: ACCIONES_NOTIFICACIONES.CARGANDO,
  filtros,
  solicitud,
});
const cargadas = (solicitud, notificaciones) => ({
  type: ACCIONES_NOTIFICACIONES.CARGADAS,
  notificaciones,
  solicitud,
});

describe('notificationsReducer: carga', () => {
  it('parte vacío e inactivo', () => {
    expect(estadoInicialNotificaciones).toMatchObject({
      notificaciones: [],
      estado: ESTADOS_NOTIFICACIONES.INACTIVO,
      error: null,
    });
  });

  it('guarda la lista y los filtros', () => {
    const estado = aplicar(cargando(1, { leida: false }), cargadas(1, LISTA));

    expect(estado).toMatchObject({
      notificaciones: LISTA,
      filtros: { leida: false },
      estado: ESTADOS_NOTIFICACIONES.LISTO,
    });
  });

  it('solo aplica la respuesta de la última petición', () => {
    const estado = aplicar(
      cargando(1),
      cargando(2),
      cargadas(2, [notificacionCambioEstado]),
      cargadas(1, LISTA)
    );

    expect(estado.notificaciones).toEqual([notificacionCambioEstado]);
  });

  it('un error conserva la lista anterior', () => {
    const estado = aplicar(cargando(1), cargadas(1, LISTA), cargando(2), {
      type: ACCIONES_NOTIFICACIONES.FALLIDAS,
      error: ERROR,
      solicitud: 2,
    });

    expect(estado).toMatchObject({
      notificaciones: LISTA,
      estado: ESTADOS_NOTIFICACIONES.ERROR,
      error: ERROR,
    });
  });

  it('una respuesta que no es arreglo deja la lista vacía', () => {
    expect(aplicar(cargando(1), cargadas(1, null)).notificaciones).toEqual([]);
  });
});

describe('notificationsReducer: marcar como leída', () => {
  it('la marca al tiro y luego guarda la respuesta de la API', () => {
    const marcando = aplicar(cargando(1), cargadas(1, LISTA), {
      type: ACCIONES_NOTIFICACIONES.MARCANDO_LEIDA,
      idNotificacion: ID,
    });
    expect(marcando.notificaciones[0].leida).toBe(true);

    const marcada = notificationsReducer(marcando, {
      type: ACCIONES_NOTIFICACIONES.MARCADA_LEIDA,
      notificacion: notificacionAsignadaLeida,
    });
    expect(marcada.notificaciones[0]).toEqual(notificacionAsignadaLeida);
  });

  it('si la API falla vuelve a quedar sin leer y guarda el motivo', () => {
    const estado = aplicar(
      cargando(1),
      cargadas(1, LISTA),
      { type: ACCIONES_NOTIFICACIONES.MARCANDO_LEIDA, idNotificacion: ID },
      { type: ACCIONES_NOTIFICACIONES.MARCAR_LEIDA_FALLIDA, idNotificacion: ID, error: ERROR }
    );

    expect(estado.notificaciones[0].leida).toBe(false);
    expect(estado.error).toEqual(ERROR);
  });
});

describe('contarNoLeidas', () => {
  it('cuenta solo las que no se han leído', () => {
    expect(contarNoLeidas(LISTA)).toBe(1);
    expect(contarNoLeidas([notificacionAsignadaLeida, notificacionCambioEstado])).toBe(0);
    expect(contarNoLeidas()).toBe(0);
  });
});
