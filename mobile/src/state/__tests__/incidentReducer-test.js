import {
  ACCIONES,
  ESTADOS_ENVIO,
  MAX_FOTOS,
  PRIORIDAD_POR_DEFECTO,
  camposFaltantes,
  construirNuevaIncidencia,
  estadoInicial,
  hayCambios,
  incidentReducer,
} from '../incidentReducer';

const PROYECTOR = { id_activo: 'a1d2c3b4-1111', codigo_qr: 'UCT-INF-1024', nombre: 'Proyector' };
const IMPRESORA = { id_activo: 'c3f4e5d6-3333', codigo_qr: 'UCT-ADM-2048', nombre: 'Impresora' };

function aplicar(...acciones) {
  return acciones.reduce(incidentReducer, estadoInicial);
}

const iniciar = (activo = PROYECTOR) => ({ type: ACCIONES.INICIAR, activo });
const campo = (nombre, valor) => ({ type: ACCIONES.CAMBIAR_CAMPO, campo: nombre, valor });
const fotos = (valor) => ({ type: ACCIONES.AGREGAR_FOTOS, fotos: valor });

describe('incidentReducer: formulario', () => {
  it('parte vacío, con prioridad media y sin envío', () => {
    expect(estadoInicial.borrador).toEqual({
      activo: null,
      titulo: '',
      descripcion: '',
      prioridad: PRIORIDAD_POR_DEFECTO,
      fotos: [],
    });
    expect(estadoInicial.estadoEnvio).toBe(ESTADOS_ENVIO.INACTIVO);
  });

  it('inicia el reporte con el activo identificado', () => {
    expect(aplicar(iniciar()).borrador.activo).toBe(PROYECTOR);
  });

  it('conserva lo escrito si se vuelve a abrir el mismo activo', () => {
    const estado = aplicar(iniciar(), campo('titulo', 'No enciende'), iniciar({ ...PROYECTOR }));

    expect(estado.borrador.titulo).toBe('No enciende');
  });

  it('empieza de cero si se abre otro activo', () => {
    const estado = aplicar(iniciar(), campo('titulo', 'No enciende'), iniciar(IMPRESORA));

    expect(estado.borrador.activo).toBe(IMPRESORA);
    expect(estado.borrador.titulo).toBe('');
  });

  it('actualiza título, descripción y prioridad', () => {
    const estado = aplicar(
      iniciar(),
      campo('titulo', 'No enciende'),
      campo('descripcion', 'Se apagó durante la clase'),
      campo('prioridad', 'alta')
    );

    expect(estado.borrador).toMatchObject({
      titulo: 'No enciende',
      descripcion: 'Se apagó durante la clase',
      prioridad: 'alta',
    });
  });

  it('ignora campos que no son del formulario y valores inválidos', () => {
    const base = aplicar(iniciar());

    expect(incidentReducer(base, campo('activo', IMPRESORA))).toBe(base);
    expect(incidentReducer(base, campo('prioridad', 'urgentísima'))).toBe(base);
    expect(incidentReducer(base, campo('titulo', 42))).toBe(base);
  });
});

describe('incidentReducer: fotos antes de subir', () => {
  it('guarda URIs sueltas y el objeto { uri } de la cámara', () => {
    const estado = aplicar(iniciar(), fotos('file:///a.jpg'), fotos([{ uri: 'file:///b.jpg' }]));

    expect(estado.borrador.fotos).toEqual(['file:///a.jpg', 'file:///b.jpg']);
  });

  it('no repite fotos ni guarda valores vacíos', () => {
    const estado = aplicar(iniciar(), fotos(['file:///a.jpg', 'file:///a.jpg', '', null]));

    expect(estado.borrador.fotos).toEqual(['file:///a.jpg']);
  });

  it(`no pasa de ${MAX_FOTOS} fotos`, () => {
    const muchas = Array.from({ length: MAX_FOTOS + 2 }, (_, i) => `file:///${i}.jpg`);
    const estado = aplicar(iniciar(), fotos(muchas));

    expect(estado.borrador.fotos).toHaveLength(MAX_FOTOS);
  });

  it('quita una foto por su URI', () => {
    const estado = aplicar(iniciar(), fotos(['file:///a.jpg', 'file:///b.jpg']), {
      type: ACCIONES.QUITAR_FOTO,
      uri: 'file:///a.jpg',
    });

    expect(estado.borrador.fotos).toEqual(['file:///b.jpg']);
  });
});

describe('incidentReducer: estados de envío', () => {
  const listo = [iniciar(), campo('titulo', 'No enciende'), campo('descripcion', 'Sin imagen')];
  const incidencia = { id_incidencia: 'i-1', estado: { id_estado: 1, nombre_estado: 'Pendiente' } };

  it('pasa a enviando', () => {
    expect(aplicar(...listo, { type: ACCIONES.ENVIO_INICIADO }).estadoEnvio).toBe(
      ESTADOS_ENVIO.ENVIANDO
    );
  });

  it('con éxito guarda la incidencia y vacía el borrador', () => {
    const estado = aplicar(
      ...listo,
      { type: ACCIONES.ENVIO_INICIADO },
      {
        type: ACCIONES.ENVIO_EXITOSO,
        incidencia,
      }
    );

    expect(estado.estadoEnvio).toBe(ESTADOS_ENVIO.EXITO);
    expect(estado.incidenciaCreada).toBe(incidencia);
    expect(estado.borrador).toEqual(estadoInicial.borrador);
  });

  it('con error guarda el motivo y conserva el borrador para reintentar', () => {
    const error = { mensaje: 'Sin conexión', tipo: 'sin_conexion' };
    const estado = aplicar(
      ...listo,
      { type: ACCIONES.ENVIO_INICIADO },
      {
        type: ACCIONES.ENVIO_FALLIDO,
        error,
      }
    );

    expect(estado.estadoEnvio).toBe(ESTADOS_ENVIO.ERROR);
    expect(estado.error).toBe(error);
    expect(estado.borrador.titulo).toBe('No enciende');
  });

  it('al editar después de un error se quita el mensaje', () => {
    const estado = aplicar(
      ...listo,
      { type: ACCIONES.ENVIO_FALLIDO, error: { mensaje: 'x', tipo: 'http' } },
      campo('titulo', 'Proyector no enciende')
    );

    expect(estado.estadoEnvio).toBe(ESTADOS_ENVIO.INACTIVO);
    expect(estado.error).toBeNull();
  });

  it('no deja editar ni cancelar mientras se envía', () => {
    const enviando = aplicar(...listo, { type: ACCIONES.ENVIO_INICIADO });

    expect(incidentReducer(enviando, campo('titulo', 'Otro'))).toBe(enviando);
    expect(incidentReducer(enviando, fotos('file:///a.jpg'))).toBe(enviando);
    expect(incidentReducer(enviando, { type: ACCIONES.REINICIAR })).toBe(enviando);
  });
});

describe('incidentReducer: cancelación', () => {
  it('descarta todo y vuelve al estado inicial', () => {
    const estado = aplicar(
      iniciar(),
      campo('titulo', 'No enciende'),
      fotos('file:///a.jpg'),
      { type: ACCIONES.ENVIO_FALLIDO, error: { mensaje: 'x', tipo: 'http' } },
      { type: ACCIONES.REINICIAR }
    );

    expect(estado).toEqual(estadoInicial);
  });
});

describe('hayCambios', () => {
  it('es false con solo el activo elegido', () => {
    expect(hayCambios(aplicar(iniciar()))).toBe(false);
  });

  it('es true con texto, otra prioridad o fotos', () => {
    expect(hayCambios(aplicar(iniciar(), campo('titulo', 'x')))).toBe(true);
    expect(hayCambios(aplicar(iniciar(), campo('prioridad', 'alta')))).toBe(true);
    expect(hayCambios(aplicar(iniciar(), fotos('file:///a.jpg')))).toBe(true);
  });

  it('no cuenta los espacios en blanco como cambios', () => {
    expect(hayCambios(aplicar(iniciar(), campo('titulo', '   ')))).toBe(false);
  });
});

describe('camposFaltantes y construirNuevaIncidencia', () => {
  it('lista lo obligatorio que falta', () => {
    expect(camposFaltantes(estadoInicial.borrador)).toEqual(['activo', 'titulo', 'descripcion']);
    expect(camposFaltantes(aplicar(iniciar(), campo('titulo', ' ')).borrador)).toEqual([
      'titulo',
      'descripcion',
    ]);
  });

  it('arma la NuevaIncidencia del contrato, sin espacios sobrantes y sin las fotos', () => {
    const { borrador } = aplicar(
      iniciar(),
      campo('titulo', '  No enciende '),
      campo('descripcion', ' Sin imagen  '),
      campo('prioridad', 'baja'),
      fotos('file:///a.jpg')
    );

    expect(construirNuevaIncidencia(borrador)).toEqual({
      id_activo: PROYECTOR.id_activo,
      titulo: 'No enciende',
      descripcion: 'Sin imagen',
      prioridad: 'baja',
    });
  });
});
