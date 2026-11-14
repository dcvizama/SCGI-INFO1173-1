import { act, renderHook } from '@testing-library/react-native';
import { IncidentProvider, useIncident } from '../IncidentContext';
import { crearIncidencia } from '../mockIncidentService';

// En la tarea 6 esta ruta pasa a ser '../../services/incidentService'.
jest.mock('../mockIncidentService', () => ({
  crearIncidencia: jest.fn(),
}));

const PROYECTOR = {
  id_activo: 'a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21',
  codigo_qr: 'UCT-INF-1024',
  nombre: 'Proyector sala 3',
};

const INCIDENCIA_CREADA = {
  id_incidencia: 'e5f6a7b8-0000-4c1d-9e2f-2d7b5a9c0e31',
  id_activo: PROYECTOR.id_activo,
  titulo: 'No enciende',
  descripcion: 'Sin imagen al encender',
  estado: { id_estado: 1, nombre_estado: 'Pendiente' },
};

const wrapper = ({ children }) => <IncidentProvider>{children}</IncidentProvider>;

async function montar() {
  const { result } = await renderHook(() => useIncident(), { wrapper });
  return result;
}

async function llenarFormulario(result) {
  await act(async () => {
    result.current.startIncident(PROYECTOR);
    result.current.setField('titulo', ' No enciende ');
    result.current.setField('descripcion', 'Sin imagen al encender');
    result.current.setField('prioridad', 'alta');
    result.current.addPhoto(['file:///foto-1.jpg', { uri: 'file:///foto-2.jpg' }]);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('IncidentContext: creación de incidencia', () => {
  it('envía la NuevaIncidencia del contrato con las fotos del borrador', async () => {
    crearIncidencia.mockResolvedValue(INCIDENCIA_CREADA);
    const result = await montar();
    await llenarFormulario(result);

    await act(async () => {
      await result.current.createIncident();
    });

    expect(crearIncidencia).toHaveBeenCalledTimes(1);
    expect(crearIncidencia).toHaveBeenCalledWith(
      {
        id_activo: PROYECTOR.id_activo,
        titulo: 'No enciende',
        descripcion: 'Sin imagen al encender',
        prioridad: 'alta',
      },
      ['file:///foto-1.jpg', 'file:///foto-2.jpg']
    );
  });

  it('con éxito devuelve la incidencia, la guarda y limpia el borrador', async () => {
    crearIncidencia.mockResolvedValue(INCIDENCIA_CREADA);
    const result = await montar();
    await llenarFormulario(result);

    let devuelta;
    await act(async () => {
      devuelta = await result.current.createIncident();
    });

    expect(devuelta).toBe(INCIDENCIA_CREADA);
    expect(result.current.estadoEnvio).toBe('exito');
    expect(result.current.incidenciaCreada).toBe(INCIDENCIA_CREADA);
    expect(result.current.borrador.titulo).toBe('');
    expect(result.current.borrador.fotos).toEqual([]);
    expect(result.current.hayCambios).toBe(false);
  });

  it('no llama al servicio si faltan datos obligatorios', async () => {
    const result = await montar();
    await act(async () => {
      result.current.startIncident(PROYECTOR);
    });

    expect(result.current.puedeEnviar).toBe(false);

    let devuelta;
    await act(async () => {
      devuelta = await result.current.createIncident();
    });

    expect(devuelta).toBeNull();
    expect(crearIncidencia).not.toHaveBeenCalled();
    expect(result.current.error).toEqual({
      mensaje: 'Completa: título, descripción.',
      tipo: 'validacion',
    });
  });
});

describe('IncidentContext: estados de envío', () => {
  it('marca enviando mientras espera al servidor', async () => {
    let responder;
    crearIncidencia.mockImplementation(
      () =>
        new Promise((resolve) => {
          responder = resolve;
        })
    );
    const result = await montar();
    await llenarFormulario(result);

    let envio;
    await act(async () => {
      envio = result.current.createIncident();
    });

    expect(result.current.estadoEnvio).toBe('enviando');
    expect(result.current.enviando).toBe(true);

    await act(async () => {
      responder(INCIDENCIA_CREADA);
      await envio;
    });

    expect(result.current.estadoEnvio).toBe('exito');
    expect(result.current.enviando).toBe(false);
  });

  it('ignora un segundo toque en Enviar mientras el primero sigue en curso', async () => {
    let responder;
    crearIncidencia.mockImplementation(
      () =>
        new Promise((resolve) => {
          responder = resolve;
        })
    );
    const result = await montar();
    await llenarFormulario(result);

    let primero;
    let segundo;
    await act(async () => {
      primero = result.current.createIncident();
      segundo = result.current.createIncident();
    });

    expect(await segundo).toBeNull();

    await act(async () => {
      responder(INCIDENCIA_CREADA);
      await primero;
    });

    expect(crearIncidencia).toHaveBeenCalledTimes(1);
  });

  it('sin conexión muestra el mensaje de la API y conserva el borrador', async () => {
    crearIncidencia.mockRejectedValue({
      mensaje: 'No pudimos conectarnos. Revisa tu conexión a internet.',
      tipo: 'sin_conexion',
    });
    const result = await montar();
    await llenarFormulario(result);

    let devuelta;
    await act(async () => {
      devuelta = await result.current.createIncident();
    });

    expect(devuelta).toBeNull();
    expect(result.current.estadoEnvio).toBe('error');
    expect(result.current.error).toEqual({
      mensaje: 'No pudimos conectarnos. Revisa tu conexión a internet.',
      tipo: 'sin_conexion',
    });
    expect(result.current.borrador.titulo).toBe(' No enciende ');
    expect(result.current.borrador.fotos).toHaveLength(2);
  });

  it('un error inesperado recibe un mensaje genérico', async () => {
    crearIncidencia.mockRejectedValue(new TypeError('undefined is not a function'));
    const result = await montar();
    await llenarFormulario(result);

    await act(async () => {
      await result.current.createIncident();
    });

    expect(result.current.error).toEqual({
      mensaje: 'No pudimos crear la incidencia. Intenta de nuevo.',
      tipo: 'desconocido',
    });
  });

  it('se puede reintentar después de un error', async () => {
    crearIncidencia
      .mockRejectedValueOnce({
        mensaje: 'El servidor tardó demasiado en responder.',
        tipo: 'timeout',
      })
      .mockResolvedValueOnce(INCIDENCIA_CREADA);
    const result = await montar();
    await llenarFormulario(result);

    await act(async () => {
      await result.current.createIncident();
    });
    expect(result.current.estadoEnvio).toBe('error');

    await act(async () => {
      await result.current.createIncident();
    });

    expect(result.current.estadoEnvio).toBe('exito');
    expect(result.current.error).toBeNull();
    expect(crearIncidencia).toHaveBeenCalledTimes(2);
  });
});

describe('IncidentContext: fotos y cancelación', () => {
  it('informa cuántas fotos quedan y permite quitarlas', async () => {
    const result = await montar();
    await llenarFormulario(result);

    expect(result.current.fotosRestantes).toBe(3);

    await act(async () => {
      result.current.removePhoto('file:///foto-1.jpg');
    });

    expect(result.current.borrador.fotos).toEqual(['file:///foto-2.jpg']);
    expect(result.current.fotosRestantes).toBe(4);
  });

  it('cancelar descarta los cambios y el error', async () => {
    crearIncidencia.mockRejectedValue({ mensaje: 'x', tipo: 'http' });
    const result = await montar();
    await llenarFormulario(result);
    await act(async () => {
      await result.current.createIncident();
    });

    await act(async () => {
      result.current.cancelIncident();
    });

    expect(result.current.borrador.activo).toBeNull();
    expect(result.current.borrador.titulo).toBe('');
    expect(result.current.borrador.fotos).toEqual([]);
    expect(result.current.estadoEnvio).toBe('inactivo');
    expect(result.current.error).toBeNull();
    expect(result.current.hayCambios).toBe(false);
  });
});

it('useIncident falla fuera del IncidentProvider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(renderHook(() => useIncident())).rejects.toThrow(
    'useIncident debe usarse dentro de un IncidentProvider'
  );

  console.error.mockRestore();
});
