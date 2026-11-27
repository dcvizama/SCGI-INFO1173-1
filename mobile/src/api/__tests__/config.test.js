/* global __dirname */
import fs from 'fs';
import path from 'path';

import { DESTINOS, SERVICIOS, raizDeRuta, resolverApi, servicioDeRuta } from '../config';

const MOCK = 'https://scgi-info1173-1.onrender.com/api';
const TI2 = 'https://backend-ti2.onrender.com/api';
const TI2_NOTIFICACIONES = 'https://notificaciones-ti2.onrender.com/api';
const TI2_INCIDENCIAS = 'https://incidencias-ti2.onrender.com/api';

const TODOS = Object.keys(SERVICIOS);

function todas(raiz) {
  return Object.fromEntries(TODOS.map((servicio) => [servicio, raiz]));
}

describe('resolverApi (T8: conmutación de baseURL)', () => {
  it('usa el mock por defecto', () => {
    expect(resolverApi({ urlMock: MOCK })).toEqual({
      destino: DESTINOS.MOCK,
      raiz: MOCK,
      raices: todas(MOCK),
      serviciosEnRespaldo: [],
      respaldo: false,
    });
  });

  it('usa el backend de TI2 cuando el flag es ti2 y su URL existe', () => {
    expect(resolverApi({ destino: 'ti2', urlMock: MOCK, urlTi2: TI2 })).toEqual({
      destino: DESTINOS.TI2,
      raiz: TI2,
      raices: todas(TI2),
      serviciosEnRespaldo: [],
      respaldo: false,
    });
  });

  it('vuelve al mock si se pide ti2 sin URL configurada', () => {
    expect(resolverApi({ destino: 'ti2', urlMock: MOCK, urlTi2: '' })).toEqual({
      destino: DESTINOS.MOCK,
      raiz: MOCK,
      raices: todas(MOCK),
      serviciosEnRespaldo: TODOS,
      respaldo: true,
    });
  });

  it('acepta EXPO_PUBLIC_API_URL del Sprint 1 como URL del mock', () => {
    expect(resolverApi({ urlLegada: MOCK }).raiz).toBe(MOCK);
  });

  it('prefiere EXPO_PUBLIC_API_URL_MOCK sobre la variable antigua', () => {
    expect(resolverApi({ urlMock: MOCK, urlLegada: 'https://otra.com/api' }).raiz).toBe(MOCK);
  });

  it('ignora mayúsculas y espacios en el flag', () => {
    expect(resolverApi({ destino: '  TI2 ', urlTi2: TI2 }).destino).toBe(DESTINOS.TI2);
  });

  it('quita la barra final de la URL', () => {
    expect(resolverApi({ urlMock: `${MOCK}/` }).raiz).toBe(MOCK);
  });

  it('usa el mock si el flag tiene un valor desconocido', () => {
    expect(resolverApi({ destino: 'produccion', urlMock: MOCK })).toMatchObject({
      destino: DESTINOS.MOCK,
      raiz: MOCK,
      respaldo: true,
    });
  });
});

describe('servicioDeRuta (Sprint 3: rutas nuevas del contrato v1.3.0)', () => {
  it.each([
    ['/usuarios?rol=TECNICO', 'autenticacion'],
    ['/autenticacion/inicio-sesion', 'autenticacion'],
    ['/activos/a1d2c3b4-1111-4a2b-9c3d-2d7b5a9c0e21/historial-fallas', 'activos'],
    ['/incidencias/i-1/clasificacion', 'incidencias'],
    ['/incidencias/i-1/estado', 'incidencias'],
    ['/incidencias/i-1/historial', 'incidencias'],
    ['/ordenes-trabajo', 'incidencias'],
    ['/estados-incidencia/transiciones', 'incidencias'],
    ['/notificaciones', 'notificaciones'],
    ['/notificaciones/n-1/leida', 'notificaciones'],
    ['/dispositivos', 'notificaciones'],
    ['/dispositivos/d-1', 'notificaciones'],
  ])('%s va al servicio de %s', (ruta, servicio) => {
    expect(servicioDeRuta(ruta)).toBe(servicio);
  });

  it('devuelve null para rutas que no son del contrato', () => {
    expect(servicioDeRuta('/reportes')).toBeNull();
    expect(servicioDeRuta('')).toBeNull();
    expect(servicioDeRuta(undefined)).toBeNull();
  });

  it('cubre todas las rutas del contrato docs/api/openapi.yaml', () => {
    const contrato = fs.readFileSync(
      path.resolve(__dirname, '../../../../docs/api/openapi.yaml'),
      'utf8'
    );
    const rutas = [...contrato.matchAll(/^ {2}(\/[^\s:]+):\s*$/gm)].map(([, ruta]) => ruta);

    expect(rutas.length).toBeGreaterThanOrEqual(29);
    expect(rutas.filter((ruta) => servicioDeRuta(ruta) === null)).toEqual([]);
  });
});

describe('URL propia por servicio de TI2 (Sprint 3)', () => {
  it('un servicio con URL propia la usa y el resto usa la URL general de TI2', () => {
    const api = resolverApi({
      destino: 'ti2',
      urlMock: MOCK,
      urlTi2: TI2,
      urlsTi2: { notificaciones: TI2_NOTIFICACIONES },
    });

    expect(api.raices).toEqual({ ...todas(TI2), notificaciones: TI2_NOTIFICACIONES });
    expect(api.respaldo).toBe(false);
  });

  it('funciona solo con URLs por servicio, sin URL general', () => {
    const api = resolverApi({
      destino: 'ti2',
      urlMock: MOCK,
      urlsTi2: {
        autenticacion: `${TI2}/`,
        activos: TI2,
        incidencias: TI2_INCIDENCIAS,
        notificaciones: TI2_NOTIFICACIONES,
      },
    });

    expect(api.destino).toBe(DESTINOS.TI2);
    expect(api.raices.autenticacion).toBe(TI2);
    expect(api.serviciosEnRespaldo).toEqual([]);
  });

  it('los servicios sin URL de TI2 quedan en el mock y se informan', () => {
    const api = resolverApi({
      destino: 'ti2',
      urlMock: MOCK,
      urlsTi2: { incidencias: TI2_INCIDENCIAS },
    });

    expect(api.destino).toBe(DESTINOS.TI2);
    expect(api.raices).toEqual({ ...todas(MOCK), incidencias: TI2_INCIDENCIAS });
    expect(api.serviciosEnRespaldo).toEqual(['autenticacion', 'activos', 'notificaciones']);
    expect(api.respaldo).toBe(true);
  });

  it('con destino mock se ignoran las URLs de TI2', () => {
    const api = resolverApi({
      destino: 'mock',
      urlMock: MOCK,
      urlTi2: TI2,
      urlsTi2: { notificaciones: TI2_NOTIFICACIONES },
    });

    expect(api.raices).toEqual(todas(MOCK));
  });

  it('raizDeRuta elige la raíz del servicio, o la general si la ruta no es del contrato', () => {
    const api = resolverApi({
      destino: 'ti2',
      urlTi2: TI2,
      urlsTi2: { notificaciones: TI2_NOTIFICACIONES },
    });

    expect(raizDeRuta('/dispositivos', api)).toBe(TI2_NOTIFICACIONES);
    expect(raizDeRuta('/incidencias/i-1/estado', api)).toBe(TI2);
    expect(raizDeRuta('/otra-ruta', api)).toBe(TI2);
  });
});
